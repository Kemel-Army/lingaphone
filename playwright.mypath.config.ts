import { defineConfig, devices } from '@playwright/test'

/**
 * Isolated config for the «Мой путь» e2e run. No @nuxt/test-utils server boot —
 * targets the already-running `pnpm dev` on :3000. Serial + single worker so the
 * gating flow (pass block-1 test → block-2 unlocks) sees deterministic DB state.
 */
export default defineConfig({
  testDir: './tests-e2e',
  testMatch: 'my-path.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
