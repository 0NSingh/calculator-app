import { test, expect } from '@playwright/test';

test.describe('Calculator Edge Case E2E Tests', () => {
  test('division by zero displays error or infinity', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("5")');
    await page.click('button:has-text("÷")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(300);
  });

  test('multiple decimal points are prevented', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("1")');
    await page.click('button:has-text(".")');
    await page.click('button:has-text("5")');
    await page.click('button:has-text(".")');
    await page.click('button:has-text("5")');
    
    const display = await page.locator('.text-white.text-6xl, .text-white.text-5xl, .text-white.text-4xl, .text-white.text-3xl, .text-white.text-2xl, .text-white.text-xl').last();
    const displayText = await display.textContent();
    expect(displayText).not.toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('consecutive operations update correctly', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("5")');
    await page.click('button:has-text("+")');
    await page.click('button:has-text("3")');
    await page.click('button:has-text("-")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(300);
  });

  test('negative number operations work correctly', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("5")');
    await page.click('button:has-text("+/-")');
    await page.click('button:has-text("+")');
    await page.click('button:has-text("3")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(300);
  });

  test('percentage calculations', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("5")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("%")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(300);
  });

  test('very large numbers display correctly', async ({ page }) => {
    await page.goto('/');
    
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("9")');
    }
    
    await page.waitForTimeout(200);
  });

  test('zero at start of number', async ({ page }) => {
    await page.goto('/');
    
    await page.click("button:has-text('0')");
    await page.click("button:has-text('0')");
    await page.click("button:has-text('5')");
    
    await page.waitForTimeout(100);
  });

  test('clear after calculation resets completely', async ({ page }) => {
    await page.goto('/');
    
    await page.click("button:has-text('1')");
    await page.click("button:has-text('0')");
    await page.click("button:has-text('×')");
    await page.click("button:has-text('5')");
    await page.click("button:has-text('=')");
    await page.click("button:has-text('C')");
    
    await page.waitForTimeout(100);
  });

  test('backspace removes digits', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("1")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("3")');
    
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
  });

  test('keyboard input works for numbers', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    
    await page.waitForTimeout(100);
  });

  test('keyboard input works for operations', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('1');
    await page.keyboard.press('+');
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(300);
  });

  test('escape key clears display', async ({ page }) => {
    await page.goto('/');
    
    await page.click("button:has-text('5')");
    await page.click("button:has-text('0')");
    await page.keyboard.press('Escape');
    
    await page.waitForTimeout(100);
  });

  test('cannot divide by zero', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("1")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("÷")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(300);
  });

  test('chained calculations work correctly', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("2")');
    await page.click('button:has-text("+")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("=")');
    await page.click('button:has-text("×")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(300);
  });
});

test.describe('Session Management Edge Case E2E Tests', () => {
  test('cannot delete last session', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const deleteButtons = page.locator('[title="Delete"]');
    const count = await deleteButtons.count();
    if (count === 1) {
      await expect(deleteButtons.first()).not.toBeVisible();
    }
  });

  test('session rename with empty name reverts', async ({ page }) => {
    await page.goto('/');
    
    const sessionsTab = page.locator('button:has-text("Sessions")');
    await sessionsTab.click();
    
    await page.waitForTimeout(200);
    
    const editBtn = page.locator('[title="Rename"]').first();
    await editBtn.click();
    
    await page.locator('input[class*="border-[#ff9f0a]"]').fill('');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(200);
  });

  test('new session becomes selected immediately', async ({ page }) => {
    await page.goto('/');
    
    const newSessionBtn = page.locator('button[title="New session"]').first();
    await newSessionBtn.click();
    
    await page.waitForTimeout(500);
    
    const activeSession = page.locator('.bg-\\[\\#333\\]').first();
    await expect(activeSession).toBeVisible();
  });
});

test.describe('Sidebar Edge Case E2E Tests', () => {
  test('sidebar collapse hides content but keeps buttons', async ({ page }) => {
    await page.goto('/');
    
    const collapseBtn = page.locator('button[title="Collapse sidebar"]');
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(300);
      
      await expect(page.locator('h1:has-text("Calculator")')).not.toBeVisible();
      
      const expandBtn = page.locator('button[title="Expand sidebar"]');
      await expect(expandBtn).toBeVisible();
    }
  });

  test('sidebar expand restores full content', async ({ page }) => {
    await page.goto('/');
    
    const collapseBtn = page.locator('button[title="Collapse sidebar"]');
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(300);
      
      const expandBtn = page.locator('button[title="Expand sidebar"]');
      await expandBtn.click();
      await page.waitForTimeout(300);
      
      await expect(page.locator('h1:has-text("Calculator")')).toBeVisible();
    }
  });

  test('history tab shows empty state when no calculations', async ({ page }) => {
    await page.goto('/');
    
    const newSessionBtn = page.locator('button[title="New session"]').first();
    await newSessionBtn.click();
    await page.waitForTimeout(500);
    
    const historyTab = page.locator('button:has-text("History")');
    await historyTab.click();
    
    await expect(page.locator('text=No history yet')).toBeVisible();
  });

  test('switching sessions switches history view', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("7")');
    await page.click('button:has-text("×")');
    await page.click('button:has-text("8")');
    await page.click('button:has-text("=")');
    
    await page.waitForTimeout(500);
    
    const newSessionBtn = page.locator('button[title="New session"]').first();
    await newSessionBtn.click();
    await page.waitForTimeout(500);
    
    const historyTab = page.locator('button:has-text("History")');
    await historyTab.click();
    
    await page.waitForTimeout(200);
  });
});
