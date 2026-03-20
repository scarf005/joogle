use std::{
    collections::HashMap,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    path::{Path, PathBuf},
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, Instant},
};

use axum::{
    Json, Router,
    extract::{
        ConnectInfo, DefaultBodyLimit, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::get,
};
use bincode::config::standard;
use dashmap::DashMap;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::{
    fs,
    net::TcpListener,
    signal,
    sync::{RwLock, broadcast},
    time::interval,
};
use tower_http::{
    compression::CompressionLayer,
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

const DEFAULT_PORT: u16 = 43127;
const MAX_DELTA: u16 = 32;
const LIMITER_BURST: f64 = 12.0;
const LIMITER_REFILL_PER_SECOND: f64 = 4.0;
const LIMITER_BLOCK_SECONDS: u64 = 8;
const LIMITER_STALE_SECONDS: u64 = 300;

#[derive(Clone)]
struct AppState {
    limits: Arc<DashMap<IpAddr, TokenBucket>>,
    store: Arc<RwLock<ClickStore>>,
    storage_path: Arc<PathBuf>,
    dirty: Arc<AtomicBool>,
    events: broadcast::Sender<LiveResponse>,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
struct ClickStore {
    global_total: u64,
    per_country: HashMap<String, u64>,
}

#[derive(Clone, Debug)]
struct TokenBucket {
    tokens: f64,
    last_refill: Instant,
    blocked_until: Option<Instant>,
    overflow_count: u8,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClickRequest {
    delta: u16,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ClickResponse {
    country_code: String,
    country_total: u64,
    global_total: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CountryLeaderboardEntry {
    country_code: String,
    total: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LeaderboardResponse {
    entries: Vec<CountryLeaderboardEntry>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LiveResponse {
    totals: ClickResponse,
    leaderboard: Vec<CountryLeaderboardEntry>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: &'static str,
}

impl ClickStore {
    fn apply_delta(&mut self, country_code: &str, delta: u16) -> ClickResponse {
        let delta = u64::from(delta);
        let country_total = self
            .per_country
            .entry(country_code.to_string())
            .or_default();
        *country_total += delta;
        self.global_total += delta;

        ClickResponse {
            country_code: country_code.to_string(),
            country_total: *country_total,
            global_total: self.global_total,
        }
    }

    fn snapshot(&self, country_code: &str) -> ClickResponse {
        ClickResponse {
            country_code: country_code.to_string(),
            country_total: self
                .per_country
                .get(country_code)
                .copied()
                .unwrap_or_default(),
            global_total: self.global_total,
        }
    }

    fn leaderboard(&self) -> LeaderboardResponse {
        let mut entries = self
            .per_country
            .iter()
            .map(|(country_code, total)| CountryLeaderboardEntry {
                country_code: country_code.clone(),
                total: *total,
            })
            .collect::<Vec<_>>();

        entries.sort_by(|left, right| {
            right
                .total
                .cmp(&left.total)
                .then_with(|| left.country_code.cmp(&right.country_code))
        });

        LeaderboardResponse { entries }
    }

    fn live_response(&self, country_code: &str) -> LiveResponse {
        LiveResponse {
            totals: self.snapshot(country_code),
            leaderboard: self.leaderboard().entries,
        }
    }
}

impl TokenBucket {
    fn new(now: Instant) -> Self {
        Self {
            tokens: LIMITER_BURST,
            last_refill: now,
            blocked_until: None,
            overflow_count: 0,
        }
    }

    fn consume(&mut self, now: Instant) -> bool {
        self.refill(now);

        if let Some(blocked_until) = self.blocked_until {
            if blocked_until > now {
                return false;
            }

            self.blocked_until = None;
        }

        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            self.overflow_count = 0;
            return true;
        }

        self.overflow_count = self.overflow_count.saturating_add(1);
        if self.overflow_count >= 4 {
            self.blocked_until = Some(now + Duration::from_secs(LIMITER_BLOCK_SECONDS));
            self.overflow_count = 0;
        }

        false
    }

    fn is_stale(&self, now: Instant) -> bool {
        self.blocked_until.is_none()
            && now.duration_since(self.last_refill) > Duration::from_secs(LIMITER_STALE_SECONDS)
    }

    fn refill(&mut self, now: Instant) {
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.tokens = (self.tokens + elapsed * LIMITER_REFILL_PER_SECOND).min(LIMITER_BURST);
        self.last_refill = now;
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "server=info,tower_http=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let storage_path = storage_path();
    let store = load_store(&storage_path).await.unwrap_or_default();
    let (events, _) = broadcast::channel(128);

    let state = AppState {
        limits: Arc::new(DashMap::new()),
        store: Arc::new(RwLock::new(store)),
        storage_path: Arc::new(storage_path),
        dirty: Arc::new(AtomicBool::new(false)),
        events,
    };

    spawn_persist_loop(state.clone());
    spawn_limit_cleanup(state.clone());

    let app = Router::new()
        .route("/api/jjugeul", get(get_clicks).post(post_clicks))
        .route("/api/jjugeul/leaderboard", get(get_leaderboard))
        .route("/api/jjugeul/live", get(get_live))
        .fallback_service(
            ServeDir::new(frontend_dist_dir())
                .not_found_service(ServeFile::new(frontend_dist_dir().join("index.html"))),
        )
        .with_state(state)
        .layer(DefaultBodyLimit::max(64))
        .layer(RequestBodyLimitLayer::new(64))
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(DEFAULT_PORT);

    let listener = TcpListener::bind((Ipv4Addr::UNSPECIFIED, port))
        .await
        .expect("failed to bind server port");

    info!(port, "listening");

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("server failed");
}

async fn get_clicks(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(address): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    let country_code = detect_country_code(&headers);
    let response = state.store.read().await.snapshot(&country_code);

    let _ = extract_client_ip(&headers, address);

    Json(response)
}

async fn post_clicks(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(address): ConnectInfo<SocketAddr>,
    Json(payload): Json<ClickRequest>,
) -> impl IntoResponse {
    if payload.delta == 0 || payload.delta > MAX_DELTA {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_delta",
            }),
        )
            .into_response();
    }

    let client_ip = extract_client_ip(&headers, address);
    let now = Instant::now();
    let mut bucket = state
        .limits
        .entry(client_ip)
        .or_insert_with(|| TokenBucket::new(now));

    if !bucket.consume(now) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(ErrorResponse {
                error: "rate_limited",
            }),
        )
            .into_response();
    }

    let country_code = detect_country_code(&headers);
    let response = {
        let mut store = state.store.write().await;
        store.apply_delta(&country_code, payload.delta)
    };

    let live_message = {
        let store = state.store.read().await;
        store.live_response(&country_code)
    };

    state.dirty.store(true, Ordering::Relaxed);
    let _ = state.events.send(live_message);

    (StatusCode::ACCEPTED, Json(response)).into_response()
}

async fn get_leaderboard(State(state): State<AppState>) -> impl IntoResponse {
    Json(state.store.read().await.leaderboard())
}

async fn get_live(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let country_code = detect_country_code(&headers);

    ws.on_upgrade(move |socket| handle_live_socket(socket, state, country_code))
}

async fn handle_live_socket(socket: WebSocket, state: AppState, country_code: String) {
    let (mut sender, mut receiver) = socket.split();
    let initial = {
        let store = state.store.read().await;
        store.live_response(&country_code)
    };

    if send_live_message(&mut sender, &initial).await.is_err() {
        return;
    }

    let mut events = state.events.subscribe();

    loop {
        tokio::select! {
            maybe_message = events.recv() => {
                match maybe_message {
                    Ok(_) => {
                        let message = {
                            let store = state.store.read().await;
                            store.live_response(&country_code)
                        };

                        if send_live_message(&mut sender, &message).await.is_err() {
                            return;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => return,
                }
            }
            incoming = receiver.next() => {
                match incoming {
                    Some(Ok(Message::Close(_))) | None => return,
                    Some(Ok(_)) => continue,
                    Some(Err(_)) => return,
                }
            }
        }
    }
}

async fn send_live_message(
    sender: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    payload: &LiveResponse,
) -> Result<(), serde_json::Error> {
    let body = serde_json::to_string(payload)?;

    sender
        .send(Message::Text(body.into()))
        .await
        .map_err(|error| serde_json::Error::io(std::io::Error::other(error)))
}

fn spawn_persist_loop(state: AppState) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(1));

        loop {
            ticker.tick().await;

            if !state.dirty.swap(false, Ordering::Relaxed) {
                continue;
            }

            if let Err(error) = persist_store(&state).await {
                state.dirty.store(true, Ordering::Relaxed);
                tracing::error!(%error, "failed to persist click store");
            }
        }
    });
}

fn spawn_limit_cleanup(state: AppState) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(30));

        loop {
            ticker.tick().await;
            let now = Instant::now();
            state.limits.retain(|_, bucket| !bucket.is_stale(now));
        }
    });
}

async fn shutdown_signal() {
    let _ = signal::ctrl_c().await;
}

async fn load_store(path: &Path) -> Option<ClickStore> {
    let bytes = fs::read(path).await.ok()?;
    let (store, _) = bincode::serde::decode_from_slice(&bytes, standard()).ok()?;
    Some(store)
}

async fn persist_store(state: &AppState) -> Result<(), std::io::Error> {
    let snapshot = state.store.read().await.clone();
    let encoded =
        bincode::serde::encode_to_vec(snapshot, standard()).map_err(std::io::Error::other)?;

    if let Some(parent) = state.storage_path.parent() {
        fs::create_dir_all(parent).await?;
    }

    fs::write(state.storage_path.as_path(), encoded).await
}

fn frontend_dist_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../web/dist")
}

fn storage_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/clicks.bin")
}

fn detect_country_code(headers: &HeaderMap) -> String {
    [
        "cf-ipcountry",
        "x-vercel-ip-country",
        "x-appengine-country",
        "x-country-code",
    ]
    .iter()
    .find_map(|name| {
        headers
            .get(*name)
            .and_then(|value| value.to_str().ok())
            .map(sanitize_country_code)
    })
    .unwrap_or_else(|| "ZZ".to_string())
}

fn sanitize_country_code(value: &str) -> String {
    let uppercase = value.trim().to_ascii_uppercase();
    if uppercase.len() == 2 && uppercase.chars().all(|char| char.is_ascii_alphabetic()) {
        uppercase
    } else {
        "ZZ".to_string()
    }
}

fn extract_client_ip(headers: &HeaderMap, address: SocketAddr) -> IpAddr {
    ["x-forwarded-for", "x-real-ip", "fly-client-ip"]
        .iter()
        .find_map(|name| headers.get(*name))
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .and_then(|value| value.trim().parse::<IpAddr>().ok())
        .unwrap_or_else(|| address.ip())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn country_code_is_sanitized() {
        assert_eq!(sanitize_country_code("kr"), "KR");
        assert_eq!(sanitize_country_code(" us "), "US");
        assert_eq!(sanitize_country_code("k0"), "ZZ");
        assert_eq!(sanitize_country_code("korea"), "ZZ");
    }

    #[test]
    fn click_store_updates_country_and_global_totals() {
        let mut store = ClickStore::default();

        let response = store.apply_delta("KR", 3);

        assert_eq!(response.country_code, "KR");
        assert_eq!(response.country_total, 3);
        assert_eq!(response.global_total, 3);
        assert_eq!(store.snapshot("KR").country_total, 3);
    }

    #[test]
    fn leaderboard_is_sorted_by_total_descending() {
        let mut store = ClickStore::default();
        store.apply_delta("JP", 2);
        store.apply_delta("KR", 5);
        store.apply_delta("US", 3);

        let leaderboard = store.leaderboard();

        assert_eq!(leaderboard.entries[0].country_code, "KR");
        assert_eq!(leaderboard.entries[1].country_code, "US");
        assert_eq!(leaderboard.entries[2].country_code, "JP");
    }

    #[test]
    fn token_bucket_blocks_after_repeated_overflow() {
        let now = Instant::now();
        let mut bucket = TokenBucket::new(now);

        for _ in 0..12 {
            assert!(bucket.consume(now));
        }

        assert!(!bucket.consume(now));
        assert!(!bucket.consume(now));
        assert!(!bucket.consume(now));
        assert!(!bucket.consume(now));
        assert!(bucket.blocked_until.is_some());
    }
}
