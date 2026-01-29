import "./styles/global.css"
import { signal } from "@preact/signals"
import { Home } from "./pages/Home/Home.tsx"
import { Results } from "./pages/Results/Results.tsx"
import { Footer } from "./components/Footer/Footer.tsx"
import { clearQuery } from "./stores/search.ts"

type Page = "home" | "results"

const currentPage = signal<Page>("home")

export function App() {
  const navigateToResults = () => {
    currentPage.value = "results"
    window.history.pushState({}, "", "#/search")
  }

  const navigateToHome = () => {
    currentPage.value = "home"
    clearQuery()
    window.history.pushState({}, "", "#/")
  }

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
      if (window.location.hash === "#/search") {
        currentPage.value = "results"
      } else {
        currentPage.value = "home"
        clearQuery()
      }
    })

    if (window.location.hash === "#/search") {
      currentPage.value = "results"
    }
  }

  return (
    <>
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
