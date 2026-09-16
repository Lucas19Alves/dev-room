import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:5179",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5179",
    url: "http://127.0.0.1:5179",
    reuseExistingServer: !process.env.CI,
  },
});
