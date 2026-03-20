import { computed, effect, signal } from "@preact/signals"

const STORAGE_KEY = "joogle-filters"

export interface Filters {
  schools: string[]
  roles: ("striker" | "special")[]
  rarities: (1 | 2 | 3)[]
}

function getInitialFilters(): Filters {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Ignore parse errors
      }
    }
  }
  return {
    schools: [],
    roles: [],
    rarities: [],
  }
}

export const selectedSchools = signal<string[]>(getInitialFilters().schools)
export const selectedRoles = signal<("striker" | "special")[]>(
  getInitialFilters().roles,
)
export const selectedRarities = signal<(1 | 2 | 3)[]>(
  getInitialFilters().rarities,
)

export const activeFilters = computed(() => {
  return {
    schools: selectedSchools.value,
    roles: selectedRoles.value,
    rarities: selectedRarities.value,
  }
})

export const hasActiveFilters = computed(() => {
  return selectedSchools.value.length > 0 ||
    selectedRoles.value.length > 0 ||
    selectedRarities.value.length > 0
})

export const filterCount = computed(() => {
  return selectedSchools.value.length +
    selectedRoles.value.length +
    selectedRarities.value.length
})

export function toggleSchool(schoolId: string) {
  if (selectedSchools.value.includes(schoolId)) {
    selectedSchools.value = selectedSchools.value.filter((id: string) =>
      id !== schoolId
    )
  } else {
    selectedSchools.value = [...selectedSchools.value, schoolId]
  }
}

export function toggleRole(role: "striker" | "special") {
  if (selectedRoles.value.includes(role)) {
    selectedRoles.value = selectedRoles.value.filter((
      r: "striker" | "special",
    ) => r !== role)
  } else {
    selectedRoles.value = [...selectedRoles.value, role]
  }
}

export function toggleRarity(rarity: 1 | 2 | 3) {
  if (selectedRarities.value.includes(rarity)) {
    selectedRarities.value = selectedRarities.value.filter((r: 1 | 2 | 3) =>
      r !== rarity
    )
  } else {
    selectedRarities.value = [...selectedRarities.value, rarity]
  }
}

export function clearFilters() {
  selectedSchools.value = []
  selectedRoles.value = []
  selectedRarities.value = []
}

effect(() => {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    const filters: Filters = {
      schools: selectedSchools.value,
      roles: selectedRoles.value,
      rarities: selectedRarities.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }
})
