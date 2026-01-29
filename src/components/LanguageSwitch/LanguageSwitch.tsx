import "./LanguageSwitch.css"
import { type Locale, locale, setLocale } from "../../stores/locale.ts"

const languages: { code: Locale; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
]

const labelText: Record<Locale, string> = {
  ko: "제공 언어:",
  en: "Language:",
  ja: "言語:",
}

export function LanguageSwitch() {
  const handleClick = (code: Locale) => {
    setLocale(code)
  }

  const currentLocale = locale.value as Locale

  return (
    <div class="language-switch">
      <span class="language-switch__label">
        {labelText[currentLocale]}
      </span>
      <div class="language-switch__options">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            class={`language-switch__option ${
              locale.value === lang.code
                ? "language-switch__option--active"
                : ""
            }`}
            onClick={() => handleClick(lang.code)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
