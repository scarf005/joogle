# AGENTS.md - JOOGLE Contributor Guidelines

## Project Context

JOOGLE is a Blue Archive-themed Google clone search engine built with:

- **Runtime**: Deno
- **Build**: Vite
- **UI**: Preact
- **State**: @preact/signals
- **i18n**: Lingui
- **Testing**: Vitest

## Code Style

### No Semicolons

This project uses **no semicolons**. The `deno.json` is configured with:

```json
{
  "fmt": {
    "semiColons": false
  }
}
```

Run `deno fmt` before committing to ensure consistency.

### TypeScript

- Use explicit types for function parameters
- Prefer interfaces over types for objects
- Use `unknown` over `any`
- Export types when needed by other modules

### File Naming

- Components: `PascalCase.tsx` (e.g., `SearchBar.tsx`)
- Styles: `component-name.css` (e.g., `search-bar.css`)
- Utils/Services: `camelCase.ts` (e.g., `searchService.ts`)
- Tests: `*.test.tsx` or `*.test.ts`

### Component Structure

```typescript
// Component file structure
import "./component-name.css"
import { signal } from "@preact/signals"

interface ComponentProps {
  // Props interface
}

export function Component({ prop }: ComponentProps) {
  // Component logic
  return (
    <div class="component">
      {/* JSX */}
    </div>
  )
}
```

### CSS Guidelines

- Use BEM naming: `block__element--modifier`
- Prefer CSS custom properties for theming
- Mobile-first responsive design
- No CSS-in-JS (keep styles in separate `.css` files)

## Architecture Patterns

### State Management with Signals

```typescript
// stores/example.ts
import { computed, signal } from "@preact/signals"

// Primitive signals
export const query = signal("")

// Computed values
export const isValid = computed(() => query.value.length > 0)

// Actions
export function setQuery(value: string) {
  query.value = value
}
```

### Component Pattern

```typescript
// Prefer function components
export function SearchBar() {
  // Use signals directly (no useState)
  const handleInput = (e: Event) => {
    query.value = (e.target as HTMLInputElement).value
  }

  return (
    <input
      type="text"
      value={query.value}
      onInput={handleInput}
    />
  )
}
```

### i18n Pattern

```typescript
import { Trans } from "@lingui/react"

// Use Trans component for translations
<Trans id="search.button">Joogle 검색</Trans>

// Or useLingui hook
const { t } = useLingui()
<button>{t`search.button`}</button>
```

## Directory Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── stores/        # Preact signals state
├── services/      # Business logic & APIs
├── data/          # Static data files
├── locales/       # i18n translations
├── styles/        # Global styles
└── utils/         # Helper functions
```

## Commit Guidelines

### Conventional Commits

Format: `<type>(<scope>): <description>`

#### Types

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation               |
| `style`    | Formatting (no code change) |
| `refactor` | Code restructuring          |
| `test`     | Adding/updating tests       |
| `chore`    | Maintenance                 |

#### Examples

```
feat(search): add autocomplete suggestions
fix(logo): correct letter spacing on mobile
docs: update architecture diagram
style: format components with deno fmt
refactor(store): migrate to signals
test(search-bar): add unit tests
chore: update dependencies
```

### Atomic Commits

- One logical change per commit
- Tests should pass after each commit
- Keep commits small and focused

## Testing Guidelines

### Test Files

- Place test files next to source files
- Name: `ComponentName.test.tsx`

### Test Structure

```typescript
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/preact"
import { SearchBar } from "./SearchBar"

describe("SearchBar", () => {
  it("renders input element", () => {
    render(<SearchBar />)
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
  })

  it("updates value on input", async () => {
    // Test logic
  })
})
```

### What to Test

1. Component renders correctly
2. User interactions work
3. Signal state updates properly
4. i18n keys render
5. Edge cases (empty, loading, error)

## Development Workflow

### Setup

```bash
# Install Deno (if not installed)
curl -fsSL https://deno.land/install.sh | sh

# Start dev server
deno task dev
```

### Common Tasks

```bash
deno task dev      # Development server
deno task build    # Production build
deno task preview  # Preview build
deno task test     # Run tests
deno fmt           # Format code
deno lint          # Lint code
```

### Before Committing

1. Run `deno fmt` to format
2. Run `deno lint` to check for issues
3. Run `deno task test` to ensure tests pass
4. Write meaningful commit message

## Blue Archive Context

### Character Data

Characters should include:

- Korean name (한글)
- Japanese name (日本語)
- English name
- School affiliation
- Role (striker/special)
- Rarity (1-3 stars)

### Search Terms

Common search terms include:

- Character names
- School names (게헨나, 트리니티, etc.)
- Game mechanics (총력전, 대결전, etc.)
- Events

### Tone

JOOGLE should be:

- Professional but playful
- Blue Archive-themed
- Accessible to both Korean and Japanese speakers

## Resources

- [Preact Signals](https://preactjs.com/guide/v10/signals)
- [Lingui Documentation](https://lingui.dev)
- [Deno Manual](https://deno.land/manual)
- [Blue Archive Wiki](https://bluearchive.wiki)

## Questions?

Open an issue or discussion for:

- Architecture questions
- Feature proposals
- Bug reports
- General questions
