import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();

async function open(page, path='/') {
  await page.goto(base + path, {waitUntil:'networkidle'});
  await page.locator('html[data-v12="on"]').waitFor();
}

try {
  for (const scenario of [
    {name:'desktop', options:{viewport:{width:1366,height:900}}},
    {name:'mobile', options:{viewport:{width:390,height:844}, isMobile:true, hasTouch:true}},
    {name:'landscape', options:{viewport:{width:844,height:390}, isMobile:true, hasTouch:true}},
    {name:'reduced', options:{viewport:{width:390,height:844}, reducedMotion:'reduce'}},
    {name:'forced', options:{viewport:{width:390,height:844}, forcedColors:'active'}}
  ]) {
    const context = await browser.newContext(scenario.options);
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await open(page, '/?intro=1');

    assert.equal(await page.locator('body').getAttribute('data-version'), '10', 'V12 rebuild preserves the stable semantic V10 base while draft');
    assert.equal(await page.locator('body').getAttribute('data-v12-experience'), 'cinematic-rebuild');
    assert.equal(await page.locator('.v12-world').count(), 1);
    assert.equal(await page.locator('.v12-scene').count(), 8);
    assert.equal(await page.locator('.v12-scene[data-v12-kind]').count(), 8);

    const diagnostics = await page.evaluate(() => window.__V12_DIAGNOSTICS__);
    assert.equal(diagnostics?.version, '12-rebuild-2');
    assert.equal(diagnostics?.scrollListener, false);
    assert.equal(diagnostics?.geometryReadsOnScroll, false);
    assert.equal(diagnostics?.activation, 'IntersectionObserver');
    assert.equal(
      diagnostics?.lightweightActivation,
      scenario.name === 'desktop' ? 'section observer' : 'static ambient'
    );
    assert.equal(diagnostics?.scenes, 8);

    if (scenario.name === 'desktop') {
      assert.equal(await page.locator('html').getAttribute('data-v12-profile'), 'desktop');
      await page.locator('#photography').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#photography')?.dataset.v12Active === 'true');
      assert.equal(await page.locator('.v12-world').getAttribute('data-v12-kind'), 'photography');
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#contact')?.dataset.v12Active === 'true');
      assert.equal(await page.locator('.v12-world').getAttribute('data-v12-kind'), 'contact');
    }

    if (scenario.name === 'mobile' || scenario.name === 'landscape') {
      assert.equal(await page.locator('html').getAttribute('data-v12-profile'), 'mobile');
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.v12-world-label')).display), 'none');
      assert.equal(await page.locator('.v12-scene[data-v12-active]').count(), 0);
      assert.equal(await page.locator('.v12-world').getAttribute('data-v12-scene'), '0');
    }

    if (scenario.name === 'reduced') {
      assert.equal(await page.locator('html').getAttribute('data-v12-profile'), 'reduced');
      assert.equal(await page.locator('html').getAttribute('data-v12-motion'), 'off');
      assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    }

    if (scenario.name === 'forced') {
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.v12-world')).display), 'none');
    }

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${scenario.name} has no horizontal overflow`);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`V12 rebuild QA passed: ${scenario.name}`);
  }
} finally {
  await browser.close();
}