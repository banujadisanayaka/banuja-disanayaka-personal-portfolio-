import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
const sizes=[[320,700],[390,844],[768,1024],[812,375],[1024,768],[1366,900]];
const paths=['/','/about/','/daily-gaze/','/work/tfc-orders-tracker/','/work/class-tracker/','/work/second-brain/','/work/banu-2/','/work/veloria/','/resume/'];
async function openRelease(page,path){
  let status=0;
  for(let attempt=0;attempt<8;attempt++){
    const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
    status=response?.status()||0;
    if(response?.ok()){
      try{
        await page.locator('body[data-version="10"]').waitFor({state:'attached',timeout:4000});
        await page.locator('h1').waitFor({state:'visible',timeout:4000});
        return;
      }catch{}
    }
    await page.waitForTimeout(1000);
  }
  assert.equal(await page.locator('body').getAttribute('data-version'),'10',`${path} serves the V10 release (last HTTP ${status})`);
}
try{
 for(const [width,height]of sizes){const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const path of paths){await openRelease(page,path);assert.equal(await page.locator('h1').count(),1);assert.ok(await page.locator('h1').isVisible());const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${path} overflows at ${width}×${height}`);const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.currentSrc&&!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[],`Broken images at ${path}`);}
  await openRelease(page,'/');const name=await page.locator('h1').evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,width:el.clientWidth}));assert.ok(name.left>=0&&name.right<=width+1&&name.scroll<=name.width+1,'Name fits');const immersive=await page.locator('[data-experience]').count()>0;if(!immersive&&width<=700){const menu=page.getByRole('button',{name:/Menu/});await menu.waitFor({state:'visible'});await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');}
  if(!immersive){await page.locator('#about .about-actions').scrollIntoViewIfNeeded();
  const aboutBounds=await page.locator('#about').evaluate(section=>{
    const box=section.getBoundingClientRect(),actions=section.querySelector('.about-actions').getBoundingClientRect();
    return {clearance:box.bottom-actions.bottom,nextClearance:section.nextElementSibling.getBoundingClientRect().top-actions.bottom};
  });
  assert.ok(aboutBounds.clearance>=24,`About actions have bottom space at ${width}×${height}: ${JSON.stringify(aboutBounds)}`);
  assert.ok(aboutBounds.nextClearance>=24,`Next section does not cover About actions at ${width}×${height}`);
  await page.locator('.site-footer .motion-toggle').waitFor({state:'attached'});
  assert.equal(await page.locator('.motion-toggle').evaluate(el=>getComputedStyle(el).position),'static','Motion control stays in flow outside opening');}
  assert.deepEqual(errors,[]);await context.close();console.log(`Responsive browser passed ${width}×${height}`);
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await openRelease(page,'/daily-gaze/');assert.equal(await page.locator('.photo-tile').count(),115);await page.getByRole('button',{name:'Wildlife',exact:true}).click();const count=await page.locator('.photo-tile:not([hidden])').count();assert.ok(count>0&&count<115);const first=page.locator('.photo-tile:not([hidden]) .photo-link').first();await first.click();assert.ok(await page.locator('dialog').isVisible());const title=await page.locator('#lightbox-title').textContent();await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#lightbox-title').textContent(),title);await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);assert.ok(await first.evaluate(el=>el===document.activeElement));await page.getByRole('button',{name:'All',exact:true}).click();assert.equal(await page.locator('.photo-tile:not([hidden])').count(),115);await context.close();console.log('Gallery filtering, keyboard navigation, modal focus and restoration passed');
 for(const mode of ['no-js','reduced','forced']){const context=await browser.newContext({viewport:{width:320,height:700},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference',forcedColors:mode==='forced'?'active':'none'});const page=await context.newPage();await openRelease(page,'/');for(const s of ['h1','#work','#about',await page.locator('[data-experience]').count()?'#credits':'#contact'])assert.ok(await page.locator(s).isVisible(),`${s} visible in ${mode}`);if(mode==='reduced')assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);await openRelease(page,'/daily-gaze/');assert.equal(await page.locator('.photo-tile').count(),115);await context.close();console.log(`${mode} content resilience passed`)}
 {const context=await browser.newContext();const page=await context.newPage();await page.route('**/api/content',r=>r.abort());await openRelease(page,'/');assert.ok(await page.locator('h1').isVisible());assert.ok(await page.locator('.project,.work-cell').count()===5);await context.close();console.log('CMS outage fallback passed');}
}finally{await browser.close()}
