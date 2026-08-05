import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit-Tests für die reinen Rechenfunktionen (keine DOM/DB nötig).
// Der Alias "@" spiegelt die tsconfig-Pfade wider.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
