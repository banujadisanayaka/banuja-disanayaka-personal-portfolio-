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
    const identity=all[0], work=all[1];
    geometry = {top:root.getBoundingClientRect().top+scrollY,height,width,step,headingBottom,captionTop,
      artWidth:scenes[0]?.art.offsetWidth || 360,artHeight:scenes[0]?.art.offsetHeight || 460,compact:width<=700,
      idHeadingBottom:(identity?.heading.offsetTop||0)+(identity?.heading.offsetHeight||0),
      idCaptionTop:identity?.caption.offsetTop||height*.78,
      idAw:identity?.art.offsetWidth||360,idAh:identity?.art.offsetHeight||460,
      workHeadingBottom:(work?.heading.offsetTop||0)+(work?.heading.offsetHeight||0),
      workCaptionTop:work?.caption.offsetTop||height*.72,
      workAw:work?.art.offsetWidth||360,workAh:work?.art.offsetHeight||460};
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
    const frameForPose=(candidate,localSweep=0)=>{
      const fw=w*candidate[2]*(1+localSweep*.10);
      const fh=compact ? Math.min(h*candidate[3],Math.max(80,geometry.captionTop-geometry.headingBottom)) : h*candidate[3]*(1+localSweep*.06);
      const scale=Math.min(fw/aw,fh/ah);
      const centerY=compact ? (geometry.headingBottom+geometry.captionTop)/2 : h*candidate[1];
      return {x:w*candidate[0]-aw*scale/2,y:centerY-ah*scale/2,scale,rotation:candidate[4]-localSweep*(compact?3:8),ry:candidate[5]};
    };
    const frame=frameForPose(pose,sweep);
    const {x,y,scale,rotation}=frame;
    const transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) perspective(1200px) rotateY(${frame.ry.toFixed(2)}deg) rotateZ(${rotation.toFixed(2)}deg) scale(${scale.toFixed(5)})`;
    const genericStates=[];
    scenes.forEach((scene,i) => {
      const outgoing = i===a, incoming = i===b;
      const weight = scenes.length===1 ? 1 : outgoing ? 1-swap : incoming ? swap : 0;
      const textWeight = scenes.length===1 ? 1 : outgoing ? 1-ease(clamp(t/.46)) : incoming ? ease(clamp((t-.54)/.46)) : 0;
      const backgroundOpacity=scenes.length===1?1:outgoing?1:incoming?t:0;
      const shift=outgoing ? -t*36 : (1-t)*36;
      genericStates[scene.id]={weight,textWeight,backgroundOpacity,transform,shift,wordOpacity:textWeight*.055};
      const stage2Owns=typeof root.__stage2Paint==='function'&&(scene.id===0||scene.id===1);
      if(stage2Owns)return;
      style(scene.art,'opacity',weight.toFixed(4));
      style(scene.heading,'opacity',textWeight.toFixed(4));
      style(scene.caption,'opacity',textWeight.toFixed(4));
      style(backgrounds[scene.id],'opacity',backgroundOpacity.toFixed(4));
      style(scene.word,'opacity',(textWeight*.055).toFixed(4));
      if (weight>0) style(scene.art,'transform',transform);
      if (textWeight>0) {
        style(scene.heading,'transform',`translate3d(0,${shift.toFixed(2)}px,0)`);
        style(scene.caption,'transform',`translate3d(0,${(shift*.45).toFixed(2)}px,0)`);
        style(scene.word,'transform',`translate3d(${(-p*16).toFixed(2)}px,0,0)`);
      }
      expose(scene,i===current && textWeight>.08);
    });
    if(typeof root.__stage2Paint==='function'){
      root.__stage2Paint({p,geometry,states:genericStates,current,
        restFrames:{identity:frameForPose(poses[0][compact?1:0],0),work:frameForPose(poses[1][compact?1:0],0)}});
    }
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
      root.__stage2Reset?.();
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
  root.__journeyInvalidate=invalidate;
  configure();
})();


/* Stage 2 — limited Identity → Work renderer.
   It shares the main engine's damped progress, geometry and single frame scheduler.
   The later four scenes remain on the inherited V10.5 renderer. */
(() => {
  'use strict';
  const root=document.querySelector('.scene-journey');
  if(!root||!root.querySelector('[data-stage2-proof-layer]'))return;
  const identity=root.querySelector('[data-journey-scene="0"]');
  const work=root.querySelector('[data-journey-scene="1"]');
  const backgrounds=[...root.querySelectorAll('.journey-background')];
  const plane=root.querySelector('.stage2-transition-plane');
  const idMiddle=root.querySelector('.stage2-identity-middle');
  const idBack=root.querySelector('.stage2-identity-back');
  const idFront=root.querySelector('.stage2-identity-front');
  const signal=root.querySelector('.stage2-signal');
  const dock=work?.querySelector('.journey-project-dock');
  const chips=dock?[...dock.querySelectorAll('[data-journey-project]')]:[];
  const sceneButtons=[...root.querySelectorAll('[data-journey-select]')];
  const idHeading=identity?.querySelector('.journey-heading');
  const idCaption=identity?.querySelector('.journey-caption');
  const idArt=identity?.querySelector('.journey-art');
  const idOpen=identity?.querySelector('.journey-link');
  const workHeading=work?.querySelector('.journey-heading');
  const workCaption=work?.querySelector('.journey-caption');
  const workArt=work?.querySelector('.journey-art');
  const workOpen=work?.querySelector('[data-journey-project-open]');
  const workEnv=work?.querySelector('.journey-work-environment');
  const workSlab=work?.querySelector('.journey-work-copy-slab');
  const workCopy=work?.querySelector('[data-journey-project-copy]');
  const workNote=work?.querySelector('[data-journey-project-note]');
  const systemCategory=work?.querySelector('.journey-system-category');
  const systemIndex=work?.querySelector('.journey-system-index');
  const systemTitle=work?.querySelector('.journey-sheet-title');
  const systemSteps=work?[...work.querySelectorAll('.journey-system li')]:[];
  const systemFooter=work?.querySelector('.journey-system-footer');
  const systemCaption=work?.querySelector('.journey-art figcaption');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
  const state=Object.create(null);root.__stage2ProofState=state;
  let selectedProject=0;
  const varTargets=new Map([
    ['--s2-id-env',[idBack,idMiddle]],['--s2-id-front',[idFront]],
    ['--s2-id-copy',[idHeading,idCaption]],['--s2-id-art',[idArt]],
    ['--s2-work-env',[workEnv]],['--s2-plane-opacity',[plane]],
    ['--s2-work-art',[workArt]],['--s2-work-copy',[workHeading,workCaption,workSlab]],
    ['--s2-work-controls',[dock]],['--s2-id-transform',[idArt]],
    ['--s2-work-transform',[workArt]],['--s2-id-copy-transform',[idHeading,idCaption]],
    ['--s2-work-copy-transform',[workHeading,workCaption]],['--s2-slab-transform',[workSlab]]
  ]);
  const varCache=new Map();
  const set=(name,value)=>{
    state[name]=value;
    const targets=varTargets.get(name);if(!targets)return;
    targets.forEach((el,index)=>{if(!el)return;const key=name+':'+index;if(varCache.get(key)===value)return;varCache.set(key,value);el.style.setProperty(name,value)});
  };
  const frameTransform=frame=>`translate3d(${frame.x.toFixed(2)}px,${frame.y.toFixed(2)}px,0) perspective(1200px) rotateY(${frame.ry.toFixed(2)}deg) rotateZ(${frame.rotation.toFixed(2)}deg) scale(${frame.scale.toFixed(5)})`;
  const frameMix=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),scale:mix(a.scale,b.scale,t),rotation:mix(a.rotation,b.rotation,t),ry:mix(a.ry,b.ry,t)});
  function setSceneActive(el,on,fallback){
    if(!el)return;
    if(!on&&el.contains(document.activeElement))fallback?.focus({preventScroll:true});
    el.inert=!on;
    el.setAttribute('aria-hidden',String(!on));
  }
  function setDock(interactive,visible,fallback){
    if(!dock)return;
    if(!interactive&&dock.contains(document.activeElement))fallback?.focus({preventScroll:true});
    dock.inert=!interactive;
    dock.setAttribute('aria-hidden',String(!visible));
  }
  function chooseProject(index,{focus=false}={}){
    if(!chips.length)return;
    selectedProject=(index+chips.length)%chips.length;
    chips.forEach((chip,i)=>{const on=i===selectedProject;chip.classList.toggle('is-selected',on);if(on)chip.setAttribute('aria-current','true');else chip.removeAttribute('aria-current')});
    const chip=chips[selectedProject];
    const title=chip.dataset.projectTitle||chip.querySelector('.journey-project-title')?.textContent?.trim()||'Project';
    const category=chip.dataset.projectCategory||chip.dataset.projectNote||'Selected work';
    const flow=(chip.dataset.projectFlow||'').split('|').map(x=>x.trim()).filter(Boolean);
    if(workCopy&&chip.dataset.projectSummary)workCopy.textContent=chip.dataset.projectSummary;
    if(workNote)workNote.textContent=category;
    if(workOpen){workOpen.href=chip.href;workOpen.firstChild.textContent='Open '+title+' ';}
    if(systemCategory)systemCategory.textContent=category;
    if(systemIndex)systemIndex.textContent=String(selectedProject+1).padStart(2,'0');
    if(systemTitle)systemTitle.textContent=title;
    systemSteps.forEach((row,i)=>{
      const number=row.querySelector('span');
      if(number)number.textContent=String(i+1).padStart(2,'0');
      const label=row.querySelector('.journey-flow-label');
      if(label)label.textContent=flow[i]||'Case study detail';
      row.hidden=i>=flow.length;
    });
    if(systemFooter)systemFooter.textContent=chip.dataset.projectKicker||category;
    if(systemCaption)systemCaption.textContent='PROJECT MAP / '+title.toUpperCase();
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
      if(cms.tags)chip.dataset.projectCategory=cms.tags;
    });
    chooseProject(selectedProject);
  });
  root.dataset.stage2Proof='active';
  root.__stage2Paint=({p,geometry,states,restFrames,current})=>{
    if(!root.classList.contains('is-scrubbed'))return;
    const {width:w,height:h,compact}=geometry;
    let idCopy,idArtWeight,workEnvWeight,planeOpacity,workArtWeight,workText,workControls,idTransform,workTransform,bg0,bg1;
    if(p<1){
      idCopy=1-smooth(.16,.33,p);
      idArtWeight=1-smooth(.24,.41,p);
      workEnvWeight=smooth(.08,.48,p);
      planeOpacity=smooth(.14,.34,p)*(1-smooth(.72,.94,p));
      workArtWeight=smooth(.26,.42,p);
      workText=smooth(.54,.74,p);
      workControls=smooth(.70,.88,p);
      bg0=1-smooth(.12,.70,p);
      bg1=smooth(.10,.68,p);
      const idStart=restFrames.identity;
      const idEnd={x:idStart.x-(compact?w*.16:w*.20),y:idStart.y+(compact?h*.045:h*.07),scale:idStart.scale*(compact?.76:.70),rotation:-4,ry:compact?0:-18};
      const workEnd=restFrames.work;
      const workStart={x:compact?w*.98:w*1.03,y:workEnd.y-(compact?h*.03:h*.05),scale:workEnd.scale*(compact?.78:.72),rotation:-9,ry:compact?0:13};
      idTransform=frameTransform(frameMix(idStart,idEnd,smooth(.08,.52,p)));
      workTransform=frameTransform(frameMix(workStart,workEnd,smooth(.26,.82,p)));
    }else{
      const idState=states[0]||{weight:0,textWeight:0,backgroundOpacity:0,transform:frameTransform(restFrames.identity)};
      const workState=states[1]||{weight:0,textWeight:0,backgroundOpacity:0,transform:frameTransform(restFrames.work)};
      idCopy=idState.textWeight;idArtWeight=idState.weight;bg0=idState.backgroundOpacity;
      workArtWeight=workState.weight;workText=workState.textWeight;workEnvWeight=workState.weight;bg1=workState.backgroundOpacity;
      planeOpacity=0;
      workControls=p<=1.16?1:1-smooth(1.16,1.42,p);
      idTransform=idState.transform||frameTransform(restFrames.identity);
      workTransform=workState.transform||frameTransform(restFrames.work);
    }
    set('--s2-id-env',Math.max(bg0,idArtWeight*.35).toFixed(4));
    set('--s2-id-front',Math.max(bg0*.88,0).toFixed(4));
    set('--s2-id-copy',idCopy.toFixed(4));
    set('--s2-id-art',idArtWeight.toFixed(4));
    set('--s2-work-env',workEnvWeight.toFixed(4));
    set('--s2-plane-opacity',planeOpacity.toFixed(4));
    set('--s2-work-art',workArtWeight.toFixed(4));
    set('--s2-work-copy',workText.toFixed(4));
    set('--s2-work-controls',workControls.toFixed(4));
    set('--s2-id-transform',idTransform);
    set('--s2-work-transform',workTransform);
    set('--s2-id-copy-transform',`translate3d(${(-18*smooth(.14,.40,p)).toFixed(1)}px,${(-20*smooth(.14,.40,p)).toFixed(1)}px,0)`);
    set('--s2-work-copy-transform',`translate3d(${(22*(1-workText)).toFixed(1)}px,0,0)`);
    set('--s2-slab-transform',`translate3d(${(28*(1-workText)).toFixed(1)}px,0,0)`);
    if(backgrounds[0])backgrounds[0].style.opacity=bg0.toFixed(4);
    if(backgrounds[1])backgrounds[1].style.opacity=bg1.toFixed(4);
    if(plane)plane.style.transform=`translate3d(${((1-smooth(.14,.62,Math.min(p,1)))*108-4).toFixed(2)}%,0,0) skewX(-4deg)`;
    if(idMiddle)idMiddle.style.transform=`perspective(760px) rotateX(64deg) translate3d(${(-Math.min(p,1)*2.5).toFixed(2)}%,${(Math.min(p,1)*3).toFixed(2)}%,0) scale(${(1.45+Math.min(p,1)*.10).toFixed(3)})`;
    if(idBack)idBack.style.transform=`translate3d(${(-Math.min(p,1)*3.5).toFixed(2)}%,${(Math.min(p,1)*1.6).toFixed(2)}%,0) scale(${(1+Math.min(p,1)*.06).toFixed(3)})`;
    if(idFront)idFront.style.transform=`translate3d(${(-Math.min(p,1)*2.2).toFixed(2)}%,0,0)`;
    if(signal){
      const signalOut=p<1?.94:.94*(1-smooth(1,1.34,p));
      signal.style.opacity=signalOut.toFixed(3);
      signal.style.transform=`translate3d(${(-Math.min(p,1)*1.2).toFixed(2)}%,0,0)`;
    }
    const accessScene=p<.45?0:p<1.50?1:current;
    setSceneActive(identity,accessScene===0,sceneButtons[0]);
    setSceneActive(work,accessScene===1,sceneButtons[Math.min(2,Math.max(1,current))]);
    const controlsVisible=workControls>.08&&accessScene===1;
    const controlsInteractive=workControls>.58&&accessScene===1;
    setDock(controlsInteractive,controlsVisible,sceneButtons[Math.min(2,Math.max(1,current))]);
    if(idOpen)idOpen.tabIndex=accessScene===0&&idCopy>.35?0:-1;
    if(workOpen)workOpen.tabIndex=accessScene===1&&workText>.62?0:-1;
    state['--s2-p']=p.toFixed(4);
  };
  root.__stage2Reset=()=>{
    varCache.clear();
    for(const [name,targets] of varTargets){targets.forEach(el=>el?.style.removeProperty(name));delete state[name]}
    [plane,idMiddle,idBack,idFront,signal].forEach(el=>el?.removeAttribute('style'));
    if(dock){dock.inert=false;dock.removeAttribute('aria-hidden')}
    if(idOpen)idOpen.removeAttribute('tabindex');
    if(workOpen)workOpen.removeAttribute('tabindex');
  };
  chooseProject(0);
  root.__journeyInvalidate?.();
})();
