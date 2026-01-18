import { Page, Locator, expect } from '@playwright/test';

export class JumperPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly modalTitle: Locator;
  readonly closeModalBtn: Locator;
  readonly getStartedBtn: Locator;
  readonly addressMenuBtn: Locator;
  readonly walletAvatar: Locator;
  readonly disconnectBtn: Locator;
  readonly achievementsTab: Locator;
  readonly startSwappingBtn: Locator;
  readonly explorerLink: Locator;
  readonly profile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('#jumper-logo');
    this.modalTitle = page.locator('#modal-modal-title');
    this.closeModalBtn = page.getByRole('button', { name: 'close modal' });
    this.getStartedBtn = page.getByRole('button', { name: 'Open welcome screen' });
    this.addressMenuBtn = page.locator('#address-menu-button');
    this.walletAvatar = page.getByRole('button', { name: 'wallet-avatar chain-avatar' });
    this.disconnectBtn = page.locator('#disconnect-wallet-button');
    this.achievementsTab = page.getByRole('tab', { name: 'Achievements' });
    this.startSwappingBtn = page.getByRole('link', { name: 'Start swapping' });
    this.explorerLink = page.getByRole('button').nth(3);  // nth(3) is usually the "View on Explorer" button in this UI
    this.profile = page.getByRole('button', { name: 'Pass' });
  }

  async navigate() {
    await this.page.goto('/');
  }

  /**
   * Dynamically generates the exchange URL based on constants
   */
  async goToExchange(fromChain: number, fromToken: string, toChain: number, toToken: string, amount: number = 1) {
    this.navigateToExchange();
    const url = `/?fromAmount=${amount}&fromChain=${fromChain}&fromToken=${fromToken}&toChain=${toChain}&toToken=${toToken}`;
    await this.page.goto(url);
  }

  async openInfoModal(type: 'Chains' | 'Bridges' | 'DEXs') {
    await this.page.getByText(new RegExp(`\\d+${type}`)).click();
    await expect(this.modalTitle).toContainText(type);
  }

  async closeModal() {
    await this.closeModalBtn.click();
  }

  async navigateToExchange() {
    // Close Welcome Screen and Go to the Exchange page 
    await this.getStartedBtn.click();
  }

  async openProfileAndAchievements() {
    // open profile menu 
    await this.profile.click();
    await this.addressMenuBtn.first().click();
    // close profile menu
    await this.addressMenuBtn.first().click();
    await this.achievementsTab.click();
    await this.startSwappingBtn.click();
  }

  async startSwapping() {
    await this.startSwappingBtn.click();
  }

  async disconnectWallet() {
    await this.disconnectBtn.click();
  }

  async checkExplorer() {
    await this.walletAvatar.click();
    const popupPromise = this.page.waitForEvent('popup');
    await this.explorerLink.click();
    const exploreTab = await popupPromise;
    await exploreTab.close();
  }
}