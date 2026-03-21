use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};

pub const MAX_DELTA: u16 = 32;
const LIMITER_BURST: f64 = 12.0;
const LIMITER_REFILL_PER_SECOND: f64 = 4.0;
const LIMITER_BLOCK_SECONDS: u64 = 8;
const LIMITER_STALE_SECONDS: u64 = 300;

pub const STUDENT_IDS: [&str; 5] = ["suzumi", "mari", "aru", "hifumi", "hoshino"];

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ClickStore {
    #[serde(default)]
    pub global_total: u64,
    #[serde(default)]
    pub per_country: HashMap<String, u64>,
    #[serde(default)]
    pub per_student: HashMap<String, u64>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClickEntry {
    pub student_id: String,
    pub delta: u16,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClickRequest {
    pub clicks: Vec<ClickEntry>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TotalsResponse {
    pub country_code: String,
    pub country_total: u64,
    pub global_total: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CountryLeaderboardEntry {
    pub country_code: String,
    pub total: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentLeaderboardEntry {
    pub student_id: String,
    pub total: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LeaderboardResponse {
    pub country_entries: Vec<CountryLeaderboardEntry>,
    pub student_entries: Vec<StudentLeaderboardEntry>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveResponse {
    pub totals: TotalsResponse,
    pub country_leaderboard: Vec<CountryLeaderboardEntry>,
    pub student_leaderboard: Vec<StudentLeaderboardEntry>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: &'static str,
}

#[derive(Clone, Debug)]
pub struct TokenBucket {
    tokens: f64,
    last_refill: Instant,
    blocked_until: Option<Instant>,
    overflow_count: u8,
}

impl ClickStore {
    pub fn apply_clicks(&mut self, country_code: &str, clicks: &[ClickEntry]) -> TotalsResponse {
        let country_total = self
            .per_country
            .entry(country_code.to_string())
            .or_default();

        for click in clicks {
            let delta = u64::from(click.delta);
            *country_total += delta;
            self.global_total += delta;

            let student_total = self
                .per_student
                .entry(click.student_id.clone())
                .or_default();
            *student_total += delta;
        }

        TotalsResponse {
            country_code: country_code.to_string(),
            country_total: *country_total,
            global_total: self.global_total,
        }
    }

    pub fn snapshot(&self, country_code: &str) -> TotalsResponse {
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

    pub fn leaderboard(&self) -> LeaderboardResponse {
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
                student_id: student_id.clone(),
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

    pub fn live_response(&self, country_code: &str) -> LiveResponse {
        let leaderboard = self.leaderboard();

        LiveResponse {
            totals: self.snapshot(country_code),
            country_leaderboard: leaderboard.country_entries,
            student_leaderboard: leaderboard.student_entries,
        }
    }
}

impl TokenBucket {
    pub fn new(now: Instant) -> Self {
        Self {
            tokens: LIMITER_BURST,
            last_refill: now,
            blocked_until: None,
            overflow_count: 0,
        }
    }

    pub fn consume(&mut self, now: Instant) -> bool {
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

    pub fn is_stale(&self, now: Instant) -> bool {
        self.blocked_until.is_none()
            && now.duration_since(self.last_refill) > Duration::from_secs(LIMITER_STALE_SECONDS)
    }

    fn refill(&mut self, now: Instant) {
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.tokens = (self.tokens + elapsed * LIMITER_REFILL_PER_SECOND).min(LIMITER_BURST);
        self.last_refill = now;
    }
}

pub fn sanitize_student_id(value: &str) -> Option<String> {
    let normalized = value.trim().to_ascii_lowercase();

    STUDENT_IDS
        .contains(&normalized.as_str())
        .then_some(normalized)
}

pub fn validate_clicks(clicks: &[ClickEntry]) -> Result<Vec<ClickEntry>, &'static str> {
    if clicks.is_empty() {
        return Err("invalid_click_batch");
    }

    let mut total_delta = 0_u16;
    let mut validated = Vec::with_capacity(clicks.len());

    for click in clicks {
        if click.delta == 0 || click.delta > MAX_DELTA {
            return Err("invalid_delta");
        }

        let Some(student_id) = sanitize_student_id(&click.student_id) else {
            return Err("invalid_student_id");
        };

        total_delta = total_delta
            .checked_add(click.delta)
            .ok_or("invalid_delta")?;

        validated.push(ClickEntry {
            student_id,
            delta: click.delta,
        });
    }

    if total_delta > MAX_DELTA {
        return Err("invalid_delta");
    }

    Ok(validated)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn click_store_updates_country_student_and_global_totals() {
        let mut store = ClickStore::default();

        let response = store.apply_clicks(
            "KR",
            &[
                ClickEntry {
                    student_id: "suzumi".to_string(),
                    delta: 3,
                },
                ClickEntry {
                    student_id: "mari".to_string(),
                    delta: 2,
                },
            ],
        );

        assert_eq!(response.country_code, "KR");
        assert_eq!(response.country_total, 5);
        assert_eq!(response.global_total, 5);
        assert_eq!(store.snapshot("KR").country_total, 5);
        assert_eq!(store.per_student.get("suzumi"), Some(&3));
        assert_eq!(store.per_student.get("mari"), Some(&2));
    }

    #[test]
    fn leaderboard_is_sorted_for_countries_and_students() {
        let mut store = ClickStore::default();
        store.apply_clicks(
            "JP",
            &[ClickEntry {
                student_id: "aru".to_string(),
                delta: 2,
            }],
        );
        store.apply_clicks(
            "KR",
            &[
                ClickEntry {
                    student_id: "suzumi".to_string(),
                    delta: 5,
                },
                ClickEntry {
                    student_id: "mari".to_string(),
                    delta: 1,
                },
            ],
        );
        store.apply_clicks(
            "US",
            &[ClickEntry {
                student_id: "mari".to_string(),
                delta: 3,
            }],
        );

        let leaderboard = store.leaderboard();

        assert_eq!(leaderboard.country_entries[0].country_code, "KR");
        assert_eq!(leaderboard.country_entries[1].country_code, "US");
        assert_eq!(leaderboard.country_entries[2].country_code, "JP");
        assert_eq!(leaderboard.student_entries[0].student_id, "suzumi");
        assert_eq!(leaderboard.student_entries[1].student_id, "mari");
        assert_eq!(leaderboard.student_entries[2].student_id, "aru");
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

    #[test]
    fn student_id_is_sanitized() {
        assert_eq!(sanitize_student_id(" Suzumi "), Some("suzumi".to_string()));
        assert_eq!(sanitize_student_id("MARI"), Some("mari".to_string()));
        assert_eq!(sanitize_student_id("unknown"), None);
    }

    #[test]
    fn click_batch_is_validated() {
        let validated = validate_clicks(&[
            ClickEntry {
                student_id: "SUZUMI".to_string(),
                delta: 16,
            },
            ClickEntry {
                student_id: "mari".to_string(),
                delta: 16,
            },
        ])
        .expect("valid click batch");

        assert_eq!(validated[0].student_id, "suzumi");
        assert_eq!(validated[1].student_id, "mari");
        assert_eq!(validate_clicks(&[]), Err("invalid_click_batch"));
        assert_eq!(
            validate_clicks(&[ClickEntry {
                student_id: "aru".to_string(),
                delta: 33,
            }]),
            Err("invalid_delta")
        );
        assert_eq!(
            validate_clicks(&[
                ClickEntry {
                    student_id: "aru".to_string(),
                    delta: 20,
                },
                ClickEntry {
                    student_id: "mari".to_string(),
                    delta: 20,
                },
            ]),
            Err("invalid_delta")
        );
    }
}
