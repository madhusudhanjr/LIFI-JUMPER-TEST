import { test } from '@playwright/test';
import { JumperPage } from '../../pages/JumperPage';
import { injectMockWallet } from '../../utils/mock-wallet-helper';

test.describe('Jumper Exchange - Mock Wallet Setup Test', () => {
  let jumper: JumperPage;

  test.beforeEach(async ({ page }) => {
    // 1. Setup Mocking BEFORE navigation
    await page.addInitScript(injectMockWallet());
    await page.goto('/');
  });

  /**
   * Sanity tests against Wallet setup and Navigation
   * STEPS:
   * 1. Connect using Mock Wallet
   * 2. Open Profile & Achievements
   * 3. Start a Swap
   * 4. Check Explorer link
   * 5. Disconnect Wallet 
   */
  test('Sanity: Connect using Mock Wallet and check the navigations', async ({ page }) => {

    jumper = new JumperPage(page);

    // Profile & Achievements flow
    await jumper.openProfileAndAchievements();

    // Explorer Link check 
    await jumper.checkExplorer();

    // Cleanup
    await jumper.disconnectWallet();
  });
});