import "./search-filters.css"
import { signal } from "@preact/signals"
import { schools } from "../../data/blueArchive.ts"
import { locale } from "../../stores/locale.ts"
import {
  activeFilters,
  clearFilters,
  filterCount,
  hasActiveFilters,
  toggleRarity,
  toggleRole,
  toggleSchool,
} from "../../stores/filters.ts"

const isExpanded = signal(true)

interface FilterTexts {
  title: string
  schools: string
  role: string
  rarity: string
  striker: string
  special: string
  clearAll: string
  showFilters: string
  hideFilters: string
}

const filterTexts: Record<"ko" | "ja" | "en", FilterTexts> = {
  ko: {
    title: "필터",
    schools: "학교",
    role: "역할",
    rarity: "등급",
    striker: "스트라이커",
    special: "스페셜",
    clearAll: "모두 지우기",
    showFilters: "필터 표시",
    hideFilters: "필터 숨기기",
  },
  ja: {
    title: "フィルター",
    schools: "学校",
    role: "ロール",
    rarity: "レアリティ",
    striker: "ストライカー",
    special: "スペシャル",
    clearAll: "すべてクリア",
    showFilters: "フィルターを表示",
    hideFilters: "フィルターを隠す",
  },
  en: {
    title: "Filters",
    schools: "Schools",
    role: "Role",
    rarity: "Rarity",
    striker: "Striker",
    special: "Special",
    clearAll: "Clear all",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
  },
}

export function SearchFilters() {
  const texts = filterTexts[locale.value as "ko" | "ja" | "en"] ||
    filterTexts.en

  const handleToggleExpanded = () => {
    isExpanded.value = !isExpanded.value
  }

  return (
    <aside class="search-filters">
      <div class="search-filters__header">
        <button
          type="button"
          class="search-filters__toggle"
          onClick={handleToggleExpanded}
          aria-expanded={isExpanded.value}
        >
          <span class="search-filters__title">
            {texts.title}
            {filterCount.value > 0 && (
              <span class="search-filters__count">({filterCount.value})</span>
            )}
          </span>
          <svg
            class={`search-filters__toggle-icon ${
              isExpanded.value ? "search-filters__toggle-icon--expanded" : ""
            }`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        {hasActiveFilters.value && (
          <button
            type="button"
            class="search-filters__clear"
            onClick={clearFilters}
          >
            {texts.clearAll}
          </button>
        )}
      </div>

      {isExpanded.value && (
        <div class="search-filters__content">
          <FilterSection title={texts.schools}>
            {schools.map((school) => {
              const schoolName =
                school.name[locale.value as "ko" | "ja" | "en"] ||
                school.name.en
              const isChecked = activeFilters.value.schools.includes(school.id)
              return (
                <label key={school.id} class="search-filters__option">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSchool(school.id)}
                    class="search-filters__checkbox"
                  />
                  <span class="search-filters__label">{schoolName}</span>
                </label>
              )
            })}
          </FilterSection>

          <FilterSection title={texts.role}>
            <label class="search-filters__option">
              <input
                type="checkbox"
                checked={activeFilters.value.roles.includes("striker")}
                onChange={() => toggleRole("striker")}
                class="search-filters__checkbox"
              />
              <span class="search-filters__label">{texts.striker}</span>
            </label>
            <label class="search-filters__option">
              <input
                type="checkbox"
                checked={activeFilters.value.roles.includes("special")}
                onChange={() => toggleRole("special")}
                class="search-filters__checkbox"
              />
              <span class="search-filters__label">{texts.special}</span>
            </label>
          </FilterSection>

          <FilterSection title={texts.rarity}>
            {[3, 2, 1].map((rarity) => {
              const isChecked = activeFilters.value.rarities.includes(
                rarity as 1 | 2 | 3,
              )
              return (
                <label key={rarity} class="search-filters__option">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRarity(rarity as 1 | 2 | 3)}
                    class="search-filters__checkbox"
                  />
                  <span class="search-filters__label">
                    {"★".repeat(rarity)}
                  </span>
                </label>
              )
            })}
          </FilterSection>
        </div>
      )}
    </aside>
  )
}

interface FilterSectionProps {
  title: string
  children: preact.ComponentChildren
}

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div class="search-filters__section">
      <h4 class="search-filters__section-title">{title}</h4>
      <div class="search-filters__options">
        {children}
      </div>
    </div>
  )
}
