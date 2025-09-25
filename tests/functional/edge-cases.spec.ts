import { test, expect, type Page, Browser } from '@playwright/test';

test.describe('Sauce Demo Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page
        await page.goto('https://www.saucedemo.com/');
        
        // Login with standard user
        await page.locator('[data-test="username"]').fill('standard_user');
        await page.locator('[data-test="password"]').fill('secret_sauce');
        await page.locator('[data-test="login-button"]').click();
        
        // Verify we are on inventory page
        await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test.describe('cart quantity handling', () => {
        test('should handle rapid add/remove operations with multiple items', async ({ page }) => {
            // Rapidly toggle add/remove for multiple items
            const items = [
                'sauce-labs-backpack',
                'sauce-labs-bike-light',
                'sauce-labs-bolt-t-shirt'
            ];
            
            // Perform rapid add/remove operations
            for (const item of items) {
                for (let i = 0; i < 5; i++) {
                    await page.click(`[data-test="add-to-cart-${item}"]`);
                    await page.click(`[data-test="remove-${item}"]`);
                }
            }
            
            // Add all items one final time
            for (const item of items) {
                await page.click(`[data-test="add-to-cart-${item}"]`);
            }
            
            // Verify final state
            await expect(page.locator('.shopping_cart_badge')).toHaveText('3');
        });
    });

    test.describe('concurrent operations', () => {
        test('should handle checkout in multiple tabs', async ({ browser }) => {
            const context = await browser.newContext();
            const page1 = await context.newPage();
            const page2 = await context.newPage();
            
            // Setup in first tab
            await page1.goto('https://www.saucedemo.com/');
            await page1.locator('[data-test="username"]').fill('standard_user');
            await page1.locator('[data-test="password"]').fill('secret_sauce');
            await page1.locator('[data-test="login-button"]').click();
            await page1.click('[data-test="add-to-cart-sauce-labs-backpack"]');
            
            // Start checkout in both tabs
            await page1.click('.shopping_cart_link');
            await page1.click('[data-test="checkout"]');
            
            await page2.goto('https://www.saucedemo.com/checkout-step-one.html');
            
            // Fill details in first tab
            await page1.locator('[data-test="firstName"]').fill('John');
            await page1.locator('[data-test="lastName"]').fill('Doe');
            await page1.locator('[data-test="postalCode"]').fill('12345');
            await page1.click('[data-test="continue"]');
            
            // Try to modify cart in second tab
            await page2.goto('https://www.saucedemo.com/cart.html');
            await expect(page2.locator('.cart_item')).toBeVisible();
            
            await context.close();
        });
    });

    test.describe('boundary conditions', () => {
        test('should handle special characters in input fields', async ({ page }) => {
            // Array of special characters to test
            const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
            
            // Add item and go to checkout
            await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
            await page.click('.shopping_cart_link');
            await page.click('[data-test="checkout"]');
            
            // Fill form with special characters
            await page.locator('[data-test="firstName"]').fill('John' + specialChars);
            await page.locator('[data-test="lastName"]').fill('Doe' + specialChars);
            await page.locator('[data-test="postalCode"]').fill('123' + specialChars);
            
            // Try to continue
            await page.click('[data-test="continue"]');
            
            // Verify form handles special characters appropriately
            await expect(page).toHaveURL(/\/checkout-step-two.html/);
        });
    });

    test.describe('state management', () => {
        test('should handle rapid page navigation', async ({ page }) => {
            // Add item to cart
            await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
            
            // Perform rapid navigation
            for (let i = 0; i < 5; i++) {
                await page.click('.shopping_cart_link');
                await page.goBack();
            }
            
            // Verify cart state remains consistent
            await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
        });

        test('should handle multiple browser history operations', async ({ page }) => {
            // Create a history stack
            await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
            await page.click('.shopping_cart_link');
            await page.click('[data-test="checkout"]');
            await page.goBack();
            await page.goBack();
            await page.goForward();
            await page.goForward();
            
            // Verify we end up at the correct page
            await expect(page).toHaveURL(/\/checkout-step-one.html/);
        });
    });

    test.describe('UI stress testing', () => {
        test('should handle rapid sort operations', async ({ page }) => {
            const sortOptions = ['az', 'za', 'lohi', 'hilo'];
            
            // Rapidly change sort options
            for (let i = 0; i < 3; i++) {
                for (const option of sortOptions) {
                    await page.locator('.product_sort_container').selectOption(option);
                    // Verify products are still visible
                    await expect(page.locator('.inventory_item')).toHaveCount(6);
                }
            }
        });
    });
});