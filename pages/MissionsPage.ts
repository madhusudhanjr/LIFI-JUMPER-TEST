import { Page, Locator } from '@playwright/test';

export class MissionsPage {
  readonly page: Page;
  readonly missionsTab: Locator;
  readonly missions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.missionsTab = page.getByRole('link', { name: 'Missions' });
    this.missions = page.locator('.MuiBox-root.mui-prph5i a');
  }

  async navigateToMissions() {
    await this.missionsTab.click();
  }

  /**
   * Clicks on a mission card based on its accessible name (alt text)
   */
  async openMissionByName(name: string) {
    await this.page.getByRole('link', { name: `Image for ${name}` }).click();
  }

  /**
   * Clicks the badge/info icon within a mission container.
   * If there are multiple, 'index' allows targeting a specific one.
   */
  async navigateBack(index: number = 0) {
    // Locates the first (or indexed) badge icon within the container
    await this.page.locator('.badge-container > .MuiSvgIcon-root').nth(index).click();
  }
}