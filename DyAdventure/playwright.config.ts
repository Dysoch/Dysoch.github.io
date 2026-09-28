import { defineConfig } from '@playwright/test'

/**
 * End-to-end smoke tests: the real app in a real browser, seeded with generated saves.
 * Uses an installed browser (Edge by default, E2E_CHANNEL=chrome for Chrome), so nothing is downloaded.
 *   npm run e2e
 */
const PORT = 5199

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  outputDir: 'e2e/.results',
  use: {
    channel: process.env.E2E_CHANNEL ?? 'msedge',
    baseURL: `http://localhost:${PORT}/DyAdventure/`,
    viewport: { width: 1400, height: 900 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/DyAdventure/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
