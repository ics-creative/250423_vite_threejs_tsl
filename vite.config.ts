import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    rolldownOptions: {
      input: ["index.html", "webgl-tiltshift.html", "webgpu-tiltshift.html"],
    },
  },
});
