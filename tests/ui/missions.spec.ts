import { expect, test } from '@playwright/test';
import { MissionsPage } from '../../pages/MissionsPage';
import { MISSIONS } from '../../utils/constants';

test.describe('Jumper Exchange - Missions Page Navigation Tests', () => {
  let missionsPage: MissionsPage;

  test.beforeEach(async ({ page }) => {
    missionsPage = new MissionsPage(page);
    await page.goto('/');
  });

  /**
   * Sanity tests against Missions page
   * STEPS:
   * 1. Navigate to Missions section
   * 2. Verify that missions are displayed
   * 3. Interact with specific missions and navigate back
   */
  test('Navigate through Missions', async () => {
    // 1. Go to Missions section
    await missionsPage.navigateToMissions();

    // This will automatically retry until at least one mission is visible
    await expect(missionsPage.missions.first()).toBeVisible();

    // Or to check count specifically:
    await expect(missionsPage.missions).not.toHaveCount(0);

    // 2. Interact with the 50% Points Boost mission
    await missionsPage.openMissionByName(MISSIONS.POINTS_BOOST);
    await missionsPage.navigateBack(0);

    // 3. Interact with the Deposit mission
    await missionsPage.openMissionByName(MISSIONS.DEPOSIT);
    await missionsPage.navigateBack(0);
  });
});