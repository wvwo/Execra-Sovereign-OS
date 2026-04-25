import { test, expect } from '@playwright/test';
import { login, uploadVideo } from '../utils/helpers';
import * as path from 'path';

test.describe('Audit Trail & Compliance', () => {
  const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
  
  test('audit logs are recorded for execution', async ({ page }) => {
    await login(page);
    
    await uploadVideo(page, testVideoPath);
    await page.click('text=تشغيل الأتمتة');
    await expect(page.locator('text=اكتمل التنفيذ')).toBeVisible({ timeout: 300000 });
    
    await page.click('text=لوحة الرقابة');
    
    await expect(page.locator('text=سجل الأحداث')).toBeVisible();
    const logs = page.locator('[data-testid="audit-log-row"]');
    await expect(logs).toHaveCount.greaterThan(0);
  });
  
  test('integrity verification shows chain is valid', async ({ page }) => {
    await login(page);
    await page.goto('/audit');
    
    await page.click('text=التحقق');
    
    await expect(page.locator('text=السلسلة سليمة')).toBeVisible({ timeout: 10000 });
    
    const badge = page.locator('[data-testid="integrity-badge"]');
    await expect(badge).toHaveClass(/bg-green-100/);
  });
  
  test('KPIs display correctly', async ({ page }) => {
    await login(page);
    await page.goto('/audit');
    
    await expect(page.locator('text=نسبة النجاح')).toBeVisible();
    await expect(page.locator('text=متوسط الوقت')).toBeVisible();
    await expect(page.locator('text=معدل الخطأ')).toBeVisible();
    
    const successRate = page.locator('[data-testid="kpi-success-rate"]');
    await expect(successRate).toContainText('%');
  });
  
  test('compliance report shows ISO status', async ({ page }) => {
    await login(page);
    await page.goto('/audit');
    
    await page.click('text=تقرير الامتثال');
    
    await expect(page.locator('text=ISO 27001')).toBeVisible();
    await expect(page.locator('text=ISO 9001')).toBeVisible();
  });
});
