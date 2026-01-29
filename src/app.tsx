import "./styles/global.css"
import { signal } from "@preact/signals"
import { Home } from "./pages/Home/Home.tsx"
import { Results } from "./pages/Results/Results.tsx"
import { Footer } from "./components/Footer/Footer.tsx"
import { EasterEggOverlay } from "./components/EasterEggOverlay/EasterEggOverlay.tsx"
import { clearQuery } from "./stores/search.ts"

type Page = "home" | "results"

const currentPage = signal<Page>("home")

export function App() {
  const navigateToResults = () => {
    currentPage.value = "results"
    globalThis.history.pushState({}, "", "#/search")
  }

  const navigateToHome = () => {
    currentPage.value = "home"
    clearQuery()
    globalThis.history.pushState({}, "", "#/")
  }

  if (typeof globalThis !== "undefined" && globalThis.location) {
    globalThis.addEventListener("popstate", () => {
      if (globalThis.location.hash === "#/search") {
        currentPage.value = "results"
      } else {
        currentPage.value = "home"
        clearQuery()
      }
    })

    if (globalThis.location.hash === "#/search") {
      currentPage.value = "results"
    }
  }

  return (
    <>
      <EasterEggOverlay />
      {currentPage.value === "home"
        ? (
          <>
            <Home onNavigateToResults={navigateToResults} />
            <Footer />
          </>
        )
        : <Results onNavigateToHome={navigateToHome} />}
    </>
  )
}
