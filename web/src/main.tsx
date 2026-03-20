import { render } from "preact"
import { App } from "./app.tsx"

const appElement = document.getElementById("app") as HTMLElement

render(<App />, appElement)
