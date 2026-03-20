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

export interface JjugeulLiveResponse {
  totals: JjugeulTotals
  leaderboard: JjugeulLeaderboardEntry[]
}

interface ClickPayload {
  delta: number
}

const requestJson = async <T>(options: {
  path: string
  init?: RequestInit
}): Promise<T> => {
  const response = await fetch(options.path, options.init)

  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`)
  }

  return await response.json() as T
}

export const fetchJjugeulTotals = () => {
  return requestJson<JjugeulTotals>({ path: "/api/jjugeul" })
}

export const fetchJjugeulLeaderboard = () => {
  return requestJson<JjugeulLeaderboardResponse>({
    path: "/api/jjugeul/leaderboard",
  })
}

export const postJjugeulClicks = (options: { delta: number }) => {
  const body: ClickPayload = { delta: options.delta }

  return requestJson<JjugeulTotals>({
    path: "/api/jjugeul",
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  })
}

export const sendBeaconJjugeulClicks = (options: { delta: number }) => {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.sendBeacon !== "function"
  ) {
    return false
  }

  const body: ClickPayload = { delta: options.delta }
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" })

  return navigator.sendBeacon("/api/jjugeul", blob)
}

export const createJjugeulWebSocket = () => {
  if (typeof globalThis === "undefined" || !globalThis.location) {
    return null
  }

  const protocol = globalThis.location.protocol === "https:" ? "wss" : "ws"
  return new WebSocket(
    `${protocol}://${globalThis.location.host}/api/jjugeul/live`,
  )
}
