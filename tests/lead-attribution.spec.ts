import { test, expect } from '@playwright/test';

// All third-party traffic is blocked; submission is synthetic, never sent.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
    if (route.request().url() === 'https://api.web3forms.com/submit') {
      return route.fulfill({ json: { success: true } });
    }
    return route.abort();
  });
});

async function submit(page) {
  await page.locator('#contactForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await expect(page.locator('#contactSuccess')).toBeVisible();
  return page.evaluate(() => Array.from((window as any).dataLayer || [], (x: any) => Array.from(x))
    .filter((x: any) => x[0] === 'event' && x[1] === 'generate_lead'));
}

test('training entry survives navigation to contact without query or fragment', async ({ page }) => {
  await page.goto('/training/?private=do-not-collect#fragment');
  await page.goto('/#contact');
  const events: any = await submit(page);
  expect(events).toHaveLength(1);
  expect(events[0][2]).toMatchObject({ landing_page: '/training/', lead_source_page: '/training/' });
  expect(JSON.stringify(events)).not.toContain('do-not-collect');
});

test('download entry is attributed', async ({ page }) => {
  await page.goto('/downloads/ai-readiness-checklist.html');
  await page.goto('/#contact');
  const events: any = await submit(page);
  expect(events[0][2]).toMatchObject({ landing_page: '/downloads/ai-readiness-checklist', lead_source_page: '/downloads/ai-readiness-checklist' });
});

test('storage unavailable still submits and emits a lead', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('unavailable'); } }); });
  await page.goto('/#contact');
  const events: any = await submit(page);
  expect(events).toHaveLength(1);
  expect(events[0][2]).toMatchObject({ landing_page: '/', lead_source_page: '/' });
});

test('failed submission never emits a lead', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route => route.fulfill({ json: { success: false } }));
  await page.goto('/#contact');
  await page.locator('#contactForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await expect(page.locator('#contactError')).toBeVisible();
  const events = await page.evaluate(() => Array.from((window as any).dataLayer || [], (x: any) => Array.from(x)).filter((x: any) => x[1] === 'generate_lead'));
  expect(events).toHaveLength(0);
});
