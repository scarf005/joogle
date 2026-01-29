import { type SearchResult } from "../stores/search.ts"
import { type Character, characters, schools } from "../data/blueArchive.ts"
import { type Locale, locale } from "../stores/locale.ts"

export function performSearch(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim()
  const currentLocale = locale.value as Locale
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
      const displayName = char.name[currentLocale] || char.name.en
      const url = currentLocale === "en"
        ? `https://bluearchive.wiki/wiki/${encodeURIComponent(char.name.en)}`
        : `https://namu.wiki/w/${encodeURIComponent(char.name.ko)}`

      results.push({
        id: char.id,
        type: "character",
        title: displayName,
        description: getCharacterDescription(char, currentLocale),
        url,
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
      const displayName = school.name[currentLocale] || school.name.en
      const url = currentLocale === "en"
        ? `https://bluearchive.wiki/wiki/${encodeURIComponent(school.name.en)}`
        : `https://namu.wiki/w/${encodeURIComponent(school.name.ko)}`

      results.push({
        id: school.id,
        type: "school",
        title: displayName,
        description: school.description ||
          getSchoolDescription(school.id, currentLocale),
        url,
      })
    }
  })

  if (results.length === 0) {
    const fallbackTexts: Record<Locale, { wiki: string; wikiDesc: string; baWiki: string; baWikiDesc: string }> = {
      ko: {
        wiki: `"${query}" - 나무위키 검색`,
        wikiDesc: "나무위키에서 더 많은 결과를 찾아보세요",
        baWiki: `"${query}" - Blue Archive Wiki`,
        baWikiDesc: "영어 위키에서 검색하기",
      },
      en: {
        wiki: `"${query}" - Blue Archive Wiki`,
        wikiDesc: "Search for more results on Blue Archive Wiki",
        baWiki: `"${query}" - Namu Wiki`,
        baWikiDesc: "Search on Korean Wiki (Namu Wiki)",
      },
      ja: {
        wiki: `"${query}" - ナムウィキ検索`,
        wikiDesc: "ナムウィキでもっと結果を探す",
        baWiki: `"${query}" - Blue Archive Wiki`,
        baWikiDesc: "英語Wikiで検索",
      },
    }

    const texts = fallbackTexts[currentLocale]

    if (currentLocale === "en") {
      results.push({
        id: "bluearchive-wiki",
        type: "wiki",
        title: texts.wiki,
        description: texts.wikiDesc,
        url: `https://bluearchive.wiki/wiki/${encodeURIComponent(query)}`,
      })
      results.push({
        id: "wiki-search",
        type: "wiki",
        title: texts.baWiki,
        description: texts.baWikiDesc,
        url: `https://namu.wiki/w/${encodeURIComponent(query)}`,
      })
    } else {
      results.push({
        id: "wiki-search",
        type: "wiki",
        title: texts.wiki,
        description: texts.wikiDesc,
        url: `https://namu.wiki/w/${encodeURIComponent(query)}`,
      })
      results.push({
        id: "bluearchive-wiki",
        type: "wiki",
        title: texts.baWiki,
        description: texts.baWikiDesc,
        url: `https://bluearchive.wiki/wiki/${encodeURIComponent(query)}`,
      })
    }
  }

  return results
}

function getCharacterDescription(char: Character, currentLocale: Locale): string {
  const school = schools.find((s) => s.id === char.school)
  const schoolName = school
    ? (school.name[currentLocale] || school.name.en)
    : char.school
  const rarityStars = "★".repeat(char.rarity)

  const roleTexts: Record<Locale, Record<string, string>> = {
    ko: { striker: "스트라이커", special: "스페셜" },
    en: { striker: "Striker", special: "Special" },
    ja: { striker: "ストライカー", special: "スペシャル" },
  }

  const roleText = roleTexts[currentLocale][char.role]
  return `${schoolName} | ${roleText} | ${rarityStars}`
}

function getSchoolDescription(schoolId: string, currentLocale: Locale): string {
  const descriptions: Record<string, Record<Locale, string>> = {
    trinity: {
      ko: "키보토스의 명문 학교",
      en: "Prestigious academy of Kivotos",
      ja: "キヴォトスの名門学校",
    },
    gehenna: {
      ko: "자유분방한 학생들의 학교",
      en: "School of free-spirited students",
      ja: "自由奔放な生徒たちの学校",
    },
    millennium: {
      ko: "과학 기술의 최전선",
      en: "At the forefront of science and technology",
      ja: "科学技術の最前線",
    },
    abydos: {
      ko: "사막 지역의 작은 학교",
      en: "A small school in the desert region",
      ja: "砂漠地帯の小さな学校",
    },
    hyakkiyako: {
      ko: "전통적인 일본풍 학교",
      en: "Traditional Japanese-style school",
      ja: "伝統的な日本風の学校",
    },
    redwinter: {
      ko: "군사 훈련 중심 학교",
      en: "Military training-focused school",
      ja: "軍事訓練中心の学校",
    },
    shanhaijing: {
      ko: "중국풍 학교",
      en: "Chinese-style school",
      ja: "中国風の学校",
    },
    valkyrie: {
      ko: "경찰 학교",
      en: "Police academy",
      ja: "警察学校",
    },
    arius: {
      ko: "비밀스러운 분교",
      en: "Mysterious branch school",
      ja: "秘密の分校",
    },
    srt: {
      ko: "특수 부대 학교",
      en: "Special forces school",
      ja: "特殊部隊学校",
    },
  }

  return descriptions[schoolId]?.[currentLocale] || ""
}

export function getRandomCharacter(): Character {
  const index = Math.floor(Math.random() * characters.length)
  return characters[index]
}
