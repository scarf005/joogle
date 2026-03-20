export interface JjugeulTotals {
  countryCode: string
  countryTotal: number
  globalTotal: number
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
