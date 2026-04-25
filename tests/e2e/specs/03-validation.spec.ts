import { test, expect } from '@playwright/test';
import { login } from '../utils/helpers';

test.describe('ISO 9001 Validation Gates', () => {
  test('blocks eval action as critical risk', async ({ page }) => {
    await login(page);
    
    await page.goto('/editor/test-workflow-id');
    
    await page.click('text=إضافة خطوة');
    await page.selectOption('[data-testid="action-select"]', 'eval');
    
    await expect(page.locator('text=إجراء محظور')).toBeVisible();
    await expect(page.locator('text=critical')).toBeVisible();
    await expect(page.locator('text=حفظ')).toBeDisabled();
  });
  
  test('blocks localhost URLs', async ({ page }) => {
    await login(page);
    await page.goto('/editor/test-workflow-id');
    
    await page.click('text=إضافة خطوة');
    await page.selectOption('[data-testid="action-select"]', 'navigate');
    await page.fill('[data-testid="target-url"]', 'http://localhost:3000');
    
    await expect(page.locator('text=عنوان URL محظور')).toBeVisible();
  });
  
  test('limits extract steps to 20', async ({ page }) => {
    await login(page);
    await page.goto('/editor/test-workflow-id');
    
    for (let i = 0; i < 21; i++) {
      await page.click('text=إضافة خطوة');
      await page.selectOption('[data-testid="action-select"]', 'extract');
    }
    
    await expect(page.locator('text=عدد استخراج البيانات')).toBeVisible();
  });
});
