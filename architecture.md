# JOOGLE Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         JOOGLE App                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Services   │          │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │          │
│  │  │ Home   │  │  │  │ Logo   │  │  │  │Search  │  │          │
│  │  └────────┘  │  │  └────────┘  │  │  │Service │  │          │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  └────────┘  │          │
│  │  │Results │  │  │  │SearchBar│ │  │  ┌────────┐  │          │
│  │  └────────┘  │  │  └────────┘  │  │  │  i18n  │  │          │
│  └──────────────┘  │  ┌────────┐  │  │  │Service │  │          │
│                    │  │Footer  │  │  │  └────────┘  │          │
│                    │  └────────┘  │  └──────────────┘          │
│                    └──────────────┘                            │
├─────────────────────────────────────────────────────────────────┤
│                    State Management                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Preact Signals                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │searchQuery │  │  locale    │  │searchResult│         │  │
│  │  │ (signal)   │  │ (signal)   │  │ (computed) │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ Blue Archive    │  │   External      │                      │
│  │ Static Data     │  │   APIs/Wikis    │                      │
│  │ (characters,    │  │   (optional)    │                      │
│  │  schools, etc)  │  │                 │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App
├── I18nProvider (Lingui)
│   ├── Header (optional, for results page)
│   │   ├── Logo (small)
│   │   └── SearchBar (compact)
│   ├── Main Content
│   │   ├── HomePage
│   │   │   ├── Logo
│   │   │   ├── SearchBar
│   │   │   ├── SearchButtons
│   │   │   └── LanguageSwitch
│   │   └── ResultsPage
│   │       ├── SearchResult[]
│   │       └── Pagination
│   └── Footer
│       ├── FooterTop (location-based)
│       └── FooterBottom (links)
```

### Component Specifications

#### Logo Component
```typescript
interface LogoProps {
  size?: 'small' | 'large'
  animated?: boolean
}
```
- Large: 272x92px (home page)
- Small: 92x30px (results page)
- Uses Google's color scheme for letters

#### SearchBar Component
```typescript
interface SearchBarProps {
  value: Signal<string>
  onSearch: (query: string) => void
  suggestions?: Signal<string[]>
  autoFocus?: boolean
}
```
- 582px max width, 44px height
- Search icon (left), clear button (right)
- Autocomplete dropdown

#### SearchButton Component
```typescript
interface SearchButtonProps {
  variant: 'primary' | 'secondary'
  onClick: () => void
  children: string
}
```
- Primary: "Joogle 검색" / "Joogle Search"
- Secondary: "I'm Feeling Lucky"

## State Management

### Signals Structure

```typescript
// stores/search.ts
import { signal, computed } from "@preact/signals"

export const searchQuery = signal("")
export const searchResults = signal<SearchResult[]>([])
export const isLoading = signal(false)
export const suggestions = computed(() => 
  getSuggestions(searchQuery.value)
)

// stores/locale.ts
export const locale = signal<"ko" | "ja">("ko")
export const messages = computed(() => 
  loadMessages(locale.value)
)

// stores/easter.ts
export const easterEggActive = signal(false)
export const joogleMode = signal(false)
```

### State Flow

```
User Input → Signal Update → Component Re-render
     ↓
  computed() → Derived State
     ↓
  effect() → Side Effects (API calls, localStorage)
```

## i18n Architecture

### Lingui Setup

```
src/
└── locales/
    ├── ko/
    │   └── messages.po
    └── ja/
        └── messages.po
```

### Message Catalog Structure

```typescript
// Korean (default)
{
  "search.placeholder": "블루 아카이브 검색",
  "search.button": "Joogle 검색",
  "search.lucky": "I'm Feeling Lucky",
  "footer.advertising": "광고",
  "footer.business": "비즈니스"
}

// Japanese
{
  "search.placeholder": "ブルーアーカイブを検索",
  "search.button": "Joogle 検索",
  "search.lucky": "I'm Feeling Lucky",
  "footer.advertising": "広告",
  "footer.business": "ビジネス"
}
```

## Search Service Architecture

### Search Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User       │     │  Search     │     │   Data      │
│  Input      │────▶│  Service    │────▶│   Sources   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
            ┌─────────────┐ ┌─────────────┐
            │   Local     │ │  External   │
            │   Data      │ │   API       │
            │ (characters,│ │  (optional) │
            │  schools)   │ │             │
            └─────────────┘ └─────────────┘
```

### Search Types

1. **Character Search** - Blue Archive characters
2. **School Search** - In-game schools/academies
3. **Item Search** - Equipment, materials
4. **Guide Search** - Gameplay guides
5. **Event Search** - Current/past events

### Data Structure

```typescript
interface SearchResult {
  id: string
  type: "character" | "school" | "item" | "guide" | "event"
  title: string
  description: string
  url: string
  thumbnail?: string
  metadata?: Record<string, unknown>
}

interface Character {
  id: string
  name: {
    ko: string
    ja: string
    en: string
  }
  school: string
  role: string
  rarity: number
  releaseDate: string
  imageUrl: string
}
```

## Easter Egg System

### "Joogle" Easter Egg

When user searches "joogle":

```typescript
const JOOGLE_TRIGGERS = ["joogle", "주글", "ジューグル"]

function handleSearch(query: string) {
  if (JOOGLE_TRIGGERS.includes(query.toLowerCase())) {
    activateJoogleEasterEgg()
    return
  }
  // Normal search...
}

function activateJoogleEasterEgg() {
  // 1. Logo animation (bounce/spin)
  // 2. Special results page
  // 3. Blue Archive themed effects
  // 4. Character appearances
}
```

### Easter Egg Effects

1. **Logo Animation** - Letters bounce in sequence
2. **Background Effect** - Subtle particle effects
3. **Sound** - Optional BA sound effect
4. **Special Results** - Meta/fun search results

## Routing

Simple hash-based routing (no external router):

```typescript
// routes.ts
const routes = {
  "/": HomePage,
  "/search": ResultsPage,
}

// App component handles routing based on URL
function App() {
  const path = useHashRoute()
  const Page = routes[path] || HomePage
  return <Page />
}
```

## File Structure Details

```
src/
├── components/
│   ├── Logo/
│   │   ├── Logo.tsx
│   │   ├── Logo.css
│   │   └── Logo.test.tsx
│   ├── SearchBar/
│   │   ├── SearchBar.tsx
│   │   ├── SearchBar.css
│   │   ├── Autocomplete.tsx
│   │   └── SearchBar.test.tsx
│   ├── SearchButton/
│   │   ├── SearchButton.tsx
│   │   ├── SearchButton.css
│   │   └── SearchButton.test.tsx
│   ├── Footer/
│   │   ├── Footer.tsx
│   │   ├── Footer.css
│   │   └── Footer.test.tsx
│   └── LanguageSwitch/
│       ├── LanguageSwitch.tsx
│       └── LanguageSwitch.test.tsx
├── pages/
│   ├── Home/
│   │   ├── Home.tsx
│   │   ├── Home.css
│   │   └── Home.test.tsx
│   └── Results/
│       ├── Results.tsx
│       ├── Results.css
│       ├── SearchResultItem.tsx
│       └── Results.test.tsx
├── stores/
│   ├── search.ts
│   ├── locale.ts
│   └── easter.ts
├── services/
│   ├── search.ts
│   └── i18n.ts
├── data/
│   ├── characters.ts
│   ├── schools.ts
│   └── suggestions.ts
├── locales/
│   ├── ko/
│   │   └── messages.po
│   └── ja/
│       └── messages.po
├── styles/
│   └── global.css
├── utils/
│   ├── router.ts
│   └── helpers.ts
├── app.tsx
├── main.tsx
└── vite-env.d.ts
```

## Build & Development

### Development
```bash
deno task dev      # Start Vite dev server
```

### Production
```bash
deno task build    # Build for production
deno task preview  # Preview production build
deno task serve    # Serve production build
```

### Testing
```bash
deno task test     # Run Vitest tests
deno task test:ui  # Run tests with UI
```

## Performance Considerations

1. **Code Splitting** - Lazy load results page
2. **Asset Optimization** - Compress images, SVGs
3. **Preact** - Already lightweight (~3KB)
4. **Signals** - Efficient fine-grained updates
5. **CSS** - Minimal, scoped styles

## Security

1. **Input Sanitization** - XSS prevention
2. **CSP Headers** - Content Security Policy
3. **No User Data Storage** - Privacy-first
