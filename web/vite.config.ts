import { EventEmitter } from "node:events"
import { defineConfig } from "vite"
import deno from "@deno/vite-plugin"
import preact from "@preact/preset-vite"

const usePolling = Deno.env.get("VITE_WATCH_POLLING") === "true"
const isCanceledProxyRequest = (error: Error) => {
  return error.name === "AbortError" ||
    error.message.includes("request has been cancelled")
}
type ProxyResponse = {
  end: () => void
  headersSent?: boolean
  writeHead: (statusCode: number) => void
}

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
        configure: (proxy) => {
          const proxyEmitter = proxy as unknown as EventEmitter
          const defaultErrorListeners = proxyEmitter.listeners("error")

          proxyEmitter.removeAllListeners("error")
          proxyEmitter.on(
            "error",
            (error: Error, req: unknown, res?: ProxyResponse) => {
              if (isCanceledProxyRequest(error)) {
                if (res && !res.headersSent) {
                  res.writeHead(499)
                }

                if (res) {
                  res.end()
                }

                return
              }

              for (const listener of defaultErrorListeners) {
                listener.call(proxy, error, req, res)
              }
            },
          )
        },
      },
    },
  },
})
