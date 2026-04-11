import { test, expect, Page } from '@playwright/test';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:8000/api/v1';
const generateEmail = () => `e2e_${Date.now()}@test.com`;

async function createUserAndLogin(page: Page, email: string, username: string) {
  const signupResp = await page.request.post(`${API_BASE}/auth/signup`, {
    data: { email, username, password: 'TestPass123' }
  });
  if (!signupResp.ok()) {
    throw new Error(`Signup failed: ${await signupResp.text()}`);
  }
  
  const loginResp = await page.request.post(`${API_BASE}/auth/access`, {
    data: { email, password: 'TestPass123' }
  });
  if (!loginResp.ok()) {
    throw new Error(`Login failed: ${await loginResp.text()}`);
  }
  
  return (await loginResp.json()).access_token;
}

test.describe('Frontend-Backend Integration Tests', () => {
  test('user profile shows username after login', async ({ page }) => {
    const email = generateEmail();
    await createUserAndLogin(page, email, 'testuser');
    
    await page.goto('/user/signin');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    await expect(page.locator('text=testuser')).toBeVisible({ timeout: 5000 });
  });

  test('backend API creates and retrieves sessions correctly', async ({ page }) => {
    const email = generateEmail();
    const token = await createUserAndLogin(page, email, 'apiuser');
    
    const createResp = await page.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'API Test Session' }
    });
    expect(createResp.ok()).toBeTruthy();
    const session = await createResp.json();
    expect(session.name).toBe('API Test Session');
    expect(session.id).toBeDefined();
    
    const getResp = await page.request.get(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(getResp.ok()).toBeTruthy();
    const sessions = await getResp.json();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.some((s: any) => s.name === 'API Test Session')).toBeTruthy();
  });

  test('backend API calculates and saves to history', async ({ page }) => {
    const email = generateEmail();
    const token = await createUserAndLogin(page, email, 'calcuser');
    
    const sessionResp = await page.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Calculation Test' }
    });
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json();
    const sessionId = session.id;
    
    const calcResp = await page.request.post(`${API_BASE}/calculate`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { expression: '2 + 2', session_id: sessionId }
    });
    expect(calcResp.ok()).toBeTruthy();
    expect((await calcResp.json()).result).toBe('4');
    
    await page.waitForTimeout(500);
    
    const historyResp = await page.request.get(`${API_BASE}/history/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(historyResp.ok()).toBeTruthy();
    const history = await historyResp.json();
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  test('sessions load from backend on page load', async ({ page }) => {
    const email = generateEmail();
    const token = await createUserAndLogin(page, email, 'loaduser');
    
    await page.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Pre-existing Session' }
    });
    
    await page.goto('/user/signin');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/);
    
    await expect(page.locator('span:has-text("Pre-existing Session")')).toBeVisible({ timeout: 5000 });
  });

  test('history loads from backend on tab switch', async ({ page }) => {
    const email = generateEmail();
    const token = await createUserAndLogin(page, email, 'histuser');
    
    const sessionResp = await page.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'History Load Test' }
    });
    const sessionId = (await sessionResp.json()).id;
    
    await page.request.post(`${API_BASE}/calculate`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { expression: '15 * 3', session_id: sessionId }
    });
    
    await page.goto('/user/signin');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    await page.getByRole('button', { name: /History \(\d+\)/ }).click();
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=15 * 3')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('User Data Isolation Integration Tests', () => {
  test('user cannot access another user sessions', async ({ page }) => {
    const email1 = `owner_${Date.now()}@test.com`;
    const email2 = `intruder_${Date.now()}@test.com`;
    
    const token1 = await createUserAndLogin(page, email1, 'Owner');
    await createUserAndLogin(page, email2, 'Intruder');
    
    const sessionResp = await page.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token1}` },
      data: { name: 'Private Session' }
    });
    const privateSessionId = (await sessionResp.json()).id;
    
    const historyResp = await page.request.get(`${API_BASE}/history/${privateSessionId}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    expect(historyResp.ok()).toBeTruthy();
    
    const login2 = await page.request.post(`${API_BASE}/auth/access`, {
      data: { email: email2, password: 'TestPass123' }
    });
    const token2 = (await login2.json()).access_token;
    
    const unauthorizedAccess = await page.request.get(`${API_BASE}/history/${privateSessionId}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    expect(unauthorizedAccess.status()).toBe(404);
  });

  test('each user has separate session list', async ({ page, context }) => {
    const email1 = `user1_${Date.now()}@test.com`;
    const email2 = `user2_${Date.now()}@test.com`;
    
    const token1 = await createUserAndLogin(page, email1, 'FirstUser');
    const page2 = await context.newPage();
    await createUserAndLogin(page2, email2, 'SecondUser');
    
    await page.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token1}` },
      data: { name: 'User1 Only' }
    });
    
    const login2 = await page2.request.post(`${API_BASE}/auth/access`, {
      data: { email: email2, password: 'TestPass123' }
    });
    const token2 = (await login2.json()).access_token;
    await page2.request.post(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token2}` },
      data: { name: 'User2 Only' }
    });
    
    const sessions1 = await (await page.request.get(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token1}` }
    })).json();
    const sessions2 = await (await page2.request.get(`${API_BASE}/sessions`, {
      headers: { Authorization: `Bearer ${token2}` }
    })).json();
    
    expect(sessions1.some((s: any) => s.name === 'User1 Only')).toBeTruthy();
    expect(sessions1.some((s: any) => s.name === 'User2 Only')).toBeFalsy();
    expect(sessions2.some((s: any) => s.name === 'User2 Only')).toBeTruthy();
    expect(sessions2.some((s: any) => s.name === 'User1 Only')).toBeFalsy();
  });
});
