import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage, CheckoutOverviewPage } from '../pages/CheckoutPages';

let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let cartPage: CartPage;
let checkoutInfoPage: CheckoutInfoPage;
let checkoutOverviewPage: CheckoutOverviewPage;

test.describe('Sauce Demo Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutInfoPage = new CheckoutInfoPage(page);
    checkoutOverviewPage = new CheckoutOverviewPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test.describe('cart quantity handling', () => {
    test('should handle rapid add/remove operations with multiple items', async () => {
      const items = ['sauce-labs-backpack', 'sauce-labs-bike-light', 'sauce-labs-bolt-t-shirt'];

      // Perform rapid add/remove operations
      for (const item of items) {
        await inventoryPage.rapidAddRemove(item, 5);
      }

      // Add all items one final time
      for (const item of items) {
        await inventoryPage.addToCart(item);
      }

      // Verify final state
      expect(await inventoryPage.getCartCount()).toBe(3);
    });
  });

  test.describe('concurrent operations', () => {
    test('should handle checkout in multiple tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // Initialize page objects for first tab
      const login1 = new LoginPage(page1);
      const inventory1 = new InventoryPage(page1);
      const cart1 = new CartPage(page1);
      const checkout1 = new CheckoutInfoPage(page1);

      // Setup in first tab
      await login1.goto();
      await login1.login('standard_user', 'secret_sauce');
      await inventory1.addToCart('sauce-labs-backpack');

      // Start checkout in both tabs
      await cart1.goto();
      await cart1.proceedToCheckout();

      // Try concurrent access in second tab
      await page2.goto('https://www.saucedemo.com/checkout-step-one.html');

      // Fill details in first tab
      await checkout1.fillAndContinue({
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '12345',
      });

      // Try to modify cart in second tab
      const cart2 = new CartPage(page2);
      await cart2.goto();
      await expect(cart2.page.locator('.cart_item')).toBeVisible();

      await context.close();
    });
  });

  test.describe('boundary conditions', () => {
    test('should handle special characters in input fields', async ({ page }) => {
      // Array of special characters to test
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';

      // Add item and proceed to checkout
      await inventoryPage.addToCart('sauce-labs-backpack');
      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Fill form with special characters and continue
      await checkoutInfoPage.fillAndContinue({
        firstName: 'John' + specialChars,
        lastName: 'Doe' + specialChars,
        postalCode: '123' + specialChars,
      });

      // Verify form handles special characters appropriately
      await expect(page).toHaveURL(/\/checkout-step-two.html/);
    });
  });

  test.describe('state management', () => {
    test('should handle rapid page navigation', async ({ page }) => {
      // Add item to cart
      await inventoryPage.addToCart('sauce-labs-backpack');

      // Perform rapid navigation
      for (let i = 0; i < 5; i++) {
        await cartPage.goto();
        await page.goBack();
      }

      // Verify cart state remains consistent
      expect(await inventoryPage.getCartCount()).toBe(1);
    });

    test('should handle multiple browser history operations', async ({ page }) => {
      // Create a history stack
      await inventoryPage.addToCart('sauce-labs-backpack');
      await cartPage.goto();
      await cartPage.proceedToCheckout();
      await page.goBack();
      await page.goBack();
      await page.goForward();
      await page.goForward();

      // Verify we end up at the correct page
      await expect(page).toHaveURL(/\/checkout-step-one.html/);
    });
  });

  test.describe('UI stress testing', () => {
    test('should handle rapid sort operations', async () => {
      const sortOptions = ['az', 'za', 'lohi', 'hilo'] as const;

      // Rapidly change sort options
      for (let i = 0; i < 3; i++) {
        for (const option of sortOptions) {
          await inventoryPage.sortProducts(option);
          const products = await inventoryPage.getProducts();
          expect(products.length).toBe(6);
        }
      }
    });
  });
});
