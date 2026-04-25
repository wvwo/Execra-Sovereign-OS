import { test, expect } from '@playwright/test';
import { login, uploadVideo, waitForWebSocket } from '../utils/helpers';
import * as path from 'path';

test.describe('Workflow Execution with WebSocket', () => {
  const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
  
  test('execute workflow with real-time updates', async ({ page }) => {
    await login(page);
    
    await uploadVideo(page, testVideoPath);
    
    await page.click('text=تشغيل الأتمتة');
    await expect(page).toHaveURL(/\/execute/);
    
    await waitForWebSocket(page);
    
    await page.click('text=تشغيل الأتمتة');
    
    const stepStatuses = page.locator('[data-testid="step-status"]');
    await expect(stepStatuses.first()).toHaveAttribute('data-status', 'running', { timeout: 30000 });
    
    await expect(page.locator('text=اكتمل التنفيذ')).toBeVisible({ timeout: 300000 });
    
    const successSteps = page.locator('[data-status="success"]');
    await expect(successSteps).toHaveCount.greaterThan(0);
  });
  
  test('CAPTCHA human-in-the-loop', async ({ page }) => {
    await login(page);
    
    await page.goto('/execute/captcha-test');
    
    await page.click('text=تشغيل الأتمتة');
    
    await expect(page.locator('text=تحقق أمني مطلوب')).toBeVisible({ timeout: 60000 });
    
    const status = page.locator('[data-testid="execution-status"]');
    await expect(status).toHaveText('في انتظار التدخل البشري');
    
    await page.click('text=تم الحل');
    
    await expect(page.locator('text=جاري الاستئناف')).toBeVisible();
  });
  
  test('execution screenshots are displayed from S3', async ({ page }) => {
    await login(page);
    await uploadVideo(page, testVideoPath);
    
    await page.click('text=تشغيل الأتمتة');
    await expect(page.locator('text=اكتمل التنفيذ')).toBeVisible({ timeout: 300000 });
    
    const screenshots = page.locator('[data-testid="screenshot-compare"]');
    await expect(screenshots).toBeVisible();
    
    const images = page.locator('img[src*="minio"]');
    await expect(images.first()).toBeVisible();
  });
});
