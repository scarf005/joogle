export interface JjugeulStudent {
  id: number
  legacyKey: string
  name: string
  title: string
  accent: string
  surface: string
}

export const jjugeulStudents: JjugeulStudent[] = [
  {
    id: 16003,
    legacyKey: "suzumi",
    name: "Suzumi",
    title: "Saintly Burst",
    accent: "#ff8b5f",
    surface: "#fff0e8",
  },
  {
    id: 23008,
    legacyKey: "mari",
    name: "Mari",
    title: "Chapel Tempo",
    accent: "#f2647c",
    surface: "#ffe8ee",
  },
  {
    id: 10000,
    legacyKey: "aru",
    name: "Aru",
    title: "Outlaw Rhythm",
    accent: "#ff5a45",
    surface: "#ffe7e2",
  },
  {
    id: 10003,
    legacyKey: "hifumi",
    name: "Hifumi",
    title: "Cherub Glow",
    accent: "#ffb63f",
    surface: "#fff3d7",
  },
  {
    id: 10005,
    legacyKey: "hoshino",
    name: "Hoshino",
    title: "Lullaby Drift",
    accent: "#55b2ff",
    surface: "#e4f5ff",
  },
]

const studentsById = new Map(
  jjugeulStudents.map((student) => [student.id, student]),
)
const studentsByLegacyKey = new Map(
  jjugeulStudents.map((student) => [student.legacyKey, student]),
)

export const defaultJjugeulStudentId = jjugeulStudents[0]?.id ?? 0

export const isJjugeulStudentId = (value: number) => {
  return studentsById.has(value)
}

export const getJjugeulStudent = (studentId: number) => {
  return studentsById.get(studentId) ??
    jjugeulStudents[0]
}

export const getLegacyStudentKey = (studentId: number) => {
  return studentsById.get(studentId)?.legacyKey ?? null
}

export const normalizeJjugeulStudentId = (value: number | string) => {
  if (typeof value === "number") {
    return studentsById.has(value) ? value : null
  }

  const asNumber = Number.parseInt(value, 10)
  if (Number.isInteger(asNumber) && studentsById.has(asNumber)) {
    return asNumber
  }

  const normalized = value.trim().toLowerCase()
  return studentsByLegacyKey.get(normalized)?.id ?? null
}
