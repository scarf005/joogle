import { computed, effect, signal } from "@preact/signals"

export type Locale = "ko" | "ja" | "en"

const STORAGE_KEY = "joogle-locale"
const LOCALE_ORDER: Locale[] = ["ko", "en", "ja"]

function getInitialLocale(): Locale {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "ko" || stored === "ja" || stored === "en") return stored

    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith("ja")) return "ja"
    if (browserLang.startsWith("ko")) return "ko"
    // Default to English for all other languages
    return "en"
  }
  return "en"
}

export const locale = signal<Locale>(getInitialLocale())

export const isKorean = computed(() => locale.value === "ko")
export const isJapanese = computed(() => locale.value === "ja")
export const isEnglish = computed(() => locale.value === "en")

export function setLocale(newLocale: Locale) {
  locale.value = newLocale
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    localStorage.setItem(STORAGE_KEY, newLocale)
  }
}

export function nextLocale() {
  const currentIndex = LOCALE_ORDER.indexOf(locale.value)
  const nextIndex = (currentIndex + 1) % LOCALE_ORDER.length
  setLocale(LOCALE_ORDER[nextIndex])
}

// Keep toggleLocale for backward compatibility (ko ↔ ja)
export function toggleLocale() {
  setLocale(locale.value === "ko" ? "ja" : "ko")
}

effect(() => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale.value
  }
})
