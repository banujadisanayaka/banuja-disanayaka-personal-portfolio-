import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();

async function open(page, path='/') {
  await page.goto(base + path, {waitUntil:'networkidle'});
  await page.locator('html[data-v121="on"]').waitFor();
  await page.waitForFunction(() => document.querySelector('link[data-v121-style]')?.sheet);
  await page.waitForFunction(() => document.querySelector('link[data-v121-compositions]')?.sheet);
}

async function waitForMediaOpacity(page, kind, threshold = 0.5) {
  await page.waitForFunction(({kind, threshold}) => {
    const media = document.querySelector(`.v121-stage__media[data-v121-media="${kind}"]`);
    return media && Number(getComputedStyle(media).opacity) > threshold;
  }, {kind, threshold}, {timeout: 3000});
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

    assert.equal(await page.locator('body').getAttribute('data-version'), '10');
    assert.equal(await page.locator('body').getAttribute('data-v121-experience'), 'cinematic-system');
    assert.equal(await page.locator('.v121-stage').count(), 1);
    assert.equal(await page.locator('.v121-chapter').count(), 8);
    assert.equal(await page.locator('.v121-chapter[data-v121-kind]').count(), 8);
    assert.equal(await page.locator('.v121-stage__media').count(), 3);
    assert.equal(await page.locator('.v121-stage__image').count(), 3);
    assert.equal(await page.locator('link[data-v121-compositions]').count(), 1);
    assert.equal(await page.locator('html[data-v12="on"]').count(), 0, 'retired V12 runtime must not initialize');
    assert.equal(await page.locator('.v12-world').count(), 0, 'retired V12 stage must not exist');

    const diagnostics = await page.evaluate(() => window.__V121_DIAGNOSTICS__);
    assert.equal(diagnostics?.version, '12.1-art-direction-2');
    assert.equal(diagnostics?.mediaPlanes, 3);
    assert.equal(diagnostics?.scrollListener, false);
    assert.equal(diagnostics?.geometryReadsOnScroll, false);
    assert.equal(diagnostics?.activation, 'IntersectionObserver');
    assert.equal(diagnostics?.scenes, 8);

    if (scenario.name === 'desktop') {
      assert.equal(await page.locator('html').getAttribute('data-v121-profile'), 'desktop');
      assert.equal(diagnostics?.lightweightActivation, 'section observer');
      await waitForMediaOpacity(page, 'identity');
      assert.ok((await page.locator('.v121-stage__media[data-v121-media="identity"] img').getAttribute('src'))?.length > 0);

      const identityPlaneOpacity = await page.evaluate(() => getComputedStyle(document.querySelector('.v121-stage'), '::before').opacity);
      assert.ok(Number(identityPlaneOpacity) > 0, 'desktop composition plane is visible');

      await page.locator('#photography').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.v121-stage')?.dataset.v121Kind === 'photography');
      assert.equal(await page.locator('.v121-stage__word').textContent(), 'GAZE');
      await waitForMediaOpacity(page, 'photography');

      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.v121-stage')?.dataset.v121Kind === 'about');
      assert.equal(await page.locator('.v121-stage__word').textContent(), 'HUMAN');
      await waitForMediaOpacity(page, 'about');

      await page.locator('#contact').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.v121-stage')?.dataset.v121Kind === 'contact');
      assert.equal(await page.locator('.v121-stage__word').textContent(), 'HELLO');
    }

    if (scenario.name === 'mobile' || scenario.name === 'landscape') {
      assert.equal(await page.locator('html').getAttribute('data-v121-profile'), 'mobile');
      assert.equal(diagnostics?.lightweightActivation, 'static ambient');
      const initialKind = await page.locator('.v121-stage').getAttribute('data-v121-kind');
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.v121-stage').getAttribute('data-v121-kind'), initialKind, `${scenario.name} keeps static ambient world`);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.v121-stage'), '::before').display), 'none');
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.v121-stage'), '::after').display), 'none');
    }

    if (scenario.name === 'reduced') {
      assert.equal(await page.locator('html').getAttribute('data-v121-profile'), 'reduced');
      assert.equal(await page.locator('html').getAttribute('data-v121-motion'), 'off');
      assert.equal(diagnostics?.lightweightActivation, 'static ambient');
      assert.equal(await page.evaluate(() => document.querySelector('.v121-stage')?.getAnimations({subtree:true}).filter(a => a.playState === 'running').length), 0);
    }

    if (scenario.name === 'forced') {
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.v121-stage')).display), 'none');
    }

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${scenario.name} has no horizontal overflow`);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`V12.1 browser QA passed: ${scenario.name}`);
  }
} finally {
  await browser.close();
}
