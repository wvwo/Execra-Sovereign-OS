import { test, expect } from '@playwright/test';
import { login, createMockVideo } from '../utils/helpers';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Video Upload & Workflow Generation', () => {
  const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
  
  test.beforeAll(() => {
    if (!fs.existsSync(path.dirname(testVideoPath))) {
      fs.mkdirSync(path.dirname(testVideoPath), { recursive: true });
    }
    if (!fs.existsSync(testVideoPath)) {
      createMockVideo(testVideoPath, 5);
    }
  });
  
  test('upload MP4 video and generate workflow', async ({ page }) => {
    await login(page);
    await page.goto('/upload');
    
    const dropZone = page.locator('[data-testid="dropzone"]');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      dropZone.click()
    ]);
    await fileChooser.setFiles(testVideoPath);
    
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    await expect(page.locator('text=تم استخراج الخطوات')).toBeVisible({ 
      timeout: 120000 
    });
    
    await expect(page.locator('[data-testid="workflow-timeline"]')).toBeVisible();
    const steps = page.locator('[data-testid="step-card"]');
    await expect(steps).toHaveCount.greaterThan(0);
  });
  
  test('rejects files larger than 100MB', async ({ page }) => {
    await login(page);
    await page.goto('/upload');
    
    const oversizedPath = path.join(__dirname, '../fixtures/oversized.mp4');
    fs.writeFileSync(oversizedPath, Buffer.alloc(101 * 1024 * 1024));
    
    const dropZone = page.locator('[data-testid="dropzone"]');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      dropZone.click()
    ]);
    await fileChooser.setFiles(oversizedPath);
    
    await expect(page.locator('text=حجم الملف يتجاوز')).toBeVisible();
    
    fs.unlinkSync(oversizedPath);
  });
  
  test('rejects invalid file formats', async ({ page }) => {
    await login(page);
    await page.goto('/upload');
    
    const invalidPath = path.join(__dirname, '../fixtures/test.txt');
    fs.writeFileSync(invalidPath, 'not a video');
    
    const dropZone = page.locator('[data-testid="dropzone"]');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      dropZone.click()
    ]);
    await fileChooser.setFiles(invalidPath);
    
    await expect(page.locator('text=صيغة غير مدعومة')).toBeVisible();
    
    fs.unlinkSync(invalidPath);
  });
  
  test('privacy notice is displayed', async ({ page }) => {
    await login(page);
    await page.goto('/upload');
    
    await expect(page.locator('text=سيتم حذف الفيديو')).toBeVisible();
  });
});
