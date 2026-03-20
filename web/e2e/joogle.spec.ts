import { expect, test } from "@playwright/test"

test.describe("Jjugeul", () => {
  test("shows the clicker on index", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator(".jjugeul__counter")).toHaveText("0")
    await expect(page.locator(".jjugeul__stage")).toBeVisible()
  })

  test("increments only once while holding then increments again on next press", async ({ page }) => {
    await page.goto("/")

    const counter = page.locator(".jjugeul__counter")
    const stage = page.locator(".jjugeul__stage")

    await stage.hover()
    await page.mouse.down()
    await page.waitForTimeout(250)
    await expect(counter).toHaveText("1")

    await page.mouse.up()
    await page.waitForTimeout(50)

    await stage.click()
    await expect(counter).toHaveText("2")
  })

  test("opens leaderboard", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: /open leaderboard/i }).click()
    await expect(page.locator(".jjugeul__leaderboard")).toBeVisible()
  })
})
