# JOOGLE (쮸글) - Blue Archive Search Engine

A Google-clone search engine designed specifically for Blue Archive (블루
아카이브) players.

## Features

- **Google-identical Design** - Familiar, minimalist search interface
- **Blue Archive Data** - Characters, schools, and game terminology
- **Bilingual Support** - Korean (한국어) and Japanese (日本語)
- **Autocomplete** - Search suggestions for BA characters and terms
- **Easter Egg** - Try searching "쮸글" or "joogle"!
- **Responsive** - Works on mobile and desktop

## Tech Stack

- **Runtime**: Deno 2.0+
- **Build**: Vite 7
- **UI**: Preact
- **State**: @preact/signals
- **Testing**: Vitest

## Getting Started

### Prerequisites

Install Deno (v2.0.0 or later):

```bash
curl -fsSL https://deno.land/install.sh | sh
```

### Development

```bash
deno task dev
```

Open http://localhost:5173

### Build

```bash
deno task build
deno task preview
deno task serve
```

### Testing

```bash
deno task test
deno task test:watch
```

## Project Structure

```
joogle/
├── src/
│   ├── components/     # UI components
│   │   ├── Logo/       # JOOGLE logo
│   │   ├── SearchBar/  # Search input
│   │   ├── SearchButton/
│   │   ├── Footer/
│   │   └── LanguageSwitch/
│   ├── pages/          # Page components
│   │   ├── Home/       # Main search page
│   │   └── Results/    # Search results
│   ├── stores/         # Preact signals
│   ├── services/       # Search logic
│   ├── data/           # BA character data
│   └── styles/         # Global CSS
├── plan.md             # Project plan
├── architecture.md     # System architecture
└── AGENTS.md           # Contributor guidelines
```

## Blue Archive Data

The search engine includes:

- 20+ playable characters with metadata
- 10 schools with descriptions
- Game terminology in Korean and Japanese

## Contributing

See [AGENTS.md](./AGENTS.md) for contributor guidelines.

## Code Style

- No semicolons (configured in `deno.json`)
- Run `deno fmt` before committing
- Conventional commits

## License

MIT

---

Built with 💙 for Blue Archive Senseis
