/// <reference lib="deno.ns" />
import { defineConfig, devices } from "@playwright/test"

const isCI = Deno.env.get("CI") === "true"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "deno task preview",
    url: "http://localhost:4173",
    reuseExistingServer: !isCI,
  },
})
