import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const baseline = process.env.PERFORMANCE_BASELINE_URL;
const browser = await chromium.launch();
await mkdir('qa-artifacts/v10', {recursive:true});

const metricsMap = async cdp => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
const metricDelta = (before, after, key, scale=1) => (after[key]-before[key])*scale;
const percentile = (values, p) => [...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))];

async function sweepWholeHomepage(page, cdp, label) {
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(350);
  const geometry = await page.evaluate(() => ({max:Math.max(0,document.documentElement.scrollHeight-innerHeight)}));
  const before = await metricsMap(cdp);
  const frames = await page.evaluate(({max}) => new Promise(resolve => {
    const times=[]; let previous=0, index=0; const steps=180;
    function step(now) {
      if (previous) times.push(now-previous);
      previous=now;
      const t=index/(steps-1);
      // Ease only the synthetic scroll position; the page still receives native scroll events.
      const eased=t*t*(3-2*t);
      scrollTo({top:max*eased,behavior:'instant'});
      if (++index < steps) requestAnimationFrame(step);
      else requestAnimationFrame(() => resolve(times));
    }
    requestAnimationFrame(step);
  }), geometry);
  const after = await metricsMap(cdp);
  const result = {
    label,
    distancePx:Math.round(geometry.max),
    frames:frames.length,
    layouts:Math.round(metricDelta(before,after,'LayoutCount')),
    styleRecalculations:Math.round(metricDelta(before,after,'RecalcStyleCount')),
    layoutMs:Math.round(metricDelta(before,after,'LayoutDuration',1000)),
    styleMs:Math.round(metricDelta(before,after,'RecalcStyleDuration',1000)),
    scriptMs:Math.round(metricDelta(before,after,'ScriptDuration',1000)),
    taskMs:Math.round(metricDelta(before,after,'TaskDuration',1000)),
    framesOver50ms:frames.filter(ms=>ms>50).length,
    framesOver100ms:frames.filter(ms=>ms>100).length,
    p95FrameMs:Math.round(percentile(frames,.95)),
    maxFrameMs:Math.round(Math.max(...frames))
  };
  console.log('FULL_JOURNEY_MEASURED '+JSON.stringify(result));
  return result;
}

async function measure(url, label) {
  const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2});
  const page = await context.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(url, {waitUntil:'networkidle'});
  const scenes = await page.locator('.scene-journey').count() > 0;
  await page.locator(scenes ? '.scene-journey.is-scrubbed' : '.v10-story.is-cinematic').waitFor();
  const geometry = scenes ? await page.locator('.scene-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:el.querySelector('.journey-stage').clientHeight*.9,range:4.9})) : await page.locator('.story-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:el.querySelector('.story-visual').clientHeight,range:1.9}));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
  await cdp.send('Performance.enable');
  await page.evaluate(g => scrollTo({top:g.top+g.height*.05,behavior:'instant'}), geometry);
  await page.waitForTimeout(400);
  const before = await metricsMap(cdp);
  const frames = await page.evaluate(g => new Promise(resolve => {
    const times=[]; let previous=0, index=0;
    function step(now) {
      if(previous) times.push(now-previous); previous=now;
      scrollTo({top:g.top+g.height*(.05+g.range*index/119),behavior:'instant'});
      if(++index<120) requestAnimationFrame(step); else requestAnimationFrame(() => resolve(times));
    }
    requestAnimationFrame(step);
  }),geometry);
  const after = await metricsMap(cdp);
  const result = {label, cpuSlowdown:4, frames:frames.length,
    layouts:after.LayoutCount-before.LayoutCount,
    styleRecalculations:after.RecalcStyleCount-before.RecalcStyleCount,
    layoutMs:Math.round((after.LayoutDuration-before.LayoutDuration)*1000),
    styleMs:Math.round((after.RecalcStyleDuration-before.RecalcStyleDuration)*1000),
    scriptMs:Math.round((after.ScriptDuration-before.ScriptDuration)*1000),
    framesOver50ms:frames.filter(ms => ms>50).length,
    p95FrameMs:Math.round(percentile(frames,.95))};

  // Preserve the native pinned stage position while the composition transforms.
  // The previous release is measured with its original stable-copy probe.
  const positions=[];
  for (const fraction of [.58,.72,.86,1,1.14,1.28,1.42]) {
    await page.evaluate(({g,f}) => scrollTo({top:g.top+g.height*f,behavior:'instant'}),{g:geometry,f:fraction});
    await page.waitForTimeout(60);
    positions.push((await page.locator(scenes ? '.journey-stage' : '[data-beat="1"]>div').boundingBox()).y);
  }
  result.copyDriftPx = +(Math.max(...positions)-Math.min(...positions)).toFixed(2);
  console.log('PERFORMANCE_MEASURED '+JSON.stringify(result));

  if (label === 'candidate') {
    assert.ok(result.copyDriftPx <= 1, `Story copy moved ${result.copyDriftPx}px during native scroll`);
    assert.ok(result.styleMs <= 500, `Scroll spent ${result.styleMs}ms recalculating styles; budget is 500ms at 4× CPU slowdown`);
    assert.ok(result.layouts <= 12, `Scroll triggered ${result.layouts} layouts; budget is 12`);
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
    // Restore motion before measuring the complete V12 journey.
    await motionToggle.press('Enter');
    await page.waitForFunction(() => document.documentElement.dataset.motion === 'on');
  }

  result.fullJourney = await sweepWholeHomepage(page,cdp,label);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:1});

  if (label === 'candidate') {
    const full=result.fullJourney;
    assert.ok(full.distancePx > 4000, `Full cinematic journey is unexpectedly short (${full.distancePx}px)`);
    assert.ok(full.p95FrameMs <= 50, `Full journey p95 frame time ${full.p95FrameMs}ms exceeds 50ms at 4× CPU slowdown`);
    assert.ok(full.framesOver100ms <= 3, `Full journey produced ${full.framesOver100ms} frames over 100ms`);
    assert.ok(full.layouts <= 30, `Full journey triggered ${full.layouts} layouts; budget is 30`);
    assert.ok(full.styleMs <= 1200, `Full journey spent ${full.styleMs}ms recalculating styles; budget is 1200ms`);
    assert.ok(full.scriptMs <= 1200, `Full journey spent ${full.scriptMs}ms in script; budget is 1200ms`);
    assert.deepEqual(pageErrors,[],`Full journey emitted page errors: ${pageErrors.join('; ')}`);
  }

  await context.close();
  console.log('PERFORMANCE_RESULT '+JSON.stringify(result));
  return result;
}

try {
  const results=[];
  if (baseline) results.push(await measure(baseline,'baseline'));
  results.push(await measure(base,'candidate'));
  if (results.length === 2) {
    const [oldRelease,candidate]=results.map(r=>r.fullJourney);
    // V12 may do more purposeful work than the previous release, but it must not
    // regress catastrophically relative to the live baseline under the same throttle.
    assert.ok(candidate.p95FrameMs <= Math.max(50,Math.ceil(oldRelease.p95FrameMs*1.35)),`V12 full-journey p95 regressed from ${oldRelease.p95FrameMs}ms to ${candidate.p95FrameMs}ms`);
    assert.ok(candidate.framesOver100ms <= oldRelease.framesOver100ms+3,`V12 introduced too many severe long frames (${oldRelease.framesOver100ms} → ${candidate.framesOver100ms})`);
  }
  await writeFile('qa-artifacts/v10/performance.json',JSON.stringify(results,null,2));
  console.log('Mobile scroll layout budget, full cinematic journey, stable copy, chapter controls and offscreen idle passed.');
} finally { await browser.close(); }
