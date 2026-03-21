import { expect, test } from "@playwright/test"

test.describe("JOOGLE", () => {
  test("shows the clicker on index", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator(".jjugeul__counter")).toHaveText("0")
    await expect(page.locator(".jjugeul__stage")).toBeVisible()
    await expect(page.getByRole("button", { name: /board/i })).toBeVisible()
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

    await page.getByRole("button", { name: /board/i }).click()
    await expect(page.locator(".jjugeul__leaderboard")).toBeVisible()
  })

  test("keeps the click count after reload", async ({ page }) => {
    await page.goto("/")

    await page.locator(".jjugeul__stage").click()
    await expect(page.locator(".jjugeul__counter")).toHaveText("1")

    await page.reload()
    await expect(page.locator(".jjugeul__counter")).toHaveText("1")
  })
})
