import { test, expect, type Page } from '@playwright/test';

test.describe('Sauce Demo Security', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page
        await page.goto('https://www.saucedemo.com/');
    });

    test('should handle XSS attempts in login fields', async ({ page }) => {
        // Attempt script injection in username
        const xssPayload = '<script>alert("xss")</script>';
        await page.locator('[data-test="username"]').fill(xssPayload);
        await page.locator('[data-test="password"]').fill('secret_sauce');
        await page.locator('[data-test="login-button"]').click();
        
        // Verify error message is sanitized
        const errorMessage = await page.locator('[data-test="error"]').textContent();
        expect(errorMessage).not.toContain('<script>');
        expect(errorMessage).not.toContain('</script>');
    });

    test('should protect against unauthorized page access', async ({ page }) => {
        // Attempt to access inventory page without auth
        await page.goto('https://www.saucedemo.com/inventory.html');
        
        // Should be redirected to login
        await expect(page).toHaveURL('https://www.saucedemo.com/');
        
        // Attempt to access checkout without auth
        await page.goto('https://www.saucedemo.com/checkout-step-one.html');
        
        // Should be redirected to login
        await expect(page).toHaveURL('https://www.saucedemo.com/');
    });

    test('should handle malformed URLs', async ({ page }) => {
        // Login first
        await page.locator('[data-test="username"]').fill('standard_user');
        await page.locator('[data-test="password"]').fill('secret_sauce');
        await page.locator('[data-test="login-button"]').click();
        
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
            "' UNION SELECT username, password FROM users--"
        ];

        for (const payload of sqlPayloads) {
            await page.locator('[data-test="username"]').fill(payload);
            await page.locator('[data-test="password"]').fill(payload);
            await page.locator('[data-test="login-button"]').click();
            
            // Verify we're still on login page
            await expect(page).toHaveURL('https://www.saucedemo.com/');
            
            // Verify error message is sanitized
            const errorMessage = await page.locator('[data-test="error"]').textContent();
            expect(errorMessage).not.toContain('SQL');
            expect(errorMessage).not.toContain('database');
        }
    });

    test('should validate checkout form inputs', async ({ page }) => {
        // Login
        await page.locator('[data-test="username"]').fill('standard_user');
        await page.locator('[data-test="password"]').fill('secret_sauce');
        await page.locator('[data-test="login-button"]').click();
        
        // Add item to cart
        await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
        await page.click('.shopping_cart_link');
        await page.click('[data-test="checkout"]');
        
        // Test script injection in checkout form
        const xssPayload = '<script>alert("xss")</script>';
        await page.locator('[data-test="firstName"]').fill(xssPayload);
        await page.locator('[data-test="lastName"]').fill(xssPayload);
        await page.locator('[data-test="postalCode"]').fill(xssPayload);
        await page.click('[data-test="continue"]');
        
        // Verify we proceed to next step (input was sanitized)
        await expect(page).toHaveURL(/\/checkout-step-two.html/);
        
        // Verify displayed values are sanitized
        const summary = await page.locator('.summary_info').textContent();
        expect(summary).not.toContain('<script>');
    });

    test('should prevent rapid-fire login attempts', async ({ page }) => {
        // Attempt multiple rapid login attempts
        for (let i = 0; i < 5; i++) {
            await page.locator('[data-test="username"]').fill(`user${i}`);
            await page.locator('[data-test="password"]').fill('password');
            await page.locator('[data-test="login-button"]').click();
        }
        
        // Verify error message is shown
        await expect(page.locator('[data-test="error"]')).toBeVisible();
    });

    test('should handle session expiry gracefully', async ({ page }) => {
        // Login
        await page.locator('[data-test="username"]').fill('standard_user');
        await page.locator('[data-test="password"]').fill('secret_sauce');
        await page.locator('[data-test="login-button"]').click();
        
        // Clear cookies to simulate session expiry
        await page.context().clearCookies();
        
        // Try to access protected page
        await page.goto('https://www.saucedemo.com/inventory.html');
        
        // Should be redirected to login
        await expect(page).toHaveURL('https://www.saucedemo.com/');
    });
});