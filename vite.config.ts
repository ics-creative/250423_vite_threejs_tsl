import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: [
        "index.html",
        "webgl-tiltshift.html",
        "webgpu-tiltshift.html"
      ]
    }
  },
});
