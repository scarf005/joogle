# JOOGLE - Blue Archive Search Engine

## Project Overview

JOOGLE is a Google-clone search engine designed specifically for Blue Archive
players. The name "JOOGLE" is a playful combination that references the game's
aesthetic and community culture.

### Why JOOGLE?

Inspired by the Blue Archive character "이오치 마리" (Iochi Mari), JOOGLE serves
as a dedicated search portal for the Blue Archive community, providing quick
access to character information, game guides, and community resources.

## Goals

1. **Pixel-perfect Google Clone** - Replicate Google's minimalist homepage
   design
2. **Blue Archive Integration** - Serve as a specialized search engine for BA
   content
3. **Internationalization** - Support Korean (primary), Japanese (secondary)
4. **Modern Stack** - Deno + Vite + Preact + Signals
5. **Easter Eggs** - Hidden features for community engagement

## Tech Stack

| Technology      | Purpose                                      |
| --------------- | -------------------------------------------- |
| Deno            | Runtime environment                          |
| Vite            | Build tool & dev server                      |
| Preact          | UI framework (lightweight React alternative) |
| @preact/signals | State management                             |
| Lingui          | Internationalization (i18n)                  |
| Vitest          | Testing framework                            |
| TypeScript      | Type safety                                  |

## Project Structure

```
joogle/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Logo/          # JOOGLE logo
│   │   ├── SearchBar/     # Search input with autocomplete
│   │   ├── SearchButton/  # Search action buttons
│   │   ├── Footer/        # Page footer
│   │   └── LanguageSwitch/# i18n language selector
│   ├── pages/             # Page components
│   │   ├── Home/          # Main search page
│   │   └── Results/       # Search results page
│   ├── stores/            # Preact signals state
│   │   ├── search.ts      # Search state
│   │   └── locale.ts      # Locale state
│   ├── services/          # API & data services
│   │   └── search.ts      # Search logic
│   ├── data/              # Static data
│   │   └── blueArchive.ts # BA character/info data
│   ├── locales/           # i18n translations
│   │   ├── ko/            # Korean
│   │   └── ja/            # Japanese
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   └── __tests__/         # Test files
├── public/                # Static assets
├── docs/                  # Documentation
├── plan.md               # This file
├── architecture.md       # System architecture
└── AGENTS.md             # Contributor guidelines
```

## Features

### Phase 1: Core UI (Priority: High) ✅

- [x] Google-identical homepage layout
- [x] JOOGLE logo with Blue Archive theme
- [x] Search bar with focus states
- [x] "Joogle 검색" / "I'm Feeling Lucky" buttons
- [x] Responsive design

### Phase 2: Search Functionality (Priority: High) ✅

- [x] Search query handling
- [x] Autocomplete suggestions (BA characters, terms)
- [x] Search results page
- [x] Integration with Blue Archive wikis/resources

### Phase 3: Internationalization (Priority: Medium) ✅

- [x] Lingui setup with Vite
- [x] Korean translations (default)
- [x] Japanese translations
- [x] Language switcher UI

### Phase 4: State Management (Priority: High) ✅

- [x] Preact Signals setup
- [x] Search state (query, results, loading)
- [x] Locale state
- [x] Preferences state

### Phase 5: Easter Eggs (Priority: Medium) ✅

- [x] "joogle" search easter egg
- [ ] Character-specific interactions
- [ ] Hidden features for community

### Phase 6: Testing (Priority: High) ✅

- [x] Vitest setup
- [x] Unit tests for components
- [x] Integration tests
- [ ] E2E tests consideration

## Design Specifications

### Color Palette

| Element        | Color   | Notes             |
| -------------- | ------- | ----------------- |
| Background     | #ffffff | Clean white       |
| Text Primary   | #202124 | Google dark gray  |
| Text Secondary | #5f6368 | Google light gray |
| Link           | #1a0dab | Google blue       |
| Button BG      | #f8f9fa | Light gray        |
| Button Border  | #f8f9fa | Same as BG        |
| Button Hover   | #f1f3f4 | Slightly darker   |
| JOOGLE Blue    | #4285f4 | Google blue       |
| JOOGLE Red     | #ea4335 | Google red        |
| JOOGLE Yellow  | #fbbc05 | Google yellow     |
| JOOGLE Green   | #34a853 | Google green      |

### Typography

- Font Family: `Arial, sans-serif` (Google default)
- Logo: Custom styled "JOOGLE" with Google colors
- Search Input: 16px
- Buttons: 14px

### Layout Measurements

- Logo width: ~272px
- Search bar width: 582px (max)
- Search bar height: 44px
- Button height: 36px
- Content max-width: 584px
- Vertical centering with slight top offset

## Development Workflow

### Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, no code change
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

### Branch Strategy

- `main` - production ready
- `feat/*` - feature branches
- `fix/*` - bug fix branches

## Timeline

| Phase                | Estimated Time |
| -------------------- | -------------- |
| Phase 1: Core UI     | 2-3 hours      |
| Phase 2: Search      | 2 hours        |
| Phase 3: i18n        | 1-2 hours      |
| Phase 4: State       | 1 hour         |
| Phase 5: Easter Eggs | 1 hour         |
| Phase 6: Testing     | 2 hours        |
| **Total**            | **9-11 hours** |

## References

- [Google Homepage](https://www.google.com)
- [Blue Archive Wiki](https://bluearchive.wiki)
- [Preact Signals](https://preactjs.com/guide/v10/signals)
- [Lingui](https://lingui.dev)
- [Deno](https://deno.land)
