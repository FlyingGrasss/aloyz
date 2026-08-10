import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/mobile-web",
  reporter: "line",
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.MOBILE_WEB_URL || "http://127.0.0.1:8081",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
