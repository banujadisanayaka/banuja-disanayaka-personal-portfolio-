import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
try {
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
