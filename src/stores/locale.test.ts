import { beforeEach, describe, expect, it } from "vitest"
import {
  isJapanese,
  isKorean,
  locale,
  setLocale,
  toggleLocale,
} from "./locale.ts"

describe("Locale Store", () => {
  beforeEach(() => {
    locale.value = "ko"
  })

  it("should default to Korean", () => {
    expect(locale.value).toBe("ko")
  })

  it("setLocale should update locale", () => {
    setLocale("ja")
    expect(locale.value).toBe("ja")

    setLocale("ko")
    expect(locale.value).toBe("ko")
  })

  it("toggleLocale should switch between languages", () => {
    expect(locale.value).toBe("ko")

    toggleLocale()
    expect(locale.value).toBe("ja")

    toggleLocale()
    expect(locale.value).toBe("ko")
  })

  it("isKorean should be true when locale is ko", () => {
    locale.value = "ko"
    expect(isKorean.value).toBe(true)
    expect(isJapanese.value).toBe(false)
  })

  it("isJapanese should be true when locale is ja", () => {
    locale.value = "ja"
    expect(isKorean.value).toBe(false)
    expect(isJapanese.value).toBe(true)
  })
})
