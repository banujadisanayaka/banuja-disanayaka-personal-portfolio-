import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.BROWSER_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function geometry(root){return root.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,step:el.querySelector('.journey-stage').clientHeight*.9}))}
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
async function assertSignalClear(page,selector){
  const collisions=await page.locator(selector).evaluate((path)=>{
    const heading=document.querySelector('[data-journey-scene="0"] .journey-heading').getBoundingClientRect();
    const caption=document.querySelector('[data-journey-scene="0"] .journey-caption').getBoundingClientRect();
    const ctm=path.getScreenCTM(),length=path.getTotalLength(),bad=[];
    const inside=(x,y,r)=>x>=r.left-8&&x<=r.right+8&&y>=r.top-8&&y<=r.bottom+8;
    for(let i=0;i<=80;i++){const q=path.getPointAtLength(length*i/80),p=new DOMPoint(q.x,q.y).matrixTransform(ctm);if(inside(p.x,p.y,heading)||inside(p.x,p.y,caption))bad.push([p.x,p.y])}
    return bad;
  });
  assert.equal(collisions.length,0,'Signal path stays clear of Identity heading and caption');
}
try{
  for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:700}]){
    const context=await browser.newContext({viewport,hasTouch:viewport.width<=700,isMobile:viewport.width<=700});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/',{waitUntil:'networkidle'});
    const root=page.locator('.scene-journey.is-scrubbed');await root.waitFor();const g=await geometry(root);

    for(const p of [0,.25,.5,.75,1]){await go(page,g,p);const s=await state(root);
      if(p===.25){assert.ok(s.id>.55,'Identity remains readable at 25%');assert.ok(s.work<.05,'Work copy does not collide at 25%')}
      if(p===.5){assert.ok(s.idArt<.08,'Portrait is occluded by midpoint');assert.ok(s.workArt>.75,'Work structure is recognizable at midpoint')}
      if(p===.75){assert.ok(s.id<.02&&s.work>.65,'Work owns the reading layer by 75%')}
      if(p===1){assert.ok(s.work>.98&&s.controls>.98,'Work rests with readable copy and usable controls')}
    }

    await go(page,g,0);
    await assertSignalClear(page,viewport.width<=700?'path.stage2-signal-mobile':'path.stage2-signal-desktop');

    // The old 1.055 clearProof seam must be continuous in both directions.
    const seam=[];
    for(const p of [1.00,1.03,1.05,1.06,1.08,1.12]){await go(page,g,p,260);const box=await page.locator('[data-journey-scene="1"] .journey-art').boundingBox();const dock=page.locator('.journey-project-dock');seam.push({p,box,opacity:+await dock.evaluate(el=>getComputedStyle(el).opacity),inert:await dock.getAttribute('inert')});}
    for(let i=1;i<seam.length;i++){const a=seam[i-1].box,b=seam[i].box;assert.ok(Math.abs(a.width-b.width)<26&&Math.abs(a.height-b.height)<32&&Math.abs(a.x-b.x)<20&&Math.abs(a.y-b.y)<20,`Work geometry remains continuous near seam ${seam[i-1].p}→${seam[i].p}`)}
    assert.ok(seam.find(x=>x.p===1.06).opacity>.85,'Project selector remains visible after previous seam');
    assert.equal(seam.find(x=>x.p===1.06).inert,null,'Visible project selector remains interactive after previous seam');
    for(const p of [1.12,1.08,1.06,1.05,1.03,1.00])await go(page,g,p,180);

    // Focus cannot remain inside a dock after it becomes invisible.
    await go(page,g,1);
    const second=page.locator('.journey-project-chip').nth(1);await second.focus();assert.equal(await second.evaluate(el=>document.activeElement===el),true);
    await go(page,g,1.52,650);
    assert.equal(await page.locator('.journey-project-dock').getAttribute('inert'),'','Dock becomes inert when it leaves the Work interval');
    assert.equal(await page.evaluate(()=>document.activeElement?.closest('.journey-project-dock')!==null),false,'Focus is moved before the dock is hidden');
    await go(page,g,1,650);assert.equal(await page.locator('.journey-project-dock').getAttribute('inert'),null,'Reverse scroll restores dock interaction');

    // All five selections keep title, map, description and destination consistent.
    for(let i=0;i<5;i++){
      const chip=page.locator('.journey-project-chip').nth(i);await chip.click();
      const expected=await chip.evaluate(el=>({title:el.dataset.projectTitle,flow:(el.dataset.projectFlow||'').split('|').filter(Boolean),href:new URL(el.href).pathname}));
      assert.equal((await page.locator('.journey-sheet-title').innerText()).trim(),expected.title);
      assert.equal(new URL(await page.locator('[data-journey-project-open]').getAttribute('href'),base).pathname,expected.href);
      const labels=await page.locator('.journey-flow-label').evaluateAll(els=>els.filter(el=>!el.closest('li').hidden).map(el=>el.textContent.trim()));
      assert.deepEqual(labels,expected.flow.slice(0,4));
      assert.equal(await chip.getAttribute('aria-current'),'true');
    }

    if(viewport.width<=700){
      const nav=page.locator('.journey-buttons');const nb=await nav.boundingBox();
      assert.ok(nb.width<=viewport.width,'Scene navigation fits the mobile viewport');
      for(const label of ['Identity','Work','Gaze','Journey','VELORIA','Contact'])assert.ok(await page.getByRole('button',{name:new RegExp(label)}).isVisible(),`${label} scene access is visible`);
      const motion=page.getByRole('button',{name:'Animation effects',exact:true}),mb=await motion.boundingBox(),db=await page.locator('.journey-project-dock').boundingBox();
      assert.ok(mb.height>=44,'Motion control retains 44px touch height');
      assert.ok(mb.y+mb.height<=db.y-4||db.y+db.height<=mb.y-4,'Motion control does not overlap project selector');
    }

    // Exercise slow scrub, fast seek, stop/reverse, and scene-button navigation.
    for(const p of [.05,.12,.20,.28,.36,.44,.52,.60,.68,.76,.84,.92,1.0])await go(page,g,p,55);
    await go(page,g,.18,80);await go(page,g,.82,80);await go(page,g,.46,120);await go(page,g,.70,120);await go(page,g,.54,420);
    await page.getByRole('button',{name:'Scene 2: Work',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='1');
    await page.getByRole('button',{name:'Scene 3: Gaze',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.scene-journey').dataset.activeScene==='2');
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`Stage 2 corrected acceptance checks passed at ${viewport.width}×${viewport.height}`);
  }

  for(const mode of ['reduced','no-js','landscape']){
    const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
    const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.scene-journey.is-scrubbed').count(),0,`${mode} uses the readable fallback`);
    assert.ok(await page.locator('[data-journey-scene="0"] h1').isVisible());
    assert.ok(await page.locator('[data-journey-scene="1"] h2').isVisible());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await context.close();console.log(`Stage 2 fallback passed: ${mode}`);
  }
}finally{await browser.close()}
