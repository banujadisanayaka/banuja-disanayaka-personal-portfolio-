import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const preview=path=>{const url=new URL(path);url.searchParams.set('ntl-drawer-state','hidden');return url.href};
const browser=await chromium.launch();
await mkdir('qa-artifacts/immersive',{recursive:true});
const names=['Opening','Gaze','Places','Act II','Work','Journey','Act III','VELORIA','Approach','Credits'];
const durations=[1.35,2.9,1.8,.9,2.3,2.4,.9,1.8,1.4,1.8];
const starts=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
async function fits(page,selector){
 const r=await page.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,scroll:el.scrollWidth,width:el.clientWidth,viewport:innerWidth,height:innerHeight}});
 assert.ok(r.left>=-1&&r.right<=r.viewport+1&&r.scroll<=r.width+1,`${selector} fits ${JSON.stringify(r)}`);
 return r;
}
async function assertPhotographyActive(page,stage){
 const state=await page.locator('#photography').evaluate(el=>({current:el.classList.contains('is-current'),inert:el.inert,ariaHidden:el.getAttribute('aria-hidden')}));
 assert.deepEqual(state,{current:true,inert:false,ariaHidden:'false'},'Photography scene is active before '+stage+': '+JSON.stringify(state));
}
async function jump(page,i){await page.getByRole('button',{name:names[i],exact:true}).click();await page.waitForFunction(i=>document.querySelector(`[data-scene="${i}"]`).getAttribute('aria-hidden')==='false',i);await page.waitForTimeout(700);}
try {
 for(const viewport of [{width:1366,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
  const context=await browser.newContext({viewport}); const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(preview(base+'/'),{waitUntil:'networkidle'}); await page.locator('.experience.is-live').waitFor();
  assert.equal(await page.locator('h1').count(),1);await fits(page,'h1');await fits(page,'.film-bottombar');
  if(viewport.width>700){
   const clearance=await page.locator('.film-topbar>span:last-child').evaluate(el=>{
    const text=document.createRange();text.selectNodeContents(el);
    return document.querySelector('.motion-toggle').getBoundingClientRect().left-text.getBoundingClientRect().right;
   });
   assert.ok(clearance>=16,'Location label clears the motion control');
  }
  assert.equal(await page.locator('.chapter-scene').count(),0,'One animation owner');
  const titleBottom=(await page.locator('h1').boundingBox()).y+(await page.locator('h1').boundingBox()).height;assert.ok(titleBottom<(await page.locator('.opening-copy').boundingBox()).y,'Opening copy never overlaps the name');
  for(let i=0;i<names.length;i++){
   await jump(page,i);assert.equal(await page.locator('.film-scene:not([inert])').count(),1);
   await fits(page,`[data-scene="${i}"]`);
   const selector=i===0?'h1':i===4?'.work-wall':i===5?'.journey-list':i===9?'.signature-stage':`[data-scene="${i}"] h2`;
   const bounds=await fits(page,selector);const rail=await page.locator('.film-bottombar').boundingBox();assert.ok(bounds.bottom<=rail.y+1,`${selector} clears controls`);
   if(i===4){
    assert.equal(await page.locator('.work-cell').count(),5,'Work matrix keeps exactly five project links');
    assert.equal(await page.locator('.work-discipline-ticker').getAttribute('aria-hidden'),'true','Discipline ticker is decorative');
    const ticker=await page.locator('.work-discipline-ticker').innerText();assert.match(ticker,/VISUAL STORYTELLING.*MULTI-BRAND ARCHITECTURE.*FULL-STACK & ANDROID SYSTEMS.*OPERATIONS ENGINEERING/);
    for(const s of ['.work-caption h2','.work-caption small']){const b=await fits(page,s),top=await page.locator('.film-topbar').boundingBox();assert.ok(!(b.top<top.y+top.height-1&&b.bottom>top.y+1),`${s} does not overlap top controls: ${JSON.stringify({b,top})}`);assert.ok(b.bottom<=rail.y+1,`${s} clears bottom controls`);}const tickerBox=await page.locator('.work-discipline-ticker').boundingBox(),tickerState=await page.locator('.work-discipline-ticker').evaluate(el=>({overflow:getComputedStyle(el).overflowX,width:el.clientWidth,scroll:el.scrollWidth})),tickerTop=await page.locator('.film-topbar').boundingBox();assert.ok(tickerBox.x>=-1&&tickerBox.x+tickerBox.width<=viewport.width+1&&tickerState.width<=viewport.width+1&&tickerState.overflow==='hidden','Discipline ticker stays clipped within viewport');assert.ok(!(tickerBox.y<tickerTop.y+tickerTop.height-1&&tickerBox.y+tickerBox.height>tickerTop.y+1)&&tickerBox.y+tickerBox.height<=rail.y+1,'Discipline ticker clears both film rails');await fits(page,'.work-cell:first-child');
    const topRailBox=await page.locator('.film-topbar').boundingBox(),topRailBottom=topRailBox.y+topRailBox.height,bottomRailTop=rail.y;const cards=await page.locator('.work-cell').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,scroll:el.scrollWidth,width:el.clientWidth};}));
    for(const b of cards)assert.ok(b.left>=-1&&b.right<=viewport.width+1&&b.scroll<=b.width+1&&b.top>=topRailBottom-1&&b.bottom<=bottomRailTop+1,`Work card fits without rail overlap: ${JSON.stringify({b,topRailBottom,bottomRailTop,viewport})}`);
    if(viewport.width>700){
     const card=page.locator('.work-cell').first();await card.hover();
     const effect=await card.evaluate(el=>({x:el.style.getPropertyValue('--cell-glare-x'),y:el.style.getPropertyValue('--cell-glare-y'),tilt:el.style.getPropertyValue('--cell-tilt-axis')}));
     assert.ok(effect.x&&effect.y&&effect.tilt,'Desktop card receives pointer glare and 3D micro-tilt');
     assert.equal((await page.locator('.reticle-pill').textContent()).trim(),'[ EXPLORE ]','Work card activates Explore reticle');
     const siblingOpacity=await page.locator('.work-cell').nth(1).evaluate(el=>Number(getComputedStyle(el).opacity));assert.ok(Math.abs(siblingOpacity-.72)<.02,'Inactive work cards dim on hover');
     await page.mouse.move(2,2);
    }
   }
   if(i===1){
    await assertPhotographyActive(page,'photography layout and comparison checks');
    const topRailBox=await page.locator('.film-topbar').boundingBox(),bottomRailBox=await page.locator('.film-bottombar').boundingBox();
    for(const selector of ['.gaze-intro','.gaze-reel-window','.gaze-readout','#perspective-photography']){const b=await page.locator(selector).boundingBox();assert.ok(b&&b.y>=topRailBox.y+topRailBox.height-1&&b.y+b.height<=bottomRailBox.y+1,'Photography element clears rails: '+selector+' '+JSON.stringify({b,topRailBox,bottomRailBox,viewport}));assert.ok(await page.locator(selector).evaluate(el=>el.scrollWidth<=el.clientWidth+1),'No horizontal overflow: '+selector);}
    assert.equal(await page.locator('[data-gaze-strip] figure').count(),6,'All six featured reel frames remain present');assert.ok(Number(await page.locator('[data-gaze-number]').textContent())>=6,'Frame counter remains numeric');const rawImage=page.locator('.grade-comparison__image--raw img');assert.equal(await rawImage.getAttribute('alt'),'','Decorative RAW overlay has empty alternative text');assert.equal(await rawImage.getAttribute('aria-hidden'),'true','Decorative RAW overlay image is hidden from assistive technology');assert.equal(await page.locator('.grade-comparison__image--raw').getAttribute('aria-hidden'),'true','RAW layer is hidden from assistive technology');assert.equal(await page.locator('[data-grade-scrubber]').evaluate(el=>getComputedStyle(el).pointerEvents),'auto','Grade scrubber remains pointer-interactive');for(const label of ['.grade-comparison__label--raw','.grade-comparison__label--graded']){const style=await page.locator(label).evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));assert.ok(style.color==='rgb(255, 255, 255)'&&style.background==='rgb(5, 7, 6)','Comparison label uses high-contrast foreground/background: '+label+' '+JSON.stringify(style));}
    await assertPhotographyActive(page,'grade scrubber interaction');const scrubber=page.locator('[data-grade-scrubber]');await scrubber.evaluate(el=>{el.value='73';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#perspective-photography').evaluate(el=>getComputedStyle(el).getPropertyValue('--grade-split').trim()),'73%','Input synchronously updates split');await scrubber.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#perspective-photography').evaluate(el=>getComputedStyle(el).getPropertyValue('--grade-split').trim()),'74%','Keyboard synchronously updates split');
    if(viewport.width>700){await assertPhotographyActive(page,'film frame hover');const frame=page.locator('.filmstrip figure').first();await frame.hover({timeout:10000});await assertPhotographyActive(page,'post-hover reticle assertion');assert.equal((await page.locator('.reticle-pill').textContent()).trim(),'[ INSPECT FRAME ]','Frame hover activates inspect reticle');await page.mouse.move(2,2);}
   }
   if(i===5){
    assert.equal(await page.locator('.journey-list li').count(),6,'Career ledger keeps exactly six entries');
    const journeyTitle=await fits(page,'.journey-copy h2'),journeyLabel=await fits(page,'.journey-copy small'),journeyTop=await page.locator('.film-topbar').boundingBox();assert.ok(!(journeyLabel.top<journeyTop.y+journeyTop.height-1&&journeyLabel.bottom>journeyTop.y+1),'Career section label clears top rail');assert.ok(!(journeyTitle.top<journeyTop.y+journeyTop.height-1&&journeyTitle.bottom>journeyTop.y+1),`Career heading does not overlap top controls: ${JSON.stringify({journeyTitle,journeyTop})}`);for(const s of ['.journey-list','.journey-list li:first-child']){const b=await fits(page,s);assert.ok(b.top>=journeyTop.y+journeyTop.height-1,`${s} clears top controls`);assert.ok(b.bottom<=rail.y+1,`${s} clears bottom controls`);}
    const topRailBox=await page.locator('.film-topbar').boundingBox(),topRailBottom=topRailBox.y+topRailBox.height,bottomRailTop=rail.y;const entries=await page.locator('.journey-list li').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,scroll:el.scrollWidth,width:el.clientWidth,scrollHeight:el.scrollHeight,height:el.clientHeight};}));
    for(const b of entries)assert.ok(b.left>=-1&&b.right<=viewport.width+1&&b.scroll<=b.width+1&&b.scrollHeight<=b.height+1&&b.top>=topRailBottom-1&&b.bottom<=bottomRailTop+1,`Career entry fits without rail overlap: ${JSON.stringify({entry:b,topRailBottom,bottomRailTop,viewport})}`);
    for(let a=0;a<entries.length;a++)for(let b=a+1;b<entries.length;b++){const x=entries[a],y=entries[b];const overlaps=x.left<y.right-1&&x.right>y.left+1&&x.top<y.bottom-1&&x.bottom>y.top+1;assert.equal(overlaps,false,`Career entries do not overlap: ${JSON.stringify({first:x,second:y,viewport})}`);}
   }
   await page.screenshot({path:`qa-artifacts/immersive/${viewport.width}-scene-${i+1}.png`});
  }
  assert.equal(await page.locator('.journey-list li').count(),6);
  assert.equal(await page.locator('.credits-more a[href*="linkedin.com"]').count(),1);
  assert.equal(await page.locator('.credits-more a[href*="github.com"]').count(),1);
  assert.equal(await page.locator('.work-cell').count(),5);
  for(const href of await page.locator('.work-cell').evaluateAll(els=>els.map(el=>el.getAttribute('href'))))assert.ok((await page.request.get(base+href)).ok(),href);
  // The intro must remain readable, then all six real photographs traverse the viewport.
  await jump(page,1);assert.ok(Number(await page.locator('.gaze-intro').evaluate(el=>getComputedStyle(el).opacity))>.95);
  const geometry=await page.locator('.experience').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,h:el.querySelector('.experience-stage').clientHeight}));
  for(const phase of [.4,.6,.84,.6,.4]){
   await page.evaluate(({g,p})=>scrollTo({top:g.top+g.h*p,behavior:'instant'}),{g:geometry,p:starts[1]+durations[1]*phase});await page.waitForTimeout(80);
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
  await page.locator('.motion-toggle').click();await page.locator('.experience.is-static').waitFor();assert.equal(await page.locator('.film-scene[inert]').count(),0);assert.equal(await page.locator('.work-discipline-ticker__track').evaluate(el=>getComputedStyle(el).animationName),'none','Static mode disables the studio ticker');
  assert.ok(await page.locator('.motion-toggle').isVisible(),'Motion can be re-enabled from the readable document');
  await page.locator('.motion-toggle').click();await page.locator('.experience.is-live').waitFor();
  assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-scene="5"]').getAttribute('aria-hidden'),'false','Restoring motion preserves the current reading section');
  await page.locator('.motion-toggle').click();await page.locator('.experience.is-static').waitFor();
  await page.goto(preview(base+'/about/'),{waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
  await page.locator('[data-explorer]').getByRole('button',{name:/The observer/}).click();assert.ok(await page.locator('#perspective-photography').isVisible());
  assert.deepEqual(errors,[]);await context.close();console.log(`Immersive scenes, links, reversals, focus and persistent motion passed ${viewport.width}x${viewport.height}`);
 }
 for(const mode of ['no-js','missing-runtime','reduced','forced','landscape','cms-offline']){
  const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:{width:320,height:700},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference',forcedColors:mode==='forced'?'active':'none'});
  const page=await context.newPage();if(mode==='missing-runtime')await page.route('**/immersive-home.js*',r=>r.abort());if(mode==='cms-offline')await page.route('**/api/content',r=>r.abort());
  await page.goto(preview(base+'/'),{waitUntil:'networkidle'});assert.equal(await page.locator('.film-scene').count(),10);assert.equal(await page.locator('.work-cell').count(),5);
  if(mode!=='cms-offline'){
   if(mode==='reduced')assert.equal(await page.locator('.work-discipline-ticker__track').evaluate(el=>getComputedStyle(el).animationName),'none','Reduced motion disables the studio ticker');
   assert.equal(await page.locator('.experience.is-live').count(),0);assert.equal(await page.locator('.film-scene[inert]').count(),0);
   for(const s of ['h1','.journey-list','.credits-list','.signature-stage']){await page.locator(s).scrollIntoViewIfNeeded();await fits(page,s);assert.ok(await page.locator(s).isVisible());}
  }
  await context.close();console.log('Content resilience passed: '+mode);
 }
 {
  const context=await browser.newContext();const page=await context.newPage();
  await page.route('**/api/content',async route=>{const response=await route.fetch();const json=await response.json();json.content.dailyGaze=[];json.content.projects=json.content.projects.slice(0,2);json.content.settings.showGaze=false;await route.fulfill({response,json});});
  await page.goto(preview(base+'/'),{waitUntil:'networkidle'});
  assert.equal(await page.locator('.filmstrip figure').count(),0,'CMS removals stay removed');assert.equal(await page.locator('.work-cell:not([hidden])').count(),2);assert.ok(await page.locator('[data-scene-select="1"]').isHidden());
  await page.getByRole('button',{name:'Places',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-scene="2"]').getAttribute('aria-hidden')==='false');
  await context.close();console.log('CMS projection, removed photographs and skipped hidden scenes passed');
 }
 // An unchanged CMS refresh must preserve decoded frames and their source attributes.
 {
  const context=await browser.newContext();const page=await context.newPage();
  await page.route('**/api/content',r=>r.abort());
  await page.goto(preview(base+'/'),{waitUntil:'networkidle'});
  const payload=await (await page.request.get(base+'/api/content')).json();
  const hydration=await page.evaluate(content=>{
   const strip=document.querySelector('.filmstrip'), before=[...strip.querySelectorAll('img')];
   const sources=before.map(img=>[img.getAttribute('src'),img.getAttribute('srcset'),img.getAttribute('sizes')]);
   const observer=new MutationObserver(()=>{});observer.observe(strip,{childList:true,subtree:true,attributes:true});
   document.dispatchEvent(new CustomEvent('portfolio:content',{detail:{content}}));
   const mutations=observer.takeRecords();observer.disconnect();
   const after=[...strip.querySelectorAll('img')];
   return {same:before.length===after.length&&before.every((img,i)=>img===after[i]),sourcesStable:JSON.stringify(sources)===JSON.stringify(after.map(img=>[img.getAttribute('src'),img.getAttribute('srcset'),img.getAttribute('sizes')])),childChanges:mutations.filter(m=>m.type==='childList').length,eager:after.every(img=>img.loading==='eager')};
  },payload.content);
  assert.deepEqual(hydration,{same:true,sourcesStable:true,childChanges:0,eager:true},'CMS hydration preserves decoded film frames');
  const edits=await page.evaluate(content=>{
   const strip=document.querySelector('.filmstrip'), first=strip.firstElementChild, id=first.dataset.photoId, image=first.querySelector('img');
   const edited=structuredClone(content);const photo=edited.dailyGaze.find(p=>String(p.id||p.preview)===id);
   photo.alt='Updated audit description';photo.title='Updated audit title';
   document.dispatchEvent(new CustomEvent('portfolio:content',{detail:{content:edited}}));
   const metadataUpdated=first.querySelector('img')===image&&image.alt===photo.alt&&first.querySelector('figcaption').textContent.includes(photo.title);
   photo.visible=false;document.dispatchEvent(new CustomEvent('portfolio:content',{detail:{content:edited}}));
   return {metadataUpdated,removed:!first.isConnected};
  },payload.content);
  assert.deepEqual(edits,{metadataUpdated:true,removed:true},'Metadata updates and unpublishing still apply');
  await jump(page,9);
  await page.locator('.motion-toggle').click();await page.locator('.experience.is-static').waitFor();
  await page.locator('[data-scene="4"]').scrollIntoViewIfNeeded();
  await page.locator('.motion-toggle').click();await page.locator('.experience.is-live').waitFor();
  assert.equal(await page.locator('[data-scene="4"]').getAttribute('aria-hidden'),'false','Static reading position survives motion restoration');
  await jump(page,5);
  assert.equal(await page.locator('.reading-progress span').evaluate(el=>el.style.transform),'','Homepage does not animate its hidden legacy bar');
  await page.goto(preview(base+'/daily-gaze/'),{waitUntil:'networkidle'});
  await page.evaluate(()=>scrollTo({top:innerHeight,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.reading-progress span').style.transform.startsWith('scaleX(')&&document.querySelector('.reading-progress span').style.transform!=='scaleX(0.0000)');
  await context.close();console.log('Decoded film reuse, CMS edits/removals and page-specific progress ownership passed');
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(preview(base+'/#contact'),{waitUntil:'networkidle'});assert.equal(await page.locator('[data-scene="9"]').getAttribute('aria-hidden'),'false');await context.close();
} finally {await browser.close();}
