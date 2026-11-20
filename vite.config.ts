import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Tiempo máximo por prueba
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "src/test/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
});
