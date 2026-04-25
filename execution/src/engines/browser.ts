import { chromium, Browser, BrowserContext, Page } from 'patchright';

export interface BrowserConfig {
  headless?: boolean;
  proxy?: string;
}

export async function launchStealthBrowser(config: BrowserConfig = {}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const browser = await chromium.launch({
    headless: config.headless ?? false,
    proxy: config.proxy ? { server: config.proxy } : undefined,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--window-size=1920,1080',
      '--start-maximized'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    permissions: ['notifications'],
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // @ts-ignore
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    // @ts-ignore
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    // @ts-ignore
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
      ]
    });
    
    // @ts-ignore
    window.chrome = { runtime: {} };
    
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  return { browser, context, page };
}
