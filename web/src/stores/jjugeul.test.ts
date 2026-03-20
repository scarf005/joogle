import { beforeEach, describe, expect, it } from "vitest"
import {
  consumeJjugeulPendingDelta,
  jjugeulBurstSeed,
  jjugeulCount,
  jjugeulCountryCode,
  jjugeulCountryTotal,
  jjugeulGlobalTotal,
  jjugeulLeaderboard,
  jjugeulLeaderboardOpen,
  jjugeulPendingDelta,
  jjugeulPressed,
  pressJjugeul,
  releaseJjugeul,
  resetJjugeulSession,
  restoreJjugeulPendingDelta,
  setJjugeulLeaderboard,
  setJjugeulRemoteTotals,
  toggleJjugeulLeaderboard,
} from "./jjugeul.ts"

describe("jjugeul store", () => {
  beforeEach(() => {
    resetJjugeulSession()
    jjugeulCountryCode.value = "ZZ"
    jjugeulCountryTotal.value = 0
    jjugeulGlobalTotal.value = 0
    jjugeulLeaderboard.value = []
    jjugeulLeaderboardOpen.value = false
    jjugeulPendingDelta.value = 0
    releaseJjugeul()
  })

  it("increments count on press", () => {
    expect(pressJjugeul()).toBe(true)

    expect(jjugeulPressed.value).toBe(true)
    expect(jjugeulCount.value).toBe(1)
    expect(jjugeulBurstSeed.value).toBe(1)
    expect(jjugeulPendingDelta.value).toBe(1)
  })

  it("ignores repeated press until release", () => {
    pressJjugeul()

    expect(pressJjugeul()).toBe(false)
    expect(jjugeulCount.value).toBe(1)

    releaseJjugeul()
    expect(pressJjugeul()).toBe(true)
    expect(jjugeulCount.value).toBe(2)
  })

  it("consumes and restores pending click deltas", () => {
    pressJjugeul()
    releaseJjugeul()

    expect(consumeJjugeulPendingDelta()).toBe(1)
    expect(jjugeulPendingDelta.value).toBe(0)

    restoreJjugeulPendingDelta({ delta: 2 })
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

  it("stores leaderboard entries and toggles the panel", () => {
    setJjugeulLeaderboard({
      entries: [
        { countryCode: "KR", total: 20 },
        { countryCode: "JP", total: 15 },
      ],
    })

    toggleJjugeulLeaderboard()

    expect(jjugeulLeaderboard.value).toHaveLength(2)
    expect(jjugeulLeaderboard.value[0].countryCode).toBe("KR")
    expect(jjugeulLeaderboardOpen.value).toBe(true)
  })
})
