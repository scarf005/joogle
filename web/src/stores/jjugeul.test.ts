import { beforeEach, describe, expect, it } from "vitest"
import { defaultJjugeulStudentId, jjugeulStudents } from "../data/students.ts"
import {
  consumeJjugeulPendingClicks,
  getJjugeulActiveStudentTotal,
  hydrateJjugeulPreferences,
  jjugeulActiveStudentId,
  jjugeulBurstSeed,
  jjugeulCount,
  jjugeulCountryCode,
  jjugeulCountryLeaderboard,
  jjugeulCountryTotal,
  jjugeulFavoriteStudentIds,
  jjugeulGlobalTotal,
  jjugeulLeaderboardOpen,
  jjugeulPendingClicks,
  jjugeulPressed,
  jjugeulStudentLeaderboard,
  pressJjugeul,
  releaseJjugeul,
  resetJjugeulSession,
  restoreJjugeulPendingClicks,
  selectJjugeulStudent,
  setJjugeulLeaderboards,
  setJjugeulRemoteTotals,
  toggleJjugeulFavoriteStudent,
  toggleJjugeulLeaderboard,
} from "./jjugeul.ts"

describe("jjugeul store", () => {
  const aruId = jjugeulStudents.find((student) => student.legacyKey === "aru")
    ?.id ?? 0
  const mariId = jjugeulStudents.find((student) => student.legacyKey === "mari")
    ?.id ?? 0

  beforeEach(() => {
    globalThis.localStorage.clear()
    globalThis.document.cookie = "joogle.jjugeulSession=; path=/; max-age=0"
    resetJjugeulSession()
    releaseJjugeul()
  })

  it("increments count on press for the active student", () => {
    expect(pressJjugeul()).toBe(true)

    expect(jjugeulPressed.value).toBe(true)
    expect(jjugeulCount.value).toBe(1)
    expect(jjugeulBurstSeed.value).toBe(1)
    expect(jjugeulPendingClicks.value[defaultJjugeulStudentId]).toBe(1)
  })

  it("ignores repeated press until release", () => {
    pressJjugeul()

    expect(pressJjugeul()).toBe(false)
    expect(jjugeulCount.value).toBe(1)

    releaseJjugeul()
    expect(pressJjugeul()).toBe(true)
    expect(jjugeulCount.value).toBe(2)
  })

  it("consumes and restores pending click batches", () => {
    pressJjugeul()
    releaseJjugeul()
    selectJjugeulStudent({ studentId: aruId })
    pressJjugeul()
    releaseJjugeul()

    expect(consumeJjugeulPendingClicks()).toEqual([
      { studentId: aruId, delta: 1 },
      { studentId: defaultJjugeulStudentId, delta: 1 },
    ])
    expect(jjugeulPendingClicks.value).toEqual({})

    restoreJjugeulPendingClicks({
      clicks: [
        { studentId: aruId, delta: 2 },
        { studentId: defaultJjugeulStudentId, delta: 1 },
      ],
    })
    expect(jjugeulPendingClicks.value).toEqual({
      [defaultJjugeulStudentId]: 1,
      [aruId]: 2,
    })
  })

  it("stores remote totals and both leaderboards", () => {
    setJjugeulRemoteTotals({
      countryCode: "KR",
      countryTotal: 12,
      globalTotal: 99,
    })
    setJjugeulLeaderboards({
      countryEntries: [
        { countryCode: "KR", total: 20 },
        { countryCode: "JP", total: 15 },
      ],
      studentEntries: [
        { studentId: defaultJjugeulStudentId, total: 30 },
        { studentId: aruId, total: 18 },
      ],
    })

    expect(jjugeulCountryCode.value).toBe("KR")
    expect(jjugeulCountryTotal.value).toBe(12)
    expect(jjugeulGlobalTotal.value).toBe(99)
    expect(jjugeulCountryLeaderboard.value).toHaveLength(2)
    expect(jjugeulStudentLeaderboard.value).toHaveLength(2)
    expect(getJjugeulActiveStudentTotal()).toBe(30)
  })

  it("persists clicks and country totals in a cookie", () => {
    pressJjugeul()
    setJjugeulRemoteTotals({
      countryCode: "KR",
      countryTotal: 12,
      globalTotal: 99,
    })

    expect(globalThis.document.cookie).toContain("joogle.jjugeulSession=")

    resetJjugeulSession()
    hydrateJjugeulPreferences()

    expect(jjugeulCount.value).toBe(1)
    expect(jjugeulCountryCode.value).toBe("KR")
    expect(jjugeulCountryTotal.value).toBe(12)
  })

  it("stores favorite students and active selection in local storage", () => {
    toggleJjugeulFavoriteStudent({ studentId: aruId })
    selectJjugeulStudent({ studentId: aruId })

    expect(jjugeulFavoriteStudentIds.value).toEqual([
      defaultJjugeulStudentId,
      aruId,
    ])
    expect(jjugeulActiveStudentId.value).toBe(aruId)
    expect(globalThis.localStorage.getItem("joogle.activeStudent")).toBe(
      String(aruId),
    )
  })

  it("hydrates preferences from storage", () => {
    globalThis.localStorage.setItem(
      "joogle.favoriteStudents",
      JSON.stringify([mariId, defaultJjugeulStudentId]),
    )
    globalThis.localStorage.setItem("joogle.activeStudent", String(mariId))

    hydrateJjugeulPreferences()

    expect(jjugeulFavoriteStudentIds.value).toEqual([
      mariId,
      defaultJjugeulStudentId,
    ])
    expect(jjugeulActiveStudentId.value).toBe(mariId)
  })

  it("toggles the leaderboard panel", () => {
    toggleJjugeulLeaderboard()

    expect(jjugeulLeaderboardOpen.value).toBe(true)
  })
})
