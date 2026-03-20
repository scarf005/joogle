import { useEffect } from "preact/hooks"
import { searchQuery, setQuery, showSuggestions } from "../stores/search.ts"

export function useKeyboardShortcuts(
  searchInputRef: { current: HTMLInputElement | null },
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && e.target !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (e.key === "Escape") {
        if (showSuggestions.value) {
          showSuggestions.value = false
        } else if (searchQuery.value) {
          setQuery("")
        } else {
          searchInputRef.current?.blur()
        }
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    return () => globalThis.removeEventListener("keydown", handleKeyDown)
  }, [searchInputRef])
}
