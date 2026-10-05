(() => {
  'use strict';
  const root=document.querySelector('.scene-journey');
  if(!root)return;
  const work=root.querySelector('[data-journey-scene="1"]');
  const chips=[...root.querySelectorAll('[data-journey-project]')];
  const workCopy=work.querySelector('[data-journey-project-copy]');
  const workNote=work.querySelector('[data-journey-project-note]');
  const workOpen=work.querySelector('[data-journey-project-open]');
  const bookLink=work.querySelector('[data-journey-book]');
  const bookTemplates=[...work.querySelectorAll('[data-journey-book-template]')];
  const systemCaption=work.querySelector('.journey-art figcaption');
  const workHeading=work.querySelector('[data-journey-project-heading]');
  const position=work.querySelector('[data-project-position]');
  const stepper=work.querySelector('.journey-work-stepper');
  if(stepper)stepper.hidden=false;
  const motionAllowed=()=>document.documentElement.dataset.motion==='on'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let projectAnimations=[],selectedProject=0,projectReady=false;
  function cancelProjectMotion(){projectAnimations.forEach(a=>a.cancel());projectAnimations=[];}
  new MutationObserver(()=>{if(!motionAllowed())cancelProjectMotion()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',cancelProjectMotion);
  function chooseProject(index,{focus=false}={}){
    if(!chips.length)return;
    const previous=selectedProject;
    cancelProjectMotion();
    selectedProject=(index+chips.length)%chips.length;
    chips.forEach((chip,i)=>{const on=i===selectedProject;chip.classList.toggle('is-selected',on);if(on)chip.setAttribute('aria-current','true');else chip.removeAttribute('aria-current')});
    const chip=chips[selectedProject];
    const title=chip.dataset.projectTitle||chip.querySelector('.journey-project-title')?.textContent?.trim()||'Project';
    const category=chip.dataset.projectCategory||chip.dataset.projectNote||'Selected work';
    const flow=(chip.dataset.projectFlow||'').split('|').map(x=>x.trim()).filter(Boolean);
    if(workHeading)workHeading.textContent=title;
    if(position)position.textContent=String(selectedProject+1).padStart(2,'0')+' / '+String(chips.length).padStart(2,'0');
    if(workCopy&&chip.dataset.projectSummary)workCopy.textContent=chip.dataset.projectSummary;
    if(workNote)workNote.textContent=category;
    if(workOpen){workOpen.href=chip.href;workOpen.firstChild.textContent='Open '+title+' ';}
    if(bookLink){
      bookLink.href=chip.href;bookLink.setAttribute('aria-label','Explore '+title);
      if(bookLink.dataset.project!==String(selectedProject)){
        bookLink.replaceChildren(bookTemplates[selectedProject].content.cloneNode(true));
        bookLink.dataset.project=String(selectedProject);
      }
      const label=bookLink.querySelector('.cover-bottom');
      if(label)label.firstChild.textContent=title;
    }
    if(systemCaption)systemCaption.textContent='PROJECT LIBRARY / '+title.toUpperCase();
    if(projectReady&&previous!==selectedProject&&motionAllowed()){
      for(const el of [bookLink,workHeading,workCopy,workNote])if(el)projectAnimations.push(el.animate([{opacity:.35,transform:'translate3d(12px,0,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:280,easing:'cubic-bezier(.22,.8,.24,1)'}));
    }
    projectReady=true;
    root.__journeyInvalidate?.();
    if(focus)chip.focus({preventScroll:true});
  }
  work.querySelectorAll('[data-project-step]').forEach(b=>b.addEventListener('click',()=>chooseProject(selectedProject+Number(b.dataset.projectStep))));
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
  chooseProject(0);
})();

/* One native-scroll renderer for all six scenes. Read geometry only when invalidated;
   paint only compositor transforms/opacity, and sleep when settled or offscreen. */
(() => {
  'use strict';
  const root=document.querySelector('.scene-journey');
  if(!root)return;
  const html=document.documentElement, stage=root.querySelector('.journey-stage');
  const canvas=root.querySelector('.journey-canvas');
  const controls=root.querySelector('.journey-controls');
  // Keep the motion preference next to scene navigation, not floating over content.
  const motionToggle=document.querySelector('.motion-toggle');
  const motionHome=motionToggle?.parentElement;
  const utility=root.querySelector('.journey-utility');
  const buttons=[...root.querySelectorAll('[data-journey-select]')];
  const backgrounds=[...root.querySelectorAll('.journey-background')];
  const signal=root.querySelector('.journey-signal');
  const progress=root.querySelector('.journey-progress span');
  const all=[...root.querySelectorAll('[data-journey-scene]')].map((el,id)=>({el,id,
    art:el.querySelector('.journey-art'),heading:el.querySelector('.journey-heading'),
    caption:el.querySelector('.journey-caption'),word:el.querySelector('.journey-word'),
    environment:el.querySelector('.journey-environment'),
    extras:[...el.querySelectorAll('.journey-project-dock,.journey-work-stepper,.journey-photo-picker,.journey-resume')]}));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), forced=matchMedia('(forced-colors: active)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
  const cache=new WeakMap();
  function style(el,key,value){let last=cache.get(el);if(!last)cache.set(el,last={});if(last[key]!==value){el.style[key]=value;last[key]=value}}
  function access(el,on,fallback){
    if(el.getAttribute('aria-hidden')===String(!on))return;
    if(!on&&el.contains(document.activeElement))fallback?.focus({preventScroll:true});
    el.inert=!on;el.setAttribute('aria-hidden',String(!on));
  }
  let scenes=all, geometry, enabled=false, initialized=false, dirty=true, inView=true;
  function placeMotion(){
    if(!motionToggle)return;
    const docked=enabled&&inView&&utility;
    const parent=docked?utility:motionHome;
    if(parent&&motionToggle.parentElement!==parent){
      const focused=document.activeElement===motionToggle;
      parent.append(motionToggle);
      if(focused)motionToggle.focus({preventScroll:true});
    }
    motionToggle.classList.toggle('in-journey',!!docked);
  }
  let raf=0,lastTime=0,value=0,target=0,lastPaint=-1,selected=-1;
  function schedule(){if(!raf&&enabled&&inView&&!document.hidden)raf=requestAnimationFrame(tick)}
  function stop(){cancelAnimationFrame(raf);raf=0;lastTime=0}
  function invalidate(){dirty=true;lastPaint=-1;schedule()}
  const dockIndicator=root.querySelector('.journey-dock-indicator');
  function updateDock(){const active=buttons[Math.max(0,selected)];if(!dockIndicator||!active)return;dockIndicator.style.width=active.offsetWidth+'px';dockIndicator.style.height=active.offsetHeight+'px';dockIndicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;}
  function measure(){
    const w=canvas.clientWidth,h=canvas.clientHeight,compact=w<=700;
    geometry={w,h,compact,step:h*.9,top:root.getBoundingClientRect().top+scrollY};
    for(const scene of scenes){
      const aw=scene.art.offsetWidth,ah=scene.art.offsetHeight;
      const top=scene.heading.offsetTop+scene.heading.offsetHeight+18;
      const obstruction=compact&&scene.id===1?scene.el.querySelector('.journey-work-stepper'):compact&&scene.id===2?scene.el.querySelector('.journey-photo-picker'):null;
      const bottom=Math.min(scene.caption.offsetTop,obstruction?.offsetHeight?obstruction.offsetTop:Infinity)-18;
      const scale=compact?Math.min((w*(scene.id===4?.94:.84))/aw,Math.max(70,bottom-top)/ah,1.15):Math.min(w*(scene.id===4?.43:.36)/aw,h*.59/ah,1.65);
      const centerX=compact?w*.5:w*(scene.id===4?.72:.73);
      const centerY=compact?(top+bottom)/2:h*.48;
      scene.frame={x:centerX-aw*scale/2,y:centerY-ah*scale/2,scale};
    }
    root.style.height=`${stage.clientHeight+geometry.step*Math.max(0,scenes.length-1)}px`;
    updateDock();
    dirty=false;
  }
  const proofState={};root.__stage2ProofState=proofState; // regression instrumentation, never a CSS input
  function paint(p){
    if(Math.abs(lastPaint-p)<.00002)return;
    lastPaint=p;
    const {w,compact}=geometry;
    const current=Math.min(scenes.length-1,Math.round(p));
    for(let i=0;i<scenes.length;i++){
      const s=scenes[i],d=p-i,enter=clamp(d+1),leave=clamp(d);
      const copy=d<0?smooth(.52,.78,enter):1-smooth(.20,.44,leave);
      const art=d<0?smooth(.28,.44,enter):1-smooth(.27,.46,leave);
      const env=d<0?smooth(.12,.70,enter):1-smooth(.12,.70,leave);
      const extra=d<0?smooth(.70,.88,enter):1-smooth(.16,.42,leave);
      style(s.art,'opacity',art.toFixed(4));
      style(s.heading,'opacity',copy.toFixed(4));style(s.caption,'opacity',copy.toFixed(4));
      style(s.word,'opacity',(copy*.035).toFixed(4));
      style(s.environment,'opacity',env.toFixed(4));
      // An opaque incoming background covers the previous environment; no photo cross-dissolves.
      style(backgrounds[s.id],'opacity',(d<0?env:d<1?1:0).toFixed(4));
      if(art>0){
        const travel=d<0?(1-smooth(.20,.82,enter))*.65:-smooth(.12,.64,leave)*.72;
        const tilt=compact?0:(s.id===0?-3:s.id===2?2:0)+travel*7;
        style(s.art,'transform',`translate3d(${(s.frame.x+travel*w).toFixed(2)}px,${s.frame.y.toFixed(2)}px,0) rotate(${tilt.toFixed(2)}deg) scale(${s.frame.scale.toFixed(5)})`);
      }
      if(copy>0){const shift=(d<0?1-copy:copy-1)*24;style(s.heading,'transform',`translate3d(${shift.toFixed(2)}px,0,0)`);style(s.caption,'transform',`translate3d(${(shift*.5).toFixed(2)}px,0,0)`)}
      // Focus is moved before any reading layer becomes visually unavailable.
      const active=i===current&&copy>.08;
      access(s.el,active,buttons[s.id]);
      for(const el of s.extras){style(el,'opacity',extra.toFixed(4));access(el,active&&extra>.58,buttons[s.id])}
      if(s.id===0){proofState['--s2-id-copy']=copy;proofState['--s2-id-art']=art}
      if(s.id===1){proofState['--s2-work-copy']=copy;proofState['--s2-work-art']=art;proofState['--s2-work-controls']=extra}
    }
    proofState['--s2-p']=p;
    style(signal,'transform',`translate3d(0,${(Math.sin(p*Math.PI/5)*10).toFixed(2)}px,0) scaleY(${(.75+Math.cos(p*Math.PI/5)*.12).toFixed(4)})`);
    style(progress,'transform',`scaleX(${(p/Math.max(1,scenes.length-1)).toFixed(5)})`);
    if(selected!==scenes[current].id){selected=scenes[current].id;root.dataset.activeScene=String(selected);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));updateDock()}
  }
  function tick(now){
    raf=0;if(!enabled||!inView||document.hidden){lastTime=0;return}
    if(dirty)measure();target=clamp((scrollY-geometry.top)/geometry.step,0,scenes.length-1);
    const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;
    // A short, time-based filter removes wheel jitter without a long spring tail.
    value+=(target-value)*(1-Math.exp(-dt/.065));
    const settled=Math.abs(value-target)<.0003;if(settled)value=target;
    paint(value);if(!settled)schedule();else lastTime=0;
  }
  // Native input drives the animation; after release, finish at a readable scene.
  // Programmatic anchor/focus scrolling is left alone. No wheel/touch cancellation.
  let settleTimer=0,gesture=null,touchHeld=false,snapping=false,previousY=scrollY;
  function cancelSettle(){clearTimeout(settleTimer);gesture=null;snapping=false}
  document.addEventListener('portfolio:project-dialog',cancelSettle);
  function intent(direction=0,distance=0){
    if(!enabled||!geometry||document.querySelector('dialog[open]'))return;
    if(snapping){scrollTo({top:scrollY,behavior:'instant'});snapping=false}
    if(!gesture)gesture={distance:0,direction:0};
    gesture.inputDirection=!!direction;
    if(direction)gesture.direction=direction;
    gesture.distance+=distance;clearTimeout(settleTimer);
    settleTimer=setTimeout(settle,180);
  }
  function settle(){
    clearTimeout(settleTimer);
    if(touchHeld)return;
    if(snapping){snapping=false;return}
    const input=gesture;gesture=null;
    if(!input||!enabled||!inView||document.hidden||!input.direction||document.querySelector('dialog[open]'))return;
    if(dirty)measure();
    const p=(scrollY-geometry.top)/geometry.step,last=scenes.length-1;
    // Let native scrolling leave either end; never pull archive visitors back in.
    if(p<0||p>last)return;
    const next=input.distance<24?Math.round(p):input.direction>0?Math.ceil(p-.003):Math.floor(p+.003);
    const destination=geometry.top+clamp(next,0,last)*geometry.step;
    if(Math.abs(destination-scrollY)<1)return;
    snapping=true;scrollTo({top:destination,behavior:'smooth'});schedule();
  }
  function onScroll(){
    const delta=scrollY-previousY;previousY=scrollY;
    if(gesture&&Math.abs(delta)>.5){if(!gesture.inputDirection)gesture.direction=Math.sign(delta);gesture.distance+=Math.abs(delta)}
    if(gesture||snapping){clearTimeout(settleTimer);settleTimer=setTimeout(settle,180)}
    schedule();
  }
  addEventListener('wheel',event=>{if(Math.abs(event.deltaY)>Math.abs(event.deltaX)&&!event.ctrlKey)intent(Math.sign(event.deltaY),Math.abs(event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1))},{passive:true});
  addEventListener('touchstart',()=>{touchHeld=true;intent()},{passive:true});
  const release=()=>{touchHeld=false;if(gesture){clearTimeout(settleTimer);settleTimer=setTimeout(settle,180)}};
  addEventListener('touchend',release,{passive:true});addEventListener('touchcancel',release,{passive:true});
  addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,[contenteditable]'))return;
    if(event.key===' '&&event.target.closest('button'))return;
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))intent();
  });
  // A scrollbar drag also settles on release, while ordinary clicks keep focus behavior.
  addEventListener('pointerdown',event=>{if(event.clientX>=document.documentElement.clientWidth)intent()},{passive:true});
  function configure(){
    const next=html.dataset.motion==='on'&&!reduced.matches&&!forced.matches&&(innerWidth<=700?innerHeight>720:innerHeight>600);
    if(next===enabled&&initialized){invalidate();return}
    const oldTop=root.getBoundingClientRect().top+scrollY,oldHeight=root.offsetHeight;
    const below=scrollY>=oldTop+oldHeight,visible=scrollY+innerHeight>oldTop&&!below;
    let index=Math.max(0,scenes.findIndex(s=>s.id===selected));
    if(!enabled&&initialized&&next&&visible){const point=scrollY+innerHeight*.35;scenes.forEach((s,i)=>{if(s.el.getBoundingClientRect().top+scrollY<=point)index=i})}
    cancelSettle();stop();enabled=next;root.classList.toggle('is-scrubbed',enabled);controls.hidden=!enabled;
    placeMotion();
    if(enabled){
      measure();value=target=initialized?index:clamp((scrollY-geometry.top)/geometry.step,0,scenes.length-1);lastPaint=-1;paint(value);
      if(initialized&&visible)scrollTo({top:geometry.top+geometry.step*index,behavior:'instant'});schedule();
    }else{
      root.style.removeProperty('height');
      all.forEach(s=>{access(s.el,true);[s.art,s.heading,s.caption,s.word,s.environment,...s.extras].forEach(el=>{el.removeAttribute('style');cache.delete(el)});s.extras.forEach(el=>access(el,true))});
      if(initialized&&visible)scenes[index]?.el.scrollIntoView({block:'start',behavior:'instant'});
    }
    if(initialized&&below)scrollBy({top:root.offsetHeight-oldHeight,behavior:'instant'});
    initialized=true;
  }
  function select(id){const i=scenes.findIndex(s=>s.id===id);if(i<0||!enabled)return;cancelSettle();if(dirty)measure();scrollTo({top:geometry.top+geometry.step*i,behavior:'smooth'});schedule()}
  buttons.forEach((button,id)=>{
    button.addEventListener('click',()=>select(id));
    button.addEventListener('keydown',event=>{const i=scenes.findIndex(s=>s.id===id),last=scenes.length-1;const n=event.key==='ArrowRight'?(i+1)%scenes.length:event.key==='ArrowLeft'?(i+last)%scenes.length:event.key==='Home'?0:event.key==='End'?last:null;if(n===null)return;event.preventDefault();buttons[scenes[n].id].focus({preventScroll:true});select(scenes[n].id)})
  });
  addEventListener('scroll',onScroll,{passive:true});
  // Mobile browser chrome changes height while scrolling. Re-measure only when the stable stage changes.
  const resizeObserver=new ResizeObserver(invalidate);resizeObserver.observe(canvas);resizeObserver.observe(stage);
  const shortViewport=()=>innerWidth<=700?innerHeight<=720:innerHeight<=600;
  let lastWidth=innerWidth,lastShort=shortViewport();
  addEventListener('resize',()=>{const short=shortViewport();if(innerWidth!==lastWidth||short!==lastShort){lastWidth=innerWidth;lastShort=short;configure()}},{passive:true});
  reduced.addEventListener('change',configure);forced.addEventListener('change',configure);
  new MutationObserver(configure).observe(html,{attributes:true,attributeFilter:['data-motion']});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;placeMotion();if(inView){lastTime=0;schedule()}else stop()}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelSettle();stop()}else{lastPaint=-1;schedule()}});
  document.fonts?.ready.then(invalidate);
  root.querySelector('.journey-photo-picker').hidden=false;
  const photoButtons=[...root.querySelectorAll('[data-opening-photo]')];
  const gazeImage=root.querySelector('[data-journey-scene="2"] .gaze-print-front img');
  const firstPhoto=gazeImage?.cloneNode(true),secondPhoto=root.querySelector('[data-opening-photo-template]')?.content.querySelector('img');
  const safeSource=url=>{try{const u=new URL(url,location.origin);return typeof url==='string'&&url.trim()&&u.origin===location.origin&&u.protocol===location.protocol&&!u.username&&!u.password&&!/[\\\u0000-\u001f]/.test(url)?u.href:''}catch{return ''}};
  const photoOptions=[firstPhoto,secondPhoto];
  let photoRequest=0,photoAnimation=null,photoSelected=0;
  const gazeFront=gazeImage?.parentElement;
  const backPhotos=[...root.querySelectorAll('.gaze-print-back img')];
  const copyPhoto=(target,source)=>{for(const attr of ['src','srcset','sizes','width','height','alt','data-scene-photo','data-photo-title']){const value=source.getAttribute(attr);if(value!==null)target.setAttribute(attr,value);else target.removeAttribute(attr)}};
  function cancelPhotoMotion(){photoRequest++;photoAnimation?.cancel();photoAnimation=null;}
  new MutationObserver(()=>{if(html.dataset.motion!=='on')cancelPhotoMotion()}).observe(html,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change',cancelPhotoMotion);
  async function choosePhoto(i,{animate=true}={}){
    if(!gazeImage||!photoOptions[i]||photoButtons[i].hidden)return;
    const request=++photoRequest,source=photoOptions[i];
    await source.decode?.().catch(()=>{});
    if(request!==photoRequest)return;
    photoAnimation?.cancel();
    copyPhoto(gazeImage,source);photoSelected=i;
    backPhotos.forEach((img,n)=>{const other=photoOptions[(i+n+1)%photoOptions.length];if(other)copyPhoto(img,other);img.alt='';});
    photoButtons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));
    gazeImage.closest('figure').querySelector('figcaption').textContent=source.dataset.photoTitle||source.alt;
    if(animate&&html.dataset.motion==='on'&&!reduced.matches)photoAnimation=gazeFront.animate([{opacity:.4,transform:'translate3d(14px,0,0) rotate(2deg)'},{opacity:1,transform:'translate3d(0,0,0) rotate(0)'}],{duration:340,easing:'cubic-bezier(.22,.8,.24,1)'});
  }
  photoButtons.forEach((b,i)=>{b.addEventListener('click',()=>choosePhoto(i));b.addEventListener('keydown',event=>{const next=event.key==='ArrowRight'?(i+1)%photoButtons.length:event.key==='ArrowLeft'?(i+photoButtons.length-1)%photoButtons.length:null;if(next===null||photoButtons[next].hidden)return;event.preventDefault();photoButtons[next].focus({preventScroll:true});choosePhoto(next)})});
  document.addEventListener('portfolio:content',event=>{
    const content=event.detail?.content,journal=content?.dailyGaze;
    if(Array.isArray(journal)){
      const visible=journal.filter(g=>g.visible!==false&&safeSource(g.preview));
      photoOptions.forEach((img,i)=>{if(!img)return;const item=visible.find(g=>g.id===img.dataset.scenePhoto)||visible[i];photoButtons[i].hidden=!item;if(!item)return;const derivatives=(item.derivatives||[]).filter(d=>Number.isFinite(d.width)&&d.width>0&&safeSource(d.url));img.src=safeSource(derivatives[0]?.url||item.preview);img.srcset=derivatives.map(d=>`${safeSource(d.url)} ${d.width}w`).join(', ');img.alt=item.alt||item.title;img.dataset.scenePhoto=item.id;img.dataset.photoTitle=item.title;photoButtons[i].setAttribute('aria-label','View '+item.title)});
      if(visible.length){gazeImage.hidden=false;backPhotos.forEach(img=>img.hidden=false);choosePhoto(photoButtons[photoSelected]?.hidden?0:photoSelected,{animate:false})}else{cancelPhotoMotion();[gazeImage,...backPhotos].forEach(img=>{img.hidden=true;img.removeAttribute('src');img.removeAttribute('srcset')})}
    }
    all.forEach(s=>{const section=s.el.dataset.section&&document.querySelector(s.el.dataset.section);s.el.hidden=!!section?.hidden||(s.id===2&&Array.isArray(journal)&&!journal.some(g=>g.visible!==false&&safeSource(g.preview)));buttons[s.id].hidden=s.el.hidden;if(s.el.hidden){access(s.el,false,buttons[0]);style(backgrounds[s.id],'opacity','0')}});
    scenes=all.filter(s=>!s.el.hidden);value=clamp(value,0,scenes.length-1);target=value;selected=-1;invalidate();
  });
  root.__journeyInvalidate=invalidate;
  configure();
})();

// An accessible, data-driven constellation. No idle animation loop.
(() => {
  const scene=document.querySelector('[data-journey-scene="4"]');if(!scene)return;
  const nodes=[...scene.querySelectorAll('[data-brand-select]')],paths=[...scene.querySelectorAll('[data-brand-connection]')];
  const detail=scene.querySelector('.journey-caption'),copy=detail.querySelector('p'),note=detail.querySelector('span'),link=detail.querySelector('a');
  const descriptions=['A closer look at the everyday.','Where stories become worlds.','Space to reflect, grow and evolve.','Technology, explored with curiosity.','Ideas that make room for learning.','Digital products with a purpose.'];
  let selected=0;
  function choose(index){
    if(nodes[index]?.hidden)return;
    selected=index;
    nodes.forEach((node,i)=>node.setAttribute('aria-pressed',String(i===index)));
    paths.forEach((line,i)=>line.classList.toggle('is-selected',i===index));
    const name=nodes[index].querySelector('strong').textContent;
    const original=['The Daily Gaze','Clouds','Aura','The Grid','Roots','The Collection'].indexOf(name);
    copy.textContent=descriptions[original]||nodes[index].querySelector('small').textContent;note.textContent=String(index+1).padStart(2,'0')+' / '+name;
    link.href=name==='The Daily Gaze'?'/daily-gaze/':'/work/veloria/';link.firstChild.textContent=name==='The Daily Gaze'?'Explore photography ':'Explore the brand architecture ';
    document.querySelector('.scene-journey').__journeyInvalidate?.();
  }
  nodes.forEach((node,i)=>{node.addEventListener('click',()=>choose(i));node.addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();const visible=nodes.filter(n=>!n.hidden),current=visible.indexOf(node),direction=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
    const next=event.key==='Home'?visible[0]:event.key==='End'?visible.at(-1):visible[(current+direction+visible.length)%visible.length];
    next?.focus({preventScroll:true});if(next)choose(nodes.indexOf(next));
  })});
  document.addEventListener('portfolio:content',event=>{
    const brands=event.detail?.content?.ecosystem;if(!Array.isArray(brands))return;
    nodes.forEach((node,i)=>{const brand=brands[i];node.hidden=!brand||brand.visible===false;paths[i].toggleAttribute('hidden',node.hidden);if(brand){node.querySelector('strong').textContent=brand.name;node.querySelector('small').textContent=brand.description;}});
    const next=nodes[selected]?.hidden?nodes.findIndex(n=>!n.hidden):selected;
    detail.hidden=next<0;if(next>=0)choose(next);
  });
  choose(0);
})();
