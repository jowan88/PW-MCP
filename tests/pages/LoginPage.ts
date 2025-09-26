import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type UserType =
  | 'standard_user'
  | 'locked_out_user'
  | 'problem_user'
  | 'performance_glitch_user'
  | 'error_user'
  | 'visual_user';

export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly logo: Locator;
  private readonly credentialsInfo: Locator;
  private readonly passwordInfo: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.logo = page.locator('.login_logo');
    this.credentialsInfo = page.locator('.login_credentials');
    this.passwordInfo = page.locator('.login_password');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com/');
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Perform login with given credentials
   */
  async login(username: UserType, password = 'secret_sauce', checkSuccess = true): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    if (checkSuccess && username !== 'locked_out_user') {
      // For successful logins, we should navigate to inventory
      await expect(this.page).toHaveURL(/.*inventory.html/);
    } else if (username === 'locked_out_user') {
      // For locked users, we should stay on login page and see error
      await expect(this.page).toHaveURL('https://www.saucedemo.com/');
      await expect(this.errorMessage).toBeVisible();
    }
  }

  /**
   * Submit login form with any credentials (including empty)
   */
  async submitLogin(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Get the current error message if any
   */
  async getErrorMessage(): Promise<string> {
    const isVisible = await this.errorMessage.isVisible();
    return isVisible ? (await this.errorMessage.textContent()) || '' : '';
  }

  /**
   * Verify if form fields are properly validated
   */
  async validateForm(): Promise<boolean> {
    const usernameValidation = await this.usernameInput.evaluate(
      el => (el as HTMLInputElement).validity.valid
    );
    const passwordValidation = await this.passwordInput.evaluate(
      el => (el as HTMLInputElement).validity.valid
    );
    return usernameValidation && passwordValidation;
  }

  /**
   * Get all available usernames from the credentials info section
   */
  async getAvailableUsernames(): Promise<string[]> {
    const credentialsText = (await this.credentialsInfo.textContent()) || '';
    return credentialsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes('Accepted usernames are:'));
  }

  /**
   * Get the standard password from the info section
   */
  async getStandardPassword(): Promise<string> {
    const passwordText = (await this.passwordInfo.textContent()) || '';
    return passwordText.replace('Password for all users:', '').trim();
  }

  /**
   * Verify the logo is displayed correctly
   */
  async verifyLogo(): Promise<void> {
    await expect(this.logo).toBeVisible();
    await expect(this.logo).toHaveText('Swag Labs');
  }

  /**
   * Handle keyboard navigation through the form
   */
  async navigateWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('Tab');
    await expect(this.usernameInput).toBeFocused();

    await this.page.keyboard.type('standard_user');
    await this.page.keyboard.press('Tab');
    await expect(this.passwordInput).toBeFocused();

    await this.page.keyboard.type('secret_sauce');
    await this.page.keyboard.press('Tab');
    await expect(this.loginButton).toBeFocused();
  }

  /**
   * Verify that all required elements are present and visible
   */
  async verifyPageElements(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.usernameInput).toHaveAttribute('placeholder', 'Username');

    await expect(this.passwordInput).toBeVisible();
    await expect(this.passwordInput).toHaveAttribute('placeholder', 'Password');
    await expect(this.passwordInput).toHaveAttribute('type', 'password');

    await expect(this.loginButton).toBeVisible();
    await expect(this.loginButton).toHaveText('Login');

    await expect(this.logo).toBeVisible();
    await expect(this.credentialsInfo).toBeVisible();
    await expect(this.passwordInfo).toBeVisible();
  }
}
