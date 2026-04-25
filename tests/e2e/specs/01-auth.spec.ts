import { test, expect } from '@playwright/test';
import { login } from '../utils/helpers';

test.describe('Authentication & Authorization', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/\/login/);
  });
  
  test('successful OAuth2 login', async ({ page }) => {
    await login(page);
    await expect(page.locator('text=رفع فيديو جديد')).toBeVisible();
  });
  
  test('logout clears session', async ({ page }) => {
    await login(page);
    await page.click('[data-testid="user-menu"]');
    await page.click('text=تسجيل الخروج');
    
    await expect(page).toHaveURL(/\/login/);
    
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    expect(tokenCookie).toBeUndefined();
  });
  
  test('rate limiting blocks excessive requests', async ({ page }) => {
    await login(page);
    
    const requests = Array(70).fill(null).map(() => 
      page.request.get('/api/v1/workflows')
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBe(true);
  });
});
