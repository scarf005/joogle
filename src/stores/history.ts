import { signal } from "@preact/signals"

const STORAGE_KEY = "joogle-search-history"
const MAX_HISTORY = 10

function loadHistory(): string[] {
  if (typeof globalThis.localStorage === "undefined") return []
  const stored = globalThis.localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(history: string[]) {
  if (typeof globalThis.localStorage === "undefined") return
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export const searchHistory = signal<string[]>(loadHistory())

export function addToHistory(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return

  const newHistory = [
    trimmed,
    ...searchHistory.value.filter((q: string) => q !== trimmed),
  ].slice(0, MAX_HISTORY)

  searchHistory.value = newHistory
  saveHistory(newHistory)
}

export function removeFromHistory(query: string) {
  const newHistory = searchHistory.value.filter((q: string) => q !== query)
  searchHistory.value = newHistory
  saveHistory(newHistory)
}

export function clearHistory() {
  searchHistory.value = []
  saveHistory([])
}
