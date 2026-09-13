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
  await page.goto(url, {waitUntil:'networkidle'});
  await page.locator('.v10-story.is-cinematic').waitFor();
  const geometry = await page.locator('.story-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY, height:el.querySelector('.story-visual').clientHeight}));
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
      scrollTo({top:g.top+g.height*(.05+1.9*index/119),behavior:'instant'});
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

  // Reproduce the visible defect: copy must hold the same position while
  // the photograph crosses intermediate scroll positions within one chapter.
  const positions=[];
  for (const fraction of [.58,.72,.86,1,1.14,1.28,1.42]) {
    await page.evaluate(({g,f}) => scrollTo({top:g.top+g.height*f,behavior:'instant'}),{g:geometry,f:fraction});
    await page.waitForTimeout(60);
    positions.push((await page.locator('[data-beat="1"]>div').boundingBox()).y);
  }
  result.copyDriftPx = +(Math.max(...positions)-Math.min(...positions)).toFixed(2);
  console.log('PERFORMANCE_MEASURED '+JSON.stringify(result));
  if (label === 'candidate') {
    assert.ok(result.copyDriftPx <= 1, `Story copy moved ${result.copyDriftPx}px during native scroll`);
    assert.ok(result.styleMs <= 500, `Scroll spent ${result.styleMs}ms recalculating styles; budget is 500ms at 4× CPU slowdown`);
    assert.ok(result.layouts <= 12, `Scroll triggered ${result.layouts} layouts; budget is 12`);
    const beforeControls=await page.locator('.story-controls').boundingBox();
    assert.ok(beforeControls.width<=390,'Story controls fit the mobile viewport');
    await page.getByRole('button',{name:'03 Create',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('.v10-story').dataset.scene==='2');
    await page.getByRole('button',{name:'01 Observe',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('.v10-story').dataset.scene==='0');
    await page.waitForFunction(top => Math.abs(scrollY-top)<2,geometry.top);
    assert.equal(await page.locator('.story-beat:not(.is-current):not([inert])').count(),0,'Inactive copy cannot trap keyboard focus');
    await page.screenshot({path:'qa-artifacts/v10/mobile-story-performance.png'});
    // Returning to the opening must not leave story transforms rewriting offscreen.
    await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(300);
    const outside = await page.evaluate(() => {
      const story=document.querySelector('.v10-story');
      return new Promise(resolve => {
        let writes=0;const observer=new MutationObserver(records => { writes+=records.length; });
        observer.observe(story,{subtree:true,attributes:true});
        scrollTo({top:80,behavior:'instant'});
        setTimeout(()=>{observer.disconnect();resolve(writes)},250);
      });
    });
    assert.equal(outside,0,'Offscreen story stays idle');
    await page.getByRole('button',{name:'Animation effects',exact:true}).press('Enter');
    assert.equal(await page.locator('.story-beat[aria-hidden="false"]').count(),3);
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
