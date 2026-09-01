import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e-live',
  use: { baseURL: 'http://127.0.0.1:4202' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4202',
    url: 'http://127.0.0.1:4202',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
