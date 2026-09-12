import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
await mkdir('qa-artifacts/v10',{recursive:true});
try {
  for (const mobile of [false,true]) {
    const name = mobile ? 'mobile' : 'desktop';
    const context = await browser.newContext({viewport:mobile ? {width:390,height:844} : {width:1366,height:900},hasTouch:mobile,isMobile:mobile});
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base+'/',{waitUntil:'networkidle'});
    const orbit = page.locator('[data-orbit]');
    await page.getByRole('button',{name:'Next perspective',exact:true}).click();
    assert.equal(await orbit.getAttribute('data-selected-perspective'),'1');
    assert.equal(await page.locator('.hero-card[aria-pressed=true]').count(),1);
    await page.locator('[data-hero-select="1"]').press('End');
    assert.equal(await orbit.getAttribute('data-selected-perspective'),'2');
    await page.locator('[data-hero-select="2"]').press('Home');
    assert.equal(await orbit.getAttribute('data-selected-perspective'),'0');
    // Waiting here checks the explicit no-autoplay requirement.
    await page.waitForTimeout(1200);
    assert.equal(await orbit.getAttribute('data-selected-perspective'),'0');
    await orbit.scrollIntoViewIfNeeded();
    const rect = await page.locator('.portrait-frame').boundingBox();
    const x = Math.round(rect.x+rect.width*.65), y = Math.round(rect.y+rect.height*.4);
    if (mobile) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      for (const dx of [20,45,70,100]) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-dx,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(() => document.querySelector('[data-orbit]').dataset.selectedPerspective === '1');
      const start = await page.evaluate(() => scrollY);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:2}]});
      for (const dy of [20,50,90,130]) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(before => scrollY > before+20,start);
      assert.equal(await orbit.getAttribute('data-selected-perspective'),'1','A vertical gesture scrolls without turning the photographs');
    } else {
      await page.mouse.move(x,y); await page.mouse.down();
      await page.mouse.move(x-110,y,{steps:12}); await page.mouse.up();
      assert.equal(await orbit.getAttribute('data-selected-perspective'),'1');
      await page.screenshot({path:'qa-artifacts/v10/desktop-hero-designer.png',animations:'disabled'});
    }
    // Finish the real touch fling before measuring exact scroll positions.
    // Otherwise the compositor can continue the gesture after scrollTo().
    await page.evaluate(() => new Promise(resolve => {
      let last = scrollY, quiet = 0;
      const check = () => {
        quiet = Math.abs(scrollY-last) < .1 ? quiet+1 : 0;
        last = scrollY;
        if (quiet >= 12) resolve(); else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    }));
    await page.locator('.v10-story.is-cinematic').waitFor();
    const geometry = await page.locator('.story-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:el.querySelector('.story-visual').clientHeight}));
    const transforms = [];
    for (const fraction of [.15,.35,.6,1]) {
      await page.evaluate(({top,height,fraction}) => scrollTo({top:top+height*fraction,behavior:'instant'}),{...geometry,fraction});
      try {
        await page.waitForFunction(f => Math.abs(Number(document.querySelector('.v10-story').style.getPropertyValue('--story-progress'))*2-f)<.02,fraction,{timeout:5000});
      } catch (error) {
        console.error('Story scroll geometry',fraction,geometry,await page.evaluate(() => ({scroll:scrollY,top:document.querySelector('.story-journey').getBoundingClientRect().top,height:document.querySelector('.story-visual').clientHeight,progress:document.querySelector('.v10-story').style.getPropertyValue('--story-progress')})));
        throw error;
      }
      transforms.push(await page.locator('[data-art="0"]').evaluate(el => getComputedStyle(el).transform));
      if (fraction === .6) await page.screenshot({path:`qa-artifacts/v10/${name}-story-between.png`});
      if (mobile && fraction === 1) await page.screenshot({path:'qa-artifacts/v10/mobile-story-connect.png'});
      if (mobile && fraction >= .6) {
        const image = await page.locator('[data-art="1"]').boundingBox();
        const copy = await page.locator('[data-beat="1"]>div').boundingBox();
        assert.ok(copy.y >= image.y+image.height+8,'Mobile story text stays below the moving photograph');
      }
    }
    assert.equal(new Set(transforms).size,4,'The camera changes between chapter boundaries, not just at triggers');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false);
    const viewer = page.locator('.gaze-viewer');
    await viewer.scrollIntoViewIfNeeded();
    await page.getByRole('button',{name:'Next featured photograph',exact:true}).click();
    const active = page.locator('.photo-tile.is-current img');
    assert.equal(await active.evaluate(el => getComputedStyle(el).objectFit),'contain');
    const animation = await active.evaluate(el => el.getAnimations().map(a => a.effect.getKeyframes()));
    assert.ok(animation.some(frames => frames[0]?.transform?.includes('scale(')),'The thumbnail becomes the main photograph');
    // Exercise native keyboard activation. Netlify's preview-only review drawer
    // may cover the lower corner; it is not present on the production website.
    await page.getByRole('button',{name:'Animation effects',exact:true}).press('Enter');
    await page.waitForFunction(() => !document.querySelector('.v10-story').classList.contains('is-cinematic'));
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState==='running').length),0);
    assert.equal(await page.locator('.story-art:visible').count(),3,'Motion off exposes every visual chapter');
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`Continuous camera, spatial selection, native gestures and animation cancellation passed: ${name}`);
  }
} finally { await browser.close(); }
