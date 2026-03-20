import { signal } from "@preact/signals"

export const jjugeulCount = signal(0)
export const jjugeulBurstSeed = signal(0)
export const jjugeulPendingDelta = signal(0)
export const jjugeulPressed = signal(false)
export const jjugeulCountryCode = signal("ZZ")
export const jjugeulCountryTotal = signal(0)
export const jjugeulGlobalTotal = signal(0)
export const jjugeulLeaderboardOpen = signal(false)
export const jjugeulLeaderboard = signal<JjugeulLeaderboardEntry[]>([])

export interface JjugeulLeaderboardEntry {
  countryCode: string
  total: number
}

export function pressJjugeul() {
  if (jjugeulPressed.value) return false

  jjugeulPressed.value = true
  jjugeulCount.value += 1
  jjugeulBurstSeed.value += 1
  jjugeulPendingDelta.value += 1

  return true
}

export function releaseJjugeul() {
  jjugeulPressed.value = false
}

export function resetJjugeulSession() {
  jjugeulCount.value = 0
  jjugeulBurstSeed.value = 0
  jjugeulPendingDelta.value = 0
  jjugeulPressed.value = false
}

export function consumeJjugeulPendingDelta() {
  const delta = jjugeulPendingDelta.value
  jjugeulPendingDelta.value = 0
  return delta
}

export function restoreJjugeulPendingDelta(delta: number) {
  jjugeulPendingDelta.value += delta
}

export function setJjugeulRemoteTotals(options: {
  countryCode: string
  countryTotal: number
  globalTotal: number
}) {
  jjugeulCountryCode.value = options.countryCode
  jjugeulCountryTotal.value = options.countryTotal
  jjugeulGlobalTotal.value = options.globalTotal
}

export function setJjugeulLeaderboard(entries: JjugeulLeaderboardEntry[]) {
  jjugeulLeaderboard.value = entries
}

export function toggleJjugeulLeaderboard() {
  jjugeulLeaderboardOpen.value = !jjugeulLeaderboardOpen.value
}
