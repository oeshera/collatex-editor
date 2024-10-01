import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "https://collatex-editor.github.io",
  plugins: [TanStackRouterVite(), viteReact()],
});
