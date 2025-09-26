import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Sauce Demo Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should show error for empty fields', async () => {
    await loginPage.submitLogin('', '');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBe('Epic sadface: Username is required');
  });

  test('should show error for empty password', async () => {
    await loginPage.submitLogin('standard_user', '');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBe('Epic sadface: Password is required');
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.submitLogin('invalid_user', 'invalid_password');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBe(
      'Epic sadface: Username and password do not match any user in this service'
    );
  });

  test('should show error for locked out user', async () => {
    await loginPage.login('locked_out_user', 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBe('Epic sadface: Sorry, this user has been locked out.');
  });

  test('should verify all login page elements and text content', async () => {
    await loginPage.verifyPageElements();
  });

  test('should handle session persistence', async ({ page }) => {
    await loginPage.login('standard_user', 'secret_sauce');

    // Refresh the page
    await page.reload();

    // Verify still on inventory page
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should support keyboard navigation and submission', async () => {
    await loginPage.navigateWithKeyboard();
    await loginPage.page.keyboard.press('Enter');
    await expect(loginPage.page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should handle performance_glitch_user login', async () => {
    await loginPage.login('performance_glitch_user', 'secret_sauce');
    await expect(loginPage.page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should work with visual_user login', async () => {
    await loginPage.login('visual_user', 'secret_sauce');
    await expect(loginPage.page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should validate input field constraints', async () => {
    // Test with very long username
    const longString = 'a'.repeat(256);
    await loginPage.submitLogin(longString, 'secret_sauce');
    expect(await loginPage.getErrorMessage()).toBeTruthy();

    // Test with special characters
    await loginPage.submitLogin('user@#$%^&*()', 'secret_sauce');
    expect(await loginPage.getErrorMessage()).toBeTruthy();
  });

  test('should handle browser navigation properly', async ({ page }) => {
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    await page.goBack();
    await expect(page).toHaveURL('https://www.saucedemo.com/');

    await page.goForward();
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should handle problem_user login quirks', async ({ page }) => {
    await loginPage.login('problem_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should handle error_user specific behavior', async ({ page }) => {
    await loginPage.login('error_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should handle visual_user specific behavior', async () => {
    await loginPage.login('visual_user', 'secret_sauce');
    await expect(loginPage.page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(loginPage.page.locator('.inventory_list')).toBeVisible();
  });

  test('should handle error messages properly', async () => {
    // Click login without credentials
    await loginPage.submitLogin('', '');
    expect(await loginPage.getErrorMessage()).toBeTruthy();
  });
});
