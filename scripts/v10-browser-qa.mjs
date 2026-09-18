import assert from 'node:assert/strict';
import {mkdir, readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
await mkdir('qa-artifacts/v10', {recursive:true});
const fits = async (page, label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label);
async function openRelease(page, path) {
  let status = 0;
  for (let attempt=0; attempt<10; attempt++) {
    const response = await page.goto(base + path, {waitUntil:'domcontentloaded'});
    status = response?.status() || 0;
    if (response?.ok()) {
      try {
        await page.locator('body[data-version="10"]').waitFor({state:'attached', timeout:4000});
        return;
      } catch {}
    }
    // Netlify deploy previews can briefly return 404 while an exact deploy
    // alias converges. Keep the release requirement strict, but give the
    // already-verified preview a bounded recovery window.
    await page.waitForTimeout(1500);
  }
  assert.equal(await page.locator('body').getAttribute('data-version'), '10', path+' serves the V10 release (last HTTP '+status+')');
}
try {
  for (const scenario of [
    {name:'desktop',viewport:{width:1366,height:900}},
    {name:'tablet',viewport:{width:768,height:1024}},
    {name:'mobile',viewport:{width:390,height:844},hasTouch:true,isMobile:true},
    {name:'small-mobile',viewport:{width:320,height:700},hasTouch:true,isMobile:true},
    {name:'landscape',viewport:{width:844,height:390},hasTouch:true,isMobile:true},
    {name:'reduced',viewport:{width:390,height:844},reducedMotion:'reduce'},
    {name:'forced',viewport:{width:390,height:844},forcedColors:'active'}
  ]) {
    const {name,...options} = scenario;
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await openRelease(page, '/?intro=1');
    assert.equal(await page.locator('.bd-welcome').count(), 0, 'Old replay links cannot open an intro');
    assert.equal(await page.locator('#main').getAttribute('inert'), null);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
    assert.ok(await page.locator('h1').isVisible());
    assert.equal(requests.some(url => /v9-welcome|portrait-cutout/.test(url)), false, 'No welcome runtime or texture is requested');
    for (const selector of ['script[src*="/v10-site.js?v="]','link[href*="/v10-site.css?v="]']) assert.equal(await page.locator(selector).count(), 1);
    await fits(page, `Opening fits ${name}`);
    await page.screenshot({path:`qa-artifacts/v10/${name}-opening.png`,animations:'disabled'});
    await page.getByRole('link',{name:'Explore selected work',exact:false}).click();
    await page.waitForFunction(() => location.hash === '#work');
    assert.ok(await page.locator('.work-showcase.is-enhanced, .work-showcase').isVisible());
    assert.equal(await page.locator('.chapter-scene').count(), 5, 'Every main homepage chapter has a graphical scene');
    assert.equal(await page.locator('html').getAttribute('data-scene-transitions'), 'on');
    await page.waitForFunction(() => document.querySelector('#work')?.dataset.scenePhase === 'active');

    // Every view remains an actual photograph, with the original lightbox and download.
    const viewer = page.getByRole('region',{name:'Featured photographs',exact:true});
    await viewer.scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.gaze-thumbnail').count(), 6);
    const firstId = await viewer.getAttribute('data-selected-photo');
    await page.getByRole('button',{name:'Next featured photograph',exact:true}).click();
    assert.notEqual(await viewer.getAttribute('data-selected-photo'), firstId);
    assert.equal(await page.locator('.featured-photos .photo-tile:visible').count(), 1);
    await page.locator('.gaze-thumbnail').last().click();
    await page.keyboard.press('Home');
    assert.equal(await viewer.getAttribute('data-selected-photo'), firstId);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.gaze-thumbnail').nth(1).getAttribute('aria-pressed'), 'true');
    await fits(page, `Photo viewer fits ${name}`);
    await viewer.screenshot({path:`qa-artifacts/v10/${name}-gaze.png`,animations:'disabled'});
    const activeLink = page.locator('.featured-photos .is-current .photo-link');
    await activeLink.click();
    assert.ok(await page.locator('#lightbox').isVisible());
    assert.ok((await page.locator('#lightbox-image').getAttribute('alt') || '').trim().length > 15, 'Lightbox photograph exposes its descriptive alt text');
    const title = await page.locator('#lightbox-title').textContent();
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.locator('#lightbox-title').textContent(), title);
    assert.match(await page.locator('#lightbox-download').getAttribute('href'), /^https?:\/\//);
    await page.keyboard.press('Escape');
    assert.ok(await activeLink.evaluate(el => el === document.activeElement));

    const panels = page.locator('#perspectives');
    await panels.getByRole('button',{name:/The observer/}).click();
    assert.ok(await page.locator('#perspective-photography').isVisible());
    assert.equal(await panels.locator('[data-panel]:visible').count(), 1);
    await page.keyboard.press('Home');
    assert.ok(await page.locator('#perspective-operations').isVisible());
    await fits(page, `Perspectives fit ${name}`);
    await panels.screenshot({path:`qa-artifacts/v10/${name}-perspectives.png`,animations:'disabled'});
    if (options.reducedMotion || options.forcedColors) assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    if (name === 'desktop') {
      await page.locator('.journey-controls').scrollIntoViewIfNeeded();
      await page.getByRole('button',{name:'Scene 5: VELORIA',exact:true}).click();
      await page.waitForFunction(() => document.querySelector('.scene-journey').dataset.activeScene === '4');
      assert.ok(await page.locator('[data-journey-scene="4"] .journey-art').isVisible());
      await page.screenshot({path:'qa-artifacts/v10/desktop-veloria-scene.png',animations:'disabled'});
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`V10 direct entry, photo selection, lightbox and perspectives passed: ${name}`);
  }
  for (const mode of ['no-js','v10-script-missing','cms-offline']) {
    const context = await browser.newContext({viewport:{width:320,height:700},javaScriptEnabled:mode !== 'no-js',reducedMotion:'reduce'});
    const page = await context.newPage();
    if (mode === 'v10-script-missing') await page.route('**/v10-site.js?*', route => route.abort());
    if (mode === 'cms-offline') await page.route('**/api/content', route => route.abort());
    await page.goto(base+'/?intro=1', {waitUntil:'networkidle'});
    assert.equal(await page.locator('.bd-welcome').count(), 0);
    assert.ok(await page.locator('h1').isVisible());
    assert.equal(await page.locator('.photo-tile').count(), 6);
    if (mode !== 'cms-offline') assert.equal(await page.locator('.featured-photos .photo-tile:visible').count(), 6);
    assert.equal(await page.locator('.project').count(), 5);
    await fits(page, `${mode} remains readable`);
    await context.close();
    console.log(`V10 progressive enhancement passed: ${mode}`);
  }
  // A late CMS response can replace/reorder the gallery after someone has selected a photo.
  for (const empty of [false,true]) {
    const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page = await context.newPage();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const content = JSON.parse(await readFile('public/content-default.json','utf8'));
    content.profile.aboutImage = '/assets/v9/personal-480.webp';
    content.dailyGaze = empty ? [] : content.dailyGaze.slice().reverse();
    await page.route('**/api/content', async route => { await gate; await route.fulfill({json:{content}}); });
    await page.goto(base+'/', {waitUntil:'domcontentloaded'});
    await page.locator('.gaze-viewer.is-ready').waitFor();
    await page.locator('.gaze-thumbnail').nth(2).click();
    const selected = await page.locator('.gaze-viewer').getAttribute('data-selected-photo');
    release();
    await page.waitForLoadState('networkidle');
    assert.ok(await page.locator('[data-portrait="about"]').evaluateAll(images => images.length > 1 && images.every(image => image.src.endsWith('/assets/v9/personal-480.webp'))),'CMS portrait changes reach every repeated scene');
    if (empty) {
      assert.equal(await page.locator('.featured-photos .photo-tile').count(), 0);
      assert.equal(await page.locator('.gaze-controls').isVisible(), false);
      assert.ok(await page.locator('.gaze-empty').isVisible());
      assert.equal(await page.locator('[data-journey-scene="2"]').isVisible(),false,'An emptied CMS journal also removes the introductory photo scene');
      assert.equal(await page.locator('[data-scene-photo][src]').count(),0,'Removed photographs do not remain in the decorative scene layers');
    } else {
      assert.equal(await page.locator('.gaze-viewer').getAttribute('data-selected-photo'), selected);
      assert.equal(await page.locator('.gaze-thumbnail[aria-pressed=true]').count(), 1);
      assert.ok(await page.locator('.gaze-thumbnail[aria-pressed=true]').evaluate(el => el === document.activeElement));
    }
    await context.close();
  }
  console.log('V10 late CMS reordering preserves photo selection/focus; an empty journal stays usable');

  // Identical CMS archive data should hydrate in place instead of rebuilding 115 photo nodes.
  {
    const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page = await context.newPage();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const content = JSON.parse(await readFile('public/content-default.json','utf8'));
    await page.route('**/api/content', async route => { await gate; await route.fulfill({json:{content}}); });
    await page.goto(base+'/daily-gaze/', {waitUntil:'domcontentloaded'});
    await page.locator('.archive-grid .photo-tile').first().waitFor();
    await page.evaluate(() => {
      const root = document.querySelector('.archive-grid');
      window.__gazeHydrationProbe = {first:root.firstElementChild, childMutations:0, hydrated:false};
      const observer = new MutationObserver(records => {
        for (const record of records) if (record.type === 'childList') window.__gazeHydrationProbe.childMutations += record.addedNodes.length + record.removedNodes.length;
      });
      observer.observe(root,{childList:true});
      document.addEventListener('portfolio:content',() => {
        window.__gazeHydrationProbe.hydrated = true;
        observer.disconnect();
      },{once:true});
    });
    release();
    await page.waitForFunction(() => window.__gazeHydrationProbe?.hydrated === true);
    assert.equal(await page.locator('.archive-grid .photo-tile').count(),115);
    assert.equal(await page.evaluate(() => document.querySelector('.archive-grid').firstElementChild === window.__gazeHydrationProbe.first),true,'Identical CMS hydration preserves the first archive node');
    assert.equal(await page.evaluate(() => window.__gazeHydrationProbe.childMutations),0,'Identical CMS hydration causes zero archive child-list replacement');
    await context.close();
  }

  // A future non-downloadable photo must not resolve an empty URL to the site root.
  {
    const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page = await context.newPage();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const content = JSON.parse(await readFile('public/content-default.json','utf8'));
    content.dailyGaze[0].downloadable = false;
    await page.route('**/api/content', async route => { await gate; await route.fulfill({json:{content}}); });
    await page.goto(base+'/daily-gaze/', {waitUntil:'domcontentloaded'});
    await page.evaluate(() => {
      window.__gazeContentReady = false;
      document.addEventListener('portfolio:content',() => { window.__gazeContentReady = true; },{once:true});
    });
    release();
    await page.waitForFunction(() => window.__gazeContentReady === true);
    await page.locator('.archive-grid .photo-link').first().click();
    assert.ok(await page.locator('#lightbox').isVisible());
    assert.equal(await page.locator('#lightbox-download').isVisible(),false,'Non-downloadable photographs keep the download action hidden');
    await page.keyboard.press('Escape');
    await context.close();
  }
  console.log('Daily Gaze identical hydration preserves nodes and non-downloadable photos stay protected');
} finally { await browser.close(); }
