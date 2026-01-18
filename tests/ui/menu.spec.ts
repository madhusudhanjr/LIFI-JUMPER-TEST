import { test } from '@playwright/test';
import { MenuList } from '../../pages/MenuList';


test.describe('Jumper Exchange - Menu Items Navigation Tests', () => {

  let menu: MenuList;

  test.beforeEach(async ({ page }) => {
    // Navigate to base URL before each test
    await page.goto('/');
    menu = new MenuList(page);
  });

  /**
    * Sanity tests against Menu items
    * STEPS:
    * 1. Navigate to Learn and verify page load
    * 2. Navigate to Discord and verify link
    * 3. Navigate to Scan and verify table headings
    * 4. Open Support chat via Intercom
    * 5. Toggle Theme between Light and Dark
    * 6. Select Language from dropdown
    * 7. Navigate to Resources and verify page load
    */
  test('Navigate through Jumper menu items', async ({ page }) => {

    // Learn and Discord Section 
    await menu.navigateToLearn();
    await menu.verifyLearnPage();
    await menu.verifyDiscordLink();

    // Scan Section
    await menu.navigateToScan();
    await menu.verifyScanTableHeadings();

    // Support Intercom
    await menu.navigateToSupportChat();

    // Theme 
    await menu.toggleTheme('Light');

    // Language Selection
    await menu.selectLanguage('English');

    // Resources
    await menu.navigateToResources();

  });
});