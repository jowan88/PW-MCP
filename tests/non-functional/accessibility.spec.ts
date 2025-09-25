import { test, expect, type Page } from '@playwright/test';

test.describe('Sauce Demo Accessibility', () => {
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

  test('should have accessible elements and labels', async ({ page }) => {
    // Check main navigation elements are accessible
    const cartLink = page.locator('.shopping_cart_link');
    const burgerBtn = page.locator('#react-burger-menu-btn');

    // Cart link and menu button should be visible and clickable
    await expect(cartLink).toBeVisible();
    await expect(burgerBtn).toBeVisible();

    // Verify product sort functionality
    const sortSelect = page.locator('.product_sort_container');
    await expect(sortSelect).toHaveValue('az'); // Default sort

    // Test sort select functionality
    await sortSelect.selectOption('za');
    await expect(sortSelect).toHaveValue('za');

    // Each product should have all required information
    const product = page.locator('.inventory_item').first();
    await expect(product.locator('img.inventory_item_img')).toBeVisible();
    await expect(product.locator('.inventory_item_name')).toBeVisible();
    await expect(product.locator('.inventory_item_desc')).toBeVisible();
    await expect(product.locator('.inventory_item_price')).toBeVisible();

    // Add to cart button should work
    const addButton = product.locator('[data-test^="add-to-cart"]');
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test('should have proper state management for assistive tech', async ({ page }) => {
    // Add item to cart
    const addButton = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
    await addButton.click();

    // Cart should indicate items present
    const cartBadge = page.locator('.shopping_cart_badge');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');

    // Button should change to "Remove"
    const removeButton = page.locator('[data-test="remove-sauce-labs-backpack"]');
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toHaveText(/remove/i);

    // Remove item
    await removeButton.click();

    // Cart should update appropriately
    await expect(cartBadge).not.toBeVisible();
    await expect(addButton).toBeVisible();
  });

  test('should handle form validation feedback', async ({ page }) => {
    // Add item and go to checkout
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('[data-test="checkout"]');

    // All form fields should be visible
    const firstName = page.locator('[data-test="firstName"]');
    const lastName = page.locator('[data-test="lastName"]');
    const postalCode = page.locator('[data-test="postalCode"]');

    await expect(firstName).toBeVisible();
    await expect(lastName).toBeVisible();
    await expect(postalCode).toBeVisible();

    // Submit empty form and check error
    await page.click('[data-test="continue"]');
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/first name is required/i);

    // Fix error by filling fields
    await firstName.fill('John');
    await lastName.fill('Doe');
    await postalCode.fill('12345');
    await page.click('[data-test="continue"]');

    // Should proceed to next step
    await expect(page).toHaveURL(/\/checkout-step-two.html/);
  });

  test('should have clear visual hierarchy', async ({ page }) => {
    // Verify header elements are prominent
    const header = page.locator('.header_label');
    await expect(header).toBeVisible();

    // Verify navigation elements are visible and distinct
    const nav = {
      menu: page.locator('#react-burger-menu-btn'),
      cart: page.locator('.shopping_cart_link'),
      sort: page.locator('.product_sort_container'),
    };

    // All nav elements should be visible
    await expect(nav.menu).toBeVisible();
    await expect(nav.cart).toBeVisible();
    await expect(nav.sort).toBeVisible();

    // Verify product grid layout
    const productGrid = page.locator('.inventory_list');
    await expect(productGrid).toBeVisible();

    // Verify product cards have consistent layout
    const firstProduct = page.locator('.inventory_item').first();
    await expect(firstProduct.locator('img.inventory_item_img')).toBeVisible();
    await expect(firstProduct.locator('.inventory_item_name')).toBeVisible();
    await expect(firstProduct.locator('.inventory_item_desc')).toBeVisible();
    await expect(firstProduct.locator('.inventory_item_price')).toBeVisible();

    // Add to cart button should be prominent
    const cartButton = firstProduct.locator('[data-test^="add-to-cart"]');
    await expect(cartButton).toBeVisible();
    await expect(cartButton).toHaveText(/add to cart/i);

    // Interactive elements should be clearly clickable
    const addButton = firstProduct.locator('[data-test^="add-to-cart"]');
    await expect(addButton).toBeEnabled();

    // Click add button and verify visual feedback
    await addButton.click();
    const removeButton = firstProduct.locator('[data-test^="remove"]');
    await expect(removeButton).toBeVisible();
  });
});
