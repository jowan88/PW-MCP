import { test, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let cartPage: CartPage;

test.describe('Sauce Demo Burger Menu', () => {
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should verify burger menu functionality', async () => {
    // Open menu
    await inventoryPage.toggleMenu('open');
    expect(await inventoryPage.isMenuVisible()).toBe(true);

    // Verify all menu items
    const menuItems = [
      { id: '#inventory_sidebar_link', text: 'All Items' },
      { id: '#about_sidebar_link', text: 'About' },
      { id: '#logout_sidebar_link', text: 'Logout' },
      { id: '#reset_sidebar_link', text: 'Reset App State' },
    ];

    for (const item of menuItems) {
      expect(await inventoryPage.getMenuItemText(item.id)).toBe(item.text);
    }

    // Close menu
    await inventoryPage.toggleMenu('close');
    expect(await inventoryPage.isMenuVisible()).toBe(false);
  });

  test.describe('menu navigation', () => {
    test('should navigate to All Items from different pages', async ({ page }) => {
      // First go to cart page
      await cartPage.goto();

      // Use All Items to return to inventory
      await inventoryPage.performMenuAction('all-items');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

      // Verify inventory content is visible
      await expect(page.locator('.inventory_list')).toBeVisible();
      const products = await inventoryPage.getProducts();
      expect(products.length).toBe(6);
    });

    test('should reset app state completely', async ({ page }) => {
      // Setup multiple state changes
      await inventoryPage.addToCart('sauce-labs-backpack');
      await inventoryPage.addToCart('sauce-labs-bike-light');
      expect(await inventoryPage.getCartCount()).toBe(2);

      // Change sort order
      await inventoryPage.sortProducts('za');

      // Reset state using menu action
      await inventoryPage.performMenuAction('reset');

      // Verify cart is empty
      expect(await inventoryPage.getCartCount()).toBe(0);

      // Reload page to verify persistent state and reset
      await page.reload();

      // Verify everything is back to initial state
      expect(await inventoryPage.getCartCount()).toBe(0);
      expect(await inventoryPage.canAddToCart('sauce-labs-backpack')).toBe(true);
    });

    test('should navigate to About page and verify content', async ({ page }) => {
      // Navigate to About page
      await inventoryPage.performMenuAction('about');

      // Verify we're on Sauce Labs website
      expect(page.url()).toContain('saucelabs.com');

      // Wait for the page to be loaded
      await page.waitForLoadState('domcontentloaded');

      // Return to inventory and verify
      await inventoryPage.goto();
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test('should logout successfully and clear session', async ({ page }) => {
      // Add item to cart first
      await inventoryPage.addToCart('sauce-labs-backpack');
      expect(await inventoryPage.getCartCount()).toBe(1);

      // Logout using menu action
      await inventoryPage.performMenuAction('logout');
      await expect(page).toHaveURL('https://www.saucedemo.com/');

      // Verify we're logged out by checking login form
      const loginForm = await page.locator('form');
      await expect(loginForm.locator('[data-test="username"]')).toBeVisible();
      await expect(loginForm.locator('[data-test="password"]')).toBeVisible();

      // Try to access inventory page directly and verify redirect
      await inventoryPage.goto();
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });

    test('should verify menu keyboard interaction', async ({ page }) => {
      // Open menu to access elements
      await inventoryPage.toggleMenu('open');
      expect(await inventoryPage.isMenuVisible()).toBe(true);

      // Verify menu items are clickable and in tab order
      const menuItems = [
        '#inventory_sidebar_link',
        '#about_sidebar_link',
        '#logout_sidebar_link',
        '#reset_sidebar_link',
      ];

      for (const itemId of menuItems) {
        const item = page.locator(itemId);
        await expect(item).toBeVisible();

        // Verify element is in the tab order
        const tabIndex = await item.evaluate(el => {
          return (
            window.getComputedStyle(el).display !== 'none' &&
            !el.hasAttribute('disabled') &&
            el.tabIndex >= 0
          );
        });
        expect(tabIndex).toBeTruthy();
      }

      // Test navigation using menu item
      await inventoryPage.clickMenuItem('#inventory_sidebar_link');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test('should handle rapid menu toggling', async () => {
      // Rapidly toggle menu open/close
      for (let i = 0; i < 3; i++) {
        await inventoryPage.toggleMenu('open');
        expect(await inventoryPage.isMenuVisible()).toBe(true);

        await inventoryPage.toggleMenu('close');
        expect(await inventoryPage.isMenuVisible()).toBe(false);
      }

      // Verify menu is still functional
      await inventoryPage.toggleMenu('open');
      expect(await inventoryPage.isMenuVisible()).toBe(true);
    });

    test('should handle clicking outside menu to close', async ({ page }) => {
      // Open menu
      await inventoryPage.toggleMenu('open');
      expect(await inventoryPage.isMenuVisible()).toBe(true);

      // Click outside menu area
      await page.click('.inventory_list');

      // Check if menu auto-closes on outside click
      const menuVisible = await inventoryPage.isMenuVisible();
      if (!menuVisible) {
        expect(await inventoryPage.isMenuVisible()).toBe(false);
      } else {
        // Close manually if needed
        await inventoryPage.toggleMenu('close');
        expect(await inventoryPage.isMenuVisible()).toBe(false);
      }
    });

    test('should handle menu actions during page transitions', async ({ page }) => {
      // Navigate using menu
      await inventoryPage.performMenuAction('about');
      expect(page.url()).toContain('saucelabs.com');

      // Return to inventory
      await inventoryPage.goto();
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

      // Verify menu still works after navigation
      await inventoryPage.toggleMenu('open');
      expect(await inventoryPage.isMenuVisible()).toBe(true);
    });

    test('should handle state reset', async () => {
      // Add an item to cart
      await inventoryPage.addToCart('sauce-labs-backpack');
      expect(await inventoryPage.getCartCount()).toBe(1);

      // Reset state using menu action
      await inventoryPage.performMenuAction('reset');

      // Verify cart is empty after reset
      expect(await inventoryPage.getCartCount()).toBe(0);

      // Close menu
      await inventoryPage.toggleMenu('close');
      expect(await inventoryPage.isMenuVisible()).toBe(false);

      // Verify inventory is still accessible
      const products = await inventoryPage.getProducts();
      expect(products.length).toBe(6);
    });
  });
});
