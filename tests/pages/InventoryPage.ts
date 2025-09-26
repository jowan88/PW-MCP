import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
}

export class InventoryPage extends BasePage {
  private readonly inventoryList: Locator;
  private readonly sortDropdown: Locator;
  private readonly productImages: Locator;
  private readonly socialLinks: Locator;
  private readonly footer: Locator;

  private readonly burgerMenuLocator: Locator;
  private readonly menuLocator: Locator;
  private readonly closeMenuButton: Locator;
  private readonly allItemsLink: Locator;
  private readonly aboutLink: Locator;
  private readonly logoutLink: Locator;
  private readonly resetLink: Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryList = page.locator('.inventory_list');
    this.sortDropdown = page.locator('.product_sort_container');
    this.productImages = page.locator('.inventory_item img');
    this.socialLinks = page.locator('.social');
    this.footer = page.locator('footer');

    // Menu-related locators
    this.burgerMenuLocator = page.locator('#react-burger-menu-btn');
    this.menuLocator = page.locator('.bm-menu');
    this.closeMenuButton = page.locator('#react-burger-cross-btn');
    this.allItemsLink = page.locator('#inventory_sidebar_link');
    this.aboutLink = page.locator('#about_sidebar_link');
    this.logoutLink = page.locator('#logout_sidebar_link');
    this.resetLink = page.locator('#reset_sidebar_link');
  }

  /**
   * Navigate to the inventory page
   */
  async goto(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com/inventory.html');
    try {
      // Try to find inventory list with a short timeout
      await expect(this.inventoryList).toBeVisible({ timeout: 2000 });
    } catch {
      // If inventory list is not visible, we're probably redirected to login
      await expect(this.page).toHaveURL('https://www.saucedemo.com/');
    }
  }

  /**
   * Add a product to cart
   */
  async addToCart(productId: string): Promise<void> {
    const addButton = this.page.locator(`[data-test="add-to-cart-${productId}"]`);
    await addButton.click();
    await expect(this.page.locator(`[data-test="remove-${productId}"]`)).toBeVisible();
  }

  /**
   * Remove a product from cart
   */
  async removeFromCart(productId: string): Promise<void> {
    const removeButton = this.page.locator(`[data-test="remove-${productId}"]`);
    await removeButton.click();
    await expect(this.page.locator(`[data-test="add-to-cart-${productId}"]`)).toBeVisible();
  }

  /**
   * Get all products currently displayed
   */
  async getProducts(): Promise<Product[]> {
    const products = await this.page.$$('.inventory_item');
    return Promise.all(
      products.map(async product => {
        const name = await product.$eval('.inventory_item_name', el => el.textContent || '');
        const description = await product.$eval('.inventory_item_desc', el => el.textContent || '');
        const price = await product.$eval('.inventory_item_price', el => el.textContent || '');

        // Try to find either the add or remove button to get the product ID
        let id = '';
        try {
          id = await product.$eval(
            '[id^="add-to-cart-"]',
            el => el.getAttribute('id')?.replace('add-to-cart-', '') || ''
          );
        } catch {
          // If add button not found, try remove button
          id = await product.$eval(
            '[id^="remove-"]',
            el => el.getAttribute('id')?.replace('remove-', '') || ''
          );
        }

        return { id, name, description, price };
      })
    );
  }

  /**
   * Sort products by the given option
   */
  async sortProducts(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
    await this.page.waitForTimeout(500); // Wait for sort to complete
  }

  /**
   * Verify product image dimensions and quality
   */
  async verifyProductImages(): Promise<void> {
    const images = await this.productImages.all();
    for (const image of images) {
      const box = await image.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);

      // Verify image source
      const src = await image.getAttribute('src');
      expect(src).toBeTruthy();
    }
  }

  /**
   * Verify social media links
   */
  async verifySocialLinks(): Promise<void> {
    const links = await this.socialLinks.locator('a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//); // Should be absolute URLs
    }
  }

  /**
   * Verify footer content
   */
  async verifyFooter(): Promise<void> {
    await expect(this.footer).toBeVisible();
    const text = await this.footer.textContent();
    expect(text).toContain('©');
  }

  /**
   * Get the current sort order
   */
  async getCurrentSortOrder(): Promise<string> {
    return await this.sortDropdown.inputValue();
  }

  /**
   * Check if a product can be added to cart
   */
  async canAddToCart(productId: string): Promise<boolean> {
    const addButton = this.page.locator(`[data-test="add-to-cart-${productId}"]`);
    return await addButton.isVisible();
  }

  /**
   * Handle rapid add/remove operations
   */
  async rapidAddRemove(productId: string, iterations: number): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      await this.addToCart(productId);
      await this.removeFromCart(productId);
    }
  }

  /**
   * Toggle burger menu
   */
  async toggleMenu(action: 'open' | 'close'): Promise<void> {
    if (action === 'open') {
      await this.burgerMenuLocator.click();
      await this.menuLocator.waitFor({ state: 'visible' });
    } else {
      await this.closeMenuButton.click();
      await this.menuLocator.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Check if menu is visible
   */
  async isMenuVisible(): Promise<boolean> {
    try {
      await this.menuLocator.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click menu item by ID
   */
  async clickMenuItem(itemId: string): Promise<void> {
    const menuItem = this.page.locator(itemId);
    await menuItem.waitFor({ state: 'visible' });
    await menuItem.click();
  }

  /**
   * Get menu item text
   */
  async getMenuItemText(itemId: string): Promise<string> {
    const menuItem = this.page.locator(itemId);
    return (await menuItem.textContent()) || '';
  }

  /**
   * Handle multiple menu actions
   */
  async performMenuAction(action: 'all-items' | 'about' | 'logout' | 'reset'): Promise<void> {
    // Make sure menu is fully open
    await this.toggleMenu('open');
    await this.page.waitForTimeout(500); // Small delay to ensure animation completes

    // Ensure menu is visible and ready
    await this.menuLocator.waitFor({ state: 'visible' });

    // Get the appropriate link
    let link: Locator;
    switch (action) {
      case 'all-items':
        link = this.allItemsLink;
        break;
      case 'about':
        link = this.aboutLink;
        break;
      case 'logout':
        link = this.logoutLink;
        break;
      case 'reset':
        link = this.resetLink;
        break;
    }

    // Wait for link to be ready and handle scrolling
    await link.waitFor({ state: 'visible' });
    await link.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(100); // Small delay after scrolling

    // Force click if normal click fails
    try {
      await link.click({ timeout: 5000 });
    } catch {
      // If normal click fails, try force click
      await link.evaluate(node => (node as HTMLElement).click());
    }

    // For non-about links, wait for URL change
    if (action !== 'about') {
      // About opens in new tab
      await this.page.waitForURL(/.*/, { waitUntil: 'commit' });
    }
  }
}
