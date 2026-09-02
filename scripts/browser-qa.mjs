import { chromium } from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function computed(page, selector, property) {
  return page.locator(selector).evaluate((el, prop) => getComputedStyle(el)[prop], property);
}

async function waitForFocusedId(page, id, timeout = 1200) {
  await page.waitForFunction(
    expectedId => document.activeElement?.id === expectedId,
    id,
    { timeout }
  );
}

async function assertNoHorizontalOverflow(page, viewport, label) {
  const dimensions = await page.locator('body').evaluate(el => ({
    body: el.scrollWidth,
    document: document.documentElement.scrollWidth
  }));
  const width = Math.max(dimensions.body, dimensions.document);
  assert(width <= viewport.width + 2, `${label} horizontal overflow at ${viewport.width}x${viewport.height}: ${width}px`);
}

const browser = await chromium.launch({ headless: true });
try {
  const desktopViewport = { width: 1363, height: 936 };
  const desktop = await browser.newContext({ viewport: desktopViewport });
  const page = await desktop.newPage();
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });

  assert(await computed(page, '#menuToggle', 'display') === 'none', 'Desktop menu trigger must be hidden.');
  assert(await computed(page, '#cvLink', 'display') === 'none', 'Hidden CV link must not render.');
  await assertNoHorizontalOverflow(page, desktopViewport, 'Desktop');
  await desktop.close();

  const noJs = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/', { waitUntil: 'domcontentloaded' });
  assert(await computed(noJsPage, '#boot', 'display') === 'none', 'Boot overlay must fail open without JavaScript.');
  const homeReveal = noJsPage.locator('.reveal').first();
  assert(await homeReveal.count(), 'Expected reveal content on homepage.');
  assert(Number(await homeReveal.evaluate(el => getComputedStyle(el).opacity)) > 0.9, 'Homepage reveal content must remain visible without JavaScript.');
  await noJsPage.goto(base + '/work/tfc-orders-tracker/', { waitUntil: 'domcontentloaded' });
  const caseReveal = noJsPage.locator('.reveal').first();
  assert(await caseReveal.count(), 'Expected reveal content on case study.');
  assert(Number(await caseReveal.evaluate(el => getComputedStyle(el).opacity)) > 0.9, 'Case-study reveal content must remain visible without JavaScript.');
  await noJs.close();

  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 812, height: 375 }
  ]) {
    const context = await browser.newContext({ viewport });
    const mobile = await context.newPage();
    await mobile.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await assertNoHorizontalOverflow(mobile, viewport, 'Responsive');

    if (viewport.width <= 390) {
      const toggle = mobile.locator('#menuToggle');
      assert(await computed(mobile, '#menuToggle', 'display') !== 'none', 'Mobile menu trigger should be visible.');
      await toggle.click();
      assert(await toggle.getAttribute('aria-expanded') === 'true', 'Mobile menu should expose aria-expanded=true when open.');
      await mobile.waitForFunction(() => document.activeElement?.closest?.('#navPanel') !== null, null, { timeout: 1200 });
      const focusedHref = await mobile.evaluate(() => document.activeElement?.getAttribute?.('href') || '');
      assert(focusedHref.startsWith('#'), 'Opening mobile menu should move focus into navigation.');
      const workLink = mobile.locator('#navPanel a[href="#work"]');
      await workLink.click();
      await waitForFocusedId(mobile, 'work');
      assert(await toggle.getAttribute('aria-expanded') === 'false', 'Selecting a mobile navigation link should close the menu.');
    }

    await context.close();
  }

  console.log('Browser QA passed: desktop menu, hidden states, no-JS resilience, mobile focus, landscape and overflow verified.');
} finally {
  await browser.close();
}
