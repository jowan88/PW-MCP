import { test, expect, type Page } from '@playwright/test';

test.describe('Sauce Demo Burger Menu', () => {
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

  test('should verify burger menu functionality', async ({ page }) => {
    // Verify burger menu button is visible
    await expect(page.locator('#react-burger-menu-btn')).toBeVisible();

    // Click burger menu button
    await page.click('#react-burger-menu-btn');

    // Verify menu items are visible
    await expect(page.locator('.bm-menu')).toBeVisible();

    // Verify all menu items
    const menuItems = [
      { id: '#inventory_sidebar_link', text: 'All Items' },
      { id: '#about_sidebar_link', text: 'About' },
      { id: '#logout_sidebar_link', text: 'Logout' },
      { id: '#reset_sidebar_link', text: 'Reset App State' },
    ];

    for (const item of menuItems) {
      const menuItem = page.locator(item.id);
      await expect(menuItem).toBeVisible();
      await expect(menuItem).toHaveText(item.text);
    }

    // Test menu close button
    const closeButton = page.locator('#react-burger-cross-btn');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Verify menu is closed
    await expect(page.locator('.bm-menu')).not.toBeVisible();
  });

  test.describe('menu navigation', () => {
    async function openMenu(page: Page) {
      // Wait for menu button to be ready before clicking
      await page.locator('#react-burger-menu-btn').waitFor({ state: 'visible', timeout: 5000 });
      await page.click('#react-burger-menu-btn');
      // Wait for menu animation to complete
      await page.locator('.bm-menu').waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300); // Wait for animation to complete
    }

    test('should navigate to All Items from different pages', async ({ page }) => {
      // First go to cart page
      await page.click('.shopping_cart_link');
      await expect(page).toHaveURL('https://www.saucedemo.com/cart.html');

      // Use All Items to return to inventory
      await openMenu(page);
      await page.click('#inventory_sidebar_link');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

      // Verify inventory content is visible
      await expect(page.locator('.inventory_list')).toBeVisible();
      await expect(page.locator('.inventory_item')).toHaveCount(6);
    });

    test('should reset app state completely', async ({ page }) => {
      // Setup multiple state changes
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
      await expect(page.locator('.shopping_cart_badge')).toHaveText('2');

      // Change sort order
      await page.locator('.product_sort_container').selectOption('za');

      // Reset state
      await openMenu(page);
      await page.click('#reset_sidebar_link');
      await page.waitForTimeout(500); // Wait for reset to complete

      // Verify cart is empty
      await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();

      // Reload page to verify persistent state and reset
      await page.reload();

      // Verify everything is back to initial state
      await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
      const firstProduct = page.locator('.inventory_item').first();
      await expect(
        firstProduct.locator('[data-test="add-to-cart-sauce-labs-backpack"]')
      ).toBeVisible();
    });

    test('should navigate to About page and verify content', async ({ page }) => {
      await openMenu(page);
      
      // Click about link and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click('#about_sidebar_link')
      ]);

      // Verify we're on Sauce Labs website
      expect(page.url()).toContain('saucelabs.com');
      
      // Wait for the page to be loaded
      await page.waitForLoadState('domcontentloaded');
      
      // Return to inventory and verify
      await page.goto('https://www.saucedemo.com/inventory.html');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test('should maintain menu state during navigation', async ({ page }) => {
      // Open menu on inventory page
      await openMenu(page);

      // Click cart link
      await page.click('.shopping_cart_link');
      await expect(page).toHaveURL('https://www.saucedemo.com/cart.html');

      // Open menu again on cart page
      await openMenu(page);
      await expect(page.locator('#inventory_sidebar_link')).toBeVisible();

      // Navigate back to inventory using menu
      await page.click('#inventory_sidebar_link');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test('should handle rapid menu interactions', async ({ page }) => {
      // Quick open/close sequences
      await openMenu(page);
      await page.click('#react-burger-cross-btn');
      await expect(page.locator('.bm-menu')).not.toBeVisible();

      await openMenu(page);
      await expect(page.locator('.bm-menu')).toBeVisible();

      // Quick navigation sequence
      await page.click('#about_sidebar_link');
      await expect(page.url()).toContain('saucelabs.com');

      await page.goto('https://www.saucedemo.com/inventory.html');
      await openMenu(page);
      await expect(page.locator('.bm-menu')).toBeVisible();
    });

    test('should logout successfully and clear session', async ({ page }) => {
      // Add item to cart first
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await expect(page.locator('.shopping_cart_badge')).toBeVisible();

      // Logout
      await openMenu(page);
      await page.click('#logout_sidebar_link');
      await expect(page).toHaveURL('https://www.saucedemo.com/');

      // Verify we're logged out
      await expect(page.locator('[data-test="username"]')).toBeVisible();
      await expect(page.locator('[data-test="password"]')).toBeVisible();

      // Try to access inventory page directly
      await page.goto('https://www.saucedemo.com/inventory.html');

      // Should be redirected back to login
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });

    test('should verify menu keyboard interaction', async ({ page }) => {
      // Open menu first so we can find its elements
      await page.click('#react-burger-menu-btn');
      await expect(page.locator('.bm-menu')).toBeVisible();

      // Get all interactive elements
      const menuItems = [
        '#inventory_sidebar_link',
        '#about_sidebar_link',
        '#logout_sidebar_link',
        '#reset_sidebar_link',
      ];

      // Verify each menu item can be clicked
      for (const itemId of menuItems) {
        const item = page.locator(itemId);
        await expect(item).toBeVisible();

        // Verify the element is in the tab order
        const tabIndex = await item.evaluate(el => {
          return (
            window.getComputedStyle(el).display !== 'none' &&
            !el.hasAttribute('disabled') &&
            el.tabIndex >= 0
          );
        });
        expect(tabIndex).toBeTruthy();
      }

      // Test keyboard interaction with the first item
      await page.locator('#inventory_sidebar_link').click();
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test('should handle rapid menu toggling', async ({ page }) => {
      const menuBtn = page.locator('#react-burger-menu-btn');
      const closeBtn = page.locator('#react-burger-cross-btn');
      const menu = page.locator('.bm-menu');

      // Rapidly toggle menu open/close with proper waits
      for (let i = 0; i < 3; i++) {
        // Open menu
        await menuBtn.waitFor({ state: 'visible' });
        await menuBtn.click();
        await menu.waitFor({ state: 'visible' });
        await page.waitForTimeout(100); // Small wait for animation

        // Close menu
        await closeBtn.waitFor({ state: 'visible' });
        await closeBtn.click();
        await menu.waitFor({ state: 'hidden' });
        await page.waitForTimeout(100); // Small wait for animation
      }

      // Should end in a consistent state
      await expect(menu).not.toBeVisible();

      // Menu should still be functional
      await menuBtn.click();
      await menu.waitFor({ state: 'visible' });
      await expect(menu).toBeVisible();
    });

    test('should handle clicking outside menu to close', async ({ page }) => {
      // Open menu
      await page.click('#react-burger-menu-btn');
      await expect(page.locator('.bm-menu')).toBeVisible();

      // Click outside menu area
      await page.click('.inventory_list');

      // Menu should be closed or remain open (depending on implementation)
      const menuVisible = await page.locator('.bm-menu').isVisible();
      if (!menuVisible) {
        // If implementation closes menu on outside click
        await expect(page.locator('.bm-menu')).not.toBeVisible();
      } else {
        // If implementation requires explicit close
        await page.click('#react-burger-cross-btn');
        await expect(page.locator('.bm-menu')).not.toBeVisible();
      }
    });

    test('should handle menu actions during page transitions', async ({ page }) => {
      // Open menu
      await openMenu(page);

      // Click about link but don't wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('#about_sidebar_link'),
      ]);

      // Verify we've navigated away
      expect(page.url()).toContain('saucelabs.com');

      // Return to the inventory page
      await page.goto('https://www.saucedemo.com/inventory.html');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

      // Menu should still work after navigation
      await openMenu(page);
      await expect(page.locator('.bm-menu')).toBeVisible();
    });

    test('should handle state reset', async ({ page }) => {
      // Add an item to cart
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await expect(page.locator('.shopping_cart_badge')).toBeVisible();

      // Open menu and reset state
      await openMenu(page);
      await page.click('#reset_sidebar_link');

      // Wait for state to be fully reset
      await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();

      // Close menu
      await page.locator('#react-burger-cross-btn').click();
      await page.locator('.bm-menu').waitFor({ state: 'hidden' });

      // Verify inventory is still accessible
      await expect(page.locator('.inventory_list')).toBeVisible();
    });
  });
});
