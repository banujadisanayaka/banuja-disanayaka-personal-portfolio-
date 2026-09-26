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
    function frame(now){const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t);scrollTo({top:g.top+g.step*(from+(to-from)*e),behavior:'instant'});if(t<1)requestAnimationFrame(frame);else setTimeout(resolve,260)}
    requestAnimationFrame(frame);
  }),{g,from,to,duration});
}
async function captureRun({name,viewport,videoSize,isMobile=false,deviceScaleFactor=1}){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile,deviceScaleFactor,recordVideo:{dir:out,size:videoSize}});
  const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});await page.locator('.scene-journey.is-scrubbed').waitFor();
  const g=await geometry(page);await page.evaluate(g=>scrollTo({top:g.top,behavior:'instant'}),g);await page.waitForTimeout(650);
  await page.screenshot({path:`${out}/${name}-identity.jpg`,type:'jpeg',quality:88,animations:'disabled'});
  await page.evaluate(({g})=>scrollTo({top:g.top+g.step*.5,behavior:'instant'}),{g});await page.waitForTimeout(600);
  await page.screenshot({path:`${out}/${name}-midpoint.jpg`,type:'jpeg',quality:88,animations:'disabled'});
  await page.evaluate(({g})=>scrollTo({top:g.top+g.step*1.08,behavior:'instant'}),{g});await page.waitForTimeout(600);
  await page.screenshot({path:`${out}/${name}-work-gaze-join.jpg`,type:'jpeg',quality:88,animations:'disabled'});
  await page.evaluate(g=>scrollTo({top:g.top,behavior:'instant'}),g);await page.waitForTimeout(350);
  await scrub(page,g,0,1.28,2200);await page.waitForTimeout(450);await scrub(page,g,1.28,0,2200);await page.waitForTimeout(450);
  const video=page.video();await context.close();if(video)await video.saveAs(`${out}/${name}-forward-reverse.webm`);
}
try{
  await captureRun({name:'desktop',viewport:{width:1366,height:900},videoSize:{width:960,height:632}});
  await captureRun({name:'mobile',viewport:{width:390,height:844},videoSize:{width:390,height:844},isMobile:true,deviceScaleFactor:2});
  const names=['desktop-identity.jpg','desktop-midpoint.jpg','desktop-work-gaze-join.jpg','desktop-forward-reverse.webm','mobile-identity.jpg','mobile-midpoint.jpg','mobile-work-gaze-join.jpg','mobile-forward-reverse.webm'];
  for(const name of names){
    const b64=(await readFile(out+'/'+name)).toString('base64');
    console.log(`STAGE2_MEDIA_BEGIN|${name}|${b64.length}`);
    for(let i=0,n=0;i<b64.length;i+=48000,n++)console.log(`STAGE2_MEDIA_CHUNK|${name}|${n}|${b64.slice(i,i+48000)}`);
    console.log(`STAGE2_MEDIA_END|${name}`);
  }
  console.log('Stage 2 corrected desktop/mobile review media captured.');
}finally{await browser.close()}
