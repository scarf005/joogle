import { type SearchResult } from "../stores/search.ts"
import { type Character, characters, schools } from "../data/blueArchive.ts"
import { locale } from "../stores/locale.ts"

export async function performSearch(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.toLowerCase().trim()
  const currentLocale = locale.value as "ko" | "ja"
  const results: SearchResult[] = []

  characters.forEach((char) => {
    const nameKo = char.name.ko.toLowerCase()
    const nameJa = char.name.ja.toLowerCase()
    const nameEn = char.name.en.toLowerCase()

    if (
      nameKo.includes(normalizedQuery) ||
      nameJa.includes(normalizedQuery) ||
      nameEn.includes(normalizedQuery)
    ) {
      const displayName = char.name[currentLocale] || char.name.ko
      results.push({
        id: char.id,
        type: "character",
        title: displayName,
        description: getCharacterDescription(char, currentLocale),
        url: `https://namu.wiki/w/${encodeURIComponent(char.name.ko)}`,
        thumbnail: char.imageUrl,
        metadata: {
          school: char.school,
          role: char.role,
          rarity: char.rarity,
        },
      })
    }
  })

  schools.forEach((school) => {
    const nameKo = school.name.ko.toLowerCase()
    const nameJa = school.name.ja.toLowerCase()
    const nameEn = school.name.en.toLowerCase()

    if (
      nameKo.includes(normalizedQuery) ||
      nameJa.includes(normalizedQuery) ||
      nameEn.includes(normalizedQuery)
    ) {
      const displayName = school.name[currentLocale] || school.name.ko
      results.push({
        id: school.id,
        type: "school",
        title: displayName,
        description: school.description ||
          getSchoolDescription(school.id, currentLocale),
        url: `https://namu.wiki/w/${encodeURIComponent(school.name.ko)}`,
      })
    }
  })

  if (results.length === 0) {
    results.push({
      id: "wiki-search",
      type: "wiki",
      title: currentLocale === "ko"
        ? `"${query}" - 나무위키 검색`
        : `"${query}" - ナムウィキ検索`,
      description: currentLocale === "ko"
        ? "나무위키에서 더 많은 결과를 찾아보세요"
        : "ナムウィキでもっと結果を探す",
      url: `https://namu.wiki/w/${encodeURIComponent(query)}`,
    })

    results.push({
      id: "bluearchive-wiki",
      type: "wiki",
      title: currentLocale === "ko"
        ? `"${query}" - Blue Archive Wiki`
        : `"${query}" - Blue Archive Wiki`,
      description: currentLocale === "ko"
        ? "영어 위키에서 검색하기"
        : "英語Wikiで検索",
      url: `https://bluearchive.wiki/wiki/${encodeURIComponent(query)}`,
    })
  }

  return results
}

function getCharacterDescription(char: Character, locale: "ko" | "ja"): string {
  const school = schools.find((s) => s.id === char.school)
  const schoolName = school
    ? (school.name[locale] || school.name.ko)
    : char.school

  if (locale === "ja") {
    const roleText = char.role === "striker" ? "ストライカー" : "スペシャル"
    const rarityStars = "★".repeat(char.rarity)
    return `${schoolName} | ${roleText} | ${rarityStars}`
  }

  const roleText = char.role === "striker" ? "스트라이커" : "스페셜"
  const rarityStars = "★".repeat(char.rarity)
  return `${schoolName} | ${roleText} | ${rarityStars}`
}

function getSchoolDescription(schoolId: string, locale: "ko" | "ja"): string {
  const descriptions: Record<string, { ko: string; ja: string }> = {
    trinity: {
      ko: "키보토스의 명문 학교",
      ja: "キヴォトスの名門学校",
    },
    gehenna: {
      ko: "자유분방한 학생들의 학교",
      ja: "自由奔放な生徒たちの学校",
    },
    millennium: {
      ko: "과학 기술의 최전선",
      ja: "科学技術の最前線",
    },
    abydos: {
      ko: "사막 지역의 작은 학교",
      ja: "砂漠地帯の小さな学校",
    },
    hyakkiyako: {
      ko: "전통적인 일본풍 학교",
      ja: "伝統的な日本風の学校",
    },
    redwinter: {
      ko: "군사 훈련 중심 학교",
      ja: "軍事訓練中心の学校",
    },
    shanhaijing: {
      ko: "중국풍 학교",
      ja: "中国風の学校",
    },
    valkyrie: {
      ko: "경찰 학교",
      ja: "警察学校",
    },
    arius: {
      ko: "비밀스러운 분교",
      ja: "秘密の分校",
    },
    srt: {
      ko: "특수 부대 학교",
      ja: "特殊部隊学校",
    },
  }

  return descriptions[schoolId]?.[locale] || ""
}

export function getRandomCharacter(): Character {
  const index = Math.floor(Math.random() * characters.length)
  return characters[index]
}
