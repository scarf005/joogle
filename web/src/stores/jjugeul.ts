import { signal } from "@preact/signals"

export interface JjugeulLeaderboardEntry {
  countryCode: string
  total: number
}

export const jjugeulCount = signal(0)
export const jjugeulBurstSeed = signal(0)
export const jjugeulPendingDelta = signal(0)
export const jjugeulPressed = signal(false)
export const jjugeulCountryCode = signal("ZZ")
export const jjugeulCountryTotal = signal(0)
export const jjugeulGlobalTotal = signal(0)
export const jjugeulLeaderboardOpen = signal(false)
export const jjugeulLeaderboard = signal<JjugeulLeaderboardEntry[]>([])

export const pressJjugeul = () => {
  if (jjugeulPressed.value) return false

  jjugeulPressed.value = true
  jjugeulCount.value += 1
  jjugeulBurstSeed.value += 1
  jjugeulPendingDelta.value += 1

  return true
}

export const releaseJjugeul = () => {
  jjugeulPressed.value = false
}

export const resetJjugeulSession = () => {
  jjugeulCount.value = 0
  jjugeulBurstSeed.value = 0
  jjugeulPendingDelta.value = 0
  jjugeulPressed.value = false
}

export const consumeJjugeulPendingDelta = () => {
  const delta = jjugeulPendingDelta.value
  jjugeulPendingDelta.value = 0
  return delta
}

export const restoreJjugeulPendingDelta = (options: { delta: number }) => {
  jjugeulPendingDelta.value += options.delta
}

export const setJjugeulRemoteTotals = (options: {
  countryCode: string
  countryTotal: number
  globalTotal: number
}) => {
  jjugeulCountryCode.value = options.countryCode
  jjugeulCountryTotal.value = options.countryTotal
  jjugeulGlobalTotal.value = options.globalTotal
}

export const setJjugeulLeaderboard = (options: {
  entries: JjugeulLeaderboardEntry[]
}) => {
  jjugeulLeaderboard.value = options.entries
}

export const toggleJjugeulLeaderboard = () => {
  jjugeulLeaderboardOpen.value = !jjugeulLeaderboardOpen.value
}
