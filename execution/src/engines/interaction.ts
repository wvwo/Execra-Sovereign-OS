import { Page, Locator } from 'patchright';
import { Point } from '../types/workflow';
import { BezierEngine } from './bezier';

export async function getCurrentMousePosition(page: Page): Promise<Point> {
  return page.evaluate(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }));
}

export async function humanMove(page: Page, targetX: number, targetY: number, targetSize: number = 50): Promise<void> {
  const currentPos = await getCurrentMousePosition(page);
  const path = BezierEngine.generatePath(currentPos, { x: targetX, y: targetY }, targetSize);

  for (let i = 0; i < path.length; i++) {
    await page.mouse.move(path[i].x, path[i].y);
    if (i < path.length - 1) {
      await page.waitForTimeout(5 + Math.random() * 15);
    }
  }
  await page.waitForTimeout(50 + Math.random() * 150);
}

export async function humanClick(page: Page, locator: Locator, stepId: number): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Step ${stepId}: Element not found for click`);

  const targetX = box.x + 5 + Math.random() * (box.width - 10);
  const targetY = box.y + 5 + Math.random() * (box.height - 10);

  await humanMove(page, targetX, targetY, Math.min(box.width, box.height));

  const clickDuration = 80 + Math.random() * 70;
  await page.mouse.down();
  await page.waitForTimeout(clickDuration);
  await page.mouse.up();
}

export async function humanType(page: Page, locator: Locator, text: string, wpm: number = 45): Promise<void> {
  await locator.click();
  await page.waitForTimeout(100 + Math.random() * 200);

  const charsPerMs = wpm * 5 / 60000;

  for (let i = 0; i < text.length; i++) {
    let delay = 1 / charsPerMs;

    if (i > 0 && [' ', '.', ',', '!', '?'].includes(text[i - 1])) {
      delay += 200 + Math.random() * 300;
    }

    if (Math.random() < 0.02 && text[i] !== ' ') {
      const wrongChar = String.fromCharCode(text[i].charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
      await page.keyboard.type(wrongChar, { delay: delay * 0.5 });
      await page.waitForTimeout(100 + Math.random() * 200);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(50 + Math.random() * 100);
    }

    await page.keyboard.type(text[i], { delay: delay * (0.8 + Math.random() * 0.4) });
  }
}
