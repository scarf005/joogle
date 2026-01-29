import { signal } from "@preact/signals"

export const joogleMode = signal(false)
export const easterEggTriggered = signal(false)

const JOOGLE_TRIGGERS = ["joogle", "쮸글", "ジューグル", "jjugeul", "쭈글"]

export function checkEasterEgg(query: string): boolean {
  const normalized = query.toLowerCase().trim()
  if (JOOGLE_TRIGGERS.includes(normalized)) {
    activateJoogleMode()
    return true
  }
  return false
}

export function activateJoogleMode() {
  joogleMode.value = true
  easterEggTriggered.value = true
  setTimeout(() => {
    joogleMode.value = false
  }, 5000)
}

export function resetEasterEgg() {
  joogleMode.value = false
  easterEggTriggered.value = false
}
