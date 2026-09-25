(() => {
  'use strict';
  const root = document.querySelector('.scene-journey');
  if (!root) return;
  const html = document.documentElement;
  const stage = root.querySelector('.journey-stage');
  const controls = root.querySelector('.journey-controls');
  const buttons = [...root.querySelectorAll('[data-journey-select]')];
  const backgrounds = [...root.querySelectorAll('.journey-background')];
  const all = [...root.querySelectorAll('[data-journey-scene]')].map((el, id) => ({el,id,
    art:el.querySelector('.journey-art'),heading:el.querySelector('.journey-heading'),
    caption:el.querySelector('.journey-caption'),word:el.querySelector('.journey-word')}));
  const contour = root.querySelector('.journey-contours');
  const orbit = root.querySelector('.journey-orbit');
  const paper = root.querySelector('.journey-paper');
  const satellite = root.querySelector('.journey-satellite');
  const progress = root.querySelector('.journey-progress span');
  const scenePhotos = [...root.querySelectorAll('[data-scene-photo]')].map(image=>({image,id:image.dataset.scenePhoto}));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
  const mix = (a,b,t) => a+(b-a)*t;
  const ease = t => t*t*t*(t*(t*6-15)+10);
  const poses = [
    [[.71,.52,.31,.65,6,-10],[.60,.58,.51,.36,4,0]],
    [[.73,.54,.39,.66,-5,7],[.52,.58,.74,.36,-2,0]],
    [[.67,.53,.31,.65,3,-6],[.56,.58,.52,.36,3,0]],
    [[.71,.54,.38,.58,-5,7],[.56,.58,.65,.35,-3,0]],
    [[.72,.54,.40,.61,3,-4],[.52,.58,.73,.36,0,0]],
    [[.73,.54,.29,.59,-5,6],[.61,.58,.49,.35,-3,0]]
  ];
  let scenes = all, geometry = null, enabled = false, initialized = false;
  let raf = 0, lastTime = 0, value = 0, target = 0, velocity = 0, lastPaint = -1, selected = -1;
  let dirty = true, inView = true;
  const cache = new WeakMap();
  function style(el, key, val) {
    let values = cache.get(el); if (!values) cache.set(el, values = {});
    if (values[key] !== val) { el.style[key] = val; values[key] = val; }
  }
  function schedule() { if (!raf && enabled && inView && !document.hidden) raf = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0; velocity = 0; }
  function invalidate() { dirty = true; lastPaint = -1; schedule(); }
  function measure() {
    const height = stage.clientHeight, width = stage.clientWidth;
    const step = height * .90;
    const headingBottom = Math.max(...scenes.map(s=>s.heading.offsetTop+s.heading.offsetHeight))+22;
    const captionTop = Math.min(...scenes.map(s=>s.caption.offsetTop))-20;
    geometry = {top:root.getBoundingClientRect().top+scrollY,height,width,step,headingBottom,captionTop,
      artWidth:scenes[0]?.art.offsetWidth || 360,artHeight:scenes[0]?.art.offsetHeight || 460,compact:width<=700};
    root.style.height = `${height+step*Math.max(0,scenes.length-1)}px`;
    dirty = false;
  }
  function expose(scene, active) {
    const hidden = String(!active);
    if (scene.el.getAttribute('aria-hidden') !== hidden) {
      // A scroll gesture must not leave focus inside a now hidden scene.
      if (!active && scene.el.contains(document.activeElement)) buttons[scene.id].focus({preventScroll:true});
      scene.el.inert = !active;
      scene.el.setAttribute('aria-hidden',hidden);
    }
  }
  function paint(p) {
    if (!geometry || Math.abs(lastPaint-p)<.00001) return;
    lastPaint = p;
    const {width:w,height:h,artWidth:aw,artHeight:ah,compact} = geometry;
    const a = Math.min(Math.max(0,scenes.length-2),Math.floor(p));
    const b = Math.min(a+1,scenes.length-1), u = p-a;
    const t = ease(clamp((u-.12)/.76));
    const swap = ease(clamp((t-.25)/.50));
    const current = Math.min(scenes.length-1,Math.round(p));
    const first = poses[scenes[a].id][compact?1:0], next = poses[scenes[b].id][compact?1:0];
    const pose = first.map((v,i) => mix(v,next[i],t));
    const sweep = Math.sin(Math.PI*t);
    const fw = w*pose[2]*(1+sweep*.10);
    const fh = compact ? Math.min(h*pose[3],Math.max(80,geometry.captionTop-geometry.headingBottom)) : h*pose[3]*(1+sweep*.06);
    const scale = Math.min(fw/aw,fh/ah);
    const centerY = compact ? (geometry.headingBottom+geometry.captionTop)/2 : h*pose[1];
    const x = w*pose[0]-aw*scale/2, y = centerY-ah*scale/2;
    const rotation = pose[4]-sweep*(compact?3:8);
    const transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) perspective(1200px) rotateY(${pose[5].toFixed(2)}deg) rotateZ(${rotation.toFixed(2)}deg) scale(${scale.toFixed(5)})`;
    scenes.forEach((scene,i) => {
      const outgoing = i===a, incoming = i===b;
      const weight = scenes.length===1 ? 1 : outgoing ? 1-swap : incoming ? swap : 0;
      const textWeight = scenes.length===1 ? 1 : outgoing ? 1-ease(clamp(t/.46)) : incoming ? ease(clamp((t-.54)/.46)) : 0;
      style(scene.art,'opacity',weight.toFixed(4));
      style(scene.heading,'opacity',textWeight.toFixed(4));
      style(scene.caption,'opacity',textWeight.toFixed(4));
      style(backgrounds[scene.id],'opacity',(scenes.length===1?1:outgoing?1:incoming?t:0).toFixed(4));
      style(scene.word,'opacity',(textWeight*.055).toFixed(4));
      if (weight>0) style(scene.art,'transform',transform);
      if (textWeight>0) {
        const shift = outgoing ? -t*36 : (1-t)*36;
        style(scene.heading,'transform',`translate3d(0,${shift.toFixed(2)}px,0)`);
        style(scene.caption,'transform',`translate3d(0,${(shift*.45).toFixed(2)}px,0)`);
        style(scene.word,'transform',`translate3d(${(-p*16).toFixed(2)}px,0,0)`);
      }
      expose(scene,i===current && textWeight>.08);
    });
    const frameX = x-5, frameY = y-5;
    style(paper,'transform',`translate3d(${frameX.toFixed(2)}px,${frameY.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${((aw*scale+10)/100).toFixed(4)},${((ah*scale+10)/100).toFixed(4)})`);
    style(contour,'transform',`translate3d(${(-p*3).toFixed(3)}%,${(Math.sin(p)*5).toFixed(3)}%,0) rotate(${(p*9).toFixed(3)}deg) scale(${(1+sweep*.08).toFixed(4)})`);
    style(orbit,'transform',`translate3d(${(Math.sin(p*1.2)*7).toFixed(3)}%,0,0) rotate(${(-38+p*24).toFixed(3)}deg) scaleY(${(.44+Math.sin(p*.9)*.12).toFixed(4)})`);
    const gazeIndex = scenes.findIndex(s=>s.id===2);
    const gazeWeight = gazeIndex<0 ? 0 : ease(clamp(1-Math.abs(p-gazeIndex)));
    style(satellite,'opacity',(gazeWeight*.95).toFixed(4));
    if (gazeWeight>0) style(satellite,'transform',`translate3d(${(w*(compact?.075:.82)).toFixed(2)}px,${(h*(compact?.49:.25)).toFixed(2)}px,0) rotate(${(-16+gazeWeight*6).toFixed(3)}deg) scale(${((compact?w*.23/190:w*.15/190)*(.8+gazeWeight*.2)).toFixed(4)})`);
    style(progress,'transform',`scaleX(${(p/Math.max(1,scenes.length-1)).toFixed(5)})`);
    if (selected !== scenes[current].id) {
      selected = scenes[current].id;
      root.dataset.activeScene = String(selected);
      buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
    }
  }
  function advance(delta) {
    // Critically damped, time based integration. Carry velocity when direction
    // changes, clamp large seeks, and do not ease the browser's native scrolling.
    const omega = 2/.13;
    while (delta>1e-8) {
      const dt = Math.min(delta,1/240), change = clamp(value-target,-.8,.8);
      const anchor = value-change, transient = (velocity+omega*change)*dt, decay = Math.exp(-omega*dt);
      value = clamp(anchor+(change+transient)*decay,0,scenes.length-1);
      velocity = (velocity-omega*transient)*decay;
      delta -= dt;
    }
  }
  function tick(now) {
    raf = 0;
    if (!enabled || !inView || document.hidden) { lastTime=0; return; }
    if (dirty) measure();
    target = clamp((scrollY-geometry.top)/geometry.step,0,scenes.length-1);
    const delta = lastTime ? clamp((now-lastTime)/1000,0,1/30) : 1/60;
    lastTime = now;
    advance(delta);
    const settled = Math.abs(value-target)<.0003 && Math.abs(velocity)<.006;
    if (settled) { value=target; velocity=0; }
    paint(value);
    if (!settled) schedule(); else lastTime=0;
  }
  function configure() {
    const shouldEnable = html.dataset.motion==='on' && !reduced.matches && !forced.matches && innerHeight>600;
    const oldTop = root.getBoundingClientRect().top+scrollY, oldHeight = root.offsetHeight;
    const below = scrollY>=oldTop+oldHeight;
    const wasVisible = scrollY+innerHeight>oldTop && !below;
    let index = Math.max(0,scenes.findIndex(s=>s.id===selected));
    if (!enabled && initialized && shouldEnable && wasVisible) {
      const point = scrollY+innerHeight*.35;
      scenes.forEach((s,i)=>{if(s.el.getBoundingClientRect().top+scrollY<=point)index=i;});
    }
    if (shouldEnable === enabled && initialized) { invalidate(); return; }
    stop(); enabled=shouldEnable;
    root.classList.toggle('is-scrubbed',enabled);
    controls.hidden=!enabled;
    if (enabled) {
      measure(); value=target=initialized?index:clamp((scrollY-geometry.top)/geometry.step,0,scenes.length-1);
      lastPaint=-1; paint(value);
      if (initialized && wasVisible) scrollTo({top:geometry.top+geometry.step*index,behavior:'instant'});
      schedule();
    } else {
      root.style.removeProperty('height');
      all.forEach(scene=>{
        expose(scene,true);
        [scene.art,scene.heading,scene.caption,scene.word].forEach(el=>{el.removeAttribute('style');cache.delete(el);});
      });
      if (initialized && wasVisible) scenes[index]?.el.scrollIntoView({block:'start',behavior:'instant'});
    }
    if (initialized && below) scrollBy({top:root.offsetHeight-oldHeight,behavior:'instant'});
    initialized=true;
  }
  function select(id) {
    const index = scenes.findIndex(s=>s.id===id);
    if (index<0 || !enabled) return;
    if (dirty) measure();
    scrollTo({top:geometry.top+geometry.step*index,behavior:'smooth'});
    schedule();
  }
  buttons.forEach((button,id)=>{
    button.addEventListener('click',()=>select(id));
    button.addEventListener('keydown',event=>{
      const i=scenes.findIndex(s=>s.id===id);
      const next=event.key==='ArrowRight'?(i+1)%scenes.length:event.key==='ArrowLeft'?(i+scenes.length-1)%scenes.length:event.key==='Home'?0:event.key==='End'?scenes.length-1:null;
      if(next===null)return;
      event.preventDefault();buttons[scenes[next].id].focus({preventScroll:true});select(scenes[next].id);
    });
  });
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',configure,{passive:true});
  new MutationObserver(configure).observe(html,{attributes:true,attributeFilter:['data-motion']});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;
    if(inView){lastTime=0;schedule();}else stop();
  }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{lastPaint=-1;schedule();}});
  document.fonts?.ready.then(invalidate);
  document.addEventListener('portfolio:content',event=>{
    const journal=event.detail?.content?.dailyGaze;
    const safeSource=url=>{
      if(typeof url!=='string'||!url.trim())return '';
      try {const u=new URL(url,location.origin);return u.origin===location.origin&&u.protocol===location.protocol&&!u.username&&!u.password&&!/[\\\u0000-\u001f]/.test(url)?u.href:'';}catch{return '';}
    };
    if(Array.isArray(journal))scenePhotos.forEach(({image,id},index)=>{
      const visible=journal.filter(g=>g.visible!==false&&safeSource(g.preview));
      const g=visible.find(g=>g.id===id)||visible[index%Math.max(1,visible.length)];
      image.hidden=!g;
      if(!g){image.removeAttribute('src');image.removeAttribute('srcset');return;}
      const derivatives=(g.derivatives||[]).filter(d=>Number.isFinite(d.width)&&d.width>0&&safeSource(d.url));
      image.src=safeSource(derivatives[0]?.url||g.preview);
      image.srcset=derivatives.map(d=>`${safeSource(d.url)} ${d.width}w`).join(', ');
      image.alt=g.alt||g.title;image.dataset.scenePhoto=g.id;
      const caption=image.closest('figure')?.querySelector('figcaption');
      if(caption)caption.textContent='THE DAILY GAZE / '+String(g.title).toUpperCase();
    });
    all.forEach(scene=>{
      const targetSection=scene.el.dataset.section&&document.querySelector(scene.el.dataset.section);
      scene.el.hidden=!!targetSection?.hidden||(scene.id===2&&Array.isArray(journal)&&journal.length===0);
      buttons[scene.id].hidden=scene.el.hidden;
      if(scene.el.hidden)style(backgrounds[scene.id],'opacity','0');
    });
    scenes=all.filter(scene=>!scene.el.hidden);
    value=clamp(value,0,scenes.length-1);target=value;velocity=0;selected=-1;
    invalidate();
  });
  configure();
})();


/* Stage 2 — limited Identity → Work choreography and project selector.
   This layer only overrides the first transition; the V10.5 scene engine
   continues to own native scrolling, later scenes and fallback behavior. */
(() => {
  'use strict';
  const root=document.querySelector('.scene-journey');
  if(!root||!root.querySelector('[data-stage2-proof-layer]'))return;
  const html=document.documentElement,stage=root.querySelector('.journey-stage');
  const identity=root.querySelector('[data-journey-scene="0"]');
  const work=root.querySelector('[data-journey-scene="1"]');
  const plane=root.querySelector('.stage2-transition-plane');
  const idMiddle=root.querySelector('.stage2-identity-middle');
  const idBack=root.querySelector('.stage2-identity-back');
  const idFront=root.querySelector('.stage2-identity-front');
  const signal=root.querySelector('.stage2-signal');
  const dock=work?.querySelector('.journey-project-dock');
  const chips=dock?[...dock.querySelectorAll('[data-journey-project]')]:[];
  const workCopy=work?.querySelector('[data-journey-project-copy]');
  const workNote=work?.querySelector('[data-journey-project-note]');
  const workOpen=work?.querySelector('[data-journey-project-open]');
  const identityOpen=identity?.querySelector('.journey-link');
  const sceneButtons=[...root.querySelectorAll('[data-journey-select]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const forced=matchMedia('(forced-colors: active)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
  let geometry=null,raf=0,inView=true,last=-1,selectedProject=0;
  const set=(name,value)=>root.style.setProperty(name,value);
  function chooseProject(index,{focus=false}={}){
    if(!chips.length)return;
    selectedProject=(index+chips.length)%chips.length;
    chips.forEach((chip,i)=>{const on=i===selectedProject;chip.classList.toggle('is-selected',on);if(on)chip.setAttribute('aria-current','true');else chip.removeAttribute('aria-current')});
    const chip=chips[selectedProject];
    if(workCopy&&chip.dataset.projectSummary)workCopy.textContent=chip.dataset.projectSummary;
    if(workNote&&chip.dataset.projectNote)workNote.textContent=chip.dataset.projectNote;
    if(workOpen){workOpen.href=chip.href;workOpen.firstChild.textContent='Open '+(chip.dataset.projectTitle||chip.textContent.trim())+' ';}
    if(focus)chip.focus({preventScroll:true});
  }
  chips.forEach((chip,index)=>{
    chip.addEventListener('click',event=>{
      if(!root.classList.contains('is-scrubbed')||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();chooseProject(index);
    });
    chip.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?index+1:event.key==='ArrowLeft'?index-1:event.key==='Home'?0:event.key==='End'?chips.length-1:null;
      if(next===null)return;
      event.preventDefault();chooseProject(next,{focus:true});
      chips[selectedProject].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    });
  });
  document.addEventListener('portfolio:content',event=>{
    const list=event.detail?.content?.projects;
    if(!Array.isArray(list))return;
    chips.forEach(chip=>{
      const current=chip.dataset.projectPath;
      const cms=list.find(item=>{try{return new URL(item.url,location.origin).pathname===current}catch{return false}});
      if(!cms)return;
      const label=chip.querySelector('.journey-project-title');
      if(label&&cms.title)label.textContent=cms.title;
      if(cms.title)chip.dataset.projectTitle=cms.title;
      if(cms.description)chip.dataset.projectSummary=cms.description;
      if(cms.tags)chip.dataset.projectNote=cms.tags;
    });
    chooseProject(selectedProject);
  });
  function measure(){
    const h=stage.clientHeight,w=stage.clientWidth,step=h*.90;
    geometry={top:root.getBoundingClientRect().top+scrollY,h,w,step,compact:w<=700};
  }
  function clearProof(){
    if(root.dataset.stage2Proof)delete root.dataset.stage2Proof;
    if(root.dataset.stage2Controls)delete root.dataset.stage2Controls;
    ['--s2-p','--s2-id-env','--s2-id-front','--s2-id-copy','--s2-id-art','--s2-work-env','--s2-plane-opacity','--s2-work-art','--s2-work-copy','--s2-work-controls','--s2-id-transform','--s2-work-transform','--s2-id-copy-transform','--s2-work-copy-transform','--s2-slab-transform'].forEach(name=>root.style.removeProperty(name));
    [plane,idMiddle,idBack,idFront,signal].forEach(el=>el?.removeAttribute('style'));
    if(dock){dock.inert=false;dock.removeAttribute('aria-hidden')}
    if(identityOpen)identityOpen.removeAttribute('tabindex');
    if(workOpen)workOpen.removeAttribute('tabindex');
    last=-1;
  }
  function paint(){
    raf=0;
    if(!inView||document.hidden)return;
    const enabled=html.dataset.motion==='on'&&!reduced.matches&&!forced.matches&&root.classList.contains('is-scrubbed')&&innerHeight>600;
    if(!enabled){clearProof();return}
    if(!geometry)measure();
    const raw=(scrollY-geometry.top)/geometry.step;
    if(raw>1.055||raw<-.08){clearProof();return}
    const p=clamp(raw,0,1);
    if(Math.abs(p-last)<.0001)return;
    last=p;root.dataset.stage2Proof='active';
    const idCopy=1-smooth(.27,.44,p);
    const idArt=1-smooth(.39,.62,p);
    const workEnv=smooth(.10,.72,p);
    const planeP=smooth(.18,.63,p);
    const workArt=smooth(.48,.73,p);
    const workText=smooth(.64,.83,p);
    const workControls=smooth(.75,.92,p);
    set('--s2-p',p.toFixed(4));set('--s2-id-env',(1-smooth(.20,.70,p)*.82).toFixed(4));set('--s2-id-front',(1-smooth(.22,.70,p)*.88).toFixed(4));
    set('--s2-id-copy',idCopy.toFixed(4));set('--s2-id-art',idArt.toFixed(4));set('--s2-work-env',workEnv.toFixed(4));
    set('--s2-plane-opacity',smooth(.17,.48,p).toFixed(4));set('--s2-work-art',workArt.toFixed(4));set('--s2-work-copy',workText.toFixed(4));set('--s2-work-controls',workControls.toFixed(4));
    const {w,h,compact}=geometry;
    if(compact){
      const ix=mix(w*.20,w*.045,p),iy=mix(h*.31,h*.38,p),is=mix(.74,.54,p),ir=mix(3,-4,p);
      const wx=mix(w*1.03,w*.22,p),wy=mix(h*.34,h*.325,p),ws=mix(.68,.78,p),wr=mix(-8,-2,p);
      set('--s2-id-transform',`translate3d(${ix.toFixed(1)}px,${iy.toFixed(1)}px,0) rotateZ(${ir.toFixed(2)}deg) scale(${is.toFixed(4)})`);
      set('--s2-work-transform',`translate3d(${wx.toFixed(1)}px,${wy.toFixed(1)}px,0) rotateZ(${wr.toFixed(2)}deg) scale(${ws.toFixed(4)})`);
    }else{
      const ix=mix(w*.555,w*.34,p),iy=mix(h*.215,h*.30,p),is=mix(1.17,.76,p),ir=mix(6,-4,p),iry=mix(-10,-18,p);
      const wx=mix(w*1.02,w*.56,p),wy=mix(h*.17,h*.21,p),ws=mix(.88,1.28,p),wr=mix(-11,-5,p),wry=mix(13,7,p);
      set('--s2-id-transform',`translate3d(${ix.toFixed(1)}px,${iy.toFixed(1)}px,0) perspective(1200px) rotateY(${iry.toFixed(2)}deg) rotateZ(${ir.toFixed(2)}deg) scale(${is.toFixed(4)})`);
      set('--s2-work-transform',`translate3d(${wx.toFixed(1)}px,${wy.toFixed(1)}px,0) perspective(1200px) rotateY(${wry.toFixed(2)}deg) rotateZ(${wr.toFixed(2)}deg) scale(${ws.toFixed(4)})`);
    }
    set('--s2-id-copy-transform',`translate3d(${(-18*smooth(.20,.46,p)).toFixed(1)}px,${(-22*smooth(.20,.46,p)).toFixed(1)}px,0)`);
    set('--s2-work-copy-transform',`translate3d(${(24*(1-workText)).toFixed(1)}px,0,0)`);
    set('--s2-slab-transform',`translate3d(${(34*(1-workText)).toFixed(1)}px,0,0)`);
    if(plane)plane.style.transform=`translate3d(${((1-planeP)*112-6).toFixed(2)}%,0,0) skewX(-4deg)`;
    if(idMiddle)idMiddle.style.transform=`perspective(760px) rotateX(64deg) translate3d(${(-p*2.5).toFixed(2)}%,${(p*3).toFixed(2)}%,0) scale(${(1.45+p*.10).toFixed(3)})`;
    if(idBack)idBack.style.transform=`translate3d(${(-p*3.5).toFixed(2)}%,${(p*1.6).toFixed(2)}%,0) scale(${(1+p*.06).toFixed(3)})`;
    if(idFront)idFront.style.transform=`translate3d(${(-p*2.2).toFixed(2)}%,0,0)`;
    if(signal){signal.style.opacity=(.96-.12*smooth(.1,.9,p)).toFixed(3);signal.style.transform=`translate3d(${(-p*1.6).toFixed(2)}%,0,0)`}
    const controlsReady=workControls>.82;
    root.dataset.stage2Controls=controlsReady?'on':'off';
    if(dock){dock.inert=!controlsReady;dock.setAttribute('aria-hidden',String(workControls<.08))}
    if(identityOpen)identityOpen.tabIndex=idCopy>.38?0:-1;
    if(workOpen)workOpen.tabIndex=workText>.70?0:-1;
    if(!controlsReady&&dock?.contains(document.activeElement))sceneButtons[1]?.focus({preventScroll:true});
    if(idCopy<.15&&identity?.contains(document.activeElement)&&document.activeElement===identityOpen)sceneButtons[0]?.focus({preventScroll:true});
  }
  function schedule(){if(!raf&&inView&&!document.hidden)raf=requestAnimationFrame(paint)}
  function invalidate(){geometry=null;last=-1;schedule()}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',invalidate,{passive:true});
  new MutationObserver(invalidate).observe(html,{attributes:true,attributeFilter:['data-motion']});
  if('ResizeObserver'in window)new ResizeObserver(invalidate).observe(stage);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)schedule();else{cancelAnimationFrame(raf);raf=0}}).observe(stage);
  reduced.addEventListener('change',invalidate);forced.addEventListener('change',invalidate);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else schedule()});
  chooseProject(0);invalidate();
})();
