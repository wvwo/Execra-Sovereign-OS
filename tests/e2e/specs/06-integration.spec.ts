import { test, expect } from '@playwright/test';
import { login, uploadVideo } from '../utils/helpers';
import * as path from 'path';

test.describe('Full Integration Pipeline', () => {
  const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
  
  test('end-to-end: upload → analyze → validate → execute → audit', async ({ page }) => {
    await login(page);
    
    await uploadVideo(page, testVideoPath);
    
    await expect(page.locator('text=التحقق: ناجح')).toBeVisible();
    
    await page.click('[data-testid="step-card"]:first-child');
    await page.fill('[data-testid="step-description"]', 'خطوة معدلة للاختبار');
    await page.click('text=حفظ التعديلات');
    
    await page.click('text=تشغيل الأتمتة');
    await expect(page.locator('text=اكتمل التنفيذ')).toBeVisible({ timeout: 300000 });
    
    await page.click('text=لوحة الرقابة');
    await expect(page.locator('text=سجل الأحداث')).toBeVisible();
    
    await page.click('text=التحقق');
    await expect(page.locator('text=السلسلة سليمة')).toBeVisible();
    
    const metricsResponse = await page.request.get('http://localhost:9090/api/v1/query?query=autopilot_workflow_executions_total');
    expect(metricsResponse.status()).toBe(200);
    const metrics = await metricsResponse.json();
    expect(metrics.data.result.length).toBeGreaterThan(0);
  });
  
  test('fallback VLM works when OpenAI fails', async ({ page }) => {
    await login(page);
    
    await uploadVideo(page, testVideoPath);
    
    await page.click('text=تفاصيل المخطط');
    await expect(page.locator('text=Qwen')).toBeVisible();
  });
});
