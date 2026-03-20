import { beforeEach, describe, expect, it } from "vitest"
import { getRandomCharacter, performSearch } from "./search.ts"
import { locale } from "../stores/locale.ts"

describe("Search Service", () => {
  beforeEach(() => {
    locale.value = "ko"
  })

  it("should find character by Korean name", async () => {
    const results = await performSearch("호시노")

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe("character")
    expect(results[0].title).toBe("호시노")
  })

  it("should find character by Japanese name", async () => {
    const results = await performSearch("ホシノ")

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe("character")
  })

  it("should find character by English name", async () => {
    const results = await performSearch("Hoshino")

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe("character")
  })

  it("should find school by name", async () => {
    const results = await performSearch("트리니티")

    expect(results.length).toBeGreaterThan(0)
    const schoolResult = results.find((r) => r.type === "school")
    expect(schoolResult).toBeDefined()
  })

  it("should return wiki links for unknown queries", async () => {
    const results = await performSearch("unknown query xyz")

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe("wiki")
  })

  it("should return results in Korean when locale is ko", async () => {
    locale.value = "ko"
    const results = await performSearch("호시노")

    expect(results[0].title).toBe("호시노")
    expect(results[0].description).toContain("아비도스")
  })

  it("should return results in Japanese when locale is ja", async () => {
    locale.value = "ja"
    const results = await performSearch("ホシノ")

    expect(results[0].title).toBe("ホシノ")
    expect(results[0].description).toContain("アビドス")
  })
})

describe("getRandomCharacter", () => {
  it("should return a character object", () => {
    const character = getRandomCharacter()

    expect(character).toBeDefined()
    expect(character.id).toBeDefined()
    expect(character.name.ko).toBeDefined()
    expect(character.name.ja).toBeDefined()
    expect(character.name.en).toBeDefined()
  })

  it("should return different characters over multiple calls", () => {
    const characters = new Set<string>()
    for (let i = 0; i < 20; i++) {
      characters.add(getRandomCharacter().id)
    }
    expect(characters.size).toBeGreaterThan(1)
  })
})
