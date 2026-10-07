import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const durations=[1.35,2.9,1.8,.9,2.3,2.4,.9,1.8,1.4,1.8];
const starts=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
const dir='qa-artifacts/continuous-motion';await mkdir(dir,{recursive:true});
const browser=await chromium.launch();const results=[];
try{
for(const viewport of [{width:1366,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,recordVideo:{dir,size:{width:viewport.width,height:viewport.height}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=new URL(base);url.searchParams.set('ntl-drawer-state','hidden');await page.goto(url.href,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.locator('.experience.is-live').waitFor();
 const g=await page.locator('.experience').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,h:el.querySelector('.experience-stage').clientHeight}));
 const seek=async(p)=>{
   const started=Date.now();
   const actual=await page.evaluate(({g,p})=>new Promise(resolve=>{
     scrollTo({top:g.top+p*g.h,behavior:'instant'});
     // Native scroll lands immediately; the visual camera then settles independently.
     requestAnimationFrame(()=>resolve(scrollY));
   }),{g,p});
   assert.ok(Math.abs(actual-(g.top+p*g.h))<1.1,`Native scroll reaches requested position: ${actual} vs ${g.top+p*g.h}`);
   await page.waitForFunction(()=>document.querySelector('.experience')?._cameraState?.settled===true,null,{timeout:900});
   const state=await page.locator('.experience').evaluate(el=>el._cameraState);
   assert.ok(Math.abs(state.target-state.visual)<.0004,'Smoothed camera settles exactly on native scroll');
   assert.ok(Date.now()-started<900,'Camera settling stays responsive');
 };
 const state=()=>page.locator('.experience').evaluate(el=>[...el.querySelectorAll('.film-scene,.film-scene [style],.signal-rig [style]')].filter(el=>!el.closest('.film-scene')||getComputedStyle(el.closest('.film-scene')).visibility==='visible').map(el=>({tag:el.className?.baseVal??el.className,style:el.getAttribute('style')})));
 // Regression probes from the phone recording: no title resurrection over the
 // reel, and no pose discontinuities at the globe arrival or project departure.
 for(const phase of [.69,.701,.74,.85]){
  await seek(starts[1]+durations[1]*phase);
  assert.match(await page.locator('.gaze-intro').evaluate(el=>getComputedStyle(el).clipPath),/100%/,'Gaze title stays clipped throughout film departure');
 }
 const angle=()=>page.locator('.reach-globe').evaluate(el=>{const m=new DOMMatrixReadOnly(getComputedStyle(el).transform);return Math.atan2(m.b,m.a)*180/Math.PI;});
 await seek(starts[2]-.003);const incomingAngle=await angle();
 await seek(starts[2]+.003);assert.ok(Math.abs(await angle()-incomingAngle)<.2,'Globe rotation is continuous at arrival');
 const positions=()=>page.locator('.work-cell').evaluateAll(els=>els.map(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42));
 await seek(starts[4]+durations[4]*.698);const settledProjects=await positions();
 await seek(starts[4]+durations[4]*.702);const departingProjects=await positions();
 assert.ok(settledProjects.every((y,j)=>Math.abs(y-departingProjects[j])<1),'Projects leave from their settled depth pose');
 for(let i=0;i<9;i++){
  const midpoint=starts[i]+durations[i]*.85;
  await seek(starts[i]+durations[i]*.65);
  for(let n=0;n<=16;n++)await seek(starts[i]+durations[i]*(.7+.3*n/16));
  await seek(midpoint);const before=await state();
  assert.equal(await page.locator('.signal-rig').count(),1,'One persistent rig');
  const rootOpacities=await page.locator('.film-scene').evaluateAll(els=>els.filter(el=>getComputedStyle(el).visibility==='visible').map(el=>getComputedStyle(el).opacity));
  assert.ok(rootOpacities.every(v=>v==='1'),'No crossfade ghosting');
  assert.equal(await page.locator('.film-scene:not([inert])').count(),0,'Masked scene controls cannot receive focus');
  await page.screenshot({path:`${dir}/${viewport.width}-boundary-${i+1}-midpoint.png`});
  await seek(starts[i+1]+durations[i+1]*.1);await seek(midpoint);
  assert.deepEqual(await state(),before,`Boundary ${i+1} reconstructs exactly in reverse`);
  await page.waitForTimeout(160);assert.deepEqual(await state(),before,'Paused composition is stable');
 }
 // Every chapter boundary must end at exactly the state the next scene begins with.
 for(let i=1;i<10;i++){
  await seek(starts[i]);await page.screenshot({path:`${dir}/${viewport.width}-arrival-${i+1}.png`});
 }
 await seek(starts[9]+durations[9]*.85);
 assert.equal(await page.locator('.signature-pen').evaluate(el=>getComputedStyle(el).strokeDashoffset),'0px','Signature completes');
 await page.screenshot({path:`${dir}/${viewport.width}-signature.png`});
 // Walk backwards, including the gallery, using the same controller.
 for(let i=8;i>=0;i--)for(let n=10;n>=0;n--)await seek(starts[i]+durations[i]*(.7+.3*n/10));
 assert.deepEqual(errors,[]);results.push({viewport,allNineBoundaries:'opaque, reversible and pause-stable',errors});
 const video=page.video();await context.close();await video.saveAs(`${dir}/${viewport.width}-forward-reverse.webm`);
}
await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
