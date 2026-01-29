import "./Results.css"
import { Logo } from "../../components/Logo/Logo.tsx"
import { SearchBar } from "../../components/SearchBar/SearchBar.tsx"
import { Footer } from "../../components/Footer/Footer.tsx"
import {
  isLoading,
  type SearchResult,
  searchResults,
  setLoading,
  setResults,
} from "../../stores/search.ts"
import { checkEasterEgg } from "../../stores/easter.ts"
import { type Locale, locale } from "../../stores/locale.ts"
import { performSearch } from "../../services/search.ts"

interface ResultsProps {
  onNavigateToHome: () => void
}

const statsTexts: Record<Locale, (count: number) => string> = {
  ko: (count) => `검색결과 약 ${count}개`,
  en: (count) => `About ${count} results`,
  ja: (count) => `約${count}件の検索結果`,
}

const loadingTexts: Record<Locale, string> = {
  ko: "검색 중...",
  en: "Searching...",
  ja: "検索中...",
}

const typeLabelsMap: Record<Locale, Record<string, string>> = {
  ko: {
    character: "캐릭터",
    school: "학교",
    guide: "가이드",
    event: "이벤트",
    wiki: "위키",
  },
  en: {
    character: "Character",
    school: "School",
    guide: "Guide",
    event: "Event",
    wiki: "Wiki",
  },
  ja: {
    character: "キャラクター",
    school: "学校",
    guide: "ガイド",
    event: "イベント",
    wiki: "ウィキ",
  },
}

export function Results({ onNavigateToHome }: ResultsProps) {
  const handleSearch = (query: string) => {
    if (!query.trim()) return

    const easterEgg = checkEasterEgg(query)
    if (easterEgg === "joogle") {
      onNavigateToHome()
      return
    }

    setLoading(true)
    const results = performSearch(query)
    setResults(results)
    setLoading(false)
  }

  const handleLogoClick = () => {
    onNavigateToHome()
  }

  const currentLocale = locale.value as Locale
  const resultCount = searchResults.value.length
  const statsText = statsTexts[currentLocale](resultCount)

  return (
    <div class="results">
      <header class="results__header">
        <div
          class="results__logo"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
        >
          <Logo size="small" />
        </div>
        <div class="results__search">
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      <main class="results__content">
        {isLoading.value
          ? (
            <div class="results__loading">
              {loadingTexts[currentLocale]}
            </div>
          )
          : (
            <>
              <div class="results__stats">{statsText}</div>
              <div class="results__list">
                {searchResults.value.map((result: SearchResult) => (
                  <SearchResultItem key={result.id} result={result} />
                ))}
              </div>
            </>
          )}
      </main>

      <Footer />
    </div>
  )
}

interface SearchResultItemProps {
  result: SearchResult
}

function SearchResultItem({ result }: SearchResultItemProps) {
  const currentLocale = locale.value as Locale
  const typeLabels = typeLabelsMap[currentLocale]

  return (
    <article class="result-item">
      <div class="result-item__url">
        <span class="result-item__url-text">{result.url}</span>
      </div>
      <h3 class="result-item__title">
        <a href={result.url} target="_blank" rel="noopener">
          {result.title}
        </a>
      </h3>
      <p class="result-item__description">{result.description}</p>
      <div class="result-item__meta">
        <span class={`result-item__tag result-item__tag--${result.type}`}>
          {typeLabels[result.type]}
        </span>
      </div>
    </article>
  )
}
