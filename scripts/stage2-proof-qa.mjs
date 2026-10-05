import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function geometry(root){return root.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,step:el.querySelector('.journey-canvas').clientHeight*.9}))}
async function go(page,g,p,wait=520){await page.evaluate(({g,p})=>scrollTo({top:g.top+g.step*p,behavior:'instant'}),{g,p});await page.waitForTimeout(wait)}
async function state(root){
  return root.evaluate(el=>({
    p:Number(el.__stage2ProofState?.['--s2-p'])||0,
    id:Number(el.__stage2ProofState?.['--s2-id-copy'])||0,
    idArt:Number(el.__stage2ProofState?.['--s2-id-art'])||0,
    work:Number(el.__stage2ProofState?.['--s2-work-copy'])||0,
    workArt:Number(el.__stage2ProofState?.['--s2-work-art'])||0,
    controls:Number(el.__stage2ProofState?.['--s2-work-controls'])||0
  }));
}
async function assertSignalClear(page){
  const collisions=await page.locator('.journey-signal').evaluate(signal=>{
    const line=signal.getBoundingClientRect();
    return [...document.querySelectorAll('.journey-heading,.journey-caption')].filter(el=>Number(getComputedStyle(el).opacity)>.08).filter(el=>{const r=el.getBoundingClientRect();return line.left<r.right+4&&line.right>r.left-4&&line.top<r.bottom+4&&line.bottom>r.top-4}).length;
  });
  assert.equal(collisions,0,'Signal stays in the margin outside all visible reading regions');
}
try{
  for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:844}]){
    const context=await browser.newContext({viewport,hasTouch:viewport.width<=700,isMobile:viewport.width<=700});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/',{waitUntil:'networkidle'});
    const root=page.locator('.scene-journey.is-scrubbed');await root.waitFor();const g=await geometry(root);

    for(const p of [0,.25,.5,.75,1]){await go(page,g,p);const s=await state(root);
      if(p===.25){assert.ok(s.id>.55,'Identity remains readable at 25%');assert.ok(s.work<.05,'Work copy does not collide at 25%')}
      if(p===.5){
        const visual=await root.evaluate(el=>{
          const id=el.querySelector('[data-journey-scene="0"] .journey-art'),work=el.querySelector('[data-journey-scene="1"] .journey-art');
          const ib=id.getBoundingClientRect(),wb=work.getBoundingClientRect();
          return {idOpacity:Number(getComputedStyle(id).opacity),workOpacity:Number(getComputedStyle(work).opacity),workArea:wb.width*wb.height,idArea:ib.width*ib.height};
        });
        assert.ok(visual.idOpacity<.08,'Portrait is occluded by midpoint');
        const minimumArea=viewport.width*viewport.height*.04;
        assert.ok(visual.workOpacity>.75&&visual.workArea>minimumArea,`A visible Work structure occupies at least 4% of the midpoint viewport (area ${visual.workArea.toFixed(0)} > ${minimumArea.toFixed(0)})`);
      }
      if(p===.75){assert.ok(s.id<.02&&s.work>.65,'Work owns the reading layer by 75%')}
      if(p===1){assert.ok(s.work>.98&&s.controls>.98,'Work rests with readable copy and usable controls')}
    }

    await go(page,g,0);
    await assertSignalClear(page);

    // The old 1.055 clearProof seam must be continuous in both directions.
    const settle=async p=>{
      await page.evaluate(({g,p})=>scrollTo({top:g.top+g.step*p,behavior:'instant'}),{g,p});
      await page.waitForFunction(p=>Math.abs((Number(document.querySelector('.scene-journey').__stage2ProofState?.['--s2-p'])||0)-p)<.002,p,{timeout:1800});
    };
    await settle(.98);
    const seam=[];
    for(const p of [1.00,1.03,1.05,1.06,1.08,1.12]){await settle(p);const box=await page.locator('[data-journey-scene="1"] .journey-art').boundingBox();const dock=page.locator('.journey-project-dock');seam.push({p,box,opacity:+await dock.evaluate(el=>getComputedStyle(el).opacity),inert:await dock.getAttribute('inert')});}
    for(let i=1;i<seam.length;i++){const a=seam[i-1].box,b=seam[i].box;assert.ok(Math.abs(a.width-b.width)<26&&Math.abs(a.height-b.height)<32&&Math.abs(a.x-b.x)<20&&Math.abs(a.y-b.y)<20,`Work geometry remains continuous near seam ${seam[i-1].p}→${seam[i].p}`)}
    assert.ok(seam.find(x=>x.p===1.06).opacity>.85,'Project selector remains visible after previous seam');
    assert.equal(seam.find(x=>x.p===1.06).inert,null,'Visible project selector remains interactive after previous seam');
    for(const p of [1.12,1.08,1.06,1.05,1.03,1.00])await settle(p);
    // A fast crossing is sampled frame-by-frame so a one-frame geometry snap cannot hide behind settling.
    const fastTrace=await page.evaluate(({g})=>new Promise(resolve=>{
      scrollTo({top:g.top+g.step*.98,behavior:'instant'});
      setTimeout(()=>{
        const samples=[],start=performance.now();scrollTo({top:g.top+g.step*1.10,behavior:'instant'});
        const frame=now=>{const r=document.querySelector('[data-journey-scene="1"] .journey-art').getBoundingClientRect();samples.push([r.x,r.y,r.width,r.height]);if(now-start<520)requestAnimationFrame(frame);else resolve(samples)};
        requestAnimationFrame(frame);
      },420);
    }),{g});
    const maxJump=fastTrace.slice(1).reduce((max,row,i)=>Math.max(max,...row.map((v,j)=>Math.abs(v-fastTrace[i][j]))),0);
    assert.ok(maxJump<18,`Fast Work→Gaze seam crossing has no one-frame geometry snap (max ${maxJump.toFixed(2)}px)`);

    for(let scene=1;scene<5;scene++){
      await go(page,g,scene+.5,700);
      const visible=await root.locator('.journey-art').evaluateAll(els=>els.map(el=>Number(getComputedStyle(el).opacity)));
      assert.ok(visible[scene]<.08&&visible[scene+1]>.9,`Transition ${scene}→${scene+1}: incoming scene replaces the outgoing photo without a ghosted overlay`);
      await assertSignalClear(page);
    }
    // Focus cannot remain inside a dock after it becomes invisible.
    await go(page,g,1);
    const second=page.locator('.journey-project-chip').nth(1);await second.focus();assert.equal(await second.evaluate(el=>document.activeElement===el),true);
    await go(page,g,1.52,650);
    assert.equal(await page.locator('.journey-project-dock').getAttribute('inert'),'','Dock becomes inert when it leaves the Work interval');
    assert.equal(await page.evaluate(()=>document.activeElement?.closest('.journey-project-dock')!==null),false,'Focus is moved before the dock is hidden');
    await go(page,g,1,650);assert.equal(await page.locator('.journey-project-dock').getAttribute('inert'),null,'Reverse scroll restores dock interaction');

    // All five selections keep the book, description and destination consistent.
    const bookArt=new Set();
    for(let i=0;i<5;i++){
      const chip=page.locator('.journey-project-chip').nth(i);await chip.click();
      const expected=await chip.evaluate(el=>({title:el.dataset.projectTitle,flow:(el.dataset.projectFlow||'').split('|').filter(Boolean),href:new URL(el.href).pathname}));
      const book=page.locator('[data-journey-book]');
      assert.equal((await book.locator('.cover-bottom').evaluate(el=>el.firstChild.textContent)).trim(),expected.title);
      assert.equal(new URL(await book.getAttribute('href'),base).pathname,expected.href);
      assert.equal(await book.getAttribute('aria-label'),'Explore '+expected.title);
      bookArt.add(await book.locator('.cover-mark').innerHTML());
      assert.equal(new URL(await page.locator('[data-journey-project-open]').getAttribute('href'),base).pathname,expected.href);
      assert.equal(await chip.getAttribute('aria-current'),'true');
    }
    assert.equal(bookArt.size,5,'Each selected project has its own book illustration');

    if(viewport.width<=700){
      const nav=page.locator('.journey-buttons');const nb=await nav.boundingBox();
      assert.ok(nb.width<=viewport.width,'Scene navigation fits the mobile viewport');
      for(const [i,label] of ['Identity','Work','Gaze','Journey','VELORIA','Contact'].entries())assert.ok(await page.getByRole('button',{name:`Scene ${i+1}: ${label}`,exact:true}).isVisible(),`${label} scene access is visible`);
      const motion=page.getByRole('button',{name:'Animation effects',exact:true}),mb=await motion.boundingBox(),db=await page.locator('.journey-project-dock').boundingBox();
      assert.ok(mb.height>=44,'Motion control retains 44px touch height');
      assert.ok(mb.y+mb.height<=db.y-4||db.y+db.height<=mb.y-4,'Motion control does not overlap project selector');
    }

    // Exercise slow scrub, fast seek, stop/reverse, and scene-button navigation.
    for(const p of [.05,.12,.20,.28,.36,.44,.52,.60,.68,.76,.84,.92,1.0])await go(page,g,p,55);
    await go(page,g,.18,80);await go(page,g,.82,80);await go(page,g,.46,120);await go(page,g,.70,120);await go(page,g,.54,420);
    await page.getByRole('button',{name:'Scene 2: Work',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='1');
    await page.getByRole('button',{name:'Scene 3: Gaze',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='2');
    // Released native input must finish a scene, including a short swipe that
    // previously left Work faded. Fractional probes above remain geometry checks.
    const atScene=async index=>{
      try{await page.waitForFunction(({g,index})=>Math.abs(scrollY-(g.top+g.step*index))<2&&Math.abs(document.querySelector('.scene-journey').__stage2ProofState['--s2-p']-index)<.003,{g,index},{timeout:4000})}
      catch(error){console.log('Scene settle failure',JSON.stringify({expected:index,g,viewport,state:await page.evaluate(()=>({y:scrollY,p:document.querySelector('.scene-journey').__stage2ProofState['--s2-p'],hit:document.elementFromPoint(innerWidth/2,innerHeight/2)?.outerHTML.slice(0,350),focus:document.activeElement?.outerHTML.slice(0,200)}))}));throw error}
    };
    await atScene(2);await go(page,g,0);
    await page.mouse.move(viewport.width/2,viewport.height/2);
    await page.mouse.wheel(0,160);await atScene(1);
    assert.ok((await state(root)).work>.99,'Released short scroll finishes Work with readable copy');
    await page.mouse.wheel(0,-160);await atScene(0);
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.press('PageDown');await atScene(1);
    await page.getByRole('button',{name:'Scene 2: Work',exact:true}).focus();
    await page.keyboard.press('PageUp');await atScene(0);
    if(viewport.width<=700){
      const cdp=await context.newCDPSession(page);
      const x=Math.round(viewport.width/2),y=Math.round(viewport.height*.65);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let n=1;n<=6;n++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-n*22}]});
        await page.waitForTimeout(45);
      }
      await page.waitForTimeout(250);
      const held=await page.evaluate(()=>scrollY);
      assert.ok(held>20&&held<g.step*.7,'Held touch stays under native control before release');
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await atScene(1);
      await cdp.detach();
      const navBox=await page.locator('.journey-buttons').boundingBox(),motionBox=await page.locator('.motion-toggle').boundingBox();
      assert.ok(motionBox.y+motionBox.height<=navBox.y-4,'Motion button clears scene navigation');
    }
    // A new reverse gesture can interrupt completion without trapping the user.
    await go(page,g,1);await page.mouse.wheel(0,160);await page.waitForTimeout(240);
    await page.mouse.wheel(0,-80);await atScene(1);
    await go(page,g,5);await page.mouse.wheel(0,viewport.height);
    await page.waitForTimeout(800);
    assert.ok(await page.evaluate(()=>scrollY)>g.top+g.step*5+100,'Native scrolling freely exits Contact');
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`Stage 2 corrected acceptance checks passed at ${viewport.width}×${viewport.height}`);
  }

  // Model distinct small/large viewport heights: desktop emulation does not
  // reproduce Android's browser toolbar. The foreground must stay pinned while
  // the cover fills both viewport states, including the final scene boundary.
  {
    const context=await browser.newContext({viewport:{width:390,height:744},isMobile:true,hasTouch:true});
    const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});
    const root=page.locator('.scene-journey');
    await root.evaluate(el=>{el.style.setProperty('--journey-frame-height','744px');el.style.setProperty('--journey-cover-height','944px')});
    const g=await geometry(root);await go(page,g,1);
    const before=await page.locator('[data-journey-scene="1"] .journey-heading').boundingBox();
    await page.setViewportSize({width:390,height:944});await page.waitForTimeout(300);
    const after=await page.locator('[data-journey-scene="1"] .journey-heading').boundingBox();
    assert.ok(Math.abs(before.y-after.y)<1,'Toolbar viewport expansion does not move the reading frame');
    assert.ok(Math.abs((await state(root)).p-1)<.003,'Toolbar expansion preserves the scene position');
    for(const index of [1,2,3,4,5]){
      await go(page,g,index);
      const coverage=await root.evaluate((el,index)=>{
        const stage=el.querySelector('.journey-stage').getBoundingClientRect();
        const environment=el.querySelector(`[data-journey-scene="${index}"] .journey-environment`).getBoundingClientRect();
        return {top:stage.top,bottom:stage.bottom,environmentBottom:environment.bottom,viewport:innerHeight};
      },index);
      assert.ok(Math.abs(coverage.top)<1&&coverage.bottom>=coverage.viewport-1&&coverage.environmentBottom>=coverage.viewport-1,`Scene ${index} covers the expanded viewport without revealing the page underneath`);
    }
    await context.close();console.log('Stable foreground and full viewport coverage passed with distinct small/large heights');
  }

  for(const mode of ['reduced','no-js','landscape','forced','compact']){
    const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:mode==='compact'?{width:320,height:700}:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js',forcedColors:mode==='forced'?'active':'none'});
    const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.scene-journey.is-scrubbed').count(),0,`${mode} uses the readable fallback`);
    assert.ok(await page.locator('[data-journey-scene="0"] h1').isVisible());
    assert.ok(await page.locator('[data-journey-scene="1"] h2').isVisible());
    assert.equal(await page.locator('.journey-panel:visible').count(),6,'All six chapters remain readable');
    assert.equal(await page.locator('.journey-panel[inert]').count(),0,'Fallback content remains accessible');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await context.close();console.log(`Stage 2 fallback passed: ${mode}`);
  }
}finally{await browser.close()}
