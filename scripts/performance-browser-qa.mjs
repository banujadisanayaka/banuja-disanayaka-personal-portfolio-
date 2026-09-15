import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const baseline = process.env.PERFORMANCE_BASELINE_URL;
const browser = await chromium.launch();
await mkdir('qa-artifacts/v10', {recursive:true});

async function measure(url, label, diagnosticCSS = '') {
  const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2});
  try {
  const page = await context.newPage();
  await page.goto(url, {waitUntil:'networkidle'});
  if(diagnosticCSS)await page.addStyleTag({content:diagnosticCSS});
  const scenes = await page.locator('.scene-journey').count() > 0;
  await page.locator(scenes ? '.scene-journey.is-scrubbed' : '.v10-story.is-cinematic').waitFor();
  const geometry = scenes ? await page.locator('.scene-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:(el.querySelector('.journey-range')||el.querySelector('.journey-stage')).clientHeight*.9,range:4.9})) : await page.locator('.story-journey').evaluate(el => ({top:el.getBoundingClientRect().top+scrollY,height:el.querySelector('.story-visual').clientHeight,range:1.9}));
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
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest?.('.journey-atmosphere')&&a.playState==='running').length),0,'Offscreen background stops animating');
    const motionToggle=page.getByRole('button',{name:'Animation effects',exact:true});
    await motionToggle.press('Enter');
    await page.waitForFunction(() =>
      document.documentElement.dataset.motion === 'off' &&
      document.querySelectorAll('.journey-panel[aria-hidden="false"]').length === 6
    );
    assert.equal(await motionToggle.getAttribute('aria-pressed'),'false','Keyboard toggle reports motion off');
    assert.equal(await page.locator('.journey-panel[aria-hidden="false"]').count(),6);
  }
  console.log('PERFORMANCE_RESULT '+JSON.stringify(result));
  return result;
  } finally { await context.close(); }
}

async function traceLayouts() {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  try {
    const page=await context.newPage();
    await page.goto(base,{waitUntil:'networkidle'});
    const geometry=await page.locator('.scene-journey').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,step:el.querySelector('.journey-range').clientHeight*.9}));
    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking',transferMode:'ReturnAsStream'});
    await page.evaluate(g=>new Promise(resolve=>{let i=0;function next(){scrollTo({top:g.top+g.step*(.05+4.9*i/119),behavior:'instant'});if(++i<120)requestAnimationFrame(next);else resolve();}requestAnimationFrame(next);}),geometry);
    const finished=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
    await cdp.send('Tracing.end');
    const {stream}=await finished;let raw='';
    while(true){const chunk=await cdp.send('IO.read',{handle:stream});raw+=chunk.data;if(chunk.eof)break;}
    await cdp.send('IO.close',{handle:stream});
    const events=JSON.parse(raw).traceEvents;
    const invalidations=events.filter(e=>e.name==='LayoutInvalidationTracking').map(e=>e.args?.data||{});
    const reasons={};for(const e of invalidations){const key=JSON.stringify({reason:e.reason,nodeId:e.nodeId,stack:e.stackTrace?.slice(0,2)});reasons[key]=(reasons[key]||0)+1;}
    const nodes={};for(const id of [...new Set(invalidations.map(e=>e.nodeId).filter(Boolean))].slice(0,20)){
      try{const {node}=await cdp.send('DOM.describeNode',{backendNodeId:id});nodes[id]={name:node.nodeName,attributes:node.attributes};}catch{}
    }
    console.log('PERFORMANCE_LAYOUT_TRACE '+JSON.stringify({reasons,nodes,layouts:events.filter(e=>e.name==='Layout').slice(0,20).map(e=>({duration:e.dur,args:e.args}))}));
  } finally {await context.close();}
}

try {
  const results=[];
  if (baseline) results.push(await measure(baseline,'baseline'));
  try {
    results.push(await measure(base,'candidate'));
  } catch(error) {
    // Failure-only ablation identifies animation costs without weakening the gate.
    // These diagnostic pages are never accepted as a passing candidate.
    try {
      await traceLayouts();
      for(const [label,css] of [
        ['diagnostic-no-backdrop-fade','.journey-ambience{transition:none!important}'],
        ['diagnostic-promoted-backdrop','.ambient-flow,.ambient-light{will-change:transform,opacity}'],
        ['diagnostic-continuous-clocks','.scene-journey .ambient-flow,.scene-journey .ambient-light{animation-play-state:running!important}'],
        ['diagnostic-still-backdrop','.ambient-flow,.ambient-light{animation:none!important}']
      ])await measure(base,label,css);
    } catch(diagnosticError) {console.log('PERFORMANCE_DIAGNOSTIC_ERROR '+diagnosticError.message);}
    throw error;
  }
  await writeFile('qa-artifacts/v10/performance.json',JSON.stringify(results,null,2));
  console.log('Mobile scroll layout budget, stable copy, chapter controls and offscreen idle passed.');
} finally { await browser.close(); }
