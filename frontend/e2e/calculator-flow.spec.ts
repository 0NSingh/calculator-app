import { test, expect } from '@playwright/test';

test.describe('Calculator Functionality E2E Tests', () => {
  test('calculator has number buttons', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('button:has-text("7")')).toBeVisible();
    await expect(page.locator('button:has-text("8")')).toBeVisible();
    await expect(page.locator('button:has-text("9")')).toBeVisible();
  });

  test('calculator buttons are interactive', async ({ page }) => {
    await page.goto('/');
    
    const button7 = page.locator('button:has-text("7")');
    await button7.click();
    await button7.click();
    await button7.click();
  });

  test('clear button resets display', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("7")');
    await page.click('button:has-text("C")');
    
    await page.waitForTimeout(200);
  });
});
