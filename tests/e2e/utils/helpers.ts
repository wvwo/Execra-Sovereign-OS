import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export async function login(page: Page, email: string = 'test@example.com') {
  await page.goto('/login');
  
  await page.evaluate((token) => {
    document.cookie = `token=${token}; path=/; SameSite=Strict`;
  }, 'mock-jwt-token-for-testing-only');
  
  await page.goto('/');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

export async function uploadVideo(page: Page, videoPath: string) {
  await page.goto('/upload');
  
  const dropZone = page.locator('[data-testid="dropzone"]');
  await expect(dropZone).toBeVisible();
  
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    dropZone.click()
  ]);
  
  await fileChooser.setFiles(videoPath);
  
  await expect(page.locator('text=تم استخراج الخطوات')).toBeVisible({ 
    timeout: 120000 
  });
}

export async function createMockVideo(outputPath: string, duration: number = 5) {
  const { execSync } = require('child_process');
  execSync(`ffmpeg -f lavfi -i testsrc=duration=${duration}:size=1920x1080:rate=1 -pix_fmt yuv420p ${outputPath} -y`);
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export async function waitForWebSocket(page: Page) {
  await page.waitForFunction(() => {
    return (window as any).socketConnected === true;
  }, { timeout: 10000 });
}
