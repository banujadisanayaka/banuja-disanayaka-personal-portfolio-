import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const out='qa-artifacts/v10/stage2';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
async function geometry(page){return page.locator('.scene-journey').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,step:el.querySelector('.journey-stage').clientHeight*.9}))}
async function scrub(page,g,from,to,duration=1500){
  await page.evaluate(({g,from,to,duration})=>new Promise(resolve=>{
    const start=performance.now();
    function frame(now){const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t);scrollTo({top:g.top+g.step*(from+(to-from)*e),behavior:'instant'});if(t<1)requestAnimationFrame(frame);else setTimeout(resolve,240)}
    requestAnimationFrame(frame);
  }),{g,from,to,duration});
}
try{
  const context=await browser.newContext({viewport:{width:1366,height:900},recordVideo:{dir:out,size:{width:640,height:420}}});
  const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});await page.locator('.scene-journey.is-scrubbed').waitFor();
  const g=await geometry(page);await page.evaluate(g=>scrollTo({top:g.top,behavior:'instant'}),g);await page.waitForTimeout(600);
  await page.screenshot({path:out+'/desktop-identity.jpg',type:'jpeg',quality:88,animations:'disabled'});
  await scrub(page,g,0,1,1700);await page.screenshot({path:out+'/desktop-work.jpg',type:'jpeg',quality:88,animations:'disabled'});
  await page.waitForTimeout(450);await scrub(page,g,1,0,1700);await page.waitForTimeout(450);
  const video=page.video();await context.close();if(video)await video.saveAs(out+'/identity-work-forward-reverse.webm');

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const mp=await mobile.newPage();await mp.goto(base+'/',{waitUntil:'networkidle'});await mp.locator('.scene-journey.is-scrubbed').waitFor();
  const mg=await geometry(mp);await mp.evaluate(g=>scrollTo({top:g.top,behavior:'instant'}),mg);await mp.waitForTimeout(600);
  await mp.screenshot({path:out+'/mobile-identity.jpg',type:'jpeg',quality:88,animations:'disabled'});
  await mp.evaluate(g=>scrollTo({top:g.top+g.step,behavior:'instant'}),mg);await mp.waitForTimeout(700);
  await mp.screenshot({path:out+'/mobile-work.jpg',type:'jpeg',quality:88,animations:'disabled'});
  await mobile.close();

  // Artifact storage can be unavailable on the account. Emit compact, chunked
  // review media into the job log so the exact-commit evidence remains recoverable.
  const media=[
    ['desktop-identity.jpg',out+'/desktop-identity.jpg'],
    ['desktop-work.jpg',out+'/desktop-work.jpg'],
    ['mobile-identity.jpg',out+'/mobile-identity.jpg'],
    ['mobile-work.jpg',out+'/mobile-work.jpg'],
    ['identity-work-forward-reverse.webm',out+'/identity-work-forward-reverse.webm']
  ];
  for(const [name,path] of media){
    const b64=(await readFile(path)).toString('base64');
    console.log(`STAGE2_MEDIA_BEGIN|${name}|${b64.length}`);
    for(let i=0,n=0;i<b64.length;i+=48000,n++) console.log(`STAGE2_MEDIA_CHUNK|${name}|${n}|${b64.slice(i,i+48000)}`);
    console.log(`STAGE2_MEDIA_END|${name}`);
  }
  console.log('Stage 2 review screenshots and forward/reverse recording captured.');
}finally{await browser.close()}
