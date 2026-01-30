import { computed, effect, signal } from "@preact/signals"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "joogle-theme"

function getSystemTheme(): "light" | "dark" {
  if (typeof globalThis.matchMedia === "undefined") return "light"
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getStoredTheme(): Theme {
  if (typeof globalThis.localStorage === "undefined") return "system"
  const stored = globalThis.localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }
  return "system"
}

export const theme = signal<Theme>(getStoredTheme())

export const resolvedTheme = computed<"light" | "dark">(() => {
  if (theme.value === "system") return getSystemTheme()
  return theme.value
})

export function setTheme(newTheme: Theme) {
  theme.value = newTheme
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.setItem(STORAGE_KEY, newTheme)
  }
}

export function toggleTheme() {
  const next = resolvedTheme.value === "light" ? "dark" : "light"
  setTheme(next)
}

effect(() => {
  if (typeof globalThis.document === "undefined") return
  const root = globalThis.document.documentElement
  root.setAttribute("data-theme", resolvedTheme.value)

  const metaTheme = globalThis.document.querySelector(
    'meta[name="theme-color"]',
  )
  if (metaTheme) {
    metaTheme.setAttribute(
      "content",
      resolvedTheme.value === "dark" ? "#202124" : "#4285f4",
    )
  }
})

if (typeof globalThis.matchMedia !== "undefined") {
  globalThis
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (theme.value === "system") {
        const root = globalThis.document.documentElement
        root.setAttribute("data-theme", getSystemTheme())
      }
    })
}
