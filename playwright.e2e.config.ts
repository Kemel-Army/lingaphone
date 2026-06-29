import { defineConfig, devices } from '@playwright/test'

// Standalone E2E config — runs against the ALREADY-RUNNING dev server
// (pnpm dev on :3000) with the real remote Supabase. Does NOT spawn its
// own Nuxt instance (unlike playwright.config.ts which uses @nuxt/test-utils).
export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: false,
  workers: 1,
  retries: 2,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
})
