export interface JjugeulTotals {
  countryCode: string
  countryTotal: number
  globalTotal: number
}

export interface JjugeulLeaderboardEntry {
  countryCode: string
  total: number
}

export interface JjugeulLeaderboardResponse {
  entries: JjugeulLeaderboardEntry[]
}

interface ClickPayload {
  delta: number
}

async function requestJjugeul(
  path: string,
  options?: RequestInit,
): Promise<JjugeulTotals> {
  const response = await fetch(path, options)

  if (!response.ok) {
    throw new Error(`jjugeul request failed: ${response.status}`)
  }

  return await response.json() as JjugeulTotals
}

export function fetchJjugeulTotals() {
  return requestJjugeul("/api/jjugeul")
}

export async function fetchJjugeulLeaderboard() {
  const response = await fetch("/api/jjugeul/leaderboard")

  if (!response.ok) {
    throw new Error(`jjugeul leaderboard failed: ${response.status}`)
  }

  return await response.json() as JjugeulLeaderboardResponse
}

export function postJjugeulClicks(delta: number) {
  const body: ClickPayload = { delta }

  return requestJjugeul("/api/jjugeul", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

export function sendBeaconJjugeulClicks(delta: number) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.sendBeacon !== "function"
  ) {
    return false
  }

  const body: ClickPayload = { delta }
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" })

  return navigator.sendBeacon("/api/jjugeul", blob)
}
