import { test, expect } from '@playwright/test';

test.describe('Auth Pages E2E Tests', () => {
  test('signup page loads', async ({ page }) => {
    await page.goto('/user/signup');
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('signin page loads', async ({ page }) => {
    await page.goto('/user/signin');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page has link to signin', async ({ page }) => {
    await page.goto('/user/signup');
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('signin page has link to signup', async ({ page }) => {
    await page.goto('/user/signin');
    await expect(page.locator('text=Create one')).toBeVisible();
  });

  test('can navigate from signup to signin', async ({ page }) => {
    await page.goto('/user/signup');
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/user/signin');
  });

  test('can navigate from signin to signup', async ({ page }) => {
    await page.goto('/user/signin');
    await page.click('text=Create one');
    await expect(page).toHaveURL('/user/signup');
  });

  test('signup form has all required fields', async ({ page }) => {
    await page.goto('/user/signup');
    const requiredInputs = await page.locator('input:required').count();
    expect(requiredInputs).toBeGreaterThanOrEqual(3);
  });
});
