import { Page } from 'patchright';
import axios from 'axios';

const CAPTCHA_SELECTORS = [
  'iframe[src*="recaptcha"]',
  'iframe[src*="hcaptcha"]',
  '.g-recaptcha',
  '#rc-anchor-container',
  '[data-sitekey]',
  '.cf-turnstile'
];

export interface CaptchaResult {
  detected: boolean;
  selector?: string;
}

export async function detectCaptcha(page: Page): Promise<CaptchaResult> {
  for (const selector of CAPTCHA_SELECTORS) {
    const element = await page.$(selector);
    if (element) {
      return { detected: true, selector };
    }
  }
  return { detected: false };
}

export async function handleCaptchaHumanInTheLoop(
  page: Page,
  sessionId: string,
  sentinelUrl: string
): Promise<void> {
  const captcha = await detectCaptcha(page);
  if (!captcha.detected) return;

  // Log to Sentinel
  await axios.post(`${sentinelUrl}/api/v1/audit/log`, {
    session_id: sessionId,
    event_type: 'CAPTCHA_ENCOUNTERED',
    action: 'HUMAN_IN_THE_LOOP_TRIGGERED',
    status: 'success',
    severity: 'warning',
    details: { selector: captcha.selector, url: page.url() }
  }).catch(() => {});

  // Pause execution and wait for user intervention
  // In production: emit WebSocket event to frontend
  console.warn(`[${sessionId}] CAPTCHA detected. Pausing for human intervention...`);

  // Wait up to 5 minutes for CAPTCHA to disappear
  await page.waitForFunction((selectors) => {
    return !selectors.some((sel: string) => document.querySelector(sel));
  }, CAPTCHA_SELECTORS, { timeout: 300000 });

  console.log(`[${sessionId}] CAPTCHA resolved by human. Resuming...`);
}
