import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// E2E tests run against a dedicated database and port so they never touch
// dev data or collide with a manually running `pnpm dev` server.
config({ path: ".env.test", quiet: true });

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
    stdout: "pipe",
    stderr: "pipe",
  },
});
