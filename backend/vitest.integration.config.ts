import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/integration/**/*.test.ts"],
    clearMocks: true,
    setupFiles: ["./src/integration/setup.ts"],
  },
});
