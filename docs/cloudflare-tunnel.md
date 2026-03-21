# Cloudflare Tunnel

This project works well behind Cloudflare Tunnel because the server already
understands `cf-ipcountry`, which powers the country leaderboard.

## 1. Create A Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create joogle
```

Save the generated tunnel ID and credentials file path.

## 2. Copy The Example Config

Use `ops/cloudflared/config.example.yml` as a template and replace:

- `YOUR_TUNNEL_ID`
- `YOUR_HOSTNAME`
- `/etc/cloudflared/YOUR_TUNNEL_ID.json`

## 3. Run The App Locally

```bash
cd web
deno task build

cd ../server
cargo run
```

The Rust server listens on `127.0.0.1:43127` by default.

## 4. Start The Tunnel

```bash
cloudflared tunnel run joogle
```

## Notes

- Websocket traffic works through the same tunnel route
- The tunnel preserves Cloudflare country headers for leaderboard grouping
- Keep credentials files out of git
