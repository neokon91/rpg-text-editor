import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist/editor-next",
    emptyOutDir: true,
    rollupOptions: {
      input: "editor-next/index.html"
    }
  },
  server: {
    fs: {
      allow: ["."]
    }
  }
});
