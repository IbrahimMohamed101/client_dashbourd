import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// Independent entry and output. This does not change the dashboard build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    outDir: "dist-pos",
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, "pos.html") },
  },
  server: {
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } },
  },
});
