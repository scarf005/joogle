import { defineConfig } from "vite"
import deno from "@deno/vite-plugin"
import preact from "@preact/preset-vite"

const usePolling = Deno.env.get("VITE_WATCH_POLLING") === "true"

export default defineConfig({
  plugins: [
    deno(),
    preact(),
  ],
  base: Deno.env.get("GITHUB_ACTIONS") ? "/joogle/" : "/",
  server: {
    watch: usePolling
      ? {
        usePolling: true,
        interval: 120,
      }
      : undefined,
    proxy: {
      "/api": {
        target: Deno.env.get("API_ORIGIN") ?? "http://127.0.0.1:43127",
        changeOrigin: true,
      },
    },
  },
})
