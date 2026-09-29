import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import projects from '../content/projects.mjs';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const url=base+'/experiments/project-library/';
const browser=await chromium.launch();
await mkdir('qa-artifacts/threeui',{recursive:true});
const scenarios=[
 {name:'desktop',viewport:{width:1440,height:900}},
 {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2},
 {name:'small',viewport:{width:320,height:700},isMobile:true,hasTouch:true},
 {name:'tablet',viewport:{width:768,height:1024}},
 {name:'landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true},
 {name:'reduced',viewport:{width:390,height:844},reducedMotion:'reduce'},
 {name:'forced',viewport:{width:390,height:844},forcedColors:'active'}
];
const settle=page=>page.waitForFunction(()=>document.getAnimations().every(a=>a.playState!=='running'));
const fits=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal page overflow');
try{
 for(const {name,...options} of scenarios){
  const context=await browser.newContext(options),page=await context.newPage(),errors=[],drawerBlocks=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{
   if(m.type()!=='error')return;
   const message=m.text().trim();
   const drawerFrame=message===`Refused to frame 'https://app.netlify.com/' because it violates the following Content Security Policy directive: "frame-src 'none'".`;
   const drawerPermission=/^Potential permissions policy violation: (camera|microphone) is not allowed in this document\.$/.test(message);
   (drawerFrame||drawerPermission?drawerBlocks:errors).push(message);
  });
  const response=await page.goto(url,{waitUntil:'networkidle'});
  assert.ok(response.headers()['content-security-policy'].includes("frame-src 'none'"),'Frame protection remains enforced');
  assert.ok(response.headers()['permissions-policy'].includes('camera=()'),'Camera protection remains enforced');
  await fits(page);
  assert.equal(await page.locator('.book-card').count(),5);
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
  await page.screenshot({path:`qa-artifacts/threeui/${name}-library.png`,fullPage:true});
  if(name==='desktop'||name==='mobile')console.log(`THREEUI_IMAGE ${name}-library `+(await page.screenshot({type:'jpeg',quality:70,fullPage:true})).toString('base64'));
  for(let i=0;i<5;i++){
   const card=page.locator('.book-card').nth(i);
   await card.scrollIntoViewIfNeeded();
   await card.click();
   await page.locator('dialog[open]').waitFor();await settle(page);
   assert.equal(await page.locator('#detail-title').textContent(),projects[i].title);
   assert.equal(await page.locator('.case-link').getAttribute('href'),`/work/${projects[i].slug}/`);
   assert.equal(await page.locator('.status').textContent(),projects[i].status);
   assert.equal(await page.locator('.detail-copy details p').textContent(),projects[i].limits);
   assert.ok(await page.locator('.close').evaluate(el=>document.activeElement===el),'Close initially focused');
   for(let t=0;t<5;t++){await page.keyboard.press('Tab');assert.ok(await page.locator('dialog').evaluate(el=>el.contains(document.activeElement)),'Dialog traps focus');}
   const bounds=await page.locator('dialog').boundingBox();
   assert.ok(bounds.x>=0&&bounds.x+bounds.width<=options.viewport.width+1,'Dialog fits viewport');
   assert.ok(await page.locator('.detail-layout').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Detail content fits');
   await page.locator('details summary').click();
   assert.ok(await page.locator('details').getAttribute('open')!==null,'Limitations can be expanded');
   await page.locator('.case-link').scrollIntoViewIfNeeded();
   assert.ok(await page.locator('.case-link').isVisible(),'Case study reachable through internal scroll');
   if(i===0){await page.locator('.close').click();}else{await page.keyboard.press('Escape');}
   await page.locator('dialog').waitFor({state:'hidden'});
   assert.ok(await card.evaluate(el=>el===document.activeElement),'Focus returns to exact book');
   assert.equal(await page.locator('html').evaluate(el=>el.style.overflow),'','Scroll unlocked');
   await fits(page);
  }
  // Native shelf controls and keyboard navigation operate without scene scroll interception.
  if(options.viewport.width<=900){
   await page.locator('.book-card').first().focus();await page.keyboard.press('Home');
   await page.waitForFunction(()=>document.querySelector('.shelf-position').textContent==='01 / 05');
   await page.locator('.next').click();
   await page.waitForFunction(()=>document.querySelector('.shelf-position').textContent==='02 / 05');
   await page.locator('.book-card').nth(1).focus();await page.keyboard.press('End');
   await page.waitForFunction(()=>document.querySelector('.shelf-position').textContent==='05 / 05');
  }
  if(name==='reduced'||name==='forced')assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
  if(name==='mobile'){
   const cdp=await context.newCDPSession(page);
   await page.locator('.book-card').first().focus();await page.keyboard.press('Home');
   await page.waitForFunction(()=>document.querySelector('.shelf-position').textContent==='01 / 05');
   await settle(page);
   const r=await page.locator('.book-card').first().boundingBox(),y=Math.max(100,Math.min(650,r.y+100));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:290,y}]});
   for(let x=270;x>=50;x-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(16);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(700);
   assert.equal(await page.locator('dialog').getAttribute('open'),null,'Swiping books never opens a project');
   assert.ok(await page.locator('.shelf').evaluate(el=>el.scrollLeft>100),'Native touch pans shelf');
   // Measure finite opening motion at the same emulated 4× CPU rate as the portfolio gate.
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
   const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
   const frames=await page.evaluate(()=>new Promise(resolve=>{
    let last=0,n=0;const times=[];
    requestAnimationFrame(function frame(t){if(last)times.push(t-last);last=t;
     if(n===2)document.querySelector('.book-card').click();
     if(n===75)document.querySelector('.close').click();
     if(++n<120)requestAnimationFrame(frame);else resolve(times);
    });
   }));
   const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
   const perf={cpuSlowdown:4,frames:frames.length,p95FrameMs:Math.round([...frames].sort((a,b)=>a-b)[Math.floor(frames.length*.95)]),framesOver50ms:frames.filter(x=>x>50).length,layouts:after.LayoutCount-before.LayoutCount,styleMs:Math.round((after.RecalcStyleDuration-before.RecalcStyleDuration)*1000)};
   console.log('THREEUI_PERFORMANCE '+JSON.stringify(perf));await writeFile('qa-artifacts/threeui/performance.json',JSON.stringify(perf,null,2));
   assert.ok(perf.p95FrameMs<=34,'Opening p95 <= 34ms at 4× CPU');assert.ok(perf.framesOver50ms<=3,'At most three >50ms intervals');assert.ok(perf.styleMs<=500,'Style budget <=500ms');assert.ok(perf.layouts<=12,'Layout budget <=12');
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  }
  // Runtime preference changes cancel transitions and persist; no continuous frame loop.
  if(name==='desktop'){
   await page.locator('.book-card').first().click();await page.emulateMedia({reducedMotion:'reduce'});
   await settle(page);assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
   await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'no-preference'});
   await page.locator('.motion-toggle').click();await page.reload();
   assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
  }
  await page.locator('.book-card').first().scrollIntoViewIfNeeded();
  await page.locator('.book-card').first().click();await settle(page);
  await page.locator('dialog').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:`qa-artifacts/threeui/${name}-open.png`});
  if(name==='desktop'||name==='mobile')console.log(`THREEUI_IMAGE ${name}-open `+(await page.screenshot({type:'jpeg',quality:70})).toString('base64'));
  if(drawerBlocks.length){
   assert.ok(await page.locator('iframe[title="Netlify Drawer"][src^="https://app.netlify.com/cdp/"]').count()>0,'Known policy warnings belong to Netlify preview tooling');
   console.log(`Expected preview-tool policy blocks: ${name} / ${drawerBlocks.length}`);
  }
  assert.deepEqual(errors,[],`${name}: no application script or unexpected CSP errors`);
  await context.close();console.log(`ThreeUI project library passed: ${name}`);
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await context.newPage();
 await page.goto(url);await fits(page);
 await page.locator('.book-card').first().click();await page.waitForURL('**/work/tfc-orders-tracker/');
 assert.ok(await page.locator('h1').isVisible(),'No-JS opens the real case study');
 await context.close();
 const css=await readFile('public/experiments/project-library/library.css','utf8');
 assert.ok(!css.includes('infinite'),'No continuous animation');
 console.log('ThreeUI: five projects, touch, focus, preferences, no-JS fallback and performance passed.');
}finally{await browser.close();}
