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
    baseURL: "http://localhost:43127",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "deno task build && distrobox enter fedora -- bash -lc 'cd /run/media/home/scarf/repo/etc/joogle && cargo run'",
    url: "http://localhost:43127",
    reuseExistingServer: !isCI,
  },
})
