import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import projects from '../content/projects.mjs';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
await mkdir('qa-artifacts/v10/books',{recursive:true});
const scenarios=[
 {name:'desktop',viewport:{width:1440,height:900}},
 {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
 {name:'small',viewport:{width:320,height:700},isMobile:true,hasTouch:true},
 {name:'reduced',viewport:{width:390,height:844},reducedMotion:'reduce'},
 {name:'landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true},
 {name:'forced',viewport:{width:390,height:844},forcedColors:'active'}
];
try{
 for(const {name,...options} of scenarios){
  const context=await browser.newContext(options),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});
  const pinned=await page.locator('.scene-journey.is-scrubbed').count();
  if(pinned){await page.locator('[data-journey-select="1"]').click();await page.waitForTimeout(1500);}
  else await page.locator('[data-journey-book]').scrollIntoViewIfNeeded();
  await page.screenshot({path:`qa-artifacts/v10/books/${name}-work.png`});
  const indexes=pinned?[0,1,2,3,4]:[0];
  for(const i of indexes){
   if(pinned)await page.locator('[data-journey-project]').nth(i).click();
   const opener=page.locator('[data-journey-book]');
   await opener.scrollIntoViewIfNeeded();
   const y=await page.evaluate(()=>scrollY);
   await opener.click();await page.locator('#work-preview[open]').waitFor();await page.waitForTimeout(1000);
   assert.equal(await page.locator('#work-preview-title').innerText(),projects[i].title);
   assert.equal(new URL(await page.locator('.work-case-link').getAttribute('href'),base).pathname,`/work/${projects[i].slug}/`);
   assert.equal((await page.locator('.work-preview .cover-bottom').evaluate(el=>el.firstChild.textContent)).trim(),projects[i].title);
   assert.equal(await page.locator('.book-limits').innerText(),projects[i].limits);
   assert.deepEqual(await page.locator('.book-workflow li').allTextContents(),projects[i].flow);
   assert.equal(await page.locator('.work-preview-close').evaluate(el=>el===document.activeElement),true);
   await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('.work-case-link').evaluate(el=>el===document.activeElement),true);
   await page.keyboard.press('Tab');assert.equal(await page.locator('.work-preview-close').evaluate(el=>el===document.activeElement),true);
   // Wheel over modal content cannot trigger the native scene-settling controller.
   await page.locator('.work-preview-copy').hover();await page.mouse.wheel(0,240);await page.waitForTimeout(400);
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<2,'Modal scroll preserves the scene position');
   if(i===0)await page.screenshot({path:`qa-artifacts/v10/books/${name}-open.png`});
   await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'','Closing restores scroll synchronously');
   assert.equal(await opener.evaluate(el=>el===document.activeElement),true,'Returns focus to the book');
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<2,'Closing preserves the scene position');
  }
  if(pinned){
   await page.locator('[data-journey-project-open]').click();await page.locator('#work-preview[open]').waitFor();
   await page.locator('.work-preview-close').click();
   await page.locator('[data-journey-project-open]').click();await page.locator('#work-preview[open]').waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden','Rapid reopen keeps modal scroll lock');
   await page.keyboard.press('Escape');
   await page.locator('[data-journey-select="2"]').click();await page.waitForTimeout(1400);
   assert.equal(await page.locator('.scene-journey').getAttribute('data-active-scene'),'2','Navigation resumes after closing');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow');
  assert.deepEqual(errors,[]);await context.close();console.log('Integrated books passed: '+name);
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await nojs.newPage();
 await page.goto(base+'/');await page.locator('[data-journey-book]').click();await page.waitForURL('**/work/tfc-orders-tracker/');await nojs.close();
 console.log('Without JavaScript the book opens its full case study.');
 // Opening cost on a throttled mobile browser; preserve the experiment's existing budget.
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const p=await context.newPage();await p.goto(base+'/',{waitUntil:'networkidle'});await p.locator('[data-journey-select="1"]').click();await p.waitForTimeout(1500);
 const cdp=await context.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const metrics=await p.evaluate(()=>new Promise(resolve=>{const intervals=[];let last=0;const start=performance.now();document.querySelector('[data-journey-book]').click();function frame(t){if(last)intervals.push(t-last);last=t;if(t-start<2000)requestAnimationFrame(frame);else{const sorted=[...intervals].sort((a,b)=>a-b);resolve({samples:intervals.length,p95:sorted[Math.floor(sorted.length*.95)],over50:intervals.filter(n=>n>50).length})}}requestAnimationFrame(frame)}));
 await writeFile('qa-artifacts/v10/books/performance.json',JSON.stringify(metrics,null,2));console.log('BOOK_PERFORMANCE '+JSON.stringify(metrics));
 assert.ok(metrics.p95<34,'Book opening p95 stays below 34 ms');assert.ok(metrics.over50<=2,'Book opening stays within the existing slow-frame budget');
 await context.close();
}finally{await browser.close()}
