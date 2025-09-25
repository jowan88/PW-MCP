import { test, expect, type Page } from '@playwright/test';

test.describe('Sauce Demo Inventory', () => {
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

    test('should display all products with correct information', async ({ page }) => {
        // Define expected products
        const expectedProducts = [
            {
                name: 'Sauce Labs Backpack',
                description: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
                price: '$29.99'
            },
            {
                name: 'Sauce Labs Bike Light',
                description: 'A red light isn\'t the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.',
                price: '$9.99'
            },
            {
                name: 'Sauce Labs Bolt T-Shirt',
                description: 'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
                price: '$15.99'
            },
            {
                name: 'Sauce Labs Fleece Jacket',
                description: 'It\'s not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.',
                price: '$49.99'
            },
            {
                name: 'Sauce Labs Onesie',
                description: 'Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won\'t unravel.',
                price: '$7.99'
            },
            {
                name: 'Test.allTheThings() T-Shirt (Red)',
                description: 'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
                price: '$15.99'
            }
        ];

        // Get all inventory items
        const inventoryItems = page.locator('.inventory_item');
        await expect(inventoryItems).toHaveCount(expectedProducts.length);

        // Check each product's details
        for (let i = 0; i < expectedProducts.length; i++) {
            const product = expectedProducts[i];
            const itemContainer = inventoryItems.nth(i);

            // Verify product name
            await expect(itemContainer.locator('.inventory_item_name')).toHaveText(product.name);
            
            // Verify product description
            await expect(itemContainer.locator('.inventory_item_desc')).toHaveText(product.description);
            
            // Verify product price
            await expect(itemContainer.locator('.inventory_item_price')).toHaveText(product.price);
            
            // Verify product image is visible and not broken
            const image = itemContainer.locator('img');
            await expect(image).toBeVisible();
            const srcAttribute = await image.getAttribute('src');
            expect(srcAttribute).toBeTruthy();
            expect(srcAttribute).not.toContain('null');
            expect(srcAttribute).not.toContain('undefined');
        }
    });

    test('should verify product images dimensions and aspect ratio', async ({ page }) => {
        // Get all product images
        const productImages = page.locator('.inventory_item img');
        const count = await productImages.count();

        // Check each image's dimensions
        for (let i = 0; i < count; i++) {
            const image = productImages.nth(i);
            
            // Verify image is visible
            await expect(image).toBeVisible();
            
            // Get image dimensions
            const boundingBox = await image.boundingBox();
            expect(boundingBox).toBeTruthy();
            if (boundingBox) {
                // Verify dimensions are reasonable (not too small or zero)
                expect(boundingBox.width).toBeGreaterThan(0);
                expect(boundingBox.height).toBeGreaterThan(0);
                
                // Verify aspect ratio is reasonable (not extremely skewed)
                const aspectRatio = boundingBox.width / boundingBox.height;
                expect(aspectRatio).toBeGreaterThan(0.5);
                expect(aspectRatio).toBeLessThan(2);
            }
        }
    });

    test('should sort products by name from A to Z', async ({ page }) => {
        // Open sort dropdown and select A to Z
        await page.locator('.product_sort_container').selectOption('az');

        // Get all product names
        const productNames = await page.locator('.inventory_item_name').allInnerTexts();
        
        // Create a copy of names and sort them alphabetically
        const sortedNames = [...productNames].sort();
        
        // Verify the displayed order matches the alphabetical order
        expect(productNames).toEqual(sortedNames);
    });

    test('should sort products by name from Z to A', async ({ page }) => {
        // Open sort dropdown and select Z to A
        await page.locator('.product_sort_container').selectOption('za');

        // Get all product names
        const productNames = await page.locator('.inventory_item_name').allInnerTexts();
        
        // Create a copy of names and sort them in reverse alphabetical order
        const sortedNames = [...productNames].sort((a, b) => b.localeCompare(a));
        
        // Verify the displayed order matches the reverse alphabetical order
        expect(productNames).toEqual(sortedNames);
    });

    test('should sort products by price from low to high', async ({ page }) => {
        // Open sort dropdown and select price low to high
        await page.locator('.product_sort_container').selectOption('lohi');

        // Get all product prices
        const productPrices = await page.locator('.inventory_item_price').allInnerTexts();
        
        // Convert prices to numbers and create a sorted copy
        const prices = productPrices.map(price => parseFloat(price.replace('$', '')));
        const sortedPrices = [...prices].sort((a, b) => a - b);
        
        // Verify the displayed order matches the ascending price order
        expect(prices).toEqual(sortedPrices);
    });

    test('should sort products by price from high to low', async ({ page }) => {
        // Open sort dropdown and select price high to low
        await page.locator('.product_sort_container').selectOption('hilo');

        // Get all product prices
        const productPrices = await page.locator('.inventory_item_price').allInnerTexts();
        
        // Convert prices to numbers and create a sorted copy
        const prices = productPrices.map(price => parseFloat(price.replace('$', '')));
        const sortedPrices = [...prices].sort((a, b) => b - a);
        
        // Verify the displayed order matches the descending price order
        expect(prices).toEqual(sortedPrices);
    });

    test('should reset to default sort order after page refresh', async ({ page }) => {
        // Select price high to low
        await page.locator('.product_sort_container').selectOption('hilo');
        
        // Get prices before refresh
        const pricesBefore = await page.locator('.inventory_item_price').allInnerTexts();
        
        // Refresh the page
        await page.reload();
        
        // Get prices after refresh and verify they're in default order (A to Z)
        const namesAfter = await page.locator('.inventory_item_name').allInnerTexts();
        const sortedNames = [...namesAfter].sort();
        expect(namesAfter).toEqual(sortedNames);
        
        // Verify sort dropdown is reset to default
        const selectedOption = await page.locator('.product_sort_container').evaluate((el: HTMLSelectElement) => el.value);
        expect(selectedOption).toBe('az');
    });

    test.describe('social and footer', () => {
        test('should have working social media links', async ({ page }) => {
            // Check each social media link
            const socialLinks = {
                'Twitter': '.social_twitter a',
                'Facebook': '.social_facebook a',
                'LinkedIn': '.social_linkedin a'
            };

            for (const [platform, selector] of Object.entries(socialLinks)) {
                const link = page.locator(selector);
                await expect(link).toBeVisible();
                
                // Verify link has an href
                const href = await link.getAttribute('href');
                expect(href).toBeTruthy();
            }
        });

        test('should have valid footer content', async ({ page }) => {
            const footer = page.locator('.footer');
            await expect(footer).toBeVisible();
            
            // Verify copyright text contains year and company
            const footerText = await footer.textContent();
            expect(footerText).toMatch(/©\s+\d{4}/); // Any year format
            expect(footerText).toContain('Sauce Labs');
            
            // Verify footer links
            await expect(page.getByText('Terms of Service')).toBeVisible();
            await expect(page.getByText('Privacy Policy')).toBeVisible();
            
            // Verify footer is properly positioned at bottom
            const box = await footer.boundingBox();
            expect(box?.y).toBeGreaterThan(100); // Should be below content
        });
    });

    test.describe('product details', () => {
        test('should navigate to product detail page', async ({ page }) => {
            // Click product name
            await page.click('.inventory_item_name:has-text("Sauce Labs Backpack")');
            await expect(page).toHaveURL(/\/inventory-item.html/);
            
            // Verify detailed content is present
            await expect(page.locator('.inventory_details_name')).toHaveText('Sauce Labs Backpack');
            await expect(page.locator('.inventory_details_desc')).toBeVisible();
            await expect(page.locator('.inventory_details_price')).toBeVisible();
            
            // Verify back button works
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
            // Intercept image requests and simulate failure
            await page.route('**/*.jpg', route => route.abort('failed'));
            
            // Reload page with blocked images
            await page.reload();
            
            // Verify page still works and shows alt text
            const images = page.locator('.inventory_item img');
            await expect(images.first()).toBeVisible();
            const alt = await images.first().getAttribute('alt');
            expect(alt).toBeTruthy();
        });

        test('should handle invalid sort parameter manipulation', async ({ page }) => {
            // Try to set invalid sort option
            await page.evaluate(() => {
                const select = document.querySelector('.product_sort_container') as HTMLSelectElement;
                select.value = 'invalid_sort';
                select.dispatchEvent(new Event('change'));
            });

            // Should maintain default sort order
            const namesAfter = await page.locator('.inventory_item_name').allInnerTexts();
            const sortedNames = [...namesAfter].sort();
            expect(namesAfter).toEqual(sortedNames);
        });

    });

    test.describe('performance', () => {
        test('should load critical elements quickly', async ({ page }) => {
            // Start with a fresh page load
            await page.reload();
            
            // Critical elements should be visible within 1 second
            const criticalElements = [
                '.inventory_list',
                '.inventory_item:first-child',
                '.shopping_cart_link',
                '#react-burger-menu-btn'
            ];

            for (const selector of criticalElements) {
                const element = page.locator(selector);
                // Wait up to 1 second - critical elements should load fast
                await expect(element).toBeVisible({ timeout: 1000 });
            }
        });
    });

    test.describe('cart functionality from inventory', () => {
        test('should add and remove items from cart', async ({ page }) => {
            // Add first item to cart
            await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
            await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
            
            // Add second item to cart
            await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
            await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
            
            // Remove first item
            await page.click('[data-test="remove-sauce-labs-backpack"]');
            await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
            
            // Remove second item
            await page.click('[data-test="remove-sauce-labs-bike-light"]');
            await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
        });

        test('should verify add/remove button text changes', async ({ page }) => {
            const productId = 'sauce-labs-backpack';
            const addButton = page.locator(`[data-test="add-to-cart-${productId}"]`);
            const removeButton = page.locator(`[data-test="remove-${productId}"]`);

            // Initially should show "Add to cart"
            await expect(addButton).toBeVisible();
            await expect(removeButton).not.toBeVisible();
            await expect(addButton).toHaveText(/add to cart/i);

            // After adding, should show "Remove"
            await addButton.click();
            await expect(removeButton).toBeVisible();
            await expect(addButton).not.toBeVisible();
            await expect(removeButton).toHaveText(/remove/i);

            // After removing, should show "Add to cart" again
            await removeButton.click();
            await expect(addButton).toBeVisible();
            await expect(removeButton).not.toBeVisible();
        });

        test('should maintain cart count accuracy', async ({ page }) => {
            // Add multiple items
            const items = [
                'sauce-labs-backpack',
                'sauce-labs-bike-light',
                'sauce-labs-bolt-t-shirt'
            ];
            
            // Add items one by one and verify count
            for (let i = 0; i < items.length; i++) {
                await page.click(`[data-test="add-to-cart-${items[i]}"]`);
                await expect(page.locator('.shopping_cart_badge')).toHaveText(`${i + 1}`);
            }
            
            // Remove items one by one and verify count
            for (let i = items.length - 1; i >= 0; i--) {
                await page.click(`[data-test="remove-${items[i]}"]`);
                if (i === 0) {
                    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
                } else {
                    await expect(page.locator('.shopping_cart_badge')).toHaveText(`${i}`);
                }
            }
        });

        test('should handle rapid add/remove actions', async ({ page }) => {
            const productId = 'sauce-labs-backpack';
            
            // Rapidly add and remove
            await page.click(`[data-test="add-to-cart-${productId}"]`);
            await page.click(`[data-test="remove-${productId}"]`);
            await page.click(`[data-test="add-to-cart-${productId}"]`);
            
            // Verify final state
            await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
            await expect(page.locator(`[data-test="remove-${productId}"]`)).toBeVisible();
        });

        test('should update inventory count in cart icon', async ({ page }) => {
            // Get all add to cart buttons
            const addButtons = await page.locator('[data-test^="add-to-cart"]').all();
            expect(addButtons.length).toBeGreaterThan(0);
            
            // Add first three items
            for (let i = 0; i < 3; i++) {
                await addButtons[i].click();
                await expect(page.locator('.shopping_cart_badge')).toHaveText(`${i + 1}`);
            }
            
            // Remove items using remove buttons
            const removeButtons = await page.locator('[data-test^="remove"]').all();
            for (let i = 2; i >= 0; i--) {
                await removeButtons[i].click();
                if (i === 0) {
                    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
                } else {
                    await expect(page.locator('.shopping_cart_badge')).toHaveText(`${i}`);
                }
            }
        });

        test('should maintain cart state after page refresh', async ({ page }) => {
            // Add items
            await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
            await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
            
            // Refresh page
            await page.reload();
            
            // Verify cart state persists
            await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
            await expect(page.locator('[data-test="remove-sauce-labs-backpack"]')).toBeVisible();
            await expect(page.locator('[data-test="remove-sauce-labs-bike-light"]')).toBeVisible();
        });
    });
});