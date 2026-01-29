import { signal } from "@preact/signals"

export type CharacterEgg =
  | "aru"
  | "hoshino"
  | "shiroko"
  | "hina"
  | "mika"
  | null

export const joogleMode = signal(false)
export const easterEggTriggered = signal(false)
export const activeCharacterEgg = signal<CharacterEgg>(null)

const JOOGLE_TRIGGERS = ["joogle", "쮸글", "ジューグル", "jjugeul", "쭈글"]

interface CharacterEggConfig {
  id: CharacterEgg
  triggers: string[]
}

const CHARACTER_EGGS: CharacterEggConfig[] = [
  {
    id: "aru",
    triggers: ["아루", "aru", "アル"],
  },
  {
    id: "hoshino",
    triggers: ["호시노", "hoshino", "ホシノ"],
  },
  {
    id: "shiroko",
    triggers: ["시로코", "shiroko", "シロコ"],
  },
  {
    id: "hina",
    triggers: ["히나", "hina", "ヒナ"],
  },
  {
    id: "mika",
    triggers: ["미카", "mika", "ミカ"],
  },
]

export type EasterEggResult = "joogle" | "character" | null

export function checkEasterEgg(query: string): EasterEggResult {
  const normalized = query.toLowerCase().trim()

  if (JOOGLE_TRIGGERS.includes(normalized)) {
    activateJoogleMode()
    return "joogle"
  }

  for (const egg of CHARACTER_EGGS) {
    if (egg.triggers.some((t) => t.toLowerCase() === normalized)) {
      activateCharacterEgg(egg.id)
      return "character"
    }
  }

  return null
}

export function activateJoogleMode() {
  joogleMode.value = true
  easterEggTriggered.value = true
  setTimeout(() => {
    joogleMode.value = false
  }, 5000)
}

export function activateCharacterEgg(character: CharacterEgg) {
  activeCharacterEgg.value = character
  easterEggTriggered.value = true
  setTimeout(() => {
    activeCharacterEgg.value = null
  }, 3000)
}

export function resetEasterEgg() {
  joogleMode.value = false
  easterEggTriggered.value = false
  activeCharacterEgg.value = null
}
