import { expect, test } from "@playwright/test"

test.describe("JOOGLE Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should display JOOGLE logo", async ({ page }) => {
    const logo = page.locator(".logo")
    await expect(logo).toBeVisible()
    await expect(logo).toContainText("JOOGLE")
  })

  test("should have search input", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeFocused()
  })

  test("should have search buttons", async ({ page }) => {
    const joogleButton = page.getByRole("button", { name: /joogle/i })
    const luckyButton = page.getByRole("button", { name: /lucky/i })

    await expect(joogleButton).toBeVisible()
    await expect(luckyButton).toBeVisible()
  })

  test("should have language switcher with 3 languages", async ({ page }) => {
    const koreanButton = page.getByRole("button", { name: "한국어" })
    const englishButton = page.getByRole("button", { name: "English" })
    const japaneseButton = page.getByRole("button", { name: "日本語" })

    await expect(koreanButton).toBeVisible()
    await expect(englishButton).toBeVisible()
    await expect(japaneseButton).toBeVisible()
  })
})

test.describe("Search Functionality", () => {
  test("should navigate to results page on search", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.locator('input[type="text"]')

    await searchInput.fill("Hoshino")
    await searchInput.press("Enter")

    await expect(page).toHaveURL(/#\/search/)
    await expect(page.locator(".results")).toBeVisible()
  })

  test("should show search results for character name", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.locator('input[type="text"]')

    await searchInput.fill("호시노")
    await searchInput.press("Enter")

    const resultItem = page.locator(".result-item").first()
    await expect(resultItem).toBeVisible()
    await expect(resultItem).toContainText("호시노")
  })

  test("should show autocomplete suggestions", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.locator('input[type="text"]')

    await searchInput.fill("호")
    const suggestions = page.locator(".search-bar__suggestions")
    await expect(suggestions).toBeVisible()
  })

  test("should return to home when clicking logo on results page", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.locator('input[type="text"]')

    await searchInput.fill("test")
    await searchInput.press("Enter")

    await expect(page).toHaveURL(/#\/search/)

    const logo = page.locator(".results__logo")
    await logo.click()

    await expect(page).toHaveURL(/#\//)
  })
})

test.describe("Language Switching", () => {
  test("should switch to Japanese", async ({ page }) => {
    await page.goto("/")

    const japaneseButton = page.getByRole("button", { name: "日本語" })
    await japaneseButton.click()

    const subtitle = page.locator(".home__subtitle")
    await expect(subtitle).toContainText("ブルーアーカイブ")
  })

  test("should switch to English", async ({ page }) => {
    await page.goto("/")

    const englishButton = page.getByRole("button", { name: "English" })
    await englishButton.click()

    const subtitle = page.locator(".home__subtitle")
    await expect(subtitle).toContainText("Blue Archive Search Engine")
  })

  test("should persist language choice", async ({ page }) => {
    await page.goto("/")

    const japaneseButton = page.getByRole("button", { name: "日本語" })
    await japaneseButton.click()

    await page.reload()

    const subtitle = page.locator(".home__subtitle")
    await expect(subtitle).toContainText("ブルーアーカイブ")
  })
})

test.describe("Easter Eggs", () => {
  test("should trigger joogle easter egg", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.locator('input[type="text"]')

    await searchInput.fill("joogle")
    await searchInput.press("Enter")

    await expect(page).toHaveURL(/#\//)

    const logo = page.locator(".logo")
    await expect(logo).toHaveClass(/logo--animated/)
  })

  test("should show character easter egg overlay for Aru", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.locator('input[type="text"]')

    await searchInput.fill("아루")
    await searchInput.press("Enter")

    const overlay = page.locator(".easter-egg-overlay--aru")
    await expect(overlay).toBeVisible()

    await expect(page).toHaveURL(/#\/search/)
  })
})
