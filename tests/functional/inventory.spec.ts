import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Sauce Demo Inventory', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('should display all products with correct information', async () => {
    const expectedProducts = [
      {
        name: 'Sauce Labs Backpack',
        description:
          'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
        price: '$29.99',
      },
      {
        name: 'Sauce Labs Bike Light',
        description:
          "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
        price: '$9.99',
      },
      {
        name: 'Sauce Labs Bolt T-Shirt',
        description:
          'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
        price: '$15.99',
      },
      {
        name: 'Sauce Labs Fleece Jacket',
        description:
          "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
        price: '$49.99',
      },
      {
        name: 'Sauce Labs Onesie',
        description:
          "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.",
        price: '$7.99',
      },
      {
        name: 'Test.allTheThings() T-Shirt (Red)',
        description:
          'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
        price: '$15.99',
      },
    ];

    const products = await inventoryPage.getProducts();
    expect(products.length).toBe(expectedProducts.length);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const expected = expectedProducts[i];

      expect(product.name).toBe(expected.name);
      expect(product.description).toBe(expected.description);
      expect(product.price).toBe(expected.price);
    }
  });

  test('should verify product images dimensions and aspect ratio', async () => {
    await inventoryPage.verifyProductImages();
  });

  test('should sort products by name from A to Z', async () => {
    await inventoryPage.sortProducts('az');
    const products = await inventoryPage.getProducts();
    const productNames = products.map(p => p.name);
    const sortedNames = [...productNames].sort();
    expect(productNames).toEqual(sortedNames);
  });

  test('should sort products by name from Z to A', async () => {
    await inventoryPage.sortProducts('za');
    const products = await inventoryPage.getProducts();
    const productNames = products.map(p => p.name);
    const sortedNames = [...productNames].sort((a, b) => b.localeCompare(a));
    expect(productNames).toEqual(sortedNames);
  });

  test('should sort products by price from low to high', async () => {
    await inventoryPage.sortProducts('lohi');
    const products = await inventoryPage.getProducts();
    const prices = products.map(p => parseFloat(p.price.replace('$', '')));
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });

  test('should sort products by price from high to low', async () => {
    await inventoryPage.sortProducts('hilo');
    const products = await inventoryPage.getProducts();
    const prices = products.map(p => parseFloat(p.price.replace('$', '')));
    const sortedPrices = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sortedPrices);
  });

  test('should reset to default sort order after page refresh', async ({ page }) => {
    await inventoryPage.sortProducts('hilo');
    await page.reload();

    const sortOrder = await inventoryPage.getCurrentSortOrder();
    expect(sortOrder).toBe('az');

    const products = await inventoryPage.getProducts();
    const productNames = products.map(p => p.name);
    const sortedNames = [...productNames].sort();
    expect(productNames).toEqual(sortedNames);
  });

  test.describe('social and footer', () => {
    test('should have working social media links', async () => {
      await inventoryPage.verifySocialLinks();
    });

    test('should have valid footer content', async () => {
      await inventoryPage.verifyFooter();
    });
  });

  test.describe('product details', () => {
    test('should navigate to product detail page', async ({ page }) => {
      await page.click('.inventory_item_name:has-text("Sauce Labs Backpack")');
      await expect(page).toHaveURL(/\/inventory-item.html/);

      await expect(page.locator('.inventory_details_name')).toHaveText('Sauce Labs Backpack');
      await expect(page.locator('.inventory_details_desc')).toBeVisible();
      await expect(page.locator('.inventory_details_price')).toBeVisible();

      await page.click('[data-test="back-to-products"]');
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    });

    test('should navigate to product detail page via image', async ({ page }) => {
      await page.click('.inventory_item img:first-child');
      await expect(page).toHaveURL(/\/inventory-item.html/);
    });
  });

  test.describe('error handling', () => {
    test('should handle network images gracefully', async ({ page }) => {
      await page.route('**/*.jpg', route => route.abort('failed'));
      await page.reload();
      await inventoryPage.verifyProductImages();
    });

    test('should handle invalid sort parameter manipulation', async ({ page }) => {
      await page.evaluate(() => {
        const select = document.querySelector('.product_sort_container') as HTMLSelectElement;
        select.value = 'invalid_sort';
        select.dispatchEvent(new Event('change'));
      });

      // Should maintain default sort order
      const products = await inventoryPage.getProducts();
      const productNames = products.map(p => p.name);
      const sortedNames = [...productNames].sort();
      expect(productNames).toEqual(sortedNames);
    });
  });

  test.describe('performance', () => {
    test('should load critical elements quickly', async ({ page }) => {
      await page.reload();
      await expect(page.locator('.inventory_list')).toBeVisible({ timeout: 1000 });
      await expect(page.locator('.inventory_item:first-child')).toBeVisible({ timeout: 1000 });
      await expect(page.locator('.shopping_cart_link')).toBeVisible({ timeout: 1000 });
      await expect(page.locator('#react-burger-menu-btn')).toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('cart functionality from inventory', () => {
    test('should add and remove items from cart', async () => {
      await inventoryPage.addToCart('sauce-labs-backpack');
      await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText('1');

      await inventoryPage.addToCart('sauce-labs-bike-light');
      await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText('2');

      await inventoryPage.removeFromCart('sauce-labs-backpack');
      await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText('1');

      await inventoryPage.removeFromCart('sauce-labs-bike-light');
      await expect(inventoryPage.page.locator('.shopping_cart_badge')).not.toBeVisible();
    });

    test('should verify add/remove button text changes', async () => {
      const productId = 'sauce-labs-backpack';

      expect(await inventoryPage.canAddToCart(productId)).toBe(true);
      await inventoryPage.addToCart(productId);
      expect(await inventoryPage.canAddToCart(productId)).toBe(false);
      await inventoryPage.removeFromCart(productId);
      expect(await inventoryPage.canAddToCart(productId)).toBe(true);
    });

    test('should maintain cart count accuracy', async () => {
      const items = ['sauce-labs-backpack', 'sauce-labs-bike-light', 'sauce-labs-bolt-t-shirt'];

      for (let i = 0; i < items.length; i++) {
        await inventoryPage.addToCart(items[i]);
        await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText(`${i + 1}`);
      }

      for (let i = items.length - 1; i >= 0; i--) {
        await inventoryPage.removeFromCart(items[i]);
        if (i === 0) {
          await expect(inventoryPage.page.locator('.shopping_cart_badge')).not.toBeVisible();
        } else {
          await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText(`${i}`);
        }
      }
    });

    test('should handle rapid add/remove actions', async () => {
      const productId = 'sauce-labs-backpack';
      await inventoryPage.rapidAddRemove(productId, 3);
      await inventoryPage.addToCart(productId);
      await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText('1');
    });

    test('should update inventory count in cart icon', async () => {
      const products = await inventoryPage.getProducts();
      const firstThree = products.slice(0, 3).map(p => p.id);

      for (let i = 0; i < firstThree.length; i++) {
        await inventoryPage.addToCart(firstThree[i]);
        await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText(`${i + 1}`);
      }

      for (let i = firstThree.length - 1; i >= 0; i--) {
        await inventoryPage.removeFromCart(firstThree[i]);
        if (i === 0) {
          await expect(inventoryPage.page.locator('.shopping_cart_badge')).not.toBeVisible();
        } else {
          await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText(`${i}`);
        }
      }
    });

    test('should maintain cart state after page refresh', async ({ page }) => {
      await inventoryPage.addToCart('sauce-labs-backpack');
      await inventoryPage.addToCart('sauce-labs-bike-light');

      await page.reload();

      await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
      expect(await inventoryPage.canAddToCart('sauce-labs-backpack')).toBe(false);
      expect(await inventoryPage.canAddToCart('sauce-labs-bike-light')).toBe(false);
    });
  });
});
