import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
try{
  for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:700}]){
    const context=await browser.newContext({viewport,hasTouch:viewport.width<=700,isMobile:viewport.width<=700});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/',{waitUntil:'networkidle'});
    const root=page.locator('.scene-journey.is-scrubbed');await root.waitFor();
    const g=await root.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,step:el.querySelector('.journey-stage').clientHeight*.9}));
    for(const p of [0,.25,.5,.75,1]){
      await page.evaluate(({g,p})=>scrollTo({top:g.top+g.step*p,behavior:'instant'}),{g,p});
      await page.waitForTimeout(650);
      const state=await root.evaluate(el=>({
        id:Number(getComputedStyle(el).getPropertyValue('--s2-id-copy'))||0,
        work:Number(getComputedStyle(el).getPropertyValue('--s2-work-copy'))||0,
        controls:Number(getComputedStyle(el).getPropertyValue('--s2-work-controls'))||0,
        proof:el.dataset.stage2Proof||''
      }));
      assert.equal(state.proof,'active',`Stage 2 proof owns pose ${p}`);
      if(p===.25){assert.ok(state.id>.8,'Identity remains readable at 25%');assert.ok(state.work<.05,'Work copy does not collide at 25%')}
      if(p===.5){assert.ok(state.id<.05&&state.work<.05,'Midpoint has no translucent copy collision')}
      if(p===.75){assert.ok(state.id<.02&&state.work>.45,'Work owns the reading layer by 75%')}
      if(p===1){assert.ok(state.work>.98&&state.controls>.98,'Work rests with readable copy and usable controls')}
    }
    if(viewport.width<=700){
      await page.evaluate(g=>scrollTo({top:g.top,behavior:'instant'}),g);await page.waitForTimeout(500);
      const lineY=await page.locator('.stage2-signal-mobile').evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom}});
      const name=await page.locator('[data-journey-scene="0"] .journey-heading h1').boundingBox();
      assert.ok(lineY.top>=name.y+name.height+18,`Mobile signal clears the name block at ${viewport.width}px`);
      const navLabels=await page.locator('.journey-buttons button>span:last-child').evaluateAll(els=>els.map(el=>({text:el.textContent.trim(),display:getComputedStyle(el).display})));
      assert.ok(navLabels.every(x=>x.text&&x.display!=='none'),'Mobile scene navigation has visible labels');
      const motion=page.getByRole('button',{name:'Animation effects',exact:true});
      assert.match((await motion.innerText()).trim(),/^Motion (on|off)$/,'Motion control has a visible understandable label');
    }
    await page.evaluate(({g})=>scrollTo({top:g.top+g.step,behavior:'instant'}),{g});await page.waitForTimeout(700);
    assert.equal(await page.locator('.journey-project-chip').count(),5);
    assert.equal(await page.locator('.journey-project-chip[aria-current=true]').count(),1);
    const before=await page.locator('[data-journey-project-open]').getAttribute('href');
    await page.locator('.journey-project-chip').nth(1).click();
    assert.notEqual(await page.locator('[data-journey-project-open]').getAttribute('href'),before,'Project selection updates case-study action');
    assert.equal(await page.locator('.journey-project-chip').nth(1).getAttribute('aria-current'),'true');
    const text=(await page.locator('.scene-journey').innerText()).toUpperCase();
    for(const annotation of ['POSE 025','POSE 050','A1 ANCHOR','CONTENT VERIFIED','SOURCE PATH'])assert.equal(text.includes(annotation),false,`No design-review annotation: ${annotation}`);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`Stage 2 Identity→Work acceptance checks passed at ${viewport.width}×${viewport.height}`);
  }
  for(const mode of ['reduced','no-js','landscape']){
    const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
    const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.scene-journey.is-scrubbed').count(),0,`${mode} uses the readable fallback`);
    assert.ok(await page.locator('[data-journey-scene="0"] h1').isVisible());
    assert.ok(await page.locator('[data-journey-scene="1"] h2').isVisible());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await context.close();console.log(`Stage 2 fallback passed: ${mode}`);
  }
}finally{await browser.close()}
