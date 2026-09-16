import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();

async function open(page, path='/?intro=1') {
  await page.goto(base + path, {waitUntil:'networkidle'});
  await page.locator('html[data-v122="on"]').waitFor();
  await page.waitForFunction(() => document.querySelector('link[data-v122-style]')?.sheet);
  await page.waitForFunction(() => window.__V122_DIAGNOSTICS__?.version === '12.2-immersive-worlds-1');
}

async function moveTo(page, selector, expectedKind) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForFunction(kind => document.querySelector('.v122-stage')?.dataset.v122Kind === kind, expectedKind, {timeout:4000});
}

try {
  for (const scenario of [
    {name:'desktop', options:{viewport:{width:1440,height:1000}}},
    {name:'mobile', options:{viewport:{width:390,height:844}, isMobile:true, hasTouch:true}},
    {name:'landscape', options:{viewport:{width:844,height:390}, isMobile:true, hasTouch:true}},
    {name:'reduced', options:{viewport:{width:390,height:844}, reducedMotion:'reduce'}},
    {name:'forced', options:{viewport:{width:390,height:844}, forcedColors:'active'}}
  ]) {
    const context = await browser.newContext(scenario.options);
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await open(page);

    assert.equal(await page.locator('body').getAttribute('data-version'), '10');
    assert.equal(await page.locator('body').getAttribute('data-v122-experience'), 'immersive-worlds');
    assert.equal(await page.locator('.v122-stage').count(), 1);
    assert.equal(await page.locator('.v122-chapter').count(), 8);
    assert.equal(await page.locator('.v122-world').count(), 8);
    assert.equal(await page.locator('.v122-world__media').count(), 24);
    assert.equal(await page.locator('html[data-v121="on"]').count(), 0, 'V12.1 engine must not initialize inside V12.2');
    assert.equal(await page.locator('html[data-v12="on"]').count(), 0, 'retired V12 engine must not initialize');

    const diagnostics = await page.evaluate(() => window.__V122_DIAGNOSTICS__);
    assert.equal(diagnostics?.version, '12.2-immersive-worlds-1');
    assert.equal(diagnostics?.scenes, 8);
    assert.equal(diagnostics?.worlds, 8);
    assert.equal(diagnostics?.maxMediaPlanesPerWorld, 3);
    assert.equal(diagnostics?.geometryReadsInScrollHandler, false);
    assert.equal(diagnostics?.layoutReadsPerAnimationFrame, 0);

    if (scenario.name === 'desktop') {
      assert.equal(await page.locator('html').getAttribute('data-v122-profile'), 'desktop');
      await moveTo(page, '#opening', 'identity');
      await moveTo(page, '#photography', 'photography');
      const photoPresence = Number(await page.locator('.v122-world[data-v122-kind="photography"]').evaluate(el => getComputedStyle(el).opacity));
      assert.ok(photoPresence > 0.45, `photography world should dominate, opacity=${photoPresence}`);
      await moveTo(page, '#ecosystem', 'ecosystem');
      await moveTo(page, '#contact', 'contact');
      const progressTransform = await page.locator('.v122-stage__progress i').evaluate(el => getComputedStyle(el).transform);
      assert.notEqual(progressTransform, 'none');
    }

    if (scenario.name === 'mobile' || scenario.name === 'landscape') {
      assert.equal(await page.locator('html').getAttribute('data-v122-profile'), 'mobile');
      await moveTo(page, '#photography', 'photography');
      assert.equal(await page.locator('.v122-world__media--b').first().evaluate(el => getComputedStyle(el).display), 'none');
      assert.equal(await page.locator('.v122-world__media--c').first().evaluate(el => getComputedStyle(el).display), 'none');
    }

    if (scenario.name === 'reduced') {
      assert.equal(await page.locator('html').getAttribute('data-v122-profile'), 'reduced');
      await moveTo(page, '#about', 'about');
      assert.equal(await page.evaluate(() => document.querySelector('.v122-stage')?.getAnimations({subtree:true}).filter(a => a.playState === 'running').length), 0);
    }

    if (scenario.name === 'forced') {
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.v122-stage')).display), 'none');
    }

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${scenario.name} has no horizontal overflow`);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`V12.2 browser QA passed: ${scenario.name}`);
  }
} finally {
  await browser.close();
}
