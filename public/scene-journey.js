(() => {
  'use strict';
  const root = document.querySelector('.scene-journey');
  if (!root) return;
  const html = document.documentElement;
  const stage = root.querySelector('.journey-stage');
  const controls = root.querySelector('.journey-controls');
  const range = root.querySelector('.journey-range');
  const motionToggle = document.querySelector('.motion-toggle');
  const toggleHome = motionToggle?.parentNode;
  const toggleNext = motionToggle?.nextSibling;
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
  let dirty = true, inView = true, stageMostlyVisible = true;
  const rgb = color => color.match(/[\d.]+/g).slice(0,3).map(Number);
  const luminance = color => color.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const colors = backgrounds.map(el=>rgb(getComputedStyle(el).backgroundColor));
  const inks = all.map(s=>luminance(rgb(getComputedStyle(s.el).color)));
  const cache = new WeakMap();
  function style(el, key, val) {
    let values = cache.get(el); if (!values) cache.set(el, values = {});
    if (values[key] !== val) { el.style[key] = val; values[key] = val; }
  }
  function schedule() { if (!raf && enabled && inView && !document.hidden) raf = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0; velocity = 0; }
  function environment() {
    const state=enabled&&inView&&!document.hidden?'running':'paused';
    if(root.dataset.ambient!==state)root.dataset.ambient=state;
    if(!motionToggle)return;
    const dock=enabled&&stageMostlyVisible;
    const focused=document.activeElement===motionToggle;
    if(dock&&motionToggle.parentNode!==controls)controls.append(motionToggle);
    if(!dock&&motionToggle.parentNode!==toggleHome)toggleHome.insertBefore(motionToggle,toggleNext);
    motionToggle.classList.toggle('is-docked',dock);
    if(focused&&document.activeElement!==motionToggle)motionToggle.focus({preventScroll:true});
  }
  function invalidate() { dirty = true; lastPaint = -1; schedule(); }
  function measure() {
    const height = stage.clientHeight, width = stage.clientWidth;
    // Browser chrome changes dvh, but must not change the scroll distance per scene.
    const step = range.clientHeight * .90;
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
    let current = Math.min(scenes.length-1,Math.round(p));
    const previous=scenes.findIndex(s=>s.id===selected);
    if(previous>=0&&Math.abs(p-previous)<.54)current=previous;
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
      // Scroll may stop at ANY fraction. Commit one readable scene, never a
      // permanently blank title or a translucent double exposure of portraits.
      const weight = i===current ? 1 : 0, textWeight=weight;
      style(scene.art,'opacity',weight.toFixed(4));
      style(scene.heading,'opacity',textWeight.toFixed(4));
      style(scene.caption,'opacity',textWeight.toFixed(4));
      style(backgrounds[scene.id],'opacity',(scenes.length===1?1:outgoing?1:incoming?t:0).toFixed(4));
      style(scene.word,'opacity',(textWeight*.055).toFixed(4));
      if (weight>0) style(scene.art,'transform',transform);
      if (textWeight>0) {
        style(scene.heading,'transform','translate3d(0,0,0)');
        style(scene.caption,'transform','translate3d(0,0,0)');
        style(scene.word,'transform',`translate3d(${(-p*16).toFixed(2)}px,0,0)`);
      }
      expose(scene,i===current);
    });
    const backgroundLuminance=luminance(colors[scenes[a].id].map((v,i)=>mix(v,colors[scenes[b].id][i],t)));
    const ink=inks[scenes[current].id];
    const contrast=(Math.max(backgroundLuminance,ink)+.05)/(Math.min(backgroundLuminance,ink)+.05);
    const inkMode=contrast>=5?'original':backgroundLuminance>.179?'dark':'light';
    if(stage.dataset.ink!==inkMode)stage.dataset.ink=inkMode;
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
    if (shouldEnable === enabled && initialized) { invalidate(); environment(); return; }
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
    environment();
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
    stageMostlyVisible=entries[0].intersectionRatio>.65;
    if(inView){lastTime=0;schedule();}else stop();
    environment();
  },{threshold:[0,.65]}).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{lastPaint=-1;schedule();}environment();});
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
