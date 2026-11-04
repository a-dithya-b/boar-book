import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  // the artifact build is served from a sub-path, so asset URLs must be relative
  base: mode === "artifact" ? "./" : "/",
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1200, outDir: mode === "artifact" ? "dist-artifact" : "dist" },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
}));
