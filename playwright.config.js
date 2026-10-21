import { defineConfig, devices } from '@playwright/test';

// End-to-end tests: build the app in demo mode and click through every flow.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4174', acceptDownloads: true, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /phone/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /phone/ }
  ],
  webServer: {
    command: 'npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 120000
  }
});
