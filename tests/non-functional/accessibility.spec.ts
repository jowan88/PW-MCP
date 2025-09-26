import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutPages';

let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let cartPage: CartPage;
let checkoutInfoPage: CheckoutInfoPage;

test.describe('Sauce Demo Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutInfoPage = new CheckoutInfoPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });

  test('should have accessible elements and labels', async ({ page }) => {
    // Check main navigation elements are accessible
    const cartLink = page.locator('.shopping_cart_link');
    const burgerBtn = page.locator('#react-burger-menu-btn');
    await expect(cartLink).toBeVisible();
    await expect(burgerBtn).toBeVisible();

    // Verify default sort and changing sort
    expect(await inventoryPage.getCurrentSortOrder()).toBe('az');
    await inventoryPage.sortProducts('za');
    expect(await inventoryPage.getCurrentSortOrder()).toBe('za');

    // Verify product information
    const products = await inventoryPage.getProducts();
    expect(products.length).toBeGreaterThan(0);

    const firstProduct = products[0];
    expect(firstProduct.name).toBeTruthy();
    expect(firstProduct.description).toBeTruthy();
    expect(firstProduct.price).toBeTruthy();

    // Verify add to cart is accessible
    expect(await inventoryPage.canAddToCart(firstProduct.id)).toBe(true);
  });

  test('should have proper state management for assistive tech', async () => {
    // Add item to cart
    const productId = 'sauce-labs-backpack';
    await inventoryPage.addToCart(productId);

    // Verify cart state
    expect(await inventoryPage.getCartCount()).toBe(1);

    // Verify remove button is available
    expect(await inventoryPage.canAddToCart(productId)).toBe(false);

    // Remove item and verify state
    await inventoryPage.removeFromCart(productId);
    expect(await inventoryPage.getCartCount()).toBe(0);
    expect(await inventoryPage.canAddToCart(productId)).toBe(true);
  });

  test('should handle form validation feedback', async ({ page }) => {
    // Setup checkout process
    await inventoryPage.addToCart('sauce-labs-backpack');
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Submit empty form
    await checkoutInfoPage.continue();
    expect(await checkoutInfoPage.getErrorMessage()).toMatch(/first name is required/i);

    // Fill form correctly and continue
    await checkoutInfoPage.fillAndContinue({
      firstName: 'John',
      lastName: 'Doe',
      postalCode: '12345',
    });

    // Verify we proceed to next step
    await expect(page).toHaveURL(/\/checkout-step-two.html/);
  });

  test('should have clear visual hierarchy', async ({ page }) => {
    // Verify header elements are prominent
    await expect(page.locator('.header_label')).toBeVisible();

    // Verify navigation elements are visible and distinct
    await expect(page.locator('#react-burger-menu-btn')).toBeVisible();
    await expect(page.locator('.shopping_cart_link')).toBeVisible();
    await expect(page.locator('.product_sort_container')).toBeVisible();

    // Verify product grid layout and verify product information
    const products = await inventoryPage.getProducts();
    expect(products.length).toBe(6);

    // Verify each product has complete information
    const firstProduct = products[0];
    expect(firstProduct.name).toBeTruthy();
    expect(firstProduct.description).toBeTruthy();
    expect(firstProduct.price).toBeTruthy();

    // Verify cart interaction visual feedback
    const productId = firstProduct.id;
    expect(await inventoryPage.canAddToCart(productId)).toBe(true);

    await inventoryPage.addToCart(productId);
    expect(await inventoryPage.canAddToCart(productId)).toBe(false);

    // Verify images and layout
    await inventoryPage.verifyProductImages();
    await inventoryPage.verifyFooter();
  });
});
