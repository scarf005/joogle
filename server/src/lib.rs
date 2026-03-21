use std::{
    collections::HashMap,
    env,
    fs::{self, File},
    io::Read,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    path::{Path, PathBuf},
    sync::{Arc, Mutex, RwLock},
    time::{Duration, Instant},
};

use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

const DEFAULT_PORT: u16 = 43127;
const MAX_DELTA: u16 = 32;
const MAX_BODY_BYTES: usize = 2048;
const LIMITER_BURST: f64 = 12.0;
const LIMITER_REFILL_PER_SECOND: f64 = 4.0;
const LIMITER_BLOCK_SECONDS: u64 = 8;
const LIMITER_STALE_SECONDS: u64 = 300;
const LIMITER_SWEEP_SECONDS: u64 = 30;

#[derive(Clone)]
struct AppState {
    db: Arc<Mutex<Connection>>,
    snapshot: Arc<RwLock<ClickSnapshot>>,
    limits: Arc<Mutex<RateLimits>>,
}

#[derive(Clone, Debug, Default)]
struct ClickSnapshot {
    global_total: u64,
    per_country: HashMap<String, u64>,
    per_student: HashMap<u32, u64>,
}

#[derive(Debug)]
struct RateLimits {
    buckets: HashMap<IpAddr, TokenBucket>,
    last_sweep: Instant,
}

#[derive(Clone, Debug)]
struct TokenBucket {
    tokens: f64,
    last_refill: Instant,
    blocked_until: Option<Instant>,
    overflow_count: u8,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ClickEntry {
    student_id: u32,
    delta: u16,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClickRequest {
    clicks: Vec<ClickEntry>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TotalsResponse {
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

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudentLeaderboardEntry {
    student_id: u32,
    total: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LeaderboardResponse {
    country_entries: Vec<CountryLeaderboardEntry>,
    student_entries: Vec<StudentLeaderboardEntry>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LiveResponse {
    totals: TotalsResponse,
    country_leaderboard: Vec<CountryLeaderboardEntry>,
    student_leaderboard: Vec<StudentLeaderboardEntry>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse<'a> {
    error: &'a str,
}

pub fn run() {
    let db_path = storage_path();
    let mut connection = open_connection(&db_path).expect("failed to open sqlite");
    init_db(&mut connection).expect("failed to initialize sqlite schema");
    let snapshot = load_snapshot(&connection).expect("failed to load snapshot");

    let state = AppState {
        db: Arc::new(Mutex::new(connection)),
        snapshot: Arc::new(RwLock::new(snapshot)),
        limits: Arc::new(Mutex::new(RateLimits::new())),
    };

    let port = env::var("PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(DEFAULT_PORT);
    let bind = format!("{}:{}", Ipv4Addr::UNSPECIFIED, port);
    let server = Server::http(bind.as_str()).expect("failed to bind server port");

    println!("listening on {port}");

    for request in server.incoming_requests() {
        handle_request(request, &state);
    }
}

fn handle_request(request: Request, state: &AppState) {
    let path = request.url().split('?').next().unwrap_or("/").to_string();

    match (request.method(), path.as_str()) {
        (&Method::Get, "/api/jjugeul") => {
            let country_code = detect_country_code(&request);
            let live = state
                .snapshot
                .read()
                .expect("snapshot poisoned")
                .live_response(&country_code);
            respond_json(request, 200, &live);
        }
        (&Method::Get, "/api/jjugeul/leaderboard") => {
            let leaderboard = state
                .snapshot
                .read()
                .expect("snapshot poisoned")
                .leaderboard();
            respond_json(request, 200, &leaderboard);
        }
        (&Method::Get, "/api/jjugeul/live") => {
            let country_code = detect_country_code(&request);
            let live = state
                .snapshot
                .read()
                .expect("snapshot poisoned")
                .live_response(&country_code);
            respond_json(request, 200, &live);
        }
        (&Method::Post, "/api/jjugeul") => {
            handle_post_clicks(request, state);
        }
        _ => {
            serve_frontend(request, path.as_str());
        }
    }
}

fn handle_post_clicks(mut request: Request, state: &AppState) {
    let body = match read_body_limited(&mut request, MAX_BODY_BYTES) {
        Ok(body) => body,
        Err(error) => {
            respond_json(
                request,
                error,
                &ErrorResponse {
                    error: "invalid_payload",
                },
            );
            return;
        }
    };

    let payload = match serde_json::from_slice::<ClickRequest>(&body) {
        Ok(payload) => payload,
        Err(_) => {
            respond_json(
                request,
                400,
                &ErrorResponse {
                    error: "invalid_payload",
                },
            );
            return;
        }
    };

    let clicks = match validate_clicks(payload.clicks.as_slice()) {
        Ok(clicks) => clicks,
        Err(error) => {
            respond_json(request, 400, &ErrorResponse { error });
            return;
        }
    };

    let client_ip = extract_client_ip(&request);
    if !consume_rate_limit(state, client_ip) {
        respond_json(
            request,
            429,
            &ErrorResponse {
                error: "rate_limited",
            },
        );
        return;
    }

    let country_code = detect_country_code(&request);
    let live = {
        let mut connection = state.db.lock().expect("db mutex poisoned");
        let mut snapshot = state.snapshot.write().expect("snapshot poisoned");

        if apply_click_batch(
            &mut connection,
            &mut snapshot,
            &country_code,
            clicks.as_slice(),
        )
        .is_err()
        {
            respond_json(
                request,
                500,
                &ErrorResponse {
                    error: "storage_error",
                },
            );
            return;
        }

        snapshot.live_response(&country_code)
    };

    respond_json(request, 202, &live);
}

fn consume_rate_limit(state: &AppState, client_ip: IpAddr) -> bool {
    let now = Instant::now();
    let mut limits = state.limits.lock().expect("rate limiter poisoned");
    limits.cleanup_stale(now);

    let bucket = limits
        .buckets
        .entry(client_ip)
        .or_insert_with(|| TokenBucket::new(now));

    bucket.consume(now)
}

fn respond_json<T: Serialize>(request: Request, status: u16, payload: &T) {
    let body = match serde_json::to_vec(payload) {
        Ok(body) => body,
        Err(_) => b"{\"error\":\"serialization_error\"}".to_vec(),
    };

    let response = Response::from_data(body)
        .with_status_code(StatusCode(status))
        .with_header(content_type_header("application/json; charset=utf-8"));

    let _ = request.respond(response);
}

fn read_body_limited(request: &mut Request, max_bytes: usize) -> Result<Vec<u8>, u16> {
    let mut body = Vec::new();
    let mut reader = request.as_reader().take((max_bytes + 1) as u64);

    if reader.read_to_end(&mut body).is_err() {
        return Err(400);
    }

    if body.len() > max_bytes {
        return Err(413);
    }

    Ok(body)
}

fn serve_frontend(request: Request, path: &str) {
    let dist_dir = frontend_dist_dir();
    let index_file = dist_dir.join("index.html");

    let target = sanitize_public_path(path)
        .map(|clean| dist_dir.join(clean))
        .filter(|candidate| candidate.is_file())
        .unwrap_or(index_file);

    let content_type = guess_content_type(&target);

    match File::open(target) {
        Ok(file) => {
            let response = Response::from_file(file)
                .with_status_code(StatusCode(200))
                .with_header(content_type_header(content_type));
            let _ = request.respond(response);
        }
        Err(_) => {
            let response = Response::from_data("not found")
                .with_status_code(StatusCode(404))
                .with_header(content_type_header("text/plain; charset=utf-8"));
            let _ = request.respond(response);
        }
    }
}

fn sanitize_public_path(path: &str) -> Option<&str> {
    let clean = path.trim_start_matches('/');

    if clean.is_empty() {
        return Some("index.html");
    }

    if clean.contains("..") || clean.contains('\\') {
        return None;
    }

    Some(clean)
}

fn guess_content_type(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or_default()
    {
        "css" => "text/css; charset=utf-8",
        "html" => "text/html; charset=utf-8",
        "js" => "application/javascript; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "mp3" => "audio/mpeg",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        _ => "application/octet-stream",
    }
}

fn content_type_header(value: &'static str) -> Header {
    Header::from_bytes("Content-Type", value).expect("valid content-type header")
}

fn open_connection(path: &Path) -> rusqlite::Result<Connection> {
    if path == Path::new(":memory:") {
        return Connection::open_in_memory();
    }

    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    Connection::open(path)
}

fn init_db(connection: &mut Connection) -> rusqlite::Result<()> {
    connection.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA temp_store = MEMORY;
        PRAGMA busy_timeout = 5000;
        PRAGMA journal_size_limit = 1048576;

        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value_integer INTEGER NOT NULL
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS country_totals (
            country_code TEXT PRIMARY KEY,
            total INTEGER NOT NULL CHECK(total >= 0)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS student_totals (
            student_id INTEGER PRIMARY KEY,
            total INTEGER NOT NULL CHECK(total >= 0)
        ) WITHOUT ROWID;
        ",
    )?;

    connection.execute(
        "INSERT OR IGNORE INTO meta(key, value_integer) VALUES('global_total', 0)",
        [],
    )?;

    Ok(())
}

fn load_snapshot(connection: &Connection) -> rusqlite::Result<ClickSnapshot> {
    let global_total = connection
        .query_row(
            "SELECT value_integer FROM meta WHERE key = 'global_total'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .optional()?
        .unwrap_or(0) as u64;

    let mut snapshot = ClickSnapshot {
        global_total,
        ..ClickSnapshot::default()
    };

    {
        let mut statement = connection.prepare("SELECT country_code, total FROM country_totals")?;
        let rows = statement.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)? as u64))
        })?;

        for row in rows {
            let (country_code, total) = row?;
            snapshot.per_country.insert(country_code, total);
        }
    }

    {
        let mut statement = connection.prepare("SELECT student_id, total FROM student_totals")?;
        let rows = statement.query_map([], |row| {
            Ok((row.get::<_, i64>(0)? as u32, row.get::<_, i64>(1)? as u64))
        })?;

        for row in rows {
            let (student_id, total) = row?;
            snapshot.per_student.insert(student_id, total);
        }
    }

    Ok(snapshot)
}

fn apply_click_batch(
    connection: &mut Connection,
    snapshot: &mut ClickSnapshot,
    country_code: &str,
    clicks: &[ClickEntry],
) -> rusqlite::Result<()> {
    let delta_sum = clicks
        .iter()
        .map(|click| u64::from(click.delta))
        .sum::<u64>();

    let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    tx.execute(
        "
        UPDATE meta
        SET value_integer = value_integer + ?1
        WHERE key = 'global_total'
        ",
        params![delta_sum as i64],
    )?;
    tx.execute(
        "
        INSERT INTO country_totals(country_code, total)
        VALUES (?1, ?2)
        ON CONFLICT(country_code)
        DO UPDATE SET total = total + excluded.total
        ",
        params![country_code, delta_sum as i64],
    )?;

    {
        let mut student_stmt = tx.prepare_cached(
            "
            INSERT INTO student_totals(student_id, total)
            VALUES (?1, ?2)
            ON CONFLICT(student_id)
            DO UPDATE SET total = total + excluded.total
            ",
        )?;

        for click in clicks {
            student_stmt.execute(params![click.student_id as i64, i64::from(click.delta)])?;
        }
    }

    tx.commit()?;

    snapshot.apply_clicks(country_code, clicks);
    Ok(())
}

fn detect_country_code(request: &Request) -> String {
    [
        "cf-ipcountry",
        "x-vercel-ip-country",
        "x-appengine-country",
        "x-country-code",
    ]
    .iter()
    .find_map(|name| header_value(request, name))
    .map(sanitize_country_code)
    .unwrap_or_else(|| "ZZ".to_string())
}

fn header_value<'a>(request: &'a Request, name: &str) -> Option<&'a str> {
    request
        .headers()
        .iter()
        .find(|header| header.field.as_str().as_str().eq_ignore_ascii_case(name))
        .map(|header| header.value.as_str())
}

fn sanitize_country_code(value: &str) -> String {
    let uppercase = value.trim().to_ascii_uppercase();
    if uppercase.len() == 2
        && uppercase
            .chars()
            .all(|character| character.is_ascii_alphabetic())
    {
        uppercase
    } else {
        "ZZ".to_string()
    }
}

fn extract_client_ip(request: &Request) -> IpAddr {
    ["x-forwarded-for", "x-real-ip", "fly-client-ip"]
        .iter()
        .find_map(|name| header_value(request, name))
        .and_then(|value| value.split(',').next())
        .and_then(|value| value.trim().parse::<IpAddr>().ok())
        .or_else(|| request.remote_addr().map(SocketAddr::ip))
        .unwrap_or_else(|| IpAddr::from(Ipv4Addr::UNSPECIFIED))
}

fn validate_clicks(clicks: &[ClickEntry]) -> Result<Vec<ClickEntry>, &'static str> {
    if clicks.is_empty() {
        return Err("invalid_click_batch");
    }

    let mut total_delta = 0_u16;
    let mut validated = Vec::with_capacity(clicks.len());

    for click in clicks {
        if click.delta == 0 || click.delta > MAX_DELTA {
            return Err("invalid_delta");
        }

        if click.student_id == 0 {
            return Err("invalid_student_id");
        }

        total_delta = total_delta
            .checked_add(click.delta)
            .ok_or("invalid_delta")?;
        validated.push(click.clone());
    }

    if total_delta > MAX_DELTA {
        return Err("invalid_delta");
    }

    Ok(validated)
}

impl ClickSnapshot {
    fn apply_clicks(&mut self, country_code: &str, clicks: &[ClickEntry]) {
        let country_total = self
            .per_country
            .entry(country_code.to_string())
            .or_default();

        for click in clicks {
            let delta = u64::from(click.delta);
            self.global_total += delta;
            *country_total += delta;

            let student_total = self.per_student.entry(click.student_id).or_default();
            *student_total += delta;
        }
    }

    fn totals(&self, country_code: &str) -> TotalsResponse {
        TotalsResponse {
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
        let mut country_entries = self
            .per_country
            .iter()
            .map(|(country_code, total)| CountryLeaderboardEntry {
                country_code: country_code.clone(),
                total: *total,
            })
            .collect::<Vec<_>>();
        country_entries.sort_by(|left, right| {
            right
                .total
                .cmp(&left.total)
                .then_with(|| left.country_code.cmp(&right.country_code))
        });

        let mut student_entries = self
            .per_student
            .iter()
            .map(|(student_id, total)| StudentLeaderboardEntry {
                student_id: *student_id,
                total: *total,
            })
            .collect::<Vec<_>>();
        student_entries.sort_by(|left, right| {
            right
                .total
                .cmp(&left.total)
                .then_with(|| left.student_id.cmp(&right.student_id))
        });

        LeaderboardResponse {
            country_entries,
            student_entries,
        }
    }

    fn live_response(&self, country_code: &str) -> LiveResponse {
        let leaderboard = self.leaderboard();

        LiveResponse {
            totals: self.totals(country_code),
            country_leaderboard: leaderboard.country_entries,
            student_leaderboard: leaderboard.student_entries,
        }
    }
}

impl RateLimits {
    fn new() -> Self {
        Self {
            buckets: HashMap::new(),
            last_sweep: Instant::now(),
        }
    }

    fn cleanup_stale(&mut self, now: Instant) {
        if now.duration_since(self.last_sweep) < Duration::from_secs(LIMITER_SWEEP_SECONDS) {
            return;
        }

        self.buckets.retain(|_, bucket| !bucket.is_stale(now));
        self.last_sweep = now;
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

fn frontend_dist_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../web/dist")
}

fn storage_path() -> PathBuf {
    match env::var("JOOGLE_DB_PATH") {
        Ok(path) if path == ":memory:" => PathBuf::from(":memory:"),
        Ok(path) => PathBuf::from(path),
        Err(_) => PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/joogle.sqlite3"),
    }
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
    fn in_memory_sqlite_flow_updates_snapshot() {
        let mut connection = Connection::open_in_memory().expect("in-memory sqlite");
        init_db(&mut connection).expect("init schema");

        let mut snapshot = load_snapshot(&connection).expect("initial snapshot");
        assert_eq!(snapshot.global_total, 0);

        let clicks = validate_clicks(&[
            ClickEntry {
                student_id: 10000,
                delta: 8,
            },
            ClickEntry {
                student_id: 10001,
                delta: 6,
            },
        ])
        .expect("valid clicks");

        apply_click_batch(&mut connection, &mut snapshot, "KR", clicks.as_slice())
            .expect("apply first batch");
        apply_click_batch(
            &mut connection,
            &mut snapshot,
            "JP",
            &[ClickEntry {
                student_id: 10000,
                delta: 5,
            }],
        )
        .expect("apply second batch");

        let reloaded = load_snapshot(&connection).expect("reload snapshot");
        assert_eq!(reloaded.global_total, 19);
        assert_eq!(reloaded.per_country.get("KR"), Some(&14));
        assert_eq!(reloaded.per_country.get("JP"), Some(&5));
        assert_eq!(reloaded.per_student.get(&10000), Some(&13));
        assert_eq!(reloaded.per_student.get(&10001), Some(&6));
    }
}
