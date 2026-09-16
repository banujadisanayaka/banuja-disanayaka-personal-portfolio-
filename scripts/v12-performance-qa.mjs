import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();

const metricsMap = async cdp => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
const percentile = (values, p) => [...values].sort((a,b)=>a-b)[Math.min(values.length-1, Math.floor(values.length*p))];

try {
  const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(base+'/', {waitUntil:'networkidle'});
  await page.locator('html[data-v12="on"]').waitFor();
  const diagnostics = await page.evaluate(() => window.__V12_DIAGNOSTICS__);
  assert.equal(diagnostics?.scrollListener, false);
  assert.equal(diagnostics?.geometryReadsOnScroll, false);

  const max = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
  assert.ok(max > 4000, `V12 journey is unexpectedly short (${max}px)`);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
  await cdp.send('Performance.enable');
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(350);
  const before = await metricsMap(cdp);

  const frames = await page.evaluate(({max}) => new Promise(resolve => {
    const times=[];
    let previous=0;
    let index=0;
    const steps=180;
    function step(now) {
      if (previous) times.push(now-previous);
      previous=now;
      const t=index/(steps-1);
      const eased=t*t*(3-2*t);
      scrollTo({top:max*eased,behavior:'instant'});
      if (++index < steps) requestAnimationFrame(step);
      else requestAnimationFrame(() => resolve(times));
    }
    requestAnimationFrame(step);
  }), {max});

  const after = await metricsMap(cdp);
  const delta = (key, scale=1) => (after[key]-before[key])*scale;
  const result = {
    distancePx: Math.round(max),
    frames: frames.length,
    layouts: Math.round(delta('LayoutCount')),
    styleRecalculations: Math.round(delta('RecalcStyleCount')),
    layoutMs: Math.round(delta('LayoutDuration',1000)),
    styleMs: Math.round(delta('RecalcStyleDuration',1000)),
    scriptMs: Math.round(delta('ScriptDuration',1000)),
    framesOver50ms: frames.filter(ms=>ms>50).length,
    framesOver100ms: frames.filter(ms=>ms>100).length,
    p95FrameMs: Math.round(percentile(frames,.95)),
    maxFrameMs: Math.round(Math.max(...frames))
  };

  console.log('V12_PERFORMANCE '+JSON.stringify(result));
  assert.ok(result.p95FrameMs <= 50, `V12 p95 frame time ${result.p95FrameMs}ms exceeds 50ms at 4× CPU slowdown`);
  assert.ok(result.maxFrameMs <= 280, `V12 worst animation frame ${result.maxFrameMs}ms exceeds 280ms`);
  assert.ok(result.framesOver100ms <= 3, `V12 produced ${result.framesOver100ms} frames over 100ms`);
  assert.ok(result.layouts <= 30, `V12 triggered ${result.layouts} layouts; budget is 30`);
  assert.ok(result.styleMs <= 1200, `V12 spent ${result.styleMs}ms recalculating styles; budget is 1200ms`);
  assert.ok(result.scriptMs <= 1200, `V12 spent ${result.scriptMs}ms in script; budget is 1200ms`);
  assert.deepEqual(errors, [], `V12 emitted page errors: ${errors.join('; ')}`);

  await cdp.send('Emulation.setCPUThrottlingRate', {rate:1});
  await context.close();
  console.log('V12 full-journey mobile performance gate passed.');
} finally {
  await browser.close();
}
