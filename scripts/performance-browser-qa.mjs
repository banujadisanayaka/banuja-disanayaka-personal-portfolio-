import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const baseline = process.env.PERFORMANCE_BASELINE_URL;
const browser = await chromium.launch();
await mkdir('qa-artifacts/v10', {recursive:true});

async function measure(url, label) {
  const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2});
  const page = await context.newPage();
  const reviewURL=new URL(url);reviewURL.searchParams.set('ntl-drawer-state','hidden');
  await page.goto(reviewURL.href, {waitUntil:'networkidle'});
  const immersive = await page.locator('[data-experience]').count() > 0;
  const scenes = await page.locator('.scene-journey').count() > 0;
  await page.locator(immersive ? '.experience.is-live' : scenes ? '.scene-journey.is-scrubbed' : '.v10-story.is-cinematic').waitFor();
  const geometry = immersive ? await page.locator('.experience').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:el.querySelector('.experience-stage').clientHeight,range:18.5})) : scenes ? await page.locator('.scene-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:(el.querySelector('.journey-canvas')||el.querySelector('.journey-stage')).clientHeight*.9,range:4.9})) : await page.locator('.story-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:el.querySelector('.story-visual').clientHeight,range:1.9}));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
  await cdp.send('Performance.enable');
  await page.evaluate(g => scrollTo({top:g.top+g.height*.05,behavior:'instant'}), geometry);
  await page.waitForTimeout(400);
  const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
  const frames = await page.evaluate(g => new Promise(resolve => {
    const times=[]; let previous=0, index=0;
    function step(now) {
      if(previous) times.push(now-previous); previous=now;
      scrollTo({top:g.top+g.height*(.05+g.range*index/119),behavior:'instant'});
      if(++index<120) requestAnimationFrame(step); else requestAnimationFrame(() => resolve(times));
    }
    requestAnimationFrame(step);
  }),geometry);
  const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
  const result = {label, cpuSlowdown:4, frames:frames.length,
    layouts:after.LayoutCount-before.LayoutCount,
    styleRecalculations:after.RecalcStyleCount-before.RecalcStyleCount,
    layoutMs:Math.round((after.LayoutDuration-before.LayoutDuration)*1000),
    styleMs:Math.round((after.RecalcStyleDuration-before.RecalcStyleDuration)*1000),
    scriptMs:Math.round((after.ScriptDuration-before.ScriptDuration)*1000),
    framesOver50ms:frames.filter(ms => ms>50).length,
    p95FrameMs:Math.round([...frames].sort((a,b)=>a-b)[Math.floor(frames.length*.95)])};
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:1});

  // Preserve the native pinned stage position while the composition transforms.
  // The previous release is measured with its original stable-copy probe.
  const positions=[];
  for (const fraction of [.58,.72,.86,1,1.14,1.28,1.42]) {
    await page.evaluate(({g,f}) => scrollTo({top:g.top+g.height*f,behavior:'instant'}),{g:geometry,f:fraction});
    await page.waitForTimeout(60);
    positions.push((await page.locator(immersive ? '.experience-stage' : scenes ? '.journey-stage' : '[data-beat="1"]>div').boundingBox()).y);
  }
  result.copyDriftPx = +(Math.max(...positions)-Math.min(...positions)).toFixed(2);
  console.log('PERFORMANCE_MEASURED '+JSON.stringify(result));
  if(label==='candidate' && result.layouts>12){
    const details=[];let last=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='LayoutCount').value;
    for(let n=0;n<120;n++){
      const p=.05+geometry.range*n/119;
      await page.evaluate(({g,p})=>new Promise(resolve=>{scrollTo({top:g.top+g.height*p,behavior:'instant'});requestAnimationFrame(()=>requestAnimationFrame(resolve));}),{g:geometry,p});
      const count=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='LayoutCount').value;
      if(count>last)details.push({p:+p.toFixed(3),layouts:count-last,scene:await page.locator('.film-scene.is-current').getAttribute('data-scene')});
      last=count;
    }
    console.log('LAYOUT_DIAGNOSTIC '+JSON.stringify(details));
  }
  if (label === 'candidate') {
    assert.ok(result.copyDriftPx <= 1, `Story copy moved ${result.copyDriftPx}px during native scroll`);
    assert.ok(result.styleMs <= 500, `Scroll spent ${result.styleMs}ms recalculating styles; budget is 500ms at 4× CPU slowdown`);
    assert.ok(result.layouts <= 12, `Scroll triggered ${result.layouts} layouts; budget is 12`);
    assert.ok(result.p95FrameMs <= 34, `p95 scripted frame interval was ${result.p95FrameMs}ms; corrected Stage 2 gate is 34ms`);
    assert.ok(result.framesOver50ms <= 3, `Scroll produced ${result.framesOver50ms} intervals over 50ms; corrected Stage 2 gate is 3`);
    if(immersive){
      const bar=await page.locator('.film-bottombar').boundingBox();assert.ok(bar.width<=390,'Timeline fits');
      await page.getByRole('button',{name:'Credits',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('[data-scene="9"]').getAttribute('aria-hidden')==='false');
      await page.getByRole('button',{name:'Opening',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('[data-scene="0"]').getAttribute('aria-hidden')==='false');
      await page.waitForTimeout(800);
      assert.equal(await page.locator('.film-scene[aria-hidden=true]:not([inert])').count(),0);
      const writes=await page.evaluate(()=>new Promise(resolve=>{let n=0;const observer=new MutationObserver(records=>n+=records.length);observer.observe(document.querySelector('.experience'),{subtree:true,attributes:true,childList:true});setTimeout(()=>{observer.disconnect();resolve(n)},300)}));
      assert.equal(writes,0,'Paused stage stays idle');
      await page.getByRole('button',{name:'Animation effects',exact:true}).click();
      await page.locator('.experience.is-static').waitFor();assert.equal(await page.locator('.film-scene[inert]').count(),0);
      await page.screenshot({path:'qa-artifacts/v10/mobile-story-performance.png'});
    }else{
    const beforeControls=await page.locator('.journey-controls').boundingBox();
    assert.ok(beforeControls.width<=390,'Story controls fit the mobile viewport');
    await page.getByRole('button',{name:'Scene 6: Contact',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('.scene-journey').dataset.activeScene==='5');
    await page.getByRole('button',{name:'Scene 1: Identity',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('.scene-journey').dataset.activeScene==='0');
    await page.waitForFunction(top => Math.abs(scrollY-top)<2,geometry.top);
    assert.equal(await page.locator('.journey-panel[aria-hidden=true]:not([inert])').count(),0,'Inactive copy cannot trap keyboard focus');
    await page.screenshot({path:'qa-artifacts/v10/mobile-story-performance.png'});
    // The scene stage must stop writing styles once the reader reaches the full work.
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const outside = await page.evaluate(() => {
      const story=document.querySelector('.scene-journey');
      return new Promise(resolve => {
        let writes=0;const observer=new MutationObserver(records => { writes+=records.length; });
        observer.observe(story,{subtree:true,attributes:true});
        scrollBy({top:80,behavior:'instant'});
        setTimeout(()=>{observer.disconnect();resolve(writes)},250);
      });
    });
    assert.equal(outside,0,'Offscreen story stays idle');
    const motionToggle=page.getByRole('button',{name:'Animation effects',exact:true});
    await motionToggle.press('Enter');
    await page.waitForFunction(() =>
      document.documentElement.dataset.motion === 'off' &&
      document.querySelectorAll('.journey-panel[aria-hidden="false"]').length === 6
    );
    assert.equal(await motionToggle.getAttribute('aria-pressed'),'false','Keyboard toggle reports motion off');
    assert.equal(await page.locator('.journey-panel[aria-hidden="false"]').count(),6);
    }
  }
  await context.close();
  console.log('PERFORMANCE_RESULT '+JSON.stringify(result));
  return result;
}

try {
  const results=[];
  if (baseline) results.push(await measure(baseline,'baseline'));
  results.push(await measure(base,'candidate'));
  await writeFile('qa-artifacts/v10/performance.json',JSON.stringify(results,null,2));
  console.log('Mobile scroll layout budget, stable copy, chapter controls and offscreen idle passed.');
} finally { await browser.close(); }
