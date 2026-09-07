import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
const ready=page=>page.locator('.welcome-stage[data-ready="true"]').waitFor({timeout:30000});
await fs.mkdir('artifacts/welcome',{recursive:true});
try {
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});await ready(page);
  const stage=page.locator('.welcome-stage');
  // Verify that the WebGL output contains a rendered, varied image, not an empty canvas.
  const stats=await sharp(await page.locator('.welcome-stage canvas').screenshot()).stats();
  assert.ok(stats.channels.slice(0,3).some(c=>c.stdev>15),'The avatar renders visible geometry');
  await page.screenshot({path:'artifacts/welcome/desktop.png'});
  await page.locator('.welcome-stage').screenshot({path:'artifacts/welcome/avatar.png'});
  const angle=await stage.getAttribute('data-rotation');
  await page.getByRole('button',{name:'Rotate avatar right',exact:true}).click();
  await page.waitForFunction(v=>document.querySelector('.welcome-stage').dataset.rotation!==v,angle);
  const box=await stage.boundingBox();
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.75,box.y+box.height*.5,{steps:8});await page.mouse.up();
  assert.match(await page.locator('#welcome-status').textContent(),/different angle/);
  await stage.focus();await page.keyboard.press('Home');
  await page.waitForFunction(()=>['349','350'].includes(document.querySelector('.welcome-stage').dataset.rotation));
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(()=>Number(document.querySelector('.welcome-stage').dataset.rotation)<340);
  await page.getByRole('button',{name:'Cool studio lighting',exact:true}).click();
  assert.equal(await page.locator('#welcome').getAttribute('data-light'),'cool');
  await page.getByRole('button',{name:/Say hello/}).click();
  await page.waitForFunction(()=>document.querySelector('.welcome-stage').dataset.wave==='true');
  await page.waitForTimeout(650);
  await page.screenshot({path:'artifacts/welcome/greeting.png',clip:await stage.boundingBox()});
  await page.waitForFunction(()=>document.querySelector('.welcome-stage').dataset.wave==='false');
  assert.match(await page.locator('#welcome-status').textContent(),/Hello! I’m Banu/);
  await page.getByRole('link',{name:/Enter portfolio/}).click();
  assert.equal(await page.locator('#welcome').isVisible(),false);
  assert.equal(await page.locator('.welcome-stage canvas').count(),0,'Entering releases the rendering surface');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'portfolio');
  await page.getByRole('button',{name:/Replay 3D welcome/}).click();await ready(page);
  await page.getByRole('link',{name:/Skip intro/}).click();
  await page.goto(base+'/#welcome',{waitUntil:'networkidle'});await ready(page);
  assert.ok(await page.locator('#welcome').isVisible(),'An explicit welcome link reopens the scene');
  await page.getByRole('link',{name:/Skip intro/}).click();
  const welcomeRequests=[];page.on('request',r=>{if(r.url().includes('/scene-'))welcomeRequests.push(r.url());});
  await page.goto(base+'/about/');await page.goto(base+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#welcome').isVisible(),false,'Returning visitors go straight to the portfolio');
  assert.deepEqual(welcomeRequests,[],'Returning visitors do not download the 3D renderer');
  assert.deepEqual(errors,[]);await context.close();
  console.log('Rendered 3D, pointer/keyboard controls, finite wave, lighting, entry, replay and return visit passed');

  for(const [width,height] of [[320,700],[390,844],[768,1024],[812,375]]){
    const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});const p=await ctx.newPage();
    await p.goto(base+'/',{waitUntil:'networkidle'});await ready(p);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Welcome fits ${width}×${height}`);
    await p.screenshot({path:`artifacts/welcome/mobile-${width}.png`});
    const skip=await p.getByRole('link',{name:/Skip intro/}).boundingBox();assert.ok(skip.y+skip.height<height,'Skip is immediately visible');
    if(width===390){
      const cdp=await ctx.newCDPSession(p),r=await p.locator('.welcome-stage').boundingBox();
      const x=Math.round(r.x+r.width*.45),y=Math.round(r.y+r.height*.5);
      const before=await p.locator('.welcome-stage').getAttribute('data-rotation');
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+65,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await p.waitForFunction(v=>document.querySelector('.welcome-stage').dataset.rotation!==v,before);
      const scrollBefore=await p.evaluate(()=>scrollY);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:2}]});
      for(const dy of [20,45,85,125])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await p.waitForFunction(v=>scrollY>v+20,scrollBefore);
      assert.equal(await p.locator('.welcome-stage').evaluate(el=>el.classList.contains('is-dragging')),false);
    }
    await ctx.close();
  }
  console.log('Mobile/tablet/landscape layouts, native touch rotation and vertical scrolling passed');

  for(const mode of ['reduced','no-js','forced','webgl-unavailable','module-failure','deep-link']){
    const ctx=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference',forcedColors:mode==='forced'?'active':'none'});
    const p=await ctx.newPage();const requests=[];p.on('request',r=>{if(r.url().includes('/scene-'))requests.push(r.url());});
    if(mode==='webgl-unavailable')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
    if(mode==='module-failure')await p.route('**/assets/welcome/scene-*',r=>r.abort());
    await p.goto(base+'/'+(mode==='deep-link'?'#work':''),{waitUntil:'networkidle'});
    if(mode==='deep-link'){assert.equal(await p.locator('#welcome').isVisible(),false);assert.deepEqual(requests,[]);}
    else{
      assert.ok(await p.locator('.welcome-poster img').isVisible());
      if(['no-js','forced','reduced'].includes(mode))assert.deepEqual(requests,[]);
      if(mode==='reduced'){
        await p.getByRole('button',{name:/Explore in 3D/}).click();await ready(p);
        await p.getByRole('button',{name:/Say hello/}).click();
        assert.notEqual(await p.locator('.welcome-stage').getAttribute('data-wave'),'true');
        await p.getByRole('button',{name:'Rotate avatar right',exact:true}).click();
        await p.waitForFunction(()=>Number(document.querySelector('.welcome-stage').dataset.rotation)<40);
      }
      await p.getByRole('link',{name:/Skip intro/}).click();assert.ok(await p.locator('#portfolio h1').isVisible());
      if(mode!=='no-js')assert.equal(await p.locator('#welcome').isVisible(),false);
    }
    await ctx.close();
  }
  console.log('Reduced motion, no JavaScript, forced colours, unavailable WebGL/module and deep links remain usable');
}finally{await browser.close();}
