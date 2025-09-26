import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutInfoPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly continueButton: Locator;
  private readonly cancelButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  /**
   * Fill checkout information form
   */
  async fillForm(info: CheckoutInfo): Promise<void> {
    // Clear existing values first
    await this.clearForm();

    // Fill in new values and wait for changes to be applied
    if (info.firstName) {
      await this.firstNameInput.fill(info.firstName);
      await this.firstNameInput.evaluate(e => e.blur());
    }
    if (info.lastName) {
      await this.lastNameInput.fill(info.lastName);
      await this.lastNameInput.evaluate(e => e.blur());
    }
    if (info.postalCode) {
      await this.postalCodeInput.fill(info.postalCode);
      await this.postalCodeInput.evaluate(e => e.blur());
    }
  }

  /**
   * Continue to the next step
   */
  async continue(): Promise<void> {
    // Verify form state first
    const isFirstNameEmpty = (await this.firstNameInput.inputValue()) === '';
    const isLastNameEmpty = (await this.lastNameInput.inputValue()) === '';
    const isPostalCodeEmpty = (await this.postalCodeInput.inputValue()) === '';

    if (isFirstNameEmpty || isLastNameEmpty || isPostalCodeEmpty) {
      await this.continueButton.click();
      // Wait for error message
      await expect(this.errorMessage).toBeVisible();
      return;
    }

    // If all fields are filled, proceed
    await this.continueButton.click();

    // Wait for URL change
    await expect(this.page).toHaveURL(/.*checkout-step-two.html/, { timeout: 10000 });
  }

  /**
   * Cancel checkout and return to cart
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.page).toHaveURL(/.*cart.html/);
  }

  /**
   * Get current error message if any
   */
  async getErrorMessage(): Promise<string> {
    const isVisible = await this.errorMessage.isVisible();
    return isVisible ? (await this.errorMessage.textContent()) || '' : '';
  }

  /**
   * Fill and submit form
   */
  async fillAndContinue(info: CheckoutInfo): Promise<void> {
    await this.fillForm(info);
    await this.continue();
  }

  /**
   * Validate form fields
   */
  async validateFields(): Promise<boolean> {
    const isFirstNameValid = await this.firstNameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    const isLastNameValid = await this.lastNameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    const isPostalCodeValid = await this.postalCodeInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );

    return isFirstNameValid && isLastNameValid && isPostalCodeValid;
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.postalCodeInput.clear();
  }
}

export class CheckoutOverviewPage extends BasePage {
  private readonly finishButton: Locator;
  private readonly cancelButton: Locator;
  private readonly subtotalLabel: Locator;
  private readonly taxLabel: Locator;
  private readonly totalLabel: Locator;
  private readonly itemList: Locator;

  constructor(page: Page) {
    super(page);
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel = page.locator('.summary_tax_label');
    this.totalLabel = page.locator('.summary_total_label');
    this.itemList = page.locator('.cart_list');
  }

  /**
   * Complete the checkout process
   */
  async finishCheckout(): Promise<void> {
    await this.finishButton.click();
    await expect(this.page).toHaveURL(/.*checkout-complete.html/);
  }

  /**
   * Cancel and return to inventory
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.page).toHaveURL(/.*inventory.html/);
  }

  /**
   * Get the subtotal amount
   */
  async getSubtotal(): Promise<number> {
    const subtotalText = (await this.subtotalLabel.textContent()) || '';
    return parseFloat(subtotalText.replace(/[^0-9.-]+/g, ''));
  }

  /**
   * Get the tax amount
   */
  async getTax(): Promise<number> {
    const taxText = (await this.taxLabel.textContent()) || '';
    return parseFloat(taxText.replace(/[^0-9.-]+/g, ''));
  }

  /**
   * Get the total amount
   */
  async getTotal(): Promise<number> {
    const totalText = (await this.totalLabel.textContent()) || '';
    return parseFloat(totalText.replace(/[^0-9.-]+/g, ''));
  }

  /**
   * Verify the total calculation
   */
  async verifyTotalCalculation(): Promise<boolean> {
    const subtotal = await this.getSubtotal();
    const tax = await this.getTax();
    const total = await this.getTotal();
    return Math.abs(subtotal + tax - total) < 0.01; // Account for floating point precision
  }

  /**
   * Get list of items in the order
   */
  async getOrderItems(): Promise<{ name: string; quantity: number; price: string }[]> {
    const items = await this.itemList.locator('.cart_item').all();
    return Promise.all(
      items.map(async item => ({
        name: (await item.locator('.inventory_item_name').textContent()) || '',
        quantity: parseInt((await item.locator('.cart_quantity').textContent()) || '0', 10),
        price: (await item.locator('.inventory_item_price').textContent()) || '',
      }))
    );
  }
}
