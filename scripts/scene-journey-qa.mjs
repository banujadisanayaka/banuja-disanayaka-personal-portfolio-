import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser=await chromium.launch();
await mkdir('qa-artifacts/v10',{recursive:true});
try {
  for(const viewport of [{width:1366,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]) {
    const mobile=viewport.width<=700;
    const context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/',{waitUntil:'networkidle'});
    const journey=page.locator('.scene-journey.is-scrubbed');await journey.waitFor();
    assert.equal(await journey.locator('[data-journey-scene]').count(),6);
    const geometry=await journey.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,step:el.querySelector('.journey-range').clientHeight*.9}));
    for(let i=0;i<6;i++) {
      await page.evaluate(({top,step,i})=>scrollTo({top:top+step*i,behavior:'instant'}),{...geometry,i});
      await page.waitForFunction(i=>document.querySelector('.scene-journey').dataset.activeScene===String(i),i);
      await page.waitForTimeout(900);
      const panel=journey.locator(`[data-journey-scene="${i}"]`);
      assert.equal(await panel.getAttribute('aria-hidden'),'false');
      assert.equal(await journey.locator('[data-journey-scene]:not([inert])').count(),1);
      assert.equal(await journey.locator('.journey-buttons button[aria-pressed=true]').count(),1);
      const opacity=await panel.locator('.journey-heading').evaluate(el=>Number(getComputedStyle(el).opacity));
      assert.ok(opacity>.98,`Scene ${i} text settles fully`);
      const [heading,art,caption]=await Promise.all(['.journey-heading','.journey-art','.journey-caption'].map(s=>panel.locator(s).boundingBox()));
      if(mobile) {
        assert.ok(art.y>=heading.y+heading.height+5,`Scene ${i}: artwork clears the heading at ${viewport.width}px`);
        assert.ok(caption.y>=art.y+art.height+5,`Scene ${i}: caption clears the artwork at ${viewport.width}px`);
      }
      assert.ok(caption.y+caption.height<=viewport.height-75,'Scene actions stay above navigation');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      for(const img of await panel.locator('.journey-art img').all()) {
        assert.equal(await img.evaluate(el=>getComputedStyle(el).objectFit),'contain');
        assert.ok(await img.evaluate(el=>el.complete&&el.naturalWidth>0),'Original portrait/photograph loads');
      }
      await page.screenshot({path:`qa-artifacts/v10/scenes-${viewport.width}-${i}.png`});
    }
    // Intermediate scroll positions produce different camera poses, without autoplay.
    const transforms=[];
    for(const fraction of [.22,.36,.64,.78]) {
      await page.evaluate(({g,f})=>scrollTo({top:g.top+g.step*f,behavior:'instant'}),{g:geometry,f:fraction});
      await page.waitForTimeout(800);
      transforms.push(await journey.locator('.journey-art').evaluateAll(els=>els.map(el=>el.style.transform).join('|')));
    }
    assert.equal(new Set(transforms).size,4,'The shared composition transforms continuously between scenes');
    // The user's recording paused inside a transition for multiple seconds.
    // Test rest positions in BOTH directions, rather than only scene endpoints.
    for(const fraction of [.42,.5,.58,1.5,2.5,3.5,4.5,2.5,.5]) {
      await page.evaluate(({g,f})=>scrollTo({top:g.top+g.step*f,behavior:'instant'}),{g:geometry,f:fraction});
      await page.waitForTimeout(800);
      const visible=journey.locator('.journey-panel[aria-hidden=false]');
      assert.equal(await visible.count(),1,'A paused transition always has one accessible scene');
      assert.equal(await visible.locator('.journey-heading').evaluate(el=>Number(getComputedStyle(el).opacity)),1,'Paused heading is fully readable');
      assert.equal(await visible.locator('.journey-caption').evaluate(el=>Number(getComputedStyle(el).opacity)),1,'Paused actions are fully readable');
      const art=await journey.locator('.journey-art').evaluateAll(els=>els.map(el=>Number(getComputedStyle(el).opacity)));
      assert.equal(art.filter(o=>o>0).length,1,'No ghosted double exposure between artworks');
      assert.equal(Math.max(...art),1,'The photograph remains opaque');
      if(fraction===.5)await page.screenshot({path:`qa-artifacts/v10/scenes-${viewport.width}-paused.png`});
    }
    const choose=journey.locator('[data-journey-select="0"]');await choose.press('Enter');
    await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='0');
    await page.waitForTimeout(900);
    const idle=await journey.locator('.journey-art').first().getAttribute('style');
    const ambient=journey.locator('.ambience-0 .ambient-flow');
    const ambientBefore=await ambient.evaluate(el=>getComputedStyle(el).transform);
    await page.waitForTimeout(700);
    assert.equal(await journey.locator('.journey-art').first().getAttribute('style'),idle,'No scene autoplay');
    assert.notEqual(await ambient.evaluate(el=>getComputedStyle(el).transform),ambientBefore,'Background moves while the reader pauses');
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest?.('.journey-atmosphere')&&a.playState==='running').length),2,'Only the visible background animates');
    await choose.press('End');
    await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='5');
    await page.keyboard.press('Home');
    await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='0');
    if(mobile) {
      await page.waitForTimeout(900);
      await journey.locator('[data-journey-select="2"]').press('Enter');
      await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='2');
      await page.waitForTimeout(900);
      // Emulate address-bar collapse: the dynamic viewport grows while svh is stable.
      await page.addStyleTag({content:`.journey-range{height:${geometry.step/.9}px!important}`});
      await page.setViewportSize({width:viewport.width,height:viewport.height+88});
      await page.waitForTimeout(300);
      assert.equal(await journey.getAttribute('data-active-scene'),'2','Browser chrome cannot change the selected scene');
      const stage=await journey.locator('.journey-stage').boundingBox();
      assert.ok(Math.abs(stage.height-viewport.height-88)<=1,'Backdrop fills the expanded viewport');
      const toggle=await page.getByRole('button',{name:'Animation effects',exact:true}).boundingBox();
      assert.ok(toggle.height>=44,'Motion control retains a touch-sized target');
      for(const button of await journey.locator('[data-journey-select]').all()) {
        const box=await button.boundingBox();
        assert.ok(box.y+box.height<=viewport.height+88,'Scene button remains inside viewport');
        assert.ok(toggle.y+toggle.height<=box.y||toggle.y>=box.y+box.height||toggle.x+toggle.width<=box.x||toggle.x>=box.x+box.width,'Motion toggle cannot cover a scene button');
      }
      await page.screenshot({path:`qa-artifacts/v10/scenes-${viewport.width}-toolbar-hidden.png`});
      await page.setViewportSize(viewport);
      await choose.press('Enter');
      await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='0');
      await page.waitForTimeout(900);
      const cdp=await context.newCDPSession(page),x=Math.round(viewport.width*.55),y=Math.round(viewport.height*.58);
      const before=await page.evaluate(()=>scrollY);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      for(const dy of [25,60,110,170])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(y=>scrollY>y+20,before);
    }
    await page.getByRole('button',{name:'Animation effects',exact:true}).press('Enter');
    await page.waitForFunction(()=>!document.querySelector('.scene-journey').classList.contains('is-scrubbed'));
    assert.equal(await journey.count(),0);
    assert.equal(await page.locator('.journey-panel[aria-hidden=false]').count(),6);
    assert.equal(await page.locator('.journey-panel[inert]').count(),0);
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
    assert.deepEqual(errors,[]);
    await context.close();console.log(`Six scenes, readable mid-transition pauses, opaque art, animated background, toolbar resize, controls and motion-off passed at ${viewport.width}px`);
  }
  for(const mode of ['no-js','missing-script','reduced','landscape']) {
    const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:{width:320,height:700},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    const page=await context.newPage();
    if(mode==='missing-script')await page.route('**/scene-journey.js?*',r=>r.abort());
    await page.goto(base+'/',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.scene-journey.is-scrubbed').count(),0);
    assert.equal(await page.locator('.journey-panel:visible').count(),6);
    assert.equal(await page.locator('.journey-panel[inert]').count(),0);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await context.close();console.log(`Readable six-scene fallback passed: ${mode}`);
  }
} finally {await browser.close();}
