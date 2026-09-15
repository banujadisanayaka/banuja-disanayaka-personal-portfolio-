import assert from 'node:assert/strict';
import {mkdir, readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
await mkdir('qa-artifacts/v12', {recursive:true});

const fits = async (page, label) => {
  const overflow = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth,bodyWidth:document.body.scrollWidth}));
  assert.ok(overflow.scrollWidth <= overflow.innerWidth + 1, `${label}: document overflow ${JSON.stringify(overflow)}`);
};

async function openRelease(page, path='/') {
  await page.goto(base + path, {waitUntil:'networkidle'});
  await page.waitForFunction(() => document.body?.dataset.version === '12' && document.documentElement.dataset.v12 === 'on');
}

const scenarios = [
  {name:'desktop', viewport:{width:1440,height:960}},
  {name:'ultrawide', viewport:{width:1920,height:1080}},
  {name:'tablet-landscape', viewport:{width:1024,height:768}},
  {name:'tablet', viewport:{width:768,height:1024},hasTouch:true,isMobile:true},
  {name:'mobile-412', viewport:{width:412,height:915},hasTouch:true,isMobile:true},
  {name:'mobile-390', viewport:{width:390,height:844},hasTouch:true,isMobile:true},
  {name:'mobile-360', viewport:{width:360,height:800},hasTouch:true,isMobile:true},
  {name:'small-mobile', viewport:{width:320,height:700},hasTouch:true,isMobile:true},
  {name:'landscape-mobile', viewport:{width:844,height:390},hasTouch:true,isMobile:true},
  {name:'reduced', viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'},
  {name:'forced', viewport:{width:390,height:844},hasTouch:true,isMobile:true,forcedColors:'active'}
];

try {
  for (const scenario of scenarios) {
    const {name,...options} = scenario;
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));

    await openRelease(page, '/?intro=1');
    assert.equal(await page.locator('.bd-welcome').count(), 0, `${name}: obsolete welcome is absent`);
    assert.ok(await page.locator('h1').isVisible(), `${name}: primary heading is visible`);
    assert.equal(await page.locator('.v12-world').count(), 1, `${name}: one ambient world`);
    assert.equal(await page.locator('.v12-chapter-nav').count(), 1, `${name}: one scene navigator`);
    assert.equal(await page.locator('.v12-scene').count(), 8, `${name}: eight major art-directed scenes`);
    assert.equal(await page.locator('.scene-journey [data-journey-scene]').count(), 6, `${name}: six opening journey scenes preserved`);
    assert.equal(await page.locator('script[data-v12-engine]').count(), 1, `${name}: one V12 runtime`);
    assert.equal(await page.locator('link[data-v12-style]').count(), 1, `${name}: one V12 scene stylesheet`);
    assert.equal(await page.locator('link[data-v12-motion]').count(), 1, `${name}: one V12 motion stylesheet`);
    assert.equal(requests.some(url => /\/v11-site\.js(?:\?|$)/.test(url)), false, `${name}: obsolete V11 runtime is not requested`);
    await fits(page, `${name} opening`);

    const sceneLinks = page.locator('.v12-chapter-nav a');
    assert.equal(await sceneLinks.count(), 8, `${name}: every scene is reachable from cinematic navigation`);
    const currentLinks = page.locator('.v12-chapter-nav a[aria-current="location"]');
    assert.equal(await currentLinks.count(), 1, `${name}: exactly one current scene marker`);

    if (options.hasTouch || options.isMobile) {
      const compactToggle = page.locator('.v12-chapter-toggle:visible');
      if (await compactToggle.count()) {
        const toggleBox = await compactToggle.boundingBox();
        assert.ok(toggleBox.width >= 44 && toggleBox.height >= 44, `${name}: compact scene trigger is at least 44×44px ${JSON.stringify(toggleBox)}`);
        assert.equal(await page.locator('.v12-chapter-nav').getAttribute('aria-hidden'),'true',`${name}: compact scene panel is inert when closed`);
        await compactToggle.click();
        assert.equal(await compactToggle.getAttribute('aria-expanded'),'true',`${name}: compact scene panel opens intentionally`);
        assert.equal(await page.locator('.v12-chapter-nav').getAttribute('aria-hidden'),'false',`${name}: open compact scene panel is exposed`);
        const targets = await sceneLinks.evaluateAll(links => links.map(link => {
          const r = link.getBoundingClientRect(); return {w:r.width,h:r.height,visible:!!(r.width&&r.height)};
        }));
        for (const target of targets) assert.ok(target.visible && target.w >= 44 && target.h >= 44, `${name}: open scene target is at least 44×44px ${JSON.stringify(target)}`);
        await page.keyboard.press('Escape');
        assert.equal(await compactToggle.getAttribute('aria-expanded'),'false',`${name}: Escape closes compact scene navigation`);
        assert.equal(await page.locator('.v12-chapter-nav').getAttribute('aria-hidden'),'true',`${name}: closed compact scene panel cannot intercept content`);
      } else {
        const targets = await sceneLinks.evaluateAll(links => links.map(link => {
          const r = link.getBoundingClientRect(); return {w:r.width,h:r.height};
        }));
        for (const target of targets) assert.ok(target.w >= 44 && target.h >= 44, `${name}: scene target is at least 44×44px ${JSON.stringify(target)}`);
      }
    }

    const opening = page.locator('#opening');
    await opening.screenshot({path:`qa-artifacts/v12/${name}-opening.png`,animations:'disabled'});

    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);
    assert.equal(await page.locator('#work .project').count(), 5, `${name}: all selected projects remain available`);
    await page.locator('#work .work-showcase.is-ready').waitFor();
    const selectedBefore = await page.locator('#work .work-showcase').getAttribute('data-selected-project');
    await page.getByRole('button',{name:'Next project',exact:true}).click();
    const selectedAfter = await page.locator('#work .work-showcase').getAttribute('data-selected-project');
    assert.notEqual(selectedAfter, selectedBefore, `${name}: project canvas advances`);
    await fits(page, `${name} work`);
    await page.locator('#work').screenshot({path:`qa-artifacts/v12/${name}-work.png`,animations:'disabled'});

    const viewer = page.getByRole('region',{name:'Featured photographs',exact:true});
    await viewer.scrollIntoViewIfNeeded();
    await page.locator('.gaze-viewer.is-ready').waitFor();
    assert.equal(await page.locator('.gaze-thumbnail').count(), 6, `${name}: six featured photo controls`);
    const photoBefore = await viewer.getAttribute('data-selected-photo');
    await page.getByRole('button',{name:'Next featured photograph',exact:true}).click();
    assert.notEqual(await viewer.getAttribute('data-selected-photo'), photoBefore, `${name}: photography scene advances`);
    assert.equal(await page.locator('.featured-photos .photo-tile:visible').count(), 1, `${name}: one photographic frame is active`);
    await fits(page, `${name} photography`);
    await viewer.screenshot({path:`qa-artifacts/v12/${name}-gaze.png`,animations:'disabled'});

    const activePhoto = page.locator('.featured-photos .is-current .photo-link');
    await activePhoto.click();
    assert.ok(await page.locator('#lightbox').isVisible(), `${name}: immersive lightbox opens`);
    const lightboxTitle = await page.locator('#lightbox-title').textContent();
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.locator('#lightbox-title').textContent(), lightboxTitle, `${name}: lightbox keyboard navigation works`);
    await page.keyboard.press('Escape');
    assert.ok(await activePhoto.evaluate(el => el === document.activeElement), `${name}: lightbox restores focus`);

    const perspectives = page.locator('#perspectives');
    await perspectives.scrollIntoViewIfNeeded();
    const observer = perspectives.getByRole('button',{name:/The observer/i});
    if (await observer.count()) {
      await observer.click();
      assert.ok(await page.locator('#perspective-photography').isVisible(), `${name}: perspective explorer switches panels`);
      assert.equal(await perspectives.locator('[data-panel]:visible').count(), 1, `${name}: one perspective panel is active`);
    }
    await fits(page, `${name} perspectives`);

    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('html').getAttribute('data-v12-scene'), '7', `${name}: closing scene becomes active`);
    assert.ok(await page.locator('#contact h2').isVisible(), `${name}: cinematic closing remains readable`);
    await fits(page, `${name} contact`);

    if (name === 'desktop') {
      assert.equal(await page.locator('.v12-cursor').count(), 1, 'desktop: cursor layer exists');
      await page.mouse.move(420,300);
      await page.waitForTimeout(50);
      assert.equal(await page.locator('html').getAttribute('data-v12-pointer'), 'fine', 'desktop: fine-pointer treatment enabled');
    }

    if (options.reducedMotion || options.forcedColors) {
      assert.equal(await page.locator('html').getAttribute('data-v12-profile'), 'reduced', `${name}: adaptive reduced profile selected`);
      assert.equal(await page.locator('html').getAttribute('data-v12-motion'), 'off', `${name}: cinematic motion is disabled without losing content`);
      const v12Running = await page.evaluate(() => [...document.querySelectorAll('.v12-world *,.v12-scene *')].flatMap(el => el.getAnimations()).filter(a => a.playState === 'running').length);
      assert.equal(v12Running, 0, `${name}: V12 leaves no running animations`);
    }

    assert.deepEqual(errors, [], `${name}: no page errors`);
    await context.close();
    console.log(`V12 cinematic, responsive, gallery and interaction QA passed: ${name}`);
  }

  // Progressive enhancement: content remains usable when the V12 layer cannot load.
  for (const mode of ['v12-script-missing','no-js']) {
    const context = await browser.newContext({viewport:{width:360,height:800},javaScriptEnabled:mode !== 'no-js',reducedMotion:'reduce'});
    const page = await context.newPage();
    if (mode === 'v12-script-missing') await page.route('**/v12-site.js?*', route => route.abort());
    await page.goto(base+'/', {waitUntil:'networkidle'});
    assert.ok(await page.locator('h1').isVisible(), `${mode}: identity remains visible`);
    assert.equal(await page.locator('.project').count(), 5, `${mode}: work remains in semantic HTML`);
    assert.equal(await page.locator('.photo-tile').count(), 6, `${mode}: featured photography remains in semantic HTML`);
    await fits(page, `${mode} fallback`);
    await context.close();
  }

  // Late CMS updates must still preserve the existing content resilience beneath V12.
  {
    const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page = await context.newPage();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const content = JSON.parse(await readFile('public/content-default.json','utf8'));
    content.dailyGaze = content.dailyGaze.slice().reverse();
    await page.route('**/api/content', async route => { await gate; await route.fulfill({json:{content}}); });
    await page.goto(base+'/', {waitUntil:'domcontentloaded'});
    await page.locator('.gaze-viewer.is-ready').waitFor();
    await page.locator('.gaze-thumbnail').nth(2).click();
    const selected = await page.locator('.gaze-viewer').getAttribute('data-selected-photo');
    release();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.gaze-viewer').getAttribute('data-selected-photo'), selected, 'late CMS reorder preserves selected photograph');
    assert.equal(await page.locator('.v12-world').count(),1,'late CMS update does not duplicate cinematic world');
    assert.equal(await page.locator('.v12-work-index').count(),1,'late CMS update does not duplicate work enhancement');
    assert.equal(await page.locator('.v12-photo-meter').count(),1,'late CMS update does not duplicate photo enhancement');
    await context.close();
  }

  console.log('V12 cinematic exhibition QA complete.');
} finally {
  await browser.close();
}
