import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/preact"
import { Logo } from "./Logo.tsx"

describe("Logo", () => {
  it("renders all letters of JOOGLE", () => {
    render(<Logo />)

    expect(screen.getByText("J")).toBeDefined()
    expect(screen.getAllByText("o")).toHaveLength(2)
    expect(screen.getByText("g")).toBeDefined()
    expect(screen.getByText("l")).toBeDefined()
    expect(screen.getByText("e")).toBeDefined()
  })

  it("renders with large size by default", () => {
    const { container } = render(<Logo />)
    const textSpan = container.querySelector(".logo__text")
    expect(textSpan?.classList.contains("logo__text--small")).toBe(false)
  })

  it("renders with small size when specified", () => {
    const { container } = render(<Logo size="small" />)
    const textSpan = container.querySelector(".logo__text")
    expect(textSpan?.classList.contains("logo__text--small")).toBe(true)
  })

  it("adds animated class when animated prop is true", () => {
    const { container } = render(<Logo animated />)
    const logoDiv = container.querySelector(".logo")
    expect(logoDiv?.classList.contains("logo--animated")).toBe(true)
  })

  it("does not add animated class by default", () => {
    const { container } = render(<Logo />)
    const logoDiv = container.querySelector(".logo")
    expect(logoDiv?.classList.contains("logo--animated")).toBe(false)
  })
})
