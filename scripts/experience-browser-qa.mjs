import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
try {
  await mkdir('qa-artifacts/welcome', {recursive:true});
  for (const scenario of [
    {name:'desktop', viewport:{width:1366,height:900}},
    {name:'mobile', viewport:{width:390,height:844}, hasTouch:true, isMobile:true},
    {name:'small-mobile', viewport:{width:360,height:640}, hasTouch:true, isMobile:true},
    {name:'landscape', viewport:{width:844,height:390}, hasTouch:true, isMobile:true},
    {name:'reduced-motion', viewport:{width:390,height:844}, reducedMotion:'reduce'},
    {name:'no-webgl', viewport:{width:390,height:844}, noWebGL:true}
  ]) {
  const {name, noWebGL, ...options} = scenario;
  const introContext = await browser.newContext(options);
  if (noWebGL) await introContext.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl' || type === 'webgl2' ? null : getContext.call(this, type, ...args);
    };
  });
  const introPage = await introContext.newPage();
  const introErrors=[];introPage.on('pageerror',e=>introErrors.push(e.message));
  await introPage.goto(base+'/?intro=1',{waitUntil:'networkidle'});
  const welcome=introPage.locator('.bd-welcome');
  await welcome.waitFor({state:'visible'});
  const welcomeScriptSrc=await introPage.locator('script[src*="/v9-welcome.js"]').getAttribute('src');
  const welcomeStyleHref=await introPage.locator('link[href*="/v9-welcome.css"]').getAttribute('href');
  assert.match(welcomeScriptSrc||'',/\/v9-welcome\.js\?v=915-user-cutout-/,'Welcome JS uses the V9.1.5 cache-busted release key');
  assert.match(welcomeStyleHref||'',/\/v9-welcome\.css\?v=915-user-cutout-/,'Welcome CSS uses the V9.1.5 cache-busted release key');
  assert.equal(await welcome.getAttribute('role'),'dialog');
  assert.equal(await welcome.getAttribute('aria-modal'),'true');
  assert.equal(await introPage.locator('#main').getAttribute('inert'),'');
  await introPage.waitForFunction(()=>document.querySelector('.bd-welcome')?.dataset.subjectSource==='static-cutout',null,{timeout:8000});
  assert.equal(await introPage.locator('.bd-welcome-frame').count(),0,'Decorative portrait frame is removed from the welcome DOM');
  assert.equal(await introPage.locator('.bd-welcome-fallback img').count(),0,'Welcome fallback does not reprocess the portrait through a data URL');
  assert.equal(await welcome.getAttribute('data-subject-isolation'),null,'Runtime subject isolation is removed');
  const portraitResponse=await introPage.request.get(base+'/assets/v9/portrait-cutout-8a7c9e4c1dc9.webp');
  assert.equal(portraitResponse.status(),200,'Static transparent portrait is deployed');
  const matte=await introPage.evaluate(()=>{
    const canvas=document.querySelector('.bd-welcome-fallback-canvas');
    const ctx=canvas?.getContext('2d',{willReadFrequently:true});
    if(!canvas||!ctx||canvas.dataset.render!=='static-cutout') return {transparentRatio:0,sideAlphas:[],bodyAlphas:[],render:''};
    const width=canvas.width,height=canvas.height,data=ctx.getImageData(0,0,width,height).data;
    let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]<32)transparent++;
    const alphaAt=(x,y)=>data[(Math.min(height-1,Math.round(y*(height-1)))*width+Math.min(width-1,Math.round(x*(width-1))))*4+3];
    const sidePoints=[[.10,.25],[.90,.25],[.10,.50],[.90,.50],[.10,.75],[.90,.75]];
    const bodyPoints=[[.50,.16],[.50,.20],[.50,.25],[.50,.30],[.50,.36],[.50,.42],[.50,.50]];
    return {transparentRatio:transparent/(data.length/4),sideAlphas:sidePoints.map(([x,y])=>alphaAt(x,y)),bodyAlphas:bodyPoints.map(([x,y])=>alphaAt(x,y)),render:canvas.dataset.render};
  });
  assert.equal(matte.render,'static-cutout','User supplied cutout is the visible fallback source');
  assert.ok(matte.transparentRatio>.65,`Static cutout contains substantial real transparency: ${matte.transparentRatio.toFixed(3)}`);
  assert.ok(matte.sideAlphas.filter(a=>a<48).length>=5,`Cutout side probes are transparent: ${matte.sideAlphas.join(',')}`);
  assert.ok(matte.bodyAlphas.every(a=>a>180),`Head/neck/tie/torso stay intact: ${matte.bodyAlphas.join(',')}`);
  await introPage.waitForFunction(()=>document.querySelector('.bd-welcome')?.classList.contains('webgl-ready')||document.querySelector('.bd-welcome')?.classList.contains('bd-welcome-no-webgl'),null,{timeout:8000});
  assert.equal(await introPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Welcome has no horizontal overflow');
  if (noWebGL || scenario.reducedMotion) {
    assert.ok(await welcome.evaluate(el=>el.classList.contains('bd-welcome-no-webgl')),'Accessible static fallback is active');
    assert.equal(await introPage.locator('.bd-welcome-fallback').evaluate(el=>getComputedStyle(el).opacity),'1','Static portrait is visible');
  }
  if (scenario.viewport.width <= 900) {
    const visualRect = await introPage.locator('.bd-welcome-visual').boundingBox();
    const copyRect = await introPage.locator('.bd-welcome-copy').boundingBox();
    assert.ok(copyRect.y >= visualRect.y + visualRect.height - 10,'Mobile copy stays below the portrait');
  }
  const fallbackFit=await introPage.locator('.bd-welcome-fallback-canvas').evaluate(el=>({
    width:el.clientWidth,height:el.clientHeight,
    availableWidth:el.parentElement.clientWidth,availableHeight:el.parentElement.clientHeight
  }));
  assert.ok(fallbackFit.height <= fallbackFit.availableHeight + 1 && fallbackFit.width <= fallbackFit.availableWidth + 1,
    `The full static portrait fits its visual area: ${JSON.stringify(fallbackFit)}`);
  await introPage.screenshot({path:`qa-artifacts/welcome/${name}.png`,animations:'disabled'});
  // Both exit controls must stay usable in the smallest layouts as well.
  const exitButton=introPage.getByRole('button',{name:scenario.name==='small-mobile'?'Skip introduction':/Enter portfolio/});
  await exitButton.click();
  await introPage.locator('.bd-welcome').waitFor({state:'detached'});
  assert.equal(await introPage.locator('#main').getAttribute('inert'),null);
  assert.equal(await introPage.evaluate(()=>document.documentElement.style.overflow),'');
  assert.deepEqual(introErrors,[]);
  await introContext.close();
  console.log(`V9.1.5 supplied cutout and welcome layout passed: ${name}`);
  }

  const context = await browser.newContext({viewport:{width:1366,height:900}});
  const page = await context.newPage();
  await page.goto(base+'/',{waitUntil:'networkidle'});
  const portrait = page.locator('.portrait-frame');
  const box = await portrait.boundingBox();
  await page.mouse.move(box.x+box.width*.75,box.y+box.height*.35);
  await page.waitForFunction(() => document.querySelector('.portrait-frame').classList.contains('depth-active'));
  const first = await portrait.evaluate(el => el.style.getPropertyValue('--depth-y'));
  await page.mouse.move(box.x+box.width*.25,box.y+box.height*.35);
  await page.waitForFunction(previous => document.querySelector('.portrait-frame').style.getPropertyValue('--depth-y') !== previous,first);
  await page.getByRole('button',{name:'Animation effects',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
  assert.equal(await page.locator('.depth-active').count(),0);
  await page.goto(base+'/about/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('data-motion'),'off','Motion choice persists across pages');
  assert.match(await page.locator('.education').textContent(),/Thurston College, Colombo 07/);
  const perspectives = page.locator('[data-explorer]');
  await perspectives.getByRole('button',{name:/The observer/}).click();
  assert.equal(await perspectives.locator('[data-panel]:visible').count(),1);
  assert.ok(await page.locator('#perspective-photography').isVisible());
  await page.keyboard.press('Home');
  assert.ok(await page.locator('#perspective-operations').isVisible());
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.getByRole('button',{name:'Animation effects',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => document.documentElement.dataset.motion==='off');
  assert.equal(await page.getByRole('button',{name:'Animation effects',exact:true}).getAttribute('aria-disabled'),'true');
  await page.goto(base+'/work/tfc-orders-tracker/',{waitUntil:'networkidle'});
  await page.getByRole('link',{name:'The workflow',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.chapter-nav a[href="#workflow"]').getAttribute('aria-current')==='location');
  await context.close();
  console.log('Pointer depth, persistent motion choice, About perspectives and OS preference passed');

  const touchContext = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const touchPage = await touchContext.newPage();
  const touchErrors=[];touchPage.on('pageerror',e=>touchErrors.push(e.message));
  await touchPage.goto(base+'/',{waitUntil:'networkidle'});
  await touchPage.locator('.portrait-frame').scrollIntoViewIfNeeded();
  const rect = await touchPage.locator('.portrait-frame').boundingBox();
  const cdp = await touchContext.newCDPSession(touchPage);
  const x=Math.round(rect.x+rect.width*.45),y=Math.round(rect.y+rect.height*.4);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await touchPage.waitForFunction(() => document.querySelector('.portrait-frame').classList.contains('depth-active'));
  const before = await touchPage.locator('.portrait-frame').evaluate(el=>el.style.getPropertyValue('--touch-x'));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y,id:1}]});
  await touchPage.waitForFunction(v=>document.querySelector('.portrait-frame').style.getPropertyValue('--touch-x')!==v,before);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touchPage.waitForFunction(()=>!document.querySelector('.portrait-frame').classList.contains('depth-active'));
  const scrollBefore=await touchPage.evaluate(()=>scrollY);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:2}]});
  for(const dy of [15,40,80,120]) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touchPage.waitForFunction(v=>scrollY>v+20,scrollBefore);
  assert.equal(await touchPage.locator('.depth-active').count(),0,'Vertical gesture cancels depth and scrolls naturally');
  await touchPage.goto(base+'/daily-gaze/',{waitUntil:'networkidle'});
  await touchPage.locator('.photo-link').first().click();
  const titleBefore=await touchPage.locator('#lightbox-title').textContent();
  const stage=await touchPage.locator('.lightbox-stage').boundingBox();
  const sx=Math.round(stage.x+stage.width*.7),sy=Math.round(stage.y+stage.height*.5);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:3}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx-90,y:sy,id:3}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touchPage.waitForFunction(t=>document.querySelector('#lightbox-title').textContent!==t,titleBefore);
  await touchPage.getByRole('button',{name:'Close photograph',exact:true}).click();
  assert.deepEqual(touchErrors,[]);
  await touchContext.close();
  console.log('Native touch tracking, vertical scrolling and lightbox swiping passed');

  for (const javaScriptEnabled of [true,false]) {
    const ctx=await browser.newContext({viewport:{width:320,height:700},javaScriptEnabled,reducedMotion:'reduce'});
    const p=await ctx.newPage();
    for(const slug of ['tfc-orders-tracker','class-tracker','second-brain','banu-2','veloria']){
      await p.goto(base+'/work/'+slug+'/',{waitUntil:'networkidle'});
      assert.equal(await p.locator('.workflow-panel').count(),4);
      if(javaScriptEnabled){
        const buttons=p.locator('.workflow-controls button');
        for(let i=0;i<4;i++){
          await buttons.nth(i).click();
          assert.ok(await p.locator('#workflow-'+i).isVisible());
          assert.equal(await p.locator('.workflow-panel:visible').count(),1);
          assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
        }
      }else assert.equal(await p.locator('.workflow-panel:visible').count(),4);
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    }
    await ctx.close();
  }
  console.log('All five interactive workflows work with reduced motion; all stages remain readable without JavaScript');
} finally { await browser.close(); }

