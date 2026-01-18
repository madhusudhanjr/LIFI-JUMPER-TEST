import { type Locator, type Page } from '@playwright/test';

export class EarnPage {
  readonly page: Page;
  readonly earnTab: Locator;
  readonly tabsIndicator: Locator;
  readonly allFilterTab: Locator;
  readonly yourPositionsTab: Locator;
  readonly goToPortfolioButton: Locator;
  readonly earnItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.earnTab = page.getByRole('link', { name: 'Earn', exact: true });
    this.tabsIndicator = page.locator('.MuiTabs-indicator');
    this.allFilterTab = page.getByTestId('earn-filter-tab-all');
    this.yourPositionsTab = page.getByTestId('earn-filter-tab-your-positions');
    this.goToPortfolioButton = page.getByRole('button', { name: 'Go to Portfolio' });
    this.earnItems = page.locator('a[href*="/earn/"]');
  }

  async navigateToEarn() {
    await this.earnTab.click();
  }

  async toggleFilters() {
    await this.tabsIndicator.click();
    await this.allFilterTab.click();
    await this.yourPositionsTab.click();
  }

  async clickGoToPortfolio() {
    await this.goToPortfolioButton.click();
  }
}