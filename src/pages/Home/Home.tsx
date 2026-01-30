import "./Home.css"
import { Logo } from "../../components/Logo/Logo.tsx"
import { SearchBar } from "../../components/SearchBar/SearchBar.tsx"
import { SearchButtons } from "../../components/SearchButton/SearchButton.tsx"
import { LanguageSwitch } from "../../components/LanguageSwitch/LanguageSwitch.tsx"
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle.tsx"
import { searchQuery, setLoading, setResults } from "../../stores/search.ts"
import { checkEasterEgg, joogleMode } from "../../stores/easter.ts"
import { addToHistory } from "../../stores/history.ts"
import { type Locale, locale } from "../../stores/locale.ts"
import { getRandomCharacter, performSearch } from "../../services/search.ts"

interface HomeProps {
  onNavigateToResults: () => void
}

const subtitles: Record<Locale, string> = {
  ko: "블루 아카이브 전용 검색 엔진",
  en: "Blue Archive Search Engine",
  ja: "ブルーアーカイブ専用検索エンジン",
}

export function Home({ onNavigateToResults }: HomeProps) {
  const handleSearch = (query: string) => {
    if (!query.trim()) return

    const easterEgg = checkEasterEgg(query)
    if (easterEgg === "joogle") {
      return
    }

    addToHistory(query)
    setLoading(true)
    const results = performSearch(query)
    setResults(results)
    setLoading(false)
    onNavigateToResults()
  }

  const handleLucky = () => {
    const character = getRandomCharacter()
    const currentLocale = locale.value as Locale
    const name = character.name[currentLocale] || character.name.en
    const wikiUrl = currentLocale === "en"
      ? `https://bluearchive.wiki/wiki/${encodeURIComponent(name)}`
      : `https://namu.wiki/w/${encodeURIComponent(character.name.ko)}`
    globalThis.open(wikiUrl, "_blank")
  }

  const currentLocale = locale.value as Locale

  return (
    <main class="home">
      <div class="home__logo">
        <Logo size="large" animated={joogleMode.value} />
      </div>
      <div class="home__search">
        <SearchBar onSearch={handleSearch} autoFocus enableShortcuts />
        <SearchButtons
          onSearch={() => handleSearch(searchQuery.value)}
          onLucky={handleLucky}
        />
        <div class="home__controls">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
        <p class="home__subtitle">
          {subtitles[currentLocale]} -{" "}
          <a href="https://bluearchive.wiki" target="_blank" rel="noopener">
            Blue Archive Wiki
          </a>
        </p>
      </div>
    </main>
  )
}
