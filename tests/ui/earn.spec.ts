import { test, expect } from '@playwright/test';
import { EarnPage } from '../../pages/EarnPage.ts';
import { injectMockWallet } from '../../utils/mock-wallet-helper';

test.describe('Jumper Exchange - Earn Page Navigation Tests', () => {

  let earnPage: EarnPage;

  test.beforeEach(async ({ page }) => {
    // 1. Setup Mocking BEFORE navigation
    await page.addInitScript(injectMockWallet());
    earnPage = new EarnPage(page);
    await page.goto('/');
  });

  /**
   * Sanity tests against the Earn page 
   * STEPS:
   * 1. Navigate to Earn section
   * 2. Verify that earn items are displayed
   * 3. Test filtering functionality by toggling different tabs
   * 4. Click on "Go to Portfolio" and verify navigation back to Portfolio page
   */
  test('Sanity check - should navigate through earn filters and return to portfolio', async ({ page }) => {

    // Step 1: Access Earn Section
    await earnPage.navigateToEarn();

    // check count specifically:
    await expect(earnPage.earnItems).not.toHaveCount(0);

    // Step 2: Test tab filtering logic
    await earnPage.toggleFilters();

    // Step 3: Transition back to Portfolio
    await earnPage.clickGoToPortfolio();
  });

});