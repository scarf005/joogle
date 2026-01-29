import { computed, signal } from "@preact/signals"

export const searchQuery = signal("")
export const searchResults = signal<SearchResult[]>([])
export const isLoading = signal(false)
export const showSuggestions = signal(false)

export interface SearchResult {
  id: string
  type: "character" | "school" | "guide" | "event" | "wiki"
  title: string
  description: string
  url: string
  thumbnail?: string
  metadata?: Record<string, unknown>
}

export const hasQuery = computed(() => searchQuery.value.length > 0)

export function setQuery(value: string) {
  searchQuery.value = value
}

export function clearQuery() {
  searchQuery.value = ""
  searchResults.value = []
}

export function setResults(results: SearchResult[]) {
  searchResults.value = results
}

export function setLoading(loading: boolean) {
  isLoading.value = loading
}
