import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
await mkdir('qa-artifacts/immersive',{recursive:true});
const names=['Opening','Gaze','Places','Act II','Work','Journey','Act III','VELORIA','Approach','Credits'];
const durations=[1.6,3.6,1.8,.9,2.3,2.4,.9,1.8,1.4,1.8];
async function fits(page,selector){
 const r=await page.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,scroll:el.scrollWidth,width:el.clientWidth,viewport:innerWidth,height:innerHeight}});
 assert.ok(r.left>=-1&&r.right<=r.viewport+1&&r.scroll<=r.width+1,`${selector} fits ${JSON.stringify(r)}`);
 return r;
}
async function jump(page,i){await page.getByRole('button',{name:names[i],exact:true}).click();await page.waitForFunction(i=>document.querySelector(`[data-scene="${i}"]`).getAttribute('aria-hidden')==='false',i);await page.waitForTimeout(700);}
try {
 for(const viewport of [{width:1366,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
  const context=await browser.newContext({viewport}); const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'}); await page.locator('.experience.is-live').waitFor();
  assert.equal(await page.locator('h1').count(),1);await fits(page,'h1');await fits(page,'.film-bottombar');
  assert.equal(await page.locator('.chapter-scene').count(),0,'One animation owner');
  for(let i=0;i<names.length;i++){
   await jump(page,i);assert.equal(await page.locator('.film-scene:not([inert])').count(),1);
   await fits(page,`[data-scene="${i}"]`);
   const selector=i===0?'h1':i===4?'.work-wall':i===5?'.journey-list':i===9?'.signature-stage':`[data-scene="${i}"] h2`;
   const bounds=await fits(page,selector);const rail=await page.locator('.film-bottombar').boundingBox();assert.ok(bounds.bottom<=rail.y+1,`${selector} clears controls`);
   await page.screenshot({path:`qa-artifacts/immersive/${viewport.width}-scene-${i+1}.png`});
  }
  assert.equal(await page.locator('.journey-list li').count(),5);
  assert.equal(await page.locator('.work-cell').count(),5);
  for(const href of await page.locator('.work-cell').evaluateAll(els=>els.map(el=>el.getAttribute('href'))))assert.ok((await page.request.get(base+href)).ok(),href);
  // The intro must remain readable, then all six real photographs traverse the viewport.
  await jump(page,1);assert.ok(Number(await page.locator('.gaze-intro').evaluate(el=>getComputedStyle(el).opacity))>.95);
  const geometry=await page.locator('.experience').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,h:el.querySelector('.experience-stage').clientHeight}));
  for(const phase of [.4,.6,.84,.6,.4]){
   await page.evaluate(({g,p})=>scrollTo({top:g.top+g.h*(1.6+3.6*p),behavior:'instant'}),{g:geometry,p:phase});await page.waitForTimeout(80);
   assert.ok(Number(await page.locator('.filmstrip').evaluate(el=>getComputedStyle(el).opacity))>.95);
  }
  // Slow boundaries, fast forward and reverse remain opaque and maintain a native pinned stage.
  let start=0;for(let i=0;i<durations.length-1;i++){
   for(const phase of [.85,.9,.96,1.01,.96,.9]){
    await page.evaluate(({g,p})=>scrollTo({top:g.top+g.h*p,behavior:'instant'}),{g:geometry,p:start+durations[i]*phase});await page.waitForTimeout(35);
    assert.ok(await page.locator('.film-scene').evaluateAll(els=>els.some(el=>getComputedStyle(el).visibility==='visible'&&Number(getComputedStyle(el).opacity)>.99)),'No empty midpoint');
   } start+=durations[i];
  }
  const menu=page.locator('[data-open-scenes-mini]');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');
  for(let n=0;n<14;n++){await page.keyboard.press('Tab');assert.ok(await page.locator('#experience-menu').evaluate(el=>el.contains(document.activeElement)));}
  await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.ok(await menu.evaluate(el=>el===document.activeElement));assert.equal(await page.locator('html').evaluate(el=>el.style.overflow),'');
  await menu.click();await page.locator('[data-menu-scene="5"]').click();await page.waitForFunction(()=>document.querySelector('[data-scene="5"]').getAttribute('aria-hidden')==='false');
  await page.locator('.motion-toggle').click();await page.locator('.experience.is-static').waitFor();assert.equal(await page.locator('.film-scene[inert]').count(),0);
  await page.goto(base+'/about/',{waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
  await page.locator('[data-explorer]').getByRole('button',{name:/The observer/}).click();assert.ok(await page.locator('#perspective-photography').isVisible());
  assert.deepEqual(errors,[]);await context.close();console.log(`Immersive scenes, links, reversals, focus and persistent motion passed ${viewport.width}x${viewport.height}`);
 }
 for(const mode of ['no-js','missing-runtime','reduced','forced','landscape','cms-offline']){
  const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:{width:320,height:700},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference',forcedColors:mode==='forced'?'active':'none'});
  const page=await context.newPage();if(mode==='missing-runtime')await page.route('**/immersive-home.js*',r=>r.abort());if(mode==='cms-offline')await page.route('**/api/content',r=>r.abort());
  await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('.film-scene').count(),10);assert.equal(await page.locator('.work-cell').count(),5);
  if(mode!=='cms-offline'){
   assert.equal(await page.locator('.experience.is-live').count(),0);assert.equal(await page.locator('.film-scene[inert]').count(),0);
   for(const s of ['h1','.journey-list','.credits-list','.signature-stage']){await page.locator(s).scrollIntoViewIfNeeded();await fits(page,s);assert.ok(await page.locator(s).isVisible());}
  }
  await context.close();console.log('Content resilience passed: '+mode);
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(base+'/#contact',{waitUntil:'networkidle'});assert.equal(await page.locator('[data-scene="9"]').getAttribute('aria-hidden'),'false');await context.close();
} finally {await browser.close();}
