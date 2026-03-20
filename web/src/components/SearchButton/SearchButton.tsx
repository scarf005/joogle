import "./SearchButton.css"
import { type Locale, locale } from "../../stores/locale.ts"

interface SearchButtonProps {
  variant: "primary" | "lucky"
  onClick: () => void
}

const labels: Record<string, Record<Locale, string>> = {
  primary: {
    ko: "Joogle 검색",
    en: "Joogle Search",
    ja: "Joogle 検索",
  },
  lucky: {
    ko: "I'm Feeling Lucky",
    en: "I'm Feeling Lucky",
    ja: "I'm Feeling Lucky",
  },
}

export function SearchButton({ variant, onClick }: SearchButtonProps) {
  const currentLocale = locale.value as Locale
  const label = labels[variant][currentLocale]
  const className = `search-button search-button--${variant}`

  return (
    <button type="button" class={className} onClick={onClick}>
      {label}
    </button>
  )
}

interface SearchButtonsProps {
  onSearch: () => void
  onLucky: () => void
}

export function SearchButtons({ onSearch, onLucky }: SearchButtonsProps) {
  return (
    <div class="search-buttons">
      <SearchButton variant="primary" onClick={onSearch} />
      <SearchButton variant="lucky" onClick={onLucky} />
    </div>
  )
}
