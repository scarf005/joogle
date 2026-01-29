import { beforeEach, describe, expect, it } from "vitest"
import {
  checkEasterEgg,
  easterEggTriggered,
  joogleMode,
  resetEasterEgg,
} from "./easter.ts"

describe("Easter Egg Store", () => {
  beforeEach(() => {
    resetEasterEgg()
  })

  it("should not trigger for normal queries", () => {
    const result = checkEasterEgg("호시노")
    expect(result).toBe(false)
    expect(joogleMode.value).toBe(false)
  })

  it("should trigger for 'joogle' query", () => {
    const result = checkEasterEgg("joogle")
    expect(result).toBe(true)
    expect(joogleMode.value).toBe(true)
    expect(easterEggTriggered.value).toBe(true)
  })

  it("should trigger for '쮸글' query (Korean)", () => {
    const result = checkEasterEgg("쮸글")
    expect(result).toBe(true)
    expect(joogleMode.value).toBe(true)
  })

  it("should be case insensitive", () => {
    const result = checkEasterEgg("JOOGLE")
    expect(result).toBe(true)
    expect(joogleMode.value).toBe(true)
  })

  it("should trim whitespace", () => {
    const result = checkEasterEgg("  joogle  ")
    expect(result).toBe(true)
    expect(joogleMode.value).toBe(true)
  })

  it("resetEasterEgg should clear all flags", () => {
    checkEasterEgg("joogle")
    expect(joogleMode.value).toBe(true)
    expect(easterEggTriggered.value).toBe(true)

    resetEasterEgg()

    expect(joogleMode.value).toBe(false)
    expect(easterEggTriggered.value).toBe(false)
  })
})
