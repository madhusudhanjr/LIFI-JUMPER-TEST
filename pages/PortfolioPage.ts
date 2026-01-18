import { expect, type Locator, type Page } from '@playwright/test';

export class PortfolioPage {
  readonly page: Page;
  readonly portfolioLink: Locator;
  readonly body: Locator;
  readonly overviewTab: Locator;
  readonly tokensTab: Locator;
  readonly defiPositionsTab: Locator;
  readonly tabsIndicator: Locator;
  readonly defiProtocolsFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.portfolioLink = page.getByRole('link', { name: 'Portfolio' });
    this.body = page.locator('body');
    this.overviewTab = page.getByTestId('asset-overview-nav-overview');
    this.tokensTab = page.getByTestId('asset-overview-nav-tokens');
    this.defiPositionsTab = page.getByTestId('asset-overview-nav-defiPositions');
    this.tabsIndicator = page.locator('.MuiTabs-indicator');
    this.defiProtocolsFilter = page.getByTestId('portfolio-filter-tab-defi-protocols');
  }

  async navigateToPortfolio() {
    await this.portfolioLink.click();
    await expect(this.body).toContainText('Portfolio');
  }

  async switchAssetTabs() {
    await this.overviewTab.click();
    await this.tokensTab.click();
    await this.defiPositionsTab.click();
  }

  async filterByDeFiProtocols() {
    await this.tabsIndicator.click();
    await this.defiProtocolsFilter.click();
  }
}