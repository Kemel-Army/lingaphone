import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for the commit review (b286c34 / ff8ba5e / 54c363f).
 *
 * The default playwright.config.ts drives Nuxt through @nuxt/test-utils, whose
 * `_nuxtHooks` fixture builds its own Nuxt instance — on this project that
 * exceeds the 120s fixture timeout and every test errors out during setup.
 * This config talks plain HTTP to an already-running `pnpm dev` on :3000, so
 * the suite exercises the real app without the build step.
 */
export default defineConfig({
  testDir: './tests-review',
  fullyParallel: true,
  reporter: 'list',
  // The first navigation after a dev-server restart pays for Vite compiling the
  // route on demand, which alone can run past a 60s budget.
  timeout: 150_000,
  // Nuxt UI mounts modals asynchronously; the 5s default is tight against a
  // dev server that is still compiling route chunks in the background.
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.REVIEW_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
})
