import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/")
          if (!normalizedId.includes("node_modules")) return
          if (
            normalizedId.includes("@radix-ui") ||
            normalizedId.includes("radix-ui")
          ) {
            return "ui-vendor"
          }
          if (normalizedId.includes("lucide-react")) return "icons"
          if (
            normalizedId.includes("/react-dom/") ||
            normalizedId.includes("/scheduler/")
          ) {
            return "react-dom"
          }
          if (normalizedId.includes("/react/")) return "react"
          if (normalizedId.includes("@tanstack")) return "tanstack"
          if (normalizedId.includes("zod")) return "zod"
          if (normalizedId.includes("date-fns")) return "date-vendor"
        },
      },
    },
  },
})
