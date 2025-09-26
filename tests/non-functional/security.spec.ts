import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutPages';

let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let cartPage: CartPage;
let checkoutInfoPage: CheckoutInfoPage;

test.describe('Sauce Demo Security', () => {
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutInfoPage = new CheckoutInfoPage(page);
    await loginPage.goto();
  });

  test('should handle XSS attempts in login fields', async () => {
    // Attempt script injection in username
    const xssPayload = '<script>alert("xss")</script>';
    await loginPage.submitLogin(xssPayload, 'secret_sauce');

    // Verify error message is sanitized
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).not.toContain('<script>');
    expect(errorMessage).not.toContain('</script>');
  });

  test('should protect against unauthorized page access', async ({ page }) => {
    // Attempt to access inventory page without auth
    await inventoryPage.goto();
    // Should be redirected to login
    await expect(page).toHaveURL('https://www.saucedemo.com/');

    // Attempt to access checkout without auth
    await checkoutInfoPage.page.goto('https://www.saucedemo.com/checkout-step-one.html');
    // Should be redirected to login
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });

  test('should handle malformed URLs', async ({ page }) => {
    // Login first
    await loginPage.login('standard_user', 'secret_sauce');

    // Try invalid product ID
    await page.goto('https://www.saucedemo.com/inventory-item.html?id=999999');

    // Should handle gracefully (either show error or redirect)
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('body')).not.toContainText('Exception');
  });

  test('should protect against SQL injection attempts', async ({ page }) => {
    // Try common SQL injection patterns
    const sqlPayloads = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE users--",
      "' UNION SELECT username, password FROM users--",
    ];

    for (const payload of sqlPayloads) {
      await loginPage.submitLogin(payload, payload);

      // Verify we're still on login page
      await expect(page).toHaveURL('https://www.saucedemo.com/');

      // Verify error message is sanitized
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).not.toContain('SQL');
      expect(errorMessage).not.toContain('database');
    }
  });

  test('should validate checkout form inputs', async ({ page }) => {
    // Login and prepare cart
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.addToCart('sauce-labs-backpack');
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Test script injection in checkout form
    const xssPayload = '<script>alert("xss")</script>';
    await checkoutInfoPage.fillAndContinue({
      firstName: xssPayload,
      lastName: xssPayload,
      postalCode: xssPayload,
    });

    // Verify we proceed to next step (input was sanitized)
    await expect(page).toHaveURL(/\/checkout-step-two.html/);

    // Verify displayed values are sanitized
    const summary = await page.locator('.summary_info').textContent();
    expect(summary).not.toContain('<script>');
  });

  test('should prevent rapid-fire login attempts', async () => {
    // Attempt multiple rapid login attempts
    for (let i = 0; i < 5; i++) {
      await loginPage.submitLogin(`user${i}`, 'password');
    }

    // Verify error message is shown
    expect(await loginPage.getErrorMessage()).toBeTruthy();
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    // Login first
    await loginPage.login('standard_user', 'secret_sauce');

    // Clear cookies to simulate session expiry
    await page.context().clearCookies();

    // Try to access protected page
    await inventoryPage.goto();

    // Should be redirected to login
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});
