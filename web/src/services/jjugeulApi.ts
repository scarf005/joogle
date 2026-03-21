export interface JjugeulTotals {
  countryCode: string
  countryTotal: number
  globalTotal: number
}

export interface JjugeulCountryLeaderboardEntry {
  countryCode: string
  total: number
}

export interface JjugeulStudentLeaderboardEntry {
  studentId: number
  total: number
}

export interface JjugeulLiveResponse {
  totals: JjugeulTotals
  countryLeaderboard: JjugeulCountryLeaderboardEntry[]
  studentLeaderboard: JjugeulStudentLeaderboardEntry[]
}

export interface JjugeulClick {
  studentId: number
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

export const fetchJjugeulSnapshot = () => {
  return requestJson<JjugeulLiveResponse>({ path: "/api/jjugeul" })
}

export const postJjugeulClicks = (options: { clicks: JjugeulClick[] }) => {
  return requestJson<JjugeulLiveResponse>({
    path: "/api/jjugeul",
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ clicks: options.clicks }),
    },
  })
}

export const sendBeaconJjugeulClicks = (
  options: { clicks: JjugeulClick[] },
) => {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.sendBeacon !== "function"
  ) {
    return false
  }

  const blob = new Blob([JSON.stringify({ clicks: options.clicks })], {
    type: "application/json",
  })

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
