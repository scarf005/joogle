import "./Home.css"
import { Logo } from "../../components/Logo/Logo.tsx"
import { SearchBar } from "../../components/SearchBar/SearchBar.tsx"
import { SearchButtons } from "../../components/SearchButton/SearchButton.tsx"
import { LanguageSwitch } from "../../components/LanguageSwitch/LanguageSwitch.tsx"
import { searchQuery, setLoading, setResults } from "../../stores/search.ts"
import { checkEasterEgg, joogleMode } from "../../stores/easter.ts"
import { locale } from "../../stores/locale.ts"
import { getRandomCharacter, performSearch } from "../../services/search.ts"

interface HomeProps {
  onNavigateToResults: () => void
}

export function Home({ onNavigateToResults }: HomeProps) {
  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    if (checkEasterEgg(query)) {
      return
    }

    setLoading(true)
    const results = await performSearch(query)
    setResults(results)
    setLoading(false)
    onNavigateToResults()
  }

  const handleLucky = () => {
    const character = getRandomCharacter()
    const currentLocale = locale.value as "ko" | "ja"
    const name = character.name[currentLocale] || character.name.ko
    window.open(`https://namu.wiki/w/${encodeURIComponent(name)}`, "_blank")
  }

  const subtitle = locale.value === "ko"
    ? "블루 아카이브 전용 검색 엔진"
    : "ブルーアーカイブ専用検索エンジン"

  return (
    <main class="home">
      <div class="home__logo">
        <Logo size="large" animated={joogleMode.value} />
      </div>
      <div class="home__search">
        <SearchBar onSearch={handleSearch} autoFocus />
        <SearchButtons
          onSearch={() => handleSearch(searchQuery.value)}
          onLucky={handleLucky}
        />
        <LanguageSwitch />
        <p class="home__subtitle">
          {subtitle} -{" "}
          <a href="https://bluearchive.wiki" target="_blank" rel="noopener">
            Blue Archive Wiki
          </a>
        </p>
      </div>
    </main>
  )
}
