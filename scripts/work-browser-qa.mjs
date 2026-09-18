import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
const projects = ['tfc-orders-tracker','class-tracker','second-brain','banu-2','veloria'];
await fs.mkdir('qa-artifacts/work', {recursive:true});
const scenarios = [
  {name:'desktop', viewport:{width:1366,height:900}},
  {name:'tablet', viewport:{width:768,height:1024}},
  {name:'mobile', viewport:{width:390,height:844}, hasTouch:true, isMobile:true},
  {name:'small-mobile', viewport:{width:320,height:700}, hasTouch:true, isMobile:true},
  {name:'landscape', viewport:{width:844,height:390}, hasTouch:true, isMobile:true},
  {name:'reduced', viewport:{width:390,height:844}, reducedMotion:'reduce'},
  {name:'forced-colors', viewport:{width:390,height:844}, forcedColors:'active'}
];
async function settle(page) {
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || !a.effect?.target?.closest?.('.work-showcase, #work-preview')), null, {timeout:5000});
}
async function fits(page, selector) {
  const r = await page.locator(selector).evaluate(el => {
    const b = el.getBoundingClientRect();
    return {left:b.left, right:b.right, width:innerWidth, scroll:el.scrollWidth, client:el.clientWidth};
  });
  assert.ok(r.left >= -1 && r.right <= r.width + 1 && r.scroll <= r.client + 1, `${selector} fits: ${JSON.stringify(r)}`);
}
try {
  for (const {name, ...options} of scenarios) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/#work', {waitUntil:'networkidle'});
    await page.locator('.work-showcase.is-ready').waitFor();
    assert.equal(await page.locator('.work-pick').count(), 5);
    assert.equal(await page.locator('.project').count(), 5);
    for (let i = 0; i < projects.length; i++) {
      await page.locator('.work-pick').nth(i).click();
      await settle(page);
      assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[i]);
      assert.equal(await page.locator('.project[aria-hidden="false"]').count(), 1);
      assert.equal(await page.locator('.project[aria-hidden="true"] a:not([tabindex="-1"]), .project[aria-hidden="true"] button:not([tabindex="-1"])').count(), 0, 'Hidden slides leave the tab order');
      await fits(page, '.project.is-selected');
      await fits(page, '.project.is-selected h3');
      const selectedStatus = page.locator('.project.is-selected .project-status');
      assert.ok((await selectedStatus.textContent() || '').trim().length > 0, 'Selected project exposes its maturity/status');
      assert.ok(Number(await selectedStatus.evaluate(el => getComputedStyle(el).opacity)) > .95, 'Selected project status is visibly presented');
      assert.ok(Number(await page.locator('.project.is-selected h3 a>span').evaluate(el => getComputedStyle(el).opacity)) > .95, 'Selected project exposes a directional open cue');
      assert.ok(await page.locator('.project[aria-hidden="true"] .project-status').evaluateAll(nodes => nodes.every(el => Number(getComputedStyle(el).opacity) < .05)), 'Inactive project statuses stay visually quiet');
      await fits(page, '.work-dock');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Page fits with ${projects[i]} selected at ${name}`);
      const coverFits = await page.locator('.project.is-selected .system-map').evaluate(el => el.scrollHeight <= el.clientHeight + 1);
    assert.ok(coverFits, `Workflow and technology labels fit in ${projects[i]} at ${name}`);
    }
    await page.locator('.work-pick').first().click();
    await settle(page);
    await page.locator('#work').screenshot({path:`qa-artifacts/work/${name}-carousel.png`});
    const openButton = page.locator('.project.is-selected .work-open');
    await openButton.click();
    await page.locator('#work-preview[open]').waitFor();
    await settle(page);
    await page.screenshot({path:`qa-artifacts/work/${name}-preview-top.png`});
    assert.equal(await page.locator('#work-preview-title').textContent(), 'TFC Orders Tracker');
    assert.ok((await page.locator('.work-preview-story').textContent()).includes('retail, wholesale and delivery'));
    await fits(page, '#work-preview');
    assert.ok(await page.locator('.work-preview-close').evaluate(el => el === document.activeElement));
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.locator('#work-preview').evaluate(el => el.contains(document.activeElement)), 'Dialog traps keyboard focus');
    }
    await page.locator('.work-preview-close').focus();
    await page.screenshot({path:`qa-artifacts/work/${name}-preview.png`});
    await page.keyboard.press('Escape');
    await page.locator('#work-preview').waitFor({state:'hidden'});
    assert.ok(await openButton.evaluate(el => el === document.activeElement), 'Closing restores the active card');
    assert.equal(await page.locator('html').evaluate(el => el.style.overflow), '');
    await page.locator('.work-next').click();
    assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[1]);
    await page.locator('.work-next').press('End');
    assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[4]);
    await page.locator('.work-pick').last().press('ArrowRight');
    assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[0]);
    if (name === 'reduced' || name === 'forced-colors') {
      assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    }
    if (name === 'desktop') {
      await page.getByRole('button', {name:'Animation effects'}).click();
      await page.locator('.work-next').click();
      assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.target?.closest?.('.work-showcase')).length), 0, 'Site motion toggle also stops carousel transitions');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Work carousel, all five covers, expansion, focus and keyboard passed: ${name}`);
  }

  // Real pointer drag, including vertical-scroll intent and accidental-open protection.
  {
    const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
    const page = await context.newPage();
    await page.goto(base + '/#work', {waitUntil:'networkidle'});
    await page.locator('.project.is-selected').scrollIntoViewIfNeeded();
    const rect = await page.locator('.project.is-selected').boundingBox();
    await page.mouse.move(rect.x + rect.width * .8, rect.y + 80);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * .2, rect.y + 80, {steps:12});
    await page.mouse.up();
    assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[1]);
    assert.equal(await page.locator('#work-preview').isVisible(), false);
    await settle(page);
    const grid = page.locator('.project-grid');
    await grid.dispatchEvent('pointerdown',{pointerId:22,pointerType:'touch',isPrimary:true,button:0,clientX:240,clientY:250});
    await grid.dispatchEvent('pointermove',{pointerId:22,pointerType:'touch',isPrimary:true,clientX:243,clientY:310});
    await grid.dispatchEvent('pointerup',{pointerId:22,pointerType:'touch',isPrimary:true,clientX:243,clientY:310});
    assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[1], 'Vertical gestures do not switch projects');
    await page.locator('.project.is-selected .work-open').click();
    await page.getByRole('link',{name:/View full case study/}).click();
    await page.waitForURL('**/work/class-tracker/');
    assert.equal(await page.locator('h1').textContent(), 'Class Tracker TDG.');
    assert.equal(await page.locator('.work-showcase').count(), 0, 'Enhancement stays on the homepage');
    await context.close();
    console.log('Pointer drag, vertical-scroll intent, accidental-open protection and case-study navigation passed');
  }

  for (const mode of ['no-js','script-unavailable','cms-offline']) {
    const context = await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:mode !== 'no-js'});
    const page = await context.newPage();
    if (mode === 'script-unavailable') await page.route('**/v9-work.js*', r => r.abort());
    if (mode === 'cms-offline') await page.route('**/api/content', r => r.abort());
    await page.goto(base + '/#work', {waitUntil:'networkidle'});
    assert.equal(await page.locator('.project').count(), 5);
    if (mode !== 'cms-offline') {
      assert.equal(await page.locator('.work-navigation').isVisible(), false);
      assert.equal(await page.locator('.project h3 a:visible').count(), 5);
    } else assert.equal(await page.locator('.work-pick').count(), 5);
    await context.close();
    console.log(`Project content survives ${mode}`);
  }

  // A late CMS response must preserve a visitor's selection and open preview.
  {
    const context = await browser.newContext({viewport:{width:1366,height:900}});
    const page = await context.newPage();
    const content = JSON.parse(await fs.readFile('public/content-default.json','utf8'));
    content.projects[2].title = 'Second Brain — updated';
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/api/content', async route => { await gate; await route.fulfill({json:{content}}); });
    await page.goto(base + '/#work', {waitUntil:'load'});
    await page.locator('.work-pick').nth(2).click();
    await page.locator('.project.is-selected .work-open').click();
    release();
    await page.waitForFunction(() => document.querySelector('#work-preview-title')?.textContent === 'Second Brain — updated');
    assert.equal(await page.locator('#work-preview').isVisible(), true);
    assert.equal(await page.locator('.work-showcase').getAttribute('data-selected-project'), projects[2]);
    assert.equal(await page.locator('.work-pick').count(), 5);
    await context.close();
    console.log('Late CMS hydration preserves selection, updates labels and keeps the preview open');
  }
} finally { await browser.close(); }
