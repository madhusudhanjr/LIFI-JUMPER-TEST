import { test, expect } from '@playwright/test';
import { JumperPage } from '../../pages/JumperPage';
import { CHAINS, TOKENS } from '../../utils/constants';

test.describe('Jumper Exchange - Sanity tests for Swap and Bridge', () => {
  let jumper: JumperPage;

  test.beforeEach(async ({ page }) => {
    jumper = new JumperPage(page);
    jumper.navigateToExchange();
  });

  /**
   * Sanity tests against Swap routes
   * STEPS:
   * 1. Generate a Swap Route (USDC on ARB to UNI on ARB)
   */
  test('Generate a Swap Route (USDC on ARB to UNI on ARB)', async ({ page }) => {
    await jumper.goToExchange(
      CHAINS.ARBITRUM, TOKENS.USDC_ARBITRUM,
      CHAINS.ARBITRUM, TOKENS.UNI_ARBITRIUM
    );

    await expect(page.getByText('Best Return')).toBeVisible();
  });

  /**
   * Sanity tests against Swap routes
   * STEPS:
   * 2. Generate a Bridge Route (ETH on ETH to USDC on ARB)
   */
  test('Generate a Bridge Route (ETH on ETH to USDC on ARB)', async ({ page }) => {
    await jumper.goToExchange(
      CHAINS.ETH, TOKENS.ETH_MAINNET,
      CHAINS.ARBITRUM, TOKENS.USDC_ARBITRUM
    );

    await expect(page.getByText('Best Return')).toBeVisible();
    await expect(page.getByText('Fastest')).toBeVisible();
  });

});