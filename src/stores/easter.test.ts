import { beforeEach, describe, expect, it } from "vitest"
import {
  activeCharacterEgg,
  checkEasterEgg,
  easterEggTriggered,
  joogleMode,
  resetEasterEgg,
} from "./easter.ts"

describe("Easter Egg Store", () => {
  beforeEach(() => {
    resetEasterEgg()
  })

  it("should return null for normal queries", () => {
    const result = checkEasterEgg("test query")
    expect(result).toBe(null)
    expect(joogleMode.value).toBe(false)
  })

  it("should return 'joogle' for 'joogle' query", () => {
    const result = checkEasterEgg("joogle")
    expect(result).toBe("joogle")
    expect(joogleMode.value).toBe(true)
    expect(easterEggTriggered.value).toBe(true)
  })

  it("should return 'joogle' for '쮸글' query (Korean)", () => {
    const result = checkEasterEgg("쮸글")
    expect(result).toBe("joogle")
    expect(joogleMode.value).toBe(true)
  })

  it("should be case insensitive", () => {
    const result = checkEasterEgg("JOOGLE")
    expect(result).toBe("joogle")
    expect(joogleMode.value).toBe(true)
  })

  it("should trim whitespace", () => {
    const result = checkEasterEgg("  joogle  ")
    expect(result).toBe("joogle")
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

describe("Character Easter Eggs", () => {
  beforeEach(() => {
    resetEasterEgg()
  })

  it("should return 'character' and set Aru easter egg for '아루'", () => {
    const result = checkEasterEgg("아루")
    expect(result).toBe("character")
    expect(activeCharacterEgg.value).toBe("aru")
  })

  it("should return 'character' for 'Aru' (English)", () => {
    const result = checkEasterEgg("Aru")
    expect(result).toBe("character")
    expect(activeCharacterEgg.value).toBe("aru")
  })

  it("should return 'character' for '호시노'", () => {
    const result = checkEasterEgg("호시노")
    expect(result).toBe("character")
    expect(activeCharacterEgg.value).toBe("hoshino")
  })

  it("should return 'character' for '시로코'", () => {
    const result = checkEasterEgg("시로코")
    expect(result).toBe("character")
    expect(activeCharacterEgg.value).toBe("shiroko")
  })

  it("should return 'character' for '히나'", () => {
    const result = checkEasterEgg("히나")
    expect(result).toBe("character")
    expect(activeCharacterEgg.value).toBe("hina")
  })

  it("should return 'character' for '미카'", () => {
    const result = checkEasterEgg("미카")
    expect(result).toBe("character")
    expect(activeCharacterEgg.value).toBe("mika")
  })

  it("should reset character easter egg", () => {
    checkEasterEgg("아루")
    expect(activeCharacterEgg.value).toBe("aru")

    resetEasterEgg()
    expect(activeCharacterEgg.value).toBe(null)
  })
})
