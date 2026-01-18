import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['html'], ['line'],
  ['allure-playwright', { outputFolder: 'allure-results' }]],

  // Use the dotenv package to dynamically load the correct file based on an environment variable. - This step is skipped for now.
  //const ENV = process.env.ENV || 'staging';

  // Default Test Timeout: Applied to all tests (30 seconds)
  timeout: 30 * 1000,

  expect: {
    // Timeout for assertions like expect(locator).toBeVisible()
    timeout: 10000,
  },

  projects: [
    /* API Project */
    {
      name: 'api',
      testMatch: /.*api\/.*spec\.ts/,
      use: {
        baseURL: 'https://li.quest/v1/',
      },
    },

    /* UI Project (with custom timeout) */
    {
      name: 'ui',
      testMatch: /.*ui\/.*spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'only-on-failure',
        baseURL: 'https://jumper.exchange',
        trace: 'on-first-retry',
      },
    },
  ],
});