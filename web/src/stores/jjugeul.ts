import { signal } from "@preact/signals"

const BEST_COUNT_STORAGE_KEY = "jjugeul-best-count"
const MUTED_STORAGE_KEY = "jjugeul-muted"

function getStoredNumber(key: string) {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return 0
  }

  const value = globalThis.localStorage.getItem(key)
  if (!value) return 0

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getStoredMutedState() {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return false
  }

  return globalThis.localStorage.getItem(MUTED_STORAGE_KEY) === "true"
}

export const jjugeulCount = signal(0)
export const jjugeulBestCount = signal(0)
export const jjugeulBurstSeed = signal(0)
export const jjugeulMuted = signal(false)
export const jjugeulPendingDelta = signal(0)
export const jjugeulPressed = signal(false)
export const jjugeulCountryCode = signal("ZZ")
export const jjugeulCountryTotal = signal(0)
export const jjugeulGlobalTotal = signal(0)

export function rehydrateJjugeulState() {
  jjugeulBestCount.value = getStoredNumber(BEST_COUNT_STORAGE_KEY)
  jjugeulMuted.value = getStoredMutedState()
}

function persistBestCount() {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return
  }

  globalThis.localStorage.setItem(
    BEST_COUNT_STORAGE_KEY,
    String(jjugeulBestCount.value),
  )
}

function persistMutedState() {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return
  }

  globalThis.localStorage.setItem(MUTED_STORAGE_KEY, String(jjugeulMuted.value))
}

export function pressJjugeul() {
  if (jjugeulPressed.value) return false

  jjugeulPressed.value = true
  jjugeulCount.value += 1
  jjugeulBurstSeed.value += 1
  jjugeulPendingDelta.value += 1

  if (jjugeulCount.value > jjugeulBestCount.value) {
    jjugeulBestCount.value = jjugeulCount.value
    persistBestCount()
  }

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

export function setJjugeulMuted(value: boolean) {
  jjugeulMuted.value = value
  persistMutedState()
}

export function toggleJjugeulMuted() {
  setJjugeulMuted(!jjugeulMuted.value)
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

rehydrateJjugeulState()
