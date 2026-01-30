import { defineConfig } from "vite"
import deno from "@deno/vite-plugin"
import preact from "@preact/preset-vite"

export default defineConfig({
  plugins: [
    deno(),
    preact(),
  ],
  base: Deno.env.get("GITHUB_ACTIONS") ? "/joogle/" : "/",
})
