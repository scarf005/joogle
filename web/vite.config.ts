import { defineConfig } from "vite"
import deno from "@deno/vite-plugin"
import preact from "@preact/preset-vite"

export default defineConfig({
  plugins: [
    deno(),
    preact(),
  ],
  base: Deno.env.get("GITHUB_ACTIONS") ? "/joogle/" : "/",
  server: {
    proxy: {
      "/api": {
        target: Deno.env.get("API_ORIGIN") ?? "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
})
