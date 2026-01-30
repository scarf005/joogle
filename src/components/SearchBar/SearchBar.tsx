import "./SearchBar.css"
import { searchQuery, setQuery, showSuggestions } from "../../stores/search.ts"
import { locale } from "../../stores/locale.ts"
import { searchHistory } from "../../stores/history.ts"
import { characters, searchTerms } from "../../data/blueArchive.ts"
import { computed } from "@preact/signals"

interface SearchBarProps {
  onSearch: (query: string) => void
  autoFocus?: boolean
  placeholder?: string
}

const suggestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  if (!query) {
    return searchHistory.value.map((q: string) => ({
      text: q,
      isHistory: true,
    }))
  }

  const currentLocale = locale.value as "ko" | "ja"
  const results: Array<{ text: string; isHistory: boolean }> = []

  characters.forEach((char) => {
    const name = char.name[currentLocale] || char.name.ko
    if (name.toLowerCase().includes(query)) {
      results.push({ text: name, isHistory: false })
    }
  })

  const terms = currentLocale === "ja" ? searchTerms.ja : searchTerms.ko
  terms.forEach((term: string) => {
    if (term.toLowerCase().includes(query)) {
      results.push({ text: term, isHistory: false })
    }
  })

  return results.slice(0, 8)
})

export function SearchBar(
  { onSearch, autoFocus = false, placeholder }: SearchBarProps,
) {
  const currentPlaceholder = placeholder ||
    (locale.value === "ko" ? "블루 아카이브 검색" : "ブルーアーカイブを検索")

  const handleInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setQuery(value)
    showSuggestions.value = true
  }

  const handleFocus = () => {
    if (searchQuery.value || searchHistory.value.length > 0) {
      showSuggestions.value = true
    }
  }

  const handleClear = () => {
    setQuery("")
    showSuggestions.value = false
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      showSuggestions.value = false
      onSearch(searchQuery.value)
    }
    if (e.key === "Escape") {
      showSuggestions.value = false
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    showSuggestions.value = false
    onSearch(suggestion)
  }

  const handleBlur = () => {
    setTimeout(() => {
      showSuggestions.value = false
    }, 200)
  }

  return (
    <div class="search-bar">
      <div class="search-bar__wrapper">
        <div class="search-bar__icon">
          <svg
            focusable="false"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </div>
        <input
          type="text"
          class="search-bar__input"
          value={searchQuery.value}
          onInput={handleInput}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={currentPlaceholder}
          autoFocus={autoFocus}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions.value}
        />
        <button
          type="button"
          class={`search-bar__clear ${
            searchQuery.value ? "search-bar__clear--visible" : ""
          }`}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg
            focusable="false"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
      {showSuggestions.value && suggestions.value.length > 0 && (
        <div class="search-bar__suggestions" role="listbox">
          {suggestions.value.map((
            suggestion: { text: string; isHistory: boolean },
          ) => (
            <div
              key={suggestion.text}
              class="search-bar__suggestion"
              role="option"
              onClick={() => handleSuggestionClick(suggestion.text)}
            >
              <div class="search-bar__suggestion-icon">
                {suggestion.isHistory
                  ? (
                    <svg
                      focusable="false"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                    >
                      <path
                        fill="currentColor"
                        d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
                      />
                    </svg>
                  )
                  : (
                    <svg
                      focusable="false"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                    >
                      <path
                        fill="currentColor"
                        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                      />
                    </svg>
                  )}
              </div>
              <span class="search-bar__suggestion-text">
                {suggestion.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
