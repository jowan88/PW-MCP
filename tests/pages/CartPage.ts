import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Product } from './InventoryPage';

export class CartPage extends BasePage {
  private readonly cartList: Locator;
  private readonly checkoutButton: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartList = page.locator('.cart_list');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  /**
   * Navigate to the cart page
   */
  async goto(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com/cart.html');
    await expect(this.cartList).toBeVisible();
  }

  /**
   * Get all items currently in the cart
   */
  async getCartItems(): Promise<Product[]> {
    const items = await this.cartList.locator('.cart_item').all();
    return Promise.all(
      items.map(async item => {
        const name = (await item.locator('.inventory_item_name').textContent()) || '';
        const description = (await item.locator('.inventory_item_desc').textContent()) || '';
        const price = (await item.locator('.inventory_item_price').textContent()) || '';
        const removeButton = item.locator('[id^="remove-"]');
        const removeId = (await removeButton.getAttribute('id')) || '';
        const id = removeId.replace('remove-', '');

        return { id, name, description, price };
      })
    );
  }

  /**
   * Remove an item from the cart
   */
  async removeItem(productId: string): Promise<void> {
    const removeButton = this.page.locator(`[data-test="remove-${productId}"]`);
    await removeButton.click();

    // Verify item is removed
    const item = this.page.locator(`.cart_item:has-text("${productId}")`);
    await expect(item).not.toBeVisible();
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/.*checkout-step-one.html/);
  }

  /**
   * Continue shopping (return to inventory)
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(/.*inventory.html/);
  }

  /**
   * Calculate cart total
   */
  async getCartTotal(): Promise<number> {
    const items = await this.getCartItems();
    return items.reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', ''));
      return total + price;
    }, 0);
  }

  /**
   * Get quantity of a specific item
   */
  async getItemQuantity(productId: string): Promise<number> {
    const quantityElement = this.page.locator(`.cart_item:has-text("${productId}") .cart_quantity`);
    const quantity = await quantityElement.textContent();
    return parseInt(quantity || '0', 10);
  }

  /**
   * Verify cart badge count matches actual items
   */
  async verifyCartCount(): Promise<void> {
    const items = await this.getCartItems();
    const badgeCount = await this.getCartCount();
    expect(items.length).toBe(badgeCount);
  }

  /**
   * Check if the cart is empty
   */
  async isEmpty(): Promise<boolean> {
    return (await this.getCartItems()).length === 0;
  }

  /**
   * Verify cart state persists after page refresh
   */
  async verifyCartPersistence(): Promise<void> {
    const itemsBefore = await this.getCartItems();
    await this.page.reload();
    const itemsAfter = await this.getCartItems();
    expect(itemsAfter).toEqual(itemsBefore);
  }
}
