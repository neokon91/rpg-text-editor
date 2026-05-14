import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cp } from "node:fs/promises";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react(), copyRuntimeAssets()],
  root: "editor-next",
  base: "./",
  build: {
    outDir: "../dist/web",
    emptyOutDir: true
  },
  server: {
    fs: {
      allow: [".."]
    }
  }
});

function copyRuntimeAssets() {
  const runtimeDirs = ["assets", "fonts", "schemas", "styles"];
  return {
    name: "copy-runtime-assets",
    async writeBundle() {
      await Promise.all(runtimeDirs.map((dir) => cp(
        resolve(dir),
        resolve("dist", "web", dir),
        { recursive: true }
      )));
    }
  };
}
