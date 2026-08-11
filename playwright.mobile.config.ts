import { defineConfig, devices } from "@playwright/test";

const mobileWebPort = process.env.MOBILE_WEB_PORT || "8085";
const mobileWebUrl = process.env.MOBILE_WEB_URL || `http://127.0.0.1:${mobileWebPort}`;

export default defineConfig({
  testDir: "./tests/mobile-web",
  reporter: "line",
  retries: 0,
  workers: 1,
  timeout: 120_000,
  webServer: process.env.MOBILE_WEB_URL
    ? undefined
    : {
        command: `pnpm exec expo start --web --port ${mobileWebPort}`,
        cwd: "./mobile",
        url: mobileWebUrl,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          BROWSER: "none",
        },
      },
  use: {
    baseURL: mobileWebUrl,
    headless: true,
    launchOptions: { headless: true },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
