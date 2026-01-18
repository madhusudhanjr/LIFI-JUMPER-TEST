import { test } from '@playwright/test';
import { PortfolioPage } from '../../pages/PortfolioPage';
import { injectMockWallet } from '../../utils/mock-wallet-helper';

test.describe('Jumper Exchange - Portfolio Navigation and Filtering', () => {

  let portfolioPage: PortfolioPage;

  test.beforeEach(async ({ page }) => {
    // 1. Setup Mocking BEFORE navigation
    await page.addInitScript(injectMockWallet());
    await page.goto('/');
    portfolioPage = new PortfolioPage(page);
  });

  /**
   * Sanity tests against the Portfolio page
   * STEPS:
   * 1. Navigate to Portfolio
   * 2. Switch between Asset tabs (All, On Chain, DeFi, NFTs)
   * 3. Apply filters (e.g., DeFi protocols)  
   */
  test('should navigate through portfolio tabs and apply filters', async ({ page }) => {

    // Step 1: Navigate
    await portfolioPage.navigateToPortfolio();

    // Step 2: Interact with navigation tabs
    await portfolioPage.switchAssetTabs();

    // Step 3: Apply filters
    await portfolioPage.filterByDeFiProtocols();
  });

});