import { signal } from "@preact/signals"
import {
  defaultJjugeulStudentId,
  getJjugeulStudent,
  isJjugeulStudentId,
  jjugeulStudents,
  normalizeJjugeulStudentId,
} from "../data/students.ts"

const favoriteStudentsStorageKey = "joogle.favoriteStudents"
const legacyFavoriteStudentsStorageKey = "jjugeul.favoriteStudents"
const activeStudentStorageKey = "joogle.activeStudent"
const legacyActiveStudentStorageKey = "jjugeul.activeStudent"

export interface JjugeulCountryLeaderboardEntry {
  countryCode: string
  total: number
}

export interface JjugeulStudentLeaderboardEntry {
  studentId: number
  total: number
}

type PendingClicks = Record<string, number>

const toStudentKey = (studentId: number) => String(studentId)

const canUseStorage = () => {
  return typeof globalThis !== "undefined" && "localStorage" in globalThis
}

const readStorageValue = (keys: string[]) => {
  if (!canUseStorage()) return null

  for (const key of keys) {
    const value = globalThis.localStorage.getItem(key)
    if (value !== null) return value
  }

  return null
}

const readFavoriteStudentIds = () => {
  const stored = readStorageValue([
    favoriteStudentsStorageKey,
    legacyFavoriteStudentsStorageKey,
  ])
  if (!stored) return [defaultJjugeulStudentId]

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return [defaultJjugeulStudentId]

    const uniqueIds = [...new Set(parsed)]
      .map((value) => normalizeJjugeulStudentId(value as string | number))
      .filter((value): value is number => value !== null)

    return uniqueIds.length > 0 ? uniqueIds : [defaultJjugeulStudentId]
  } catch {
    return [defaultJjugeulStudentId]
  }
}

const readActiveStudentId = () => {
  const stored = readStorageValue([
    activeStudentStorageKey,
    legacyActiveStudentStorageKey,
  ])
  if (!stored) return defaultJjugeulStudentId

  return normalizeJjugeulStudentId(stored) ?? defaultJjugeulStudentId
}

const writePreferences = () => {
  if (!canUseStorage()) return

  globalThis.localStorage.setItem(
    favoriteStudentsStorageKey,
    JSON.stringify(jjugeulFavoriteStudentIds.value),
  )
  globalThis.localStorage.setItem(
    activeStudentStorageKey,
    String(jjugeulActiveStudentId.value),
  )
}

const sortedStudentIds = (favoriteStudentIds: number[]) => {
  const favoriteRank = new Map(
    favoriteStudentIds.map((studentId, index) => [studentId, index]),
  )

  return [...jjugeulStudents].sort((left, right) => {
    const leftFavoriteRank = favoriteRank.get(left.id)
    const rightFavoriteRank = favoriteRank.get(right.id)

    if (leftFavoriteRank !== undefined && rightFavoriteRank !== undefined) {
      return leftFavoriteRank - rightFavoriteRank
    }

    if (leftFavoriteRank !== undefined) return -1
    if (rightFavoriteRank !== undefined) return 1
    return left.name.localeCompare(right.name)
  })
}

const setPendingClicks = (pendingClicks: PendingClicks) => {
  jjugeulPendingClicks.value = pendingClicks
}

export const jjugeulCount = signal(0)
export const jjugeulBurstSeed = signal(0)
export const jjugeulPendingClicks = signal<PendingClicks>({})
export const jjugeulPressed = signal(false)
export const jjugeulCountryCode = signal("ZZ")
export const jjugeulCountryTotal = signal(0)
export const jjugeulGlobalTotal = signal(0)
export const jjugeulLeaderboardOpen = signal(false)
export const jjugeulCountryLeaderboard = signal<
  JjugeulCountryLeaderboardEntry[]
>([])
export const jjugeulStudentLeaderboard = signal<
  JjugeulStudentLeaderboardEntry[]
>([])
export const jjugeulFavoriteStudentIds = signal<number[]>([
  defaultJjugeulStudentId,
])
export const jjugeulActiveStudentId = signal(defaultJjugeulStudentId)
export const getJjugeulStudentRoster = () => {
  return sortedStudentIds(jjugeulFavoriteStudentIds.value)
}
export const getJjugeulActiveStudent = () => {
  return getJjugeulStudent(jjugeulActiveStudentId.value)
}
export const getJjugeulActiveStudentTotal = () => {
  return jjugeulStudentLeaderboard.value.find((entry) => {
    return entry.studentId === jjugeulActiveStudentId.value
  })?.total ?? 0
}

export const pressJjugeul = () => {
  if (jjugeulPressed.value) return false

  jjugeulPressed.value = true
  jjugeulCount.value += 1
  jjugeulBurstSeed.value += 1

  const studentKey = toStudentKey(jjugeulActiveStudentId.value)
  const currentPending = jjugeulPendingClicks.value[studentKey] ?? 0
  setPendingClicks({
    ...jjugeulPendingClicks.value,
    [studentKey]: currentPending + 1,
  })

  return true
}

export const releaseJjugeul = () => {
  jjugeulPressed.value = false
}

export const resetJjugeulSession = () => {
  jjugeulCount.value = 0
  jjugeulBurstSeed.value = 0
  jjugeulPendingClicks.value = {}
  jjugeulPressed.value = false
  jjugeulCountryCode.value = "ZZ"
  jjugeulCountryTotal.value = 0
  jjugeulGlobalTotal.value = 0
  jjugeulCountryLeaderboard.value = []
  jjugeulStudentLeaderboard.value = []
  jjugeulLeaderboardOpen.value = false
  jjugeulFavoriteStudentIds.value = [defaultJjugeulStudentId]
  jjugeulActiveStudentId.value = defaultJjugeulStudentId
}

export const consumeJjugeulPendingClicks = () => {
  const entries = Object.entries(jjugeulPendingClicks.value)
    .map(([studentId, delta]) => ({
      studentId: normalizeJjugeulStudentId(studentId),
      delta,
    }))
    .filter((entry): entry is { studentId: number; delta: number } => {
      return entry.studentId !== null && entry.delta > 0
    })

  jjugeulPendingClicks.value = {}
  return entries
}

export const restoreJjugeulPendingClicks = (options: {
  clicks: Array<{ studentId: number; delta: number }>
}) => {
  const pendingClicks = { ...jjugeulPendingClicks.value }

  for (const click of options.clicks) {
    const studentKey = toStudentKey(click.studentId)
    pendingClicks[studentKey] = (pendingClicks[studentKey] ?? 0) + click.delta
  }

  setPendingClicks(pendingClicks)
}

export const setJjugeulRemoteTotals = (options: {
  countryCode: string
  countryTotal: number
  globalTotal: number
}) => {
  jjugeulCountryCode.value = options.countryCode
  jjugeulCountryTotal.value = options.countryTotal
  jjugeulGlobalTotal.value = options.globalTotal
}

export const setJjugeulLeaderboards = (options: {
  countryEntries: JjugeulCountryLeaderboardEntry[]
  studentEntries: Array<{ studentId: number | string; total: number }>
}) => {
  jjugeulCountryLeaderboard.value = options.countryEntries
  jjugeulStudentLeaderboard.value = options.studentEntries
    .map((entry) => {
      const studentId = normalizeJjugeulStudentId(entry.studentId)
      return studentId === null ? null : {
        studentId,
        total: entry.total,
      }
    })
    .filter((entry): entry is JjugeulStudentLeaderboardEntry => entry !== null)
}

export const toggleJjugeulLeaderboard = () => {
  jjugeulLeaderboardOpen.value = !jjugeulLeaderboardOpen.value
}

export const hydrateJjugeulPreferences = () => {
  const favoriteStudentIds = readFavoriteStudentIds()
  const activeStudentId = readActiveStudentId()

  jjugeulFavoriteStudentIds.value = favoriteStudentIds
  jjugeulActiveStudentId.value = activeStudentId

  writePreferences()
}

export const selectJjugeulStudent = (options: { studentId: number }) => {
  if (!isJjugeulStudentId(options.studentId)) return

  jjugeulActiveStudentId.value = options.studentId
  writePreferences()
}

export const toggleJjugeulFavoriteStudent = (
  options: { studentId: number },
) => {
  if (!isJjugeulStudentId(options.studentId)) return

  const currentFavorites = jjugeulFavoriteStudentIds.value

  jjugeulFavoriteStudentIds.value = currentFavorites.includes(options.studentId)
    ? currentFavorites.filter((studentId) => studentId !== options.studentId)
    : [...currentFavorites, options.studentId]

  writePreferences()
}
