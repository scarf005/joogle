import "./Results.css"
import { Logo } from "../../components/Logo/Logo.tsx"
import { SearchBar } from "../../components/SearchBar/SearchBar.tsx"
import { Footer } from "../../components/Footer/Footer.tsx"
import {
  isLoading,
  searchQuery,
  type SearchResult,
  searchResults,
  setLoading,
  setResults,
} from "../../stores/search.ts"
import { checkEasterEgg } from "../../stores/easter.ts"
import { locale } from "../../stores/locale.ts"
import { performSearch } from "../../services/search.ts"

interface ResultsProps {
  onNavigateToHome: () => void
}

export function Results({ onNavigateToHome }: ResultsProps) {
  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    if (checkEasterEgg(query)) {
      onNavigateToHome()
      return
    }

    setLoading(true)
    const results = await performSearch(query)
    setResults(results)
    setLoading(false)
  }

  const handleLogoClick = () => {
    onNavigateToHome()
  }

  const resultCount = searchResults.value.length
  const statsText = locale.value === "ko"
    ? `검색결과 약 ${resultCount}개`
    : `約${resultCount}件の検索結果`

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
              {locale.value === "ko" ? "검색 중..." : "検索中..."}
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
  const typeLabels = {
    character: locale.value === "ko" ? "캐릭터" : "キャラクター",
    school: locale.value === "ko" ? "학교" : "学校",
    guide: locale.value === "ko" ? "가이드" : "ガイド",
    event: locale.value === "ko" ? "이벤트" : "イベント",
    wiki: locale.value === "ko" ? "위키" : "ウィキ",
  }

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
