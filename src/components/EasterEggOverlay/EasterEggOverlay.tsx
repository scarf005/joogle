import "./EasterEggOverlay.css"
import { activeCharacterEgg, type CharacterEgg } from "../../stores/easter.ts"
import { type Locale, locale } from "../../stores/locale.ts"

interface CharacterMessage {
  text: Record<Locale, string>
  emoji: string
  color: string
}

const characterMessages: Record<Exclude<CharacterEgg, null>, CharacterMessage> =
  {
    aru: {
      text: {
        ko: "문제 해결! 편의점 강도단 출동!",
        en: "Problem Solved! Problem Solver 68!",
        ja: "問題解決！便利屋68出動！",
      },
      emoji: "💥",
      color: "#e74c3c",
    },
    hoshino: {
      text: {
        ko: "Zzz... 5분만 더...",
        en: "Zzz... Just 5 more minutes...",
        ja: "Zzz... あと5分...",
      },
      emoji: "😴",
      color: "#9b59b6",
    },
    shiroko: {
      text: {
        ko: "계좌 잔액을 확인 중입니다...",
        en: "Checking account balance...",
        ja: "口座残高を確認中...",
      },
      emoji: "🏦",
      color: "#3498db",
    },
    hina: {
      text: {
        ko: "풍기 위반입니다!",
        en: "Disciplinary violation detected!",
        ja: "風紀違反です！",
      },
      emoji: "⚔️",
      color: "#2c3e50",
    },
    mika: {
      text: {
        ko: "선생님과 더 가까워지고 싶어요...",
        en: "I want to be closer to Sensei...",
        ja: "先生ともっと近くになりたい...",
      },
      emoji: "💕",
      color: "#e91e63",
    },
  }

export function EasterEggOverlay() {
  const character = activeCharacterEgg.value as Exclude<CharacterEgg, null>
  if (!character) return null

  const message = characterMessages[character]
  const currentLocale = locale.value as Locale

  return (
    <div
      class={`easter-egg-overlay easter-egg-overlay--${character}`}
      style={{ "--egg-color": message.color } as never}
    >
      <div class="easter-egg-overlay__content">
        <span class="easter-egg-overlay__emoji">{message.emoji}</span>
        <p class="easter-egg-overlay__text">{message.text[currentLocale]}</p>
      </div>
    </div>
  )
}
