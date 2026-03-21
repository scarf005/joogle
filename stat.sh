#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-compose.dev.yml}"
SERVER_PACKAGE="${SERVER_PACKAGE:-server}"
SERVER_BINARY="${SERVER_BINARY:-$ROOT_DIR/target/release/server}"
SERVER_IMAGE_SERVICE="${SERVER_IMAGE_SERVICE:-app}"
RUNS="${RUNS:-5}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-5}"
STARTUP_SETTLE_MILLISECONDS="${STARTUP_SETTLE_MILLISECONDS:-250}"
STARTUP_POLL_SECONDS="${STARTUP_POLL_SECONDS:-0.0005}"
USE_LOCAL_CARGO="${USE_LOCAL_CARGO:-0}"
SERVER_BINARY_TEMP_DIR=""

cd "$ROOT_DIR"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'missing required command: %s\n' "$1" >&2
    exit 1
  }
}

format_bytes() {
  python - "$1" <<'PY'
from math import floor
from sys import argv

size = int(argv[1])
units = ["B", "KB", "MB", "GB", "TB"]
value = float(size)
unit = units[0]

for candidate in units[1:]:
    if value < 1024:
        break
    value /= 1024
    unit = candidate

if unit == "B":
    print(f"{int(value)} {unit}")
else:
    print(f"{value:.2f} {unit}")
PY
}

build_server_binary() {
  if [ "$COMPOSE_FILE" = "compose.yml" ]; then
    extract_server_binary_from_image
    return
  fi

  if [ "$USE_LOCAL_CARGO" = "1" ]; then
    cargo build --release -p "$SERVER_PACKAGE" >/dev/null
    return
  fi

  podman run --rm \
    --userns keep-id \
    --user "$(id -u):$(id -g)" \
    --entrypoint cargo \
    -v "$ROOT_DIR:/app:Z" \
    -w /app \
    localhost/joogle_server:latest \
    build --release -p "$SERVER_PACKAGE" >/dev/null 2>&1
}

extract_server_binary_from_image() {
  local image
  image="$(compose_image_name "$SERVER_IMAGE_SERVICE")"
  local temp_dir
  temp_dir="$(mktemp -d)"
  SERVER_BINARY_TEMP_DIR="$temp_dir"
  local container_id
  container_id="$(podman create "$image")"

  podman cp "$container_id:/server" "$temp_dir/server" >/dev/null
  podman rm "$container_id" >/dev/null
  chmod +x "$temp_dir/server"
  SERVER_BINARY="$temp_dir/server"
}

cleanup() {
  if [ -n "$SERVER_BINARY_TEMP_DIR" ] && [ -d "$SERVER_BINARY_TEMP_DIR" ]; then
    rm -rf "$SERVER_BINARY_TEMP_DIR"
  fi
}

trap cleanup EXIT

compose_services() {
  podman compose --file "$COMPOSE_FILE" config --services
}

compose_image_name() {
  local service="$1"
  local project_name="${COMPOSE_PROJECT_NAME:-$(basename "$ROOT_DIR")}"
  printf 'localhost/%s_%s:latest\n' "$project_name" "$service"
}

ensure_compose_images() {
  local missing=0
  while IFS= read -r service; do
    [ -n "$service" ] || continue
    local image
    image="$(compose_image_name "$service")"
    if ! podman image exists "$image"; then
      missing=1
      break
    fi
  done < <(compose_services)

  if [ "$missing" -eq 1 ]; then
    podman compose --file "$COMPOSE_FILE" build >/dev/null
  fi
}

compose_total_image_size_bytes() {
  local total=0
  while IFS= read -r service; do
    [ -n "$service" ] || continue
    local image
    image="$(compose_image_name "$service")"
    local size
    size="$(podman image inspect --format '{{.Size}}' "$image")"
    total=$((total + size))
  done < <(compose_services)

  printf '%s\n' "$total"
}

measure_server() {
  python - "$SERVER_BINARY" "$RUNS" "$STARTUP_TIMEOUT_SECONDS" "$STARTUP_SETTLE_MILLISECONDS" "$STARTUP_POLL_SECONDS" <<'PY'
import json
import os
import signal
import socket
import statistics
import subprocess
import sys
import time
from pathlib import Path

binary = Path(sys.argv[1])
runs = int(sys.argv[2])
timeout_seconds = float(sys.argv[3])
settle_ms = int(sys.argv[4])
poll_seconds = float(sys.argv[5])

if not binary.exists():
    raise SystemExit(f"missing server binary: {binary}")


def read_peak_rss_bytes(pid: int) -> int:
    try:
        with open(f"/proc/{pid}/status", "r", encoding="utf-8") as handle:
            peak = 0
            current = 0
            for line in handle:
                if line.startswith("VmHWM:"):
                    peak = int(line.split()[1]) * 1024
                elif line.startswith("VmRSS:"):
                    current = int(line.split()[1]) * 1024
            return max(peak, current)
    except FileNotFoundError:
        return 0


def wait_until_ready(port: int, pid: int) -> tuple[float, int]:
    started = time.perf_counter_ns()
    deadline = time.monotonic() + timeout_seconds
    peak = 0

    while time.monotonic() < deadline:
        peak = max(peak, read_peak_rss_bytes(pid))

        try:
            with socket.create_connection(("127.0.0.1", port), timeout=max(poll_seconds, 0.001)) as connection:
                connection.sendall(b"GET /api/jjugeul HTTP/1.0\r\nHost: 127.0.0.1\r\n\r\n")
                response = connection.recv(64)
                if response.startswith(b"HTTP/1.1 200") or response.startswith(b"HTTP/1.0 200"):
                    elapsed_ms = (time.perf_counter_ns() - started) / 1_000_000
                    settle_deadline = time.monotonic() + (settle_ms / 1000)
                    while time.monotonic() < settle_deadline:
                        peak = max(peak, read_peak_rss_bytes(pid))
                        time.sleep(0.005)
                    return elapsed_ms, peak
        except OSError:
            pass

        time.sleep(poll_seconds)

    raise TimeoutError(f"server did not become ready within {timeout_seconds:.2f}s")


def pick_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


startup_ms = []
peak_rss_bytes = []

for _ in range(runs):
    port = pick_port()
    env = os.environ | {
        "PORT": str(port),
        "JOOGLE_DB_PATH": ":memory:",
    }
    process = subprocess.Popen(
        [str(binary)],
        cwd=str(binary.parent.parent.parent),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )

    try:
        elapsed_ms, peak_bytes = wait_until_ready(port, process.pid)
        startup_ms.append(elapsed_ms)
        peak_rss_bytes.append(peak_bytes)
    finally:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait(timeout=1)

if not startup_ms:
    raise SystemExit("failed to collect startup samples")

print(json.dumps({
    "startup_ms_median": statistics.median(startup_ms),
    "startup_ms_min": min(startup_ms),
    "peak_rss_bytes_max": max(peak_rss_bytes),
    "runs": runs,
}))
PY
}

require_command podman
require_command python

ensure_compose_images
build_server_binary

compose_total_size_bytes="$(compose_total_image_size_bytes)"
server_binary_size_bytes="$(stat --printf='%s' "$SERVER_BINARY")"
server_measurements="$(measure_server)"

startup_median_ms="$(python - "$server_measurements" <<'PY'
import json
import sys
print(f"{json.loads(sys.argv[1])['startup_ms_median']:.2f}")
PY
)"

startup_min_ms="$(python - "$server_measurements" <<'PY'
import json
import sys
print(f"{json.loads(sys.argv[1])['startup_ms_min']:.2f}")
PY
)"

peak_rss_bytes="$(python - "$server_measurements" <<'PY'
import json
import sys
print(json.loads(sys.argv[1])['peak_rss_bytes_max'])
PY
)"

printf 'compose (%s): %s total image size\n' "$COMPOSE_FILE" "$(format_bytes "$compose_total_size_bytes")"
printf 'server: %s binary · %s ms startup median (%s ms best, %s runs) · %s peak RSS\n' \
  "$(format_bytes "$server_binary_size_bytes")" \
  "$startup_median_ms" \
  "$startup_min_ms" \
  "$RUNS" \
  "$(format_bytes "$peak_rss_bytes")"
