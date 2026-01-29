import { computed, effect, signal } from "@preact/signals"

export type Locale = "ko" | "ja"

const STORAGE_KEY = "joogle-locale"

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "ko" || stored === "ja") return stored
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith("ja")) return "ja"
  }
  return "ko"
}

export const locale = signal<Locale>(getInitialLocale())

export const isKorean = computed(() => locale.value === "ko")
export const isJapanese = computed(() => locale.value === "ja")

export function setLocale(newLocale: Locale) {
  locale.value = newLocale
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, newLocale)
  }
}

export function toggleLocale() {
  setLocale(locale.value === "ko" ? "ja" : "ko")
}

effect(() => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale.value
  }
})
