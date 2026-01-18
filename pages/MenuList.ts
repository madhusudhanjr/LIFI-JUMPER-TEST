import { expect, Locator, Page } from '@playwright/test';

export class MenuList {
  readonly page: Page;
  readonly mainMenuButton: Locator;
  readonly learnLink: Locator;
  readonly scanLink: Locator;
  readonly supportMenuItem: Locator;
  readonly themeMenuItem: Locator;
  readonly settingsButton: Locator;
  readonly intercomFrame: string;
  readonly discordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainMenuButton = page.getByRole('button', { name: 'Main Menu' });
    this.learnLink = page.getByRole('link', { name: 'Learn' });
    this.scanLink = page.getByRole('link', { name: 'Scan' });
    this.supportMenuItem = page.getByRole('menuitem', { name: 'Support' });
    this.themeMenuItem = page.getByRole('menuitem', { name: 'Theme' });
    this.settingsButton = page.getByRole('button', { name: 'settings' });
    this.intercomFrame = 'iframe[name="intercom-messenger-frame"]';
    this.discordLink = page.getByRole('button', { name: 'Open discord link' });
  }

  async navigateToLearn() {
    await this.mainMenuButton.click();
    await this.learnLink.click();
  }

  async verifyLearnPage() {
    await expect(this.page.locator('#jumper-logo')).toContainText('.jumper-learn-logo');
    await expect(this.page.locator('body')).toContainText('Join our Discord to learn more');
  }

  async verifyDiscordLink() {
    await expect(this.page.locator('body')).toContainText('Join our Discord to learn more');
    this.discordLink.click();
    await expect(this.page.locator('form')).toContainText('You\'ve been invited to join');
  }

  async navigateToScan() {
    await this.page.goto('/scan');
  }

  async verifyScanTableHeadings() {
    const headings = ['Latest transfers', 'From token', 'To token', 'Via'];
    for (const text of headings) {
      await expect(this.page.getByRole('heading', { name: text })).toBeVisible();
    }
  }

  async toggleTheme(mode?: 'Light' | 'Dark') {
    await this.mainMenuButton.click();
    await this.themeMenuItem.click();
    if (mode === 'Light') {
      await this.page.getByText('Light').click();
    }
    await this.settingsButton.last().click();
  }

  async closeSupportChat() {
    const frame = this.page.frameLocator(this.intercomFrame);
    await expect(frame.locator('h2')).toContainText('Contact support');
    await frame.getByTestId('close-button').click();
  }

  async selectLanguage(language: string) {
    await this.page.getByRole('menuitem', { name: 'Language en' }).click();
    await this.page.getByRole('menuitem', { name: language }).click();
    await this.settingsButton.last().click();
  }

  async navigateToResources() {
    await this.page.getByRole('menuitem', { name: 'Resources' }).click();
    await this.settingsButton.last().click();
  }

  async navigateToSupportChat() {
    await this.page.goto('/');
    await this.mainMenuButton.click();
    await this.supportMenuItem.click();
    await this.closeSupportChat();
  }
} 