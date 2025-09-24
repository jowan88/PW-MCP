import { test, expect } from '@playwright/test';

test.describe('Sauce Demo Login', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page before each test
        await page.goto('https://www.saucedemo.com/');
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
});