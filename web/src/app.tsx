import "./styles/global.css"
import { signal } from "@preact/signals"
import { Home } from "./pages/Home/Home.tsx"
import { Results } from "./pages/Results/Results.tsx"
import { Jjugeul } from "./pages/Jjugeul/Jjugeul.tsx"
import { Footer } from "./components/Footer/Footer.tsx"
import { EasterEggOverlay } from "./components/EasterEggOverlay/EasterEggOverlay.tsx"
import { clearQuery } from "./stores/search.ts"
import { resetJjugeulSession } from "./stores/jjugeul.ts"

type Page = "home" | "results" | "jjugeul"

const HOME_HASH = "#/home"
const RESULTS_HASH = "#/search"
const JJUGEUL_HASH = "#/jjugeul"

function getPageFromHash(hash: string): Page {
  if (hash === HOME_HASH) return "home"
  if (hash === RESULTS_HASH) return "results"
  if (hash === JJUGEUL_HASH || hash === "#/" || hash === "") return "jjugeul"
  return "jjugeul"
}

function syncPageFromHash() {
  if (typeof globalThis === "undefined" || !globalThis.location) return

  currentPage.value = getPageFromHash(globalThis.location.hash)

  if (currentPage.value === "home") {
    clearQuery()
    resetJjugeulSession()
  }
}

function navigateToHash(hash: string) {
  if (typeof globalThis === "undefined" || !globalThis.history) return

  globalThis.history.pushState({}, "", hash)
  syncPageFromHash()
}

const currentPage = signal<Page>(
  typeof globalThis !== "undefined" && globalThis.location
    ? getPageFromHash(globalThis.location.hash)
    : "home",
)

let navigationBound = false

function ensureNavigationBinding() {
  if (
    navigationBound || typeof globalThis === "undefined" || !globalThis.location
  ) {
    return
  }

  globalThis.addEventListener("popstate", syncPageFromHash)
  globalThis.addEventListener("hashchange", syncPageFromHash)
  syncPageFromHash()
  navigationBound = true
}

export function App() {
  ensureNavigationBinding()

  const navigateToResults = () => {
    navigateToHash(RESULTS_HASH)
  }

  const navigateToJjugeul = () => {
    resetJjugeulSession()
    navigateToHash(JJUGEUL_HASH)
  }

  const navigateToHome = () => {
    navigateToHash(HOME_HASH)
  }

  return (
    <>
      <EasterEggOverlay />
      {currentPage.value === "home"
        ? (
          <>
            <Home
              onNavigateToJjugeul={navigateToJjugeul}
              onNavigateToResults={navigateToResults}
            />
            <Footer />
          </>
        )
        : currentPage.value === "results"
        ? <Results onNavigateToHome={navigateToHome} />
        : <Jjugeul onNavigateToHome={navigateToHome} />}
    </>
  )
}
