import { test } from '@playwright/test';
import { JumperPage } from '../../pages/JumperPage';

test.describe('Jumper Exchange - Welcome Screen - Sanity Flow', () => {
  let jumper: JumperPage;

  test.beforeEach(async ({ page }) => {
    jumper = new JumperPage(page);
    jumper.navigate();
  });

  /**
   * Sanity tests against Swap routes
   * STEPS:
   * 3. Verify Chains, Bridges, DEXs Actions
   */
  test('Verify Chains, Bridges, DEXs Actions', async () => {

    const categories: ('Chains' | 'Bridges' | 'DEXs')[] = ['Chains', 'Bridges', 'DEXs'];

    for (const category of categories) {
      await jumper.openInfoModal(category);
      await jumper.closeModal();
    }
  });
});