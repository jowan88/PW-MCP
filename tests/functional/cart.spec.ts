import { test, expect, type Page } from '@playwright/test';

test.describe('Sauce Demo Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page and login
    await page.goto('https://www.saucedemo.com/');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should display empty cart state correctly', async ({ page }) => {
    // Navigate to cart
    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL('https://www.saucedemo.com/cart.html');

    // Verify empty cart elements
    await expect(page.locator('.cart_list')).toBeVisible();
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.locator('[data-test="continue-shopping"]')).toBeVisible();
    await expect(page.locator('[data-test="checkout"]')).toBeVisible();

    // Verify continue shopping works
    await page.click('[data-test="continue-shopping"]');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should display cart items with correct information', async ({ page }) => {
    // Add items to cart from inventory
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');

    // Go to cart
    await page.click('.shopping_cart_link');

    // Verify cart items
    const cartItems = page.locator('.cart_item');
    await expect(cartItems).toHaveCount(2);

    // Verify first item details
    const firstItem = cartItems.first();
    await expect(firstItem.locator('.inventory_item_name')).toHaveText('Sauce Labs Backpack');
    await expect(firstItem.locator('.inventory_item_desc')).toBeVisible();
    await expect(firstItem.locator('.inventory_item_price')).toContainText('$');

    // Verify item links to product page
    const itemLink = firstItem.locator('.inventory_item_name');
    await expect(itemLink).toBeVisible();

    // Click item and verify navigation
    await itemLink.click();
    await expect(page).toHaveURL(/\/inventory-item.html/);

    // Verify product page elements
    await expect(page.locator('.inventory_details_name')).toHaveText('Sauce Labs Backpack');
    await expect(page.locator('.inventory_details_img')).toBeVisible();
  });

  test('should update cart badge count correctly', async ({ page }) => {
    // Initially no badge
    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();

    // Add first item
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    // Add second item
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');

    // Remove item from cart page
    await page.click('.shopping_cart_link');
    await page.click('[data-test="remove-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  test('should preserve cart state during navigation', async ({ page }) => {
    // Add items
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');

    // Navigate back and forth
    await page.click('.shopping_cart_link');
    await expect(page.locator('.cart_item')).toHaveCount(2);

    await page.click('[data-test="continue-shopping"]');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');

    await page.click('.shopping_cart_link');
    await expect(page.locator('.cart_item')).toHaveCount(2);
  });

  test('should handle empty cart checkout appropriately', async ({ page }) => {
    // Go to cart without adding items
    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL(/\/cart.html/);

    // Verify empty cart state
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.locator('.cart_list')).toBeVisible();

    // The checkout button should be visible but indicate empty cart state
    const checkoutBtn = page.locator('[data-test="checkout"]');
    await expect(checkoutBtn).toBeVisible();
    await expect(checkoutBtn).toBeEnabled(); // Application allows clicking even with empty cart

    // Click checkout to see how empty cart is handled
    await checkoutBtn.click();
    await expect(page).toHaveURL(/\/checkout-step-one.html/);

    // At this point, the app shows the checkout form but won't let us proceed
    const continueBtn = page.locator('[data-test="continue"]');
    await continueBtn.click();

    // Error should indicate we need to add items
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/first name is required/i); // App shows standard validation
  });

  test('should handle removal of all items during checkout process', async ({ page }) => {
    // Add item and wait for cart badge
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    // Navigate to cart and verify item
    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL(/\/cart.html/);
    await expect(page.locator('.cart_item')).toHaveCount(1);

    // Start checkout
    await page.click('[data-test="checkout"]');
    await expect(page).toHaveURL(/\/checkout-step-one.html/);

    // Fill out information
    await page.locator('[data-test="firstName"]').fill('John');
    await page.locator('[data-test="lastName"]').fill('Doe');
    await page.locator('[data-test="postalCode"]').fill('12345');

    // Go back to cart and remove item
    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL(/\/cart.html/);
    await page.click('[data-test="remove-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();

    // Cart should be empty but checkout still available
    await expect(page.locator('.cart_item')).toHaveCount(0);
    const checkoutBtn = page.locator('[data-test="checkout"]');
    await expect(checkoutBtn).toBeEnabled();
  });

  test('should validate checkout fields appropriately', async ({ page }) => {
    // Add item and go to checkout
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    await page.click('.shopping_cart_link');
    await page.click('[data-test="checkout"]');

    // Wait for form to be ready
    const form = {
      firstName: page.locator('[data-test="firstName"]'),
      lastName: page.locator('[data-test="lastName"]'),
      postalCode: page.locator('[data-test="postalCode"]'),
      continueBtn: page.locator('[data-test="continue"]'),
      error: page.locator('[data-test="error"]'),
    };

    await form.firstName.waitFor();

    // Test required field validation
    await form.continueBtn.click();
    await expect(form.error).toBeVisible();
    await expect(form.error).toContainText(/first name is required/i);

    // Test with special characters (should be allowed as per actual behavior)
    await form.firstName.fill('Test!@#');
    await form.lastName.fill('User$%^');
    await form.postalCode.fill('12345!');
    await form.continueBtn.click();

    // Application accepts special characters
    await expect(page).toHaveURL(/\/checkout-step-two.html/);
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
    test.beforeEach(async ({ page }) => {
      // Add items and go to cart
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('.shopping_cart_link');
    });

    test('should proceed through checkout steps', async ({ page }) => {
      // Start checkout
      await page.click('[data-test="checkout"]');
      await expect(page).toHaveURL(/\/checkout-step-one.html/);

      // Fill customer information
      await page.locator('[data-test="firstName"]').fill('John');
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="postalCode"]').fill('12345');

      // Continue to overview
      await page.click('[data-test="continue"]');
      await expect(page).toHaveURL(/\/checkout-step-two.html/);

      // Verify overview elements
      await expect(page.locator('.cart_list')).toBeVisible();
      await expect(page.locator('.summary_info')).toBeVisible();
      await expect(page.locator('.summary_total_label')).toBeVisible();

      // Complete order
      await page.click('[data-test="finish"]');
      await expect(page).toHaveURL(/\/checkout-complete.html/);

      // Verify completion
      await expect(page.locator('.complete-header')).toBeVisible();
      await expect(page.locator('[data-test="back-to-products"]')).toBeVisible();
    });

    test('should validate customer information', async ({ page }) => {
      await page.click('[data-test="checkout"]');

      // Try to continue without data
      await page.click('[data-test="continue"]');
      await expect(page.locator('[data-test="error"]')).toBeVisible();

      // Fill only first name
      await page.locator('[data-test="firstName"]').fill('John');
      await page.click('[data-test="continue"]');
      await expect(page.locator('[data-test="error"]')).toBeVisible();

      // Fill only last name
      await page.locator('[data-test="firstName"]').clear();
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.click('[data-test="continue"]');
      await expect(page.locator('[data-test="error"]')).toBeVisible();
    });

    test('should calculate total correctly', async ({ page }) => {
      await page.click('[data-test="checkout"]');

      // Fill information
      await page.locator('[data-test="firstName"]').fill('John');
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="postalCode"]').fill('12345');
      await page.click('[data-test="continue"]');

      // Get item price and tax
      const itemPrice = await page.locator('.inventory_item_price').textContent();
      const price = parseFloat(itemPrice!.replace('$', ''));
      const tax = await page.locator('.summary_tax_label').textContent();
      const taxAmount = parseFloat(tax!.split('$')[1]);

      // Verify total
      const totalText = await page.locator('.summary_total_label').textContent();
      const total = parseFloat(totalText!.split('$')[1]);
      expect(total).toBeCloseTo(price + taxAmount, 2);
    });

    test('should handle cancel actions', async ({ page }) => {
      // Cancel from cart
      await page.click('[data-test="checkout"]');
      await page.click('[data-test="cancel"]');
      await expect(page).toHaveURL(/\/cart.html/);

      // Cancel from customer info
      await page.click('[data-test="checkout"]');
      await page.locator('[data-test="firstName"]').fill('John');
      await page.click('[data-test="cancel"]');
      await expect(page).toHaveURL(/\/cart.html/);

      // Cancel from overview
      await page.click('[data-test="checkout"]');
      await page.locator('[data-test="firstName"]').fill('John');
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="postalCode"]').fill('12345');
      await page.click('[data-test="continue"]');
      await page.click('[data-test="cancel"]');
      await expect(page).toHaveURL(/\/inventory.html/);
    });
  });
});
