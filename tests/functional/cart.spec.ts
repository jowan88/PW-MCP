import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CartPage } from '../pages/CartPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutInfoPage, CheckoutOverviewPage } from '../pages/CheckoutPages';

test.describe('Sauce Demo Cart', () => {
  let loginPage: LoginPage;
  let cartPage: CartPage;
  let inventoryPage: InventoryPage;
  let checkoutInfoPage: CheckoutInfoPage;
  let checkoutOverviewPage: CheckoutOverviewPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    cartPage = new CartPage(page);
    inventoryPage = new InventoryPage(page);
    checkoutInfoPage = new CheckoutInfoPage(page);
    checkoutOverviewPage = new CheckoutOverviewPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('should display empty cart state correctly', async () => {
    await cartPage.goto();
    expect(await cartPage.isEmpty()).toBe(true);
    await cartPage.continueShopping();
    await expect(cartPage.page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should display cart items with correct information', async () => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await inventoryPage.addToCart('sauce-labs-bike-light');
    await cartPage.goto();

    const cartItems = await cartPage.getCartItems();
    expect(cartItems).toHaveLength(2);
    expect(cartItems[0].name).toBe('Sauce Labs Backpack');

    // Navigate to product page via item name
    await cartPage.page.click('.inventory_item_name:has-text("Sauce Labs Backpack")');
    await expect(cartPage.page).toHaveURL(/\/inventory-item.html/);
  });

  test('should update cart badge count correctly', async () => {
    expect(await cartPage.getCartCount()).toBe(0);

    await inventoryPage.addToCart('sauce-labs-backpack');
    expect(await cartPage.getCartCount()).toBe(1);

    await inventoryPage.addToCart('sauce-labs-bike-light');
    expect(await cartPage.getCartCount()).toBe(2);

    await cartPage.goto();
    await cartPage.removeItem('sauce-labs-backpack');
    expect(await cartPage.getCartCount()).toBe(1);
  });

  test('should preserve cart state during navigation', async () => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await inventoryPage.addToCart('sauce-labs-bike-light');

    await cartPage.goto();
    expect(await cartPage.getCartItems()).toHaveLength(2);

    await cartPage.continueShopping();
    await cartPage.goto();
    expect(await cartPage.getCartItems()).toHaveLength(2);
  });

  test('should handle empty cart checkout appropriately', async () => {
    await cartPage.goto();
    expect(await cartPage.isEmpty()).toBe(true);

    await cartPage.proceedToCheckout();
    await expect(checkoutInfoPage.page).toHaveURL(/\/checkout-step-one.html/);

    await checkoutInfoPage.continue();
    expect(await checkoutInfoPage.getErrorMessage()).toMatch(/first name is required/i);
  });

  test('should handle removal of all items during checkout process', async () => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    expect(await cartPage.getCartCount()).toBe(1);

    await cartPage.goto();
    expect(await cartPage.getCartItems()).toHaveLength(1);

    await cartPage.proceedToCheckout();

    await checkoutInfoPage.fillForm({
      firstName: 'John',
      lastName: 'Doe',
      postalCode: '12345',
    });

    await cartPage.goto();
    await cartPage.removeItem('sauce-labs-backpack');
    expect(await cartPage.getCartCount()).toBe(0);
    expect(await cartPage.isEmpty()).toBe(true);
  });

  test('should validate checkout fields appropriately', async () => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Test required field validation
    await checkoutInfoPage.continue();
    expect(await checkoutInfoPage.getErrorMessage()).toMatch(/first name is required/i);

    // Test with special characters
    await checkoutInfoPage.fillForm({
      firstName: 'Test!@#',
      lastName: 'User$%^',
      postalCode: '12345!',
    });
    await checkoutInfoPage.continue();

    // Application accepts special characters
    await expect(checkoutInfoPage.page).toHaveURL(/\/checkout-step-two.html/);
  });

  test('should handle checkout button interaction', async ({ page }) => {
    // Add item and wait for cart update
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    // Go to cart and wait for page load
    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL(/\/cart.html/);

    // Verify checkout button is ready
    const checkoutBtn = page.locator('[data-test="checkout"]');
    await expect(checkoutBtn).toBeVisible();
    await expect(checkoutBtn).toBeEnabled();

    // Click checkout and verify navigation
    await checkoutBtn.click();
    await expect(page).toHaveURL(/\/checkout-step-one.html/);

    // Verify we're on the checkout form
    await expect(page.locator('[data-test="firstName"]')).toBeVisible();
    await expect(page.locator('[data-test="lastName"]')).toBeVisible();
    await expect(page.locator('[data-test="postalCode"]')).toBeVisible();
  });

  test.describe('checkout process', () => {
    test.beforeEach(async () => {
      await inventoryPage.addToCart('sauce-labs-backpack');
      await cartPage.goto();
    });

    test('should proceed through checkout steps', async () => {
      await cartPage.proceedToCheckout();

      await checkoutInfoPage.fillAndContinue({
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '12345',
      });

      expect(await checkoutOverviewPage.verifyTotalCalculation()).toBe(true);

      await checkoutOverviewPage.finishCheckout();
      await expect(cartPage.page.locator('.complete-header')).toBeVisible();
      await expect(cartPage.page.locator('[data-test="back-to-products"]')).toBeVisible();
    });

    test('should validate customer information', async () => {
      await cartPage.proceedToCheckout();

      // Try to continue without data
      await checkoutInfoPage.continue();
      expect(await checkoutInfoPage.getErrorMessage()).toBeTruthy();

      // Fill only first name
      await checkoutInfoPage.fillForm({
        firstName: 'John',
        lastName: '',
        postalCode: '',
      });
      await checkoutInfoPage.continue();
      expect(await checkoutInfoPage.getErrorMessage()).toBeTruthy();

      // Fill only last name
      await checkoutInfoPage.clearForm();
      await checkoutInfoPage.fillForm({
        firstName: '',
        lastName: 'Doe',
        postalCode: '',
      });
      await checkoutInfoPage.continue();
      expect(await checkoutInfoPage.getErrorMessage()).toBeTruthy();
    });

    test('should calculate total correctly', async () => {
      await cartPage.proceedToCheckout();

      await checkoutInfoPage.fillAndContinue({
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '12345',
      });

      const subtotal = await checkoutOverviewPage.getSubtotal();
      const tax = await checkoutOverviewPage.getTax();
      const total = await checkoutOverviewPage.getTotal();

      expect(total).toBeCloseTo(subtotal + tax, 2);
    });

    test('should handle cancel actions', async () => {
      // Cancel from cart
      await cartPage.proceedToCheckout();
      await checkoutInfoPage.cancel();
      await expect(cartPage.page).toHaveURL(/\/cart.html/);

      // Cancel from customer info
      await cartPage.proceedToCheckout();
      await checkoutInfoPage.fillForm({
        firstName: 'John',
        lastName: '',
        postalCode: '',
      });
      await checkoutInfoPage.cancel();
      await expect(cartPage.page).toHaveURL(/\/cart.html/);

      // Cancel from overview
      await cartPage.proceedToCheckout();
      await checkoutInfoPage.fillAndContinue({
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '12345',
      });
      await checkoutOverviewPage.cancel();
      await expect(cartPage.page).toHaveURL(/.*inventory.html/);
    });
  });
});
