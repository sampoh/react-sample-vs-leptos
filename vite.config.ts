import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** src/ 以下のソース行数 (ビルド時に数えて定数として埋め込む。ソース本文はバンドルに含めない) */
function countSourceLines(dir: string): number {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.(tsx?|css)$/.test(f))
    .reduce((n, f) => n + (readFileSync(join(dir, f), "utf8").match(/\n/g)?.length ?? 0), 0);
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.SRC_LINES": JSON.stringify(countSourceLines("src")),
  },
  server: { port: 5173 },
});
