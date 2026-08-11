import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

/**
 * By default @nuxt/test-utils builds and boots its own Nuxt instance inside the
 * `_nuxtHooks` worker fixture. That fixture's timeout is hard-coded in the
 * library (`FIXTURE_TIMEOUT = isWindows ? 120_000 : 60_000`) and cannot be
 * raised from here — and a full build of this app runs past it, so every test
 * died during setup with `Fixture "_nuxtHooks" timeout of 120000ms exceeded`.
 *
 * Setting `host` makes test-utils skip the build and the server start and talk
 * to an already-running instance instead (`if (_options.host) { build = false;
 * server = false }`). Start `pnpm dev` in another terminal and run:
 *
 *   E2E_HOST=http://localhost:3000 pnpm test:e2e
 *
 * With E2E_HOST unset the original build-it-yourself behaviour is kept, which
 * is still the right mode in CI on Linux where the build fits in 60s.
 */
const host = process.env.E2E_HOST

export default defineConfig<ConfigOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    trace: 'on-first-retry',
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
      ...(host ? { host } : {})
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
