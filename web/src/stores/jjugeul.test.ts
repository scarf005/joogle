import { beforeEach, describe, expect, it } from "vitest"
import {
  consumeJjugeulPendingDelta,
  jjugeulBestCount,
  jjugeulBurstSeed,
  jjugeulCount,
  jjugeulCountryCode,
  jjugeulCountryTotal,
  jjugeulGlobalTotal,
  jjugeulMuted,
  jjugeulPendingDelta,
  jjugeulPressed,
  pressJjugeul,
  rehydrateJjugeulState,
  releaseJjugeul,
  resetJjugeulSession,
  restoreJjugeulPendingDelta,
  setJjugeulRemoteTotals,
  toggleJjugeulMuted,
} from "./jjugeul.ts"

describe("jjugeul store", () => {
  beforeEach(() => {
    localStorage.clear()
    resetJjugeulSession()
    jjugeulBestCount.value = 0
    jjugeulCountryCode.value = "ZZ"
    jjugeulCountryTotal.value = 0
    jjugeulGlobalTotal.value = 0
    jjugeulMuted.value = false
    jjugeulPendingDelta.value = 0
    releaseJjugeul()
    rehydrateJjugeulState()
  })

  it("increments count and best count on press", () => {
    expect(pressJjugeul()).toBe(true)

    expect(jjugeulPressed.value).toBe(true)
    expect(jjugeulCount.value).toBe(1)
    expect(jjugeulBestCount.value).toBe(1)
    expect(jjugeulBurstSeed.value).toBe(1)
    expect(jjugeulPendingDelta.value).toBe(1)
    expect(localStorage.getItem("jjugeul-best-count")).toBe("1")
  })

  it("ignores repeated press until release", () => {
    pressJjugeul()

    expect(pressJjugeul()).toBe(false)
    expect(jjugeulCount.value).toBe(1)

    releaseJjugeul()
    expect(pressJjugeul()).toBe(true)
    expect(jjugeulCount.value).toBe(2)
  })

  it("rehydrates best count and muted state from storage", () => {
    localStorage.setItem("jjugeul-best-count", "27")
    localStorage.setItem("jjugeul-muted", "true")

    rehydrateJjugeulState()

    expect(jjugeulBestCount.value).toBe(27)
    expect(jjugeulMuted.value).toBe(true)
  })

  it("persists muted state when toggled", () => {
    toggleJjugeulMuted()

    expect(jjugeulMuted.value).toBe(true)
    expect(localStorage.getItem("jjugeul-muted")).toBe("true")
  })

  it("consumes and restores pending click deltas", () => {
    pressJjugeul()
    releaseJjugeul()

    expect(consumeJjugeulPendingDelta()).toBe(1)
    expect(jjugeulPendingDelta.value).toBe(0)

    restoreJjugeulPendingDelta(2)
    expect(jjugeulPendingDelta.value).toBe(2)
  })

  it("stores remote totals from the api", () => {
    setJjugeulRemoteTotals({
      countryCode: "KR",
      countryTotal: 12,
      globalTotal: 99,
    })

    expect(jjugeulCountryCode.value).toBe("KR")
    expect(jjugeulCountryTotal.value).toBe(12)
    expect(jjugeulGlobalTotal.value).toBe(99)
  })
})
