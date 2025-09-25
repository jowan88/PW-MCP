import { test, expect } from '@playwright/test';

test.describe('Sauce Demo Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('https://www.saucedemo.com/');
  });

  test('should show error for empty fields', async ({ page }) => {
    // Click login without entering credentials
    await page.locator('[data-test="login-button"]').click();

    // Verify error message
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toHaveText(
      'Epic sadface: Username is required'
    );
  });

  test('should show error for empty password', async ({ page }) => {
    // Enter only username
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="login-button"]').click();

    // Verify error message
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toHaveText(
      'Epic sadface: Password is required'
    );
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.locator('[data-test="username"]').fill('invalid_user');
    await page.locator('[data-test="password"]').fill('invalid_password');
    await page.locator('[data-test="login-button"]').click();

    // Verify error message
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toHaveText(
      'Epic sadface: Username and password do not match any user in this service'
    );
  });

  test('should show error for locked out user', async ({ page }) => {
    // Enter locked out user credentials
    await page.locator('[data-test="username"]').fill('locked_out_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify error message specific to locked out user
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.'
    );
  });

  test('should verify all login page elements and text content', async ({ page }) => {
    // Verify page title
    await expect(page.locator('.login_logo')).toHaveText('Swag Labs');

    // Verify input fields and their attributes
    await expect(page.locator('[data-test="username"]')).toBeVisible();
    await expect(page.locator('[data-test="username"]')).toHaveAttribute('placeholder', 'Username');

    await expect(page.locator('[data-test="password"]')).toBeVisible();
    await expect(page.locator('[data-test="password"]')).toHaveAttribute('placeholder', 'Password');

    // Verify login button
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
    await expect(page.locator('[data-test="login-button"]')).toHaveText('Login');

    // Verify credentials information section
    await expect(page.locator('h4')).toHaveText([
      'Accepted usernames are:',
      'Password for all users:',
    ]);
    await expect(page.locator('.login_credentials')).toContainText('standard_user');
    await expect(page.locator('.login_password')).toContainText('secret_sauce');
  });

  test('should login successfully with standard user', async ({ page }) => {
    // Enter username
    await page.locator('[data-test="username"]').fill('standard_user');

    // Enter password
    await page.locator('[data-test="password"]').fill('secret_sauce');

    // Click login button
    await page.locator('[data-test="login-button"]').click();

    // Verify that we've successfully logged in
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Verify that we can see the inventory page elements
    await expect(page.locator('.inventory_list')).toBeVisible();
    await expect(page.locator('.title')).toHaveText('Products');

    // Verify that the shopping cart is accessible
    await expect(page.locator('.shopping_cart_link')).toBeVisible();
  });

  test('should complete login and logout successfully', async ({ page }) => {
    // Login
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Open menu and click logout
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();

    // Verify return to login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test('should handle page refresh after login', async ({ page }) => {
    // Login
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Refresh the page
    await page.reload();

    // Verify still on inventory page
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should handle error messages properly', async ({ page }) => {
    // Click login without credentials
    await page.locator('[data-test="login-button"]').click();

    // Verify error icon is visible
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('.error-button')).toBeVisible();

    // Click error close button
    await page.locator('.error-button').click();

    // Verify error is dismissed
    await expect(page.locator('[data-test="error"]')).not.toBeVisible();
  });

  test('should support keyboard navigation and submission', async ({ page }) => {
    // Use Tab to navigate to username field
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="username"]')).toBeFocused();

    // Type username
    await page.keyboard.type('standard_user');

    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="password"]')).toBeFocused();

    // Type password
    await page.keyboard.type('secret_sauce');

    // Tab to login button
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="login-button"]')).toBeFocused();

    // Submit form with Enter key
    await page.keyboard.press('Enter');

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should handle performance_glitch_user login', async ({ page }) => {
    // Login with performance_glitch_user
    await page.locator('[data-test="username"]').fill('performance_glitch_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');

    // Start timing
    const startTime = Date.now();

    await page.locator('[data-test="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // End timing
    const endTime = Date.now();
    const loginTime = endTime - startTime;

    // Log the login time for performance monitoring
    console.log(`Performance glitch user login time: ${loginTime}ms`);

    // Verify inventory page loaded eventually
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should handle problem_user login quirks', async ({ page }) => {
    // Login with problem_user
    await page.locator('[data-test="username"]').fill('problem_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Verify inventory page loaded but might have visual issues
    await expect(page.locator('.inventory_list')).toBeVisible();

    // Problem user specific checks can be added here
    // Note: This user typically has image loading issues and other UI quirks
  });

  test('should handle error_user specific behavior', async ({ page }) => {
    // Login with error_user
    await page.locator('[data-test="username"]').fill('error_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify successful login despite being error_user
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Verify basic page elements are present
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should handle visual_user specific behavior', async ({ page }) => {
    // Login with visual_user
    await page.locator('[data-test="username"]').fill('visual_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Verify basic page elements are present
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should validate input field constraints', async ({ page }) => {
    // Test with very long username
    const longString = 'a'.repeat(256);
    await page.locator('[data-test="username"]').fill(longString);
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify error message for invalid input
    await expect(page.locator('[data-test="error"]')).toBeVisible();

    // Test with special characters
    await page.locator('[data-test="username"]').fill('user@#$%^&*()');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify error message for invalid input
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });

  test('should handle browser navigation properly', async ({ page }) => {
    // Login successfully first
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Navigate back
    await page.goBack();

    // Should return to login page since it's a SPA
    await expect(page).toHaveURL('https://www.saucedemo.com/');

    // Navigate forward
    await page.goForward();

    // Should return to inventory page
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    // Logout
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();

    // Verify on login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');

    // Try to navigate back to inventory
    await page.goBack();

    // Should stay on login page when session is ended
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});
