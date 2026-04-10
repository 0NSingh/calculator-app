import { test, expect } from '@playwright/test';

test.describe('Calculator App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage loads successfully', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('calculator displays on homepage', async ({ page }) => {
    await expect(page.locator('.bg-black')).toBeVisible();
  });

  test('calculator buttons are clickable', async ({ page }) => {
    const button7 = page.locator('button:has-text("7")');
    await expect(button7).toBeVisible();
    await button7.click();
  });

  test('sidebar is visible', async ({ page }) => {
    await expect(page.locator('text=Calculator')).toBeVisible();
    await expect(page.locator('text=Sessions (')).toBeVisible();
  });

  test('can create new session', async ({ page }) => {
    const addButton = page.locator('button[title="New session"]').first();
    await addButton.click();
    await page.waitForTimeout(500);
  });

  test('can switch between sessions and history tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Sessions \(\d+\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /History \(\d+\)/ })).toBeVisible();
    
    await page.getByRole('button', { name: /History \(\d+\)/ }).click();
  });

  test('sidebar can be collapsed', async ({ page }) => {
    const collapseButton = page.locator('button[title="Collapse sidebar"]');
    await collapseButton.click();
    
    const expandButton = page.locator('button[title="Expand sidebar"]');
    await expect(expandButton).toBeVisible();
  });

  test('sidebar can be expanded after collapse', async ({ page }) => {
    await page.locator('button[title="Collapse sidebar"]').click();
    await page.locator('button[title="Expand sidebar"]').click();
    await expect(page.locator('text=Sessions (')).toBeVisible();
  });
});
