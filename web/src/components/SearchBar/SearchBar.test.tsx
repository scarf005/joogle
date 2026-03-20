import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/preact"
import { SearchBar } from "./SearchBar.tsx"
import { searchQuery, showSuggestions } from "../../stores/search.ts"

describe("SearchBar", () => {
  beforeEach(() => {
    searchQuery.value = ""
    showSuggestions.value = false
  })

  it("renders search input", () => {
    render(<SearchBar onSearch={() => {}} />)
    const input = screen.getByRole("combobox")
    expect(input).toBeDefined()
  })

  it("renders with placeholder text", () => {
    render(<SearchBar onSearch={() => {}} placeholder="Test placeholder" />)
    const input = screen.getByPlaceholderText("Test placeholder")
    expect(input).toBeDefined()
  })

  it("updates searchQuery on input", () => {
    render(<SearchBar onSearch={() => {}} />)
    const input = screen.getByRole("combobox")

    fireEvent.input(input, { target: { value: "호시노" } })

    expect(searchQuery.value).toBe("호시노")
  })

  it("calls onSearch when Enter is pressed", () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    const input = screen.getByRole("combobox")

    fireEvent.input(input, { target: { value: "test query" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onSearch).toHaveBeenCalledWith("test query")
  })

  it("shows clear button when there is input", () => {
    render(<SearchBar onSearch={() => {}} />)
    const input = screen.getByRole("combobox")

    fireEvent.input(input, { target: { value: "test" } })

    const clearButton = screen.getByLabelText("Clear search")
    expect(clearButton.classList.contains("search-bar__clear--visible")).toBe(
      true,
    )
  })

  it("clears input when clear button is clicked", () => {
    render(<SearchBar onSearch={() => {}} />)
    const input = screen.getByRole("combobox")

    fireEvent.input(input, { target: { value: "test" } })
    const clearButton = screen.getByLabelText("Clear search")
    fireEvent.click(clearButton)

    expect(searchQuery.value).toBe("")
  })
})
