import { beforeEach, describe, expect, it } from "vitest"
import {
  isEnglish,
  isJapanese,
  isKorean,
  locale,
  nextLocale,
  setLocale,
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

    setLocale("en")
    expect(locale.value).toBe("en")
  })

  it("nextLocale should cycle through ko → en → ja → ko", () => {
    expect(locale.value).toBe("ko")

    nextLocale()
    expect(locale.value).toBe("en")

    nextLocale()
    expect(locale.value).toBe("ja")

    nextLocale()
    expect(locale.value).toBe("ko")
  })

  it("isKorean should be true when locale is ko", () => {
    locale.value = "ko"
    expect(isKorean.value).toBe(true)
    expect(isJapanese.value).toBe(false)
    expect(isEnglish.value).toBe(false)
  })

  it("isJapanese should be true when locale is ja", () => {
    locale.value = "ja"
    expect(isKorean.value).toBe(false)
    expect(isJapanese.value).toBe(true)
    expect(isEnglish.value).toBe(false)
  })

  it("isEnglish should be true when locale is en", () => {
    locale.value = "en"
    expect(isKorean.value).toBe(false)
    expect(isJapanese.value).toBe(false)
    expect(isEnglish.value).toBe(true)
  })
})
