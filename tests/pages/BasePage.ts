import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  private burgerMenu: Locator;
  private resetButton: Locator;
  private logoutButton: Locator;
  protected cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.burgerMenu = page.locator('#react-burger-menu-btn');
    this.resetButton = page.locator('#reset_sidebar_link');
    this.logoutButton = page.locator('#logout_sidebar_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  /**
   * Open the burger menu with retry logic
   */
  protected async openMenu(maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.burgerMenu.waitFor({ state: 'visible', timeout: 5000 });

        const menu = this.page.locator('.bm-menu');
        const isMenuVisible = await menu.isVisible().catch(() => false);

        if (!isMenuVisible) {
          await this.burgerMenu.click();
          await menu.waitFor({ state: 'visible', timeout: 2000 });
        }

        // Wait for animation
        await this.page.waitForTimeout(500);
        return;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Close the burger menu if it's open
   */
  protected async closeMenu(): Promise<void> {
    const closeButton = this.page.locator('#react-burger-cross-btn');
    const isVisible = await closeButton.isVisible().catch(() => false);

    if (isVisible) {
      await closeButton.click();
      await this.page.locator('.bm-menu').waitFor({ state: 'hidden' });
    }
  }

  /**
   * Reset the application state
   */
  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetButton.click();
    await this.page.waitForTimeout(500);
    await this.page.reload();
  }

  /**
   * Perform logout
   */
  async logout(): Promise<void> {
    try {
      await this.openMenu();
      await this.logoutButton.waitFor({ state: 'visible' });
      await this.logoutButton.click({ force: true });
      await expect(this.page).toHaveURL('https://www.saucedemo.com/');
    } catch (error) {
      console.error('Error during logout:', error);
      await this.page.goto('https://www.saucedemo.com/');
    }
  }

  /**
   * Get the current cart item count
   */
  async getCartCount(): Promise<number> {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) return 0;
    return parseInt((await this.cartBadge.textContent()) || '0', 10);
  }

  /**
   * Wait for a condition with a custom timeout
   */
  protected async waitFor(condition: () => Promise<boolean>, timeout = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) return true;
      await this.page.waitForTimeout(100);
    }
    return false;
  }

  /**
   * Safely get text content of an element
   */
  protected async getTextContent(locator: Locator): Promise<string> {
    try {
      const content = await locator.textContent();
      return content?.trim() || '';
    } catch {
      return '';
    }
  }

  /**
   * Verify if an element exists
   */
  protected async exists(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }
}
