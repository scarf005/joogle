# joogle

Fast popcat-style clicker built with a Preact frontend and an Axum server. It
tracks a global total, country leaderboard, and student leaderboard while
letting each player pin favorite students locally.

## Features

- Popcat-like tap loop with keyboard and pointer input
- Global live totals with per-country and per-student leaderboards
- Favorite student picker persisted in local storage
- Batched click sync plus websocket live updates
- IP token-bucket rate limiting to reduce abuse
- GitHub Actions CI for web, server, and end-to-end coverage
- Cloudflare Tunnel example config for edge exposure and country headers

## Stack

- `web/`: Preact + Vite + Deno + Playwright + Vitest
- `server/`: Rust + Axum + Tokio + bincode persistence

## Local Development

### Prerequisites

- Deno 2.x
- Rust stable

### Run

```bash
# terminal 1
cd web
deno task dev

# terminal 2
cd server
cargo run
```

The Vite dev server proxies `/api` requests to `http://127.0.0.1:43127`.

### Podman Compose

```bash
# production
podman compose up --build

# development
podman compose -f compose.dev.yml up --build
```

- `compose.yml` builds with latest Chainguard Deno and Rust images, then runs on a distroless runtime image
- `compose.dev.yml` uses latest Chainguard dev images, bind-mounts the repo for live web edits, and runs Rust through `cargo watch`
- SELinux bind mounts use `:Z` where host paths are mounted into containers

## Verification

```bash
# web
cd web
deno fmt --check
deno lint
deno task test
deno task build
deno task test:e2e

# server
cd ..
cargo test
```

## API

### `GET /api/jjugeul`

Returns the current snapshot:

- global total
- current country total
- country leaderboard
- student leaderboard

### `POST /api/jjugeul`

Accepts a batched click payload:

```json
{
  "clicks": [
    { "studentId": "suzumi", "delta": 12 },
    { "studentId": "aru", "delta": 4 }
  ]
}
```

Rules:

- each `studentId` must be known
- each `delta` must be between `1` and `32`
- combined batch delta must stay at or below `32`

### `GET /api/jjugeul/live`

Websocket stream for live snapshots. The server broadcasts updated totals and
both leaderboards after accepted click batches.

## Persistence And Abuse Protection

- Click state is persisted to `server/data/clicks.bin`
- The server keeps country totals and student totals in memory for fast reads
- Click batches are rate-limited per client IP with a token bucket
- Country detection reads edge headers such as `cf-ipcountry`

## Deployment Notes

- `web/dist/` is served directly by the Rust server in production
- GitHub Pages deployment still exists for static preview builds
- CI lives in `.github/workflows/ci.yml`
- Cloudflare Tunnel notes live in `docs/cloudflare-tunnel.md`

## Credits

- Art: https://www.pixiv.net/artworks/134583684
- Sound: "Rubber Duck" by Slothfully_So -
  https://freesound.org/people/Slothfully_So/sounds/685067/ (CC0 preview used)

## License

MIT
