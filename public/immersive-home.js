(() => {
  'use strict';
  const lock=document.querySelector('.signal-lock-preloader'),lockProgress=document.querySelector('[data-lock-progress]');
  let lockTimer=0,lockStarted=0;
  function finishSignalLock(immediate=false){if(!lock||lock.dataset.finished==='true')return;lock.dataset.finished='true';if(lockTimer)clearInterval(lockTimer);if(lockProgress)lockProgress.textContent='100%';lock.classList.add('is-exiting');lock.style.pointerEvents='none';if(immediate)lock.remove();else setTimeout(()=>lock.remove(),320);}
  const reducedAtBoot=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(lock&&(navigator.webdriver===true||reducedAtBoot||document.documentElement.dataset.motion==='off'))finishSignalLock(true);
  else if(lock){lockStarted=performance.now();lockTimer=setInterval(()=>{if(document.hidden)return;const progress=Math.min(100,Math.floor((performance.now()-lockStarted)/1120*100));if(lockProgress)lockProgress.textContent=String(progress).padStart(2,'0')+'%';if(progress>=100)finishSignalLock();},35);}
  const root = document.querySelector('[data-experience]');
  if (!root) return;
  const stage = root.querySelector('.experience-stage');
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const nav = [...root.querySelectorAll('[data-scene-select]')];
  const menu = document.querySelector('#experience-menu');
  const menuItems = [...menu.querySelectorAll('[data-menu-scene]')];
  const openers = [...root.querySelectorAll('[data-open-scenes],[data-open-scenes-mini]')];
  const motion = document.querySelector('.motion-toggle');
  if (motion) { root.querySelector('.experience-utility').append(motion); motion.hidden = false; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)'),reticle=document.querySelector('.magnetic-reticle'),reticlePill=reticle?.querySelector('.reticle-pill');
  const clockNode=root.querySelector('[data-dual-clock]'),coordinateNode=root.querySelector('[data-scene-coordinate]');
  let clockTimer=0,pointerX=0,pointerY=0,pointerInside=false;
  const timeText=zone=>new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  function updateStudioClock(){if(!clockNode||document.hidden)return;clockNode.textContent=timeText('Asia/Colombo')+' / '+timeText('Asia/Kuala_Lumpur');}
  function syncClock(){updateStudioClock();if(clockTimer)clearInterval(clockTimer);if(!document.hidden)clockTimer=setInterval(updateStudioClock,30000);}
  syncClock();document.addEventListener('visibilitychange',syncClock);
  function cursorAllowed(){return finePointer.matches&&enabled&&!reduced.matches&&document.documentElement.dataset.motion!=='off'&&!root.classList.contains('is-static');}
  if(finePointer.matches&&reticle){
    addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!cursorAllowed())return;pointerX=event.clientX;pointerY=event.clientY;pointerInside=true;root.style.setProperty('--hero-parallax-x',((pointerX/innerWidth)-.5)*26+'px');root.style.setProperty('--hero-parallax-y',((pointerY/innerHeight)-.5)*20+'px');reticle.style.transform=`translate3d(${pointerX}px,${pointerY}px,0)`;reticle.classList.add('is-visible');mapPose='';if(enabled)schedule();},{passive:true});
    addEventListener('pointerover',event=>{if(!cursorAllowed())return;const target=event.target.closest?.('a,button,.work-cell,.filmstrip figure,.photo-link');if(!target)return;if(reticlePill)reticlePill.textContent=target.matches('.work-cell,.filmstrip figure,.photo-link')?'[ INSPECT FRAME ]':'[ EXPLORE ]';reticle.classList.add('is-active');},{passive:true});
    addEventListener('pointerout',event=>{if(event.target.closest?.('a,button,.work-cell,.filmstrip figure,.photo-link')&&!event.relatedTarget?.closest?.('a,button,.work-cell,.filmstrip figure,.photo-link'))reticle.classList.remove('is-active');},{passive:true});
    addEventListener('pointerleave',()=>{pointerInside=false;reticle.classList.remove('is-visible','is-active');root.style.setProperty('--hero-parallax-x','0px');root.style.setProperty('--hero-parallax-y','0px');});
    finePointer.addEventListener('change',()=>{if(!finePointer.matches){reticle.classList.remove('is-visible','is-active');root.style.setProperty('--hero-parallax-x','0px');root.style.setProperty('--hero-parallax-y','0px');}});
  }

  const names = nav.map(b => b.getAttribute('aria-label'));
  // The opening pair is intentionally brisk: establish identity, run the reel,
  // then reach the wider story before the experience starts to feel held.
  const durations = [1.35, 2.9, 1.8, .9, 2.3, 2.4, .9, 1.8, 1.4, 1.8];
  let starts = durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0));
  let total = durations.reduce((a, b) => a + b, 0);
  // Lay out every chapter label once. Visibility changes preserve text geometry
  // during scrolling, including the accessible live status.
  const timecode = i => {
    const seconds = Math.floor(starts[i] * 4);
    return `00:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}:00`;
  };
  const labelStacks = [
    ['[data-film-label]', i => `${names[i].toUpperCase()} · SC ${String(i + 1).padStart(2, '0')}`],
    ['[data-scene-status]', i => `${String(i + 1).padStart(2, '0')} / ${names[i].toUpperCase()}`],
    ['[data-film-time]', timecode]
  ].map(([selector, text]) => {
    const host = root.querySelector(selector);
    host.classList.add('film-label-stack');
    const labels = names.map((_, i) => {
      const span = document.createElement('span'); span.textContent = text(i);
      span.style.visibility = i === 0 ? 'visible' : 'hidden';
      span.setAttribute('aria-hidden', String(i !== 0));
      return span;
    });
    host.replaceChildren(...labels); return labels;
  });
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (a, b, v) => {
    const t = clamp((v - a) / (b - a));
    return t*t*t*(t*(t*6-15)+10);
  };
  let available = scenes.map((_,i) => i);
  let enabled = false, initialized = false, active = -1, raf = 0, dirty = true, geo;
  let opener, savedOverflow = '', lastNumber = -1;
  let cache = new WeakMap(), pendingStyles = null;
  // Visual progress follows native scroll through a very short critically-damped
  // camera. This removes uneven mobile scroll stepping without intercepting input.
  let cameraP = 0, cameraV = 0, cameraReady = false, cameraLast = 0;
  let cameraTargetPrev = 0, cameraTargetDir = 0;
  root._cameraState = { target: 0, visual: 0, velocity: 0, settled: true };
  // Camera handoffs use a C3-continuous curve: velocity, acceleration and jerk
  // all settle to zero at both ends, so direction changes feel less mechanical.
  const cameraEase = v => {
    const t = clamp(v);
    return t*t*t*t*(35 + t*(-84 + t*(70 - 20*t)));
  };
  function set(el, key, value) {
    if (!el) return;
    // Compose the base pose and transition before touching live styles. Each
    // property is committed once, avoiding reset/rewrite pairs every frame.
    if (pendingStyles) {
      let style = pendingStyles.get(el);
      if (!style) { style = {}; pendingStyles.set(el, style); }
      style[key] = value; return;
    }
    let old = cache.get(el);
    if (!old) { old = {}; cache.set(el, old); }
    if (old[key] !== value) { el.style[key] = value; old[key] = value; }
  }
  const q = (i, selector) => scenes[i].querySelector(selector);
  const parts = {
    photo: q(0, '.opening-photo'), name: q(0, '.opening-name'),
    intro: q(1, '.gaze-intro'), strip: q(1, '.filmstrip'), window: q(1, '.gaze-reel-window'),
    readout: q(1, '.gaze-readout'), number: q(1, '[data-gaze-number]'), note: q(1, '.gaze-channel-note'),
    total: Number(q(1, '.gaze-readout em').textContent.replace(/\D/g, '')),
    work: [...scenes[4].querySelectorAll('.work-cell')],
    jobs: [...scenes[5].querySelectorAll('.journey-list li')],
    answers: [...scenes[8].querySelectorAll('.curiosity-answer span')],
    credits: [...scenes[9].querySelectorAll('.credits-list>div')],
    signature: q(9, '.signature-stage'), pen: q(9, '.signature-pen'),
    globe: q(2, '.reach-globe'), worlds: [...scenes[7].querySelectorAll('.orbit-node')]
  };
  const rig = root.querySelector('.signal-rig');
  const gate = rig.querySelector('.signal-gate'), circle = rig.querySelector('.signal-circle');
  const dot = rig.querySelector('.signal-dot'), map = rig.querySelector('.signal-map');
  const mapCtx = map.getContext('2d');
  const copy = scenes.map(scene => [...scene.children].filter(el => !el.matches('.opening-photo,.gaze-reel-window,.reach-globe,.work-wall,.journey-list,.veloria-orbit')));
  const mix = (a,b,t) => a+(b-a)*t;
  const f = v => Number(v).toFixed(3);
  // Scale errors multiply across large surfaces: .001 can move a text edge by
  // a whole pixel. Keep zoom geometry precise at slow/high-refresh scroll rates.
  const scaleValue = v => Number(v).toFixed(6);
  const canvas = q(2, '[data-world]'), ctx = canvas.getContext('2d');
  let land = [], globeSize = 0, globePhase = -1, mapPose = '';
  const radians = Math.PI / 180, tilt = 15 * radians;
  const sinTilt = Math.sin(tilt), cosTilt = Math.cos(tilt);
  const depthBuckets = Array.from({length:24},()=>[]);
  function drawWorld(phase = .4) {
    if (!ctx || !globeSize) return;
    phase = Math.round(phase * 4096) / 4096;
    if (phase === globePhase) return;
    globePhase = phase;
    const size = globeSize, r = size * .46, center = size / 2;
    const lon0 = (82 + phase * 18) * radians;
    const sinLon = Math.sin(lon0), cosLon = Math.cos(lon0);
    const project = (lon, lat) => {
      const l = lon * Math.PI / 180 - lon0, a = lat * Math.PI / 180;
      return [center + r * Math.cos(a) * Math.sin(l), center - r * (cosTilt * Math.sin(a) - sinTilt * Math.cos(a) * Math.cos(l)), sinTilt * Math.sin(a) + cosTilt * Math.cos(a) * Math.cos(l)];
    };
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#111a12'; ctx.beginPath(); ctx.arc(center, center, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#45552b'; ctx.lineWidth = .6; ctx.stroke();
    // Real land coordinates from public-domain Natural Earth, projected orthographically.
    depthBuckets.forEach(bucket=>{bucket.length=0;});
    for (const [x0,y0,z0] of land) {
      const depth=x0*cosLon+y0*sinLon, z=sinTilt*z0+cosTilt*depth;
      if (z <= 0) continue;
      depthBuckets[Math.min(23,Math.floor(z*24))].push(center+r*(y0*cosLon-x0*sinLon),center-r*(cosTilt*z0-sinTilt*depth));
    }
    const dotRadius=Math.max(.75,size/340);
    for(let n=0;n<depthBuckets.length;n++){
      const points=depthBuckets[n];if(!points.length)continue;
      ctx.fillStyle=n%5===0?`rgba(225,29,72,${(.16+(n+.5)/24*.58).toFixed(3)})`:`rgba(212,175,55,${(.2+(n+.5)/24*.7).toFixed(3)})`;ctx.beginPath();
      for(let j=0;j<points.length;j+=2){ctx.moveTo(points[j]+dotRadius,points[j+1]);ctx.arc(points[j],points[j+1],dotRadius,0,Math.PI*2);}
      ctx.fill();
    }
    for (const [lon, lat] of [[79.86, 6.93], [101.69, 3.14]]) {
      const [x, y, z] = project(lon, lat);
      if (z <= 0) continue;
      ctx.fillStyle = '#f4e9cf'; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
    }
  }
  fetch('/assets/data/land-points.json').then(r => r.ok ? r.json() : []).then(points => {
    // Convert coordinates once; apply just one longitude rotation per frame.
    land = points.map(([lon,lat])=>{const a=lat*radians,l=lon*radians,c=Math.cos(a);return [c*Math.cos(l),c*Math.sin(l),Math.sin(a)];}); globePhase = -1;
    if (enabled) schedule(); else drawWorld();
  }).catch(() => {});

  function measure() {
    const h = stage.clientHeight, w = stage.clientWidth;
    geo = { h, w, top: root.getBoundingClientRect().top + scrollY,
      reelTravel: Math.max(0, parts.strip.scrollHeight - parts.window.clientHeight) };
    if (enabled) root.style.height = `${h * (total + 1)}px`;
    globeSize = canvas.clientWidth;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const globePixels = Math.round(globeSize * dpr);
    if (canvas.width !== globePixels || canvas.height !== globePixels) {
      canvas.width = globePixels; canvas.height = globePixels;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); globePhase = -1;
    }
    // Cache untransformed layout geometry only on resize/content change, never in paint.
    const box = el => {
      let x=0,y=0,node=el;
      while(node && node!==stage){x+=node.offsetLeft;y+=node.offsetTop;node=node.offsetParent;}
      return {x,y,w:el.offsetWidth,h:el.offsetHeight};
    };
    geo.film = box(parts.window); geo.strip = box(parts.strip); geo.globe = box(canvas);
    geo.jobs = parts.jobs.filter(el=>!el.hidden).map(el=>{const b=box(el);return {x:b.x+3,y:b.y+b.h/2};});
    geo.worlds = parts.worlds.map(el=>{const b=box(el);return {x:b.x+3,y:b.y+8};});
    geo.signature = box(parts.signature);
    map.width=Math.round(w*dpr);map.height=Math.round(h*dpr);
    mapCtx?.setTransform(dpr,0,0,dpr,0,0);
    mapPose = '';
    dirty = false;
    if (!enabled) drawWorld();
  }
  function setActive(i) {
    if (active === i) return;
    // Never make the focused subtree inert before returning focus to the timeline.
    if (scenes.some((s, j) => j !== i && s.contains(document.activeElement))) nav[i].focus({ preventScroll: true });
    active = i;
    scenes.forEach((s, j) => { s.classList.toggle('is-current', i === j); s.setAttribute('aria-hidden', String(i !== j)); s.inert = i !== j; });
    nav.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
    menuItems.forEach((b, j) => i === j ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'));
    labelStacks.forEach(labels => labels.forEach((label, j) => {
      set(label, 'visibility', i === j ? 'visible' : 'hidden');
      label.setAttribute('aria-hidden', String(i !== j));
    }));
  }
  // All motion is a pure function of native scroll position. No transition timers,
  // autonomous camera loop, wheel interception or direction-dependent state.
  function reveal(elements, t, spacing = .035) {
    elements.forEach((el, i) => {
      const progress = ease(i * spacing, .14 + i * spacing, t);
      set(el, 'opacity', '1');
      set(el, 'clipPath', `inset(0 0 ${f((1-progress)*100)}% 0)`);
      set(el, 'transform', `translate3d(0,${f((1-progress)*40)}px,0)`);
    });
  }
  function sceneMotion(i, t) {
    if (i === 0) {
      set(parts.photo,'transform',`scale(${scaleValue(1+.04*ease(0,.65,t))})`);
      set(parts.name,'transform','translate3d(0,0,0)');
    } else if (i === 1) {
      const title=1-ease(.17,.27,t), reel=ease(.23,.34,t);
      set(parts.intro,'opacity','1');
      set(parts.intro,'clipPath',`inset(0 0 ${f((1-title)*100)}% 0)`);
      set(parts.intro,'transform',`translate3d(0,${f((1-title)*-70)}px,0)`);
      set(parts.strip,'opacity','1');
      set(parts.window,'clipPath',`inset(0 ${f((1-reel)*50)}% 0 ${f((1-reel)*50)}%)`);
      const travel=ease(.31,.68,t)*geo.reelTravel;
      set(parts.strip,'transform',`translateX(-50%) translate3d(0,${f((1-reel)*geo.h*.3-travel)}px,0) scale(${scaleValue(.8+.2*reel)})`);
      set(parts.readout,'opacity',f(reel));set(parts.note,'opacity',f(reel));
      if(parts.total!==lastNumber){parts.number.textContent=String(parts.total);lastNumber=parts.total;}
    } else if(i===2) {
      drawWorld(t);
      set(parts.globe,'transform',`rotate(${f((1-ease(0,.4,t))*-12)}deg)`);
    } else if(i===4) {
      parts.work.forEach((el,j)=>{
        const enter=1, travel=ease(.4,.7,t);
        set(el,'opacity','1');set(el,'clipPath','none');
        set(el,'transform',`translate3d(${f((1-enter)*(j-2)*geo.w*.1)}px,${f((1-enter)*geo.h*.65-travel*(j%2?12:-12))}px,${f((1-enter)*-450)}px) rotateY(${f((1-enter)*(j%2?22:-22))}deg)`);
      });
    } else if(i===5) reveal(parts.jobs,t+.35,.045);
    else if(i===7) reveal(parts.worlds,t+.35,.04);
    else if(i===8) reveal(parts.answers,t+.35,.04);
    else if(i===9) {
      reveal(parts.credits,t+.35,.03);
      set(parts.signature,'opacity','1');set(parts.signature,'clipPath','none');
      set(parts.pen,'strokeDashoffset',f(1-ease(.32,.83,t)));
    }
  }
  // Anchor states share one dot, one circle and one gate throughout all ten scenes.
  // They inhabit real content coordinates, so resize does not sever the connection.
  function anchor(i,t) {
    const {w,h,strip,globe}=geo, portrait={x:w*(w<701?.55:.72),y:h*.25};
    const filmX=strip.x-strip.w/2, globeX=globe.x+globe.w/2, globeY=globe.y+globe.w/2;
    const base={x:w*.06,y:h*.55,r:3,gx:w*.06,gy:h*.15,gw:1,gh:h*.57,round:0};
    if(i===0)return {...base,...portrait,gx:portrait.x-28,gy:portrait.y-28,gw:56,gh:56,round:0};
    if(i===1){const u=ease(.23,.34,t);return {...base,x:mix(w*.5,filmX,u),y:mix(h*.68,h*.48,u),gx:mix(w*.06,filmX,u),gy:mix(h*.25,geo.film.y,u),gw:mix(w*.88,strip.w,u),gh:mix(h*.4,geo.film.h,u)};}
    if(i===2)return {...base,x:globeX,y:globeY,r:globe.w*.46,gx:globeX-globe.w*.46,gy:globeY-globe.w*.46,gw:globe.w*.92,gh:globe.w*.92,round:50};
    if(i===3||i===6)return {...base,x:w*.5,y:h*.68,gx:w*.075,gy:h*.28,gw:w*.85,gh:h*.36};
    if(i===4)return {...base,x:w*.06,y:h*.1,gx:w*.06,gy:h*.1,gw:w*.88,gh:1};
    if(i===5){const points=geo.jobs;if(!points.length)return base;const position=ease(0,.65,t)*(points.length-1),index=Math.min(points.length-2,Math.floor(position)),u=position-index;const a=points[Math.max(index,0)],b=points[Math.max(index+1,0)];return {...base,x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),gx:a.x,gy:points[0].y,gw:1,gh:Math.max(1,points.at(-1).y-points[0].y)};}
    if(i===7)return {...base,x:w*(w<701?.5:.48),y:h*(w<701?.37:.49),gx:w*(w<701?.5:.48),gy:h*.25,gw:1,gh:h*.45};
    if(i===8)return {...base,x:w*(w<701?.035:.58),y:h*.52,gx:w*(w<701?.035:.58),gy:h*.25,gw:1,gh:h*.44};
    const sig=geo.signature;return {...base,x:sig.x+sig.w*.13,y:sig.y+sig.h*.65,gx:sig.x+sig.w*.13,gy:sig.y+sig.h*.65,gw:1,gh:1};
  }
  function drawRig(i,t,next,u) {
    const a=anchor(i,t),b=next===undefined?a:anchor(next,0),v=ease(0,1,u),s={};
    for(const key of Object.keys(a))s[key]=mix(a[key],b[key],v);
    set(gate,'transform',`translate3d(${f(s.gx)}px,${f(s.gy)}px,0) scale(${scaleValue(Math.max(1,s.gw)/200)},${scaleValue(Math.max(1,s.gh)/200)})`);
    set(gate,'borderRadius',`${f(s.round)}%`);
    set(circle,'transform',`translate3d(${f(s.x-s.r)}px,${f(s.y-s.r)}px,0) scale(${scaleValue(s.r/100)})`);
    set(circle,'opacity',f(i===9?1-ease(.25,.4,t):i===0?ease(.2,.55,t):1));
    set(dot,'transform',`translate3d(${f(s.x)}px,${f(s.y)}px,0)`);
    set(dot,'opacity',f(i===9?1-ease(.32,.45,t):i===0?ease(.2,.55,t):1));
    set(gate,'opacity',f(i===9?1-ease(.2,.32,t):i===0?.55*ease(.2,.55,t):.55));
    // Paint the path in one fixed-size canvas. SVG dash/transform mutations used
    // to invalidate layout on every path update under mobile throttling.
    if(!mapCtx)return;
    const pose=i===5||i===7||next===7?`${i}:${f(t)}:${f(u)}`:'empty';
    if(pose===mapPose)return;
    mapPose=pose;
    mapCtx.clearRect(0,0,geo.w,geo.h);
    if(pointerInside&&finePointer.matches&&enabled){const glow=mapCtx.createRadialGradient(pointerX,pointerY,0,pointerX,pointerY,Math.max(150,geo.w*.22));glow.addColorStop(0,'rgba(212,175,55,.16)');glow.addColorStop(.42,'rgba(225,29,72,.055)');glow.addColorStop(1,'rgba(5,5,7,0)');mapCtx.fillStyle=glow;mapCtx.fillRect(0,0,geo.w,geo.h);mapCtx.beginPath();mapCtx.arc(pointerX,pointerY,2.2,0,Math.PI*2);mapCtx.fillStyle='#f5e8c7';mapCtx.fill();mapCtx.beginPath();mapCtx.arc(pointerX,pointerY,15,0,Math.PI*2);mapCtx.strokeStyle='#d4af3788';mapCtx.lineWidth=.7;mapCtx.stroke();}
    mapCtx.strokeStyle='#d4af37';mapCtx.lineWidth=1;
    if(i===5 && geo.jobs.length){
      const points=geo.jobs, progress=ease(0,.65,t)*(1-u)*(points.length-1);
      mapCtx.beginPath();mapCtx.moveTo(points[0].x,points[0].y);
      for(let j=1;j<points.length;j++){
        const v=clamp(progress-j+1);if(v===0)break;
        mapCtx.lineTo(mix(points[j-1].x,points[j].x,v),mix(points[j-1].y,points[j].y,v));
      }mapCtx.stroke();
    }
    if(i===7||next===7){
      mapCtx.globalAlpha=.55;
      geo.worlds.forEach((dest,j)=>{
        const progress=ease(j*.04,.2+j*.04,i===7?1:u)*(i===7?1-u:1);
        mapCtx.beginPath();mapCtx.moveTo(s.x,s.y);
        // Sample the same cubic so partial paths end at the moving signal tip.
        for(let n=1;n<=32;n++){
          const v=Math.min(progress,n/32),k=1-v;
          mapCtx.lineTo(k*k*k*s.x+3*k*k*v*s.x+3*k*v*v*(dest.x-18)+v*v*v*dest.x,
            k*k*k*s.y+(3*k*k*v+3*k*v*v+v*v*v)*dest.y);
          if(v>=progress)break;
        }mapCtx.stroke();
      });mapCtx.globalAlpha=1;
    }
  }

  function transition(i,next,u) {
    if(next===undefined||u<=0)return;
    const camera=cameraEase(u);
    // The outgoing title clears before any incoming title is uncovered.
    copy[i].forEach(el=>{
      // The title already left before the film reel. Preserve its hidden mask.
      if(i===1 && el===parts.intro)return;
      const out=cameraEase(clamp(u/.34));
      set(el,'clipPath',`inset(0 0 ${f(out*100)}% 0)`);
      set(el,'transform',`translate3d(0,${f(-out*geo.h*.14)}px,0)`);
    });
    copy[next].forEach(el=>{
      const enter=cameraEase(clamp((u-.04)/.96));
      set(el,'clipPath','none');
      set(el,'transform',`translate3d(0,${f((1-enter)*geo.h*.08)}px,0) scale(${scaleValue(.38+.62*enter)})`);
    });
    if(i===0)set(parts.photo,'transform',`translate3d(${f(-camera*geo.w*.13)}px,${f(camera*geo.h*.07)}px,0) scale(${scaleValue(1.04+camera*.55)})`);
    if(i===1){set(parts.strip,'transform',`translateX(-50%) translate3d(${f(camera*geo.w*.075)}px,${f(-geo.reelTravel-camera*geo.h*.46)}px,0) scale(${scaleValue(1+camera*.22)})`);}
    if(i===2)set(parts.globe,'transform',`translate3d(${f(-camera*geo.w*.09)}px,0,0) scale(${scaleValue(1+camera*.32)}) rotate(${f(camera*26)}deg)`);
    if(next===2)set(parts.globe,'transform',`scale(${scaleValue(.35+.65*ease(.1,1,u))}) rotate(${f(mix(-30,-12,camera))}deg)`);
    if(next===4)parts.work.forEach((el,j)=>{const e=ease(.2+j*.04,1,u);set(el,'transform',`translate3d(${f((j-2)*(1-e)*geo.w*.14)}px,${f((1-e)*geo.h*.45)}px,${f((1-e)*-500)}px) rotateY(${f((1-e)*(j%2?25:-25))}deg)`);});
    if(i===4)parts.work.forEach((el,j)=>set(el,'transform',`translate3d(${f((j-2)*camera*geo.w*.28)}px,${f(-(j%2?12:-12)-camera*geo.h*(.2+j*.07))}px,${f(camera*360)}px) rotateY(${f((j-2)*camera*12)}deg)`));
    if(i===5)parts.jobs.forEach((el,j)=>set(el,'transform',`translate3d(0,${f(-camera*geo.h*(.4+j*.07))}px,0)`));
    if(i===7)parts.worlds.forEach((el,j)=>set(el,'transform',`translate3d(${f((j%2?-1:1)*camera*geo.w*.12)}px,${f(-camera*geo.h*.15)}px,0) scale(${scaleValue(1-camera*.25)})`));
  }
  const rawProgress = () => clamp((scrollY-geo.top)/geo.h,0,total);
  function stepCamera(now) {
    const target = rawProgress();
    if (!cameraReady) {
      cameraP = target; cameraV = 0; cameraReady = true; cameraLast = now;
      cameraTargetPrev = target; cameraTargetDir = 0;
      Object.assign(root._cameraState,{target,visual:cameraP,velocity:cameraV,settled:true});
      return true;
    }
    const dt = clamp((now-cameraLast)/1000 || 1/60, 1/240, .028);
    cameraLast = now;
    const targetStep = target-cameraTargetPrev;
    const targetDir = Math.abs(targetStep) > .00004 ? Math.sign(targetStep) : 0;
    // Kill inherited velocity as soon as the user's direction changes. This avoids
    // the tiny rubber-band overshoot that can otherwise appear on fast reversals.
    if (targetDir && cameraTargetDir && targetDir !== cameraTargetDir) cameraV = 0;
    if (targetDir) cameraTargetDir = targetDir;
    cameraTargetPrev = target;

    const delta = cameraP-target;
    // A large programmatic seek should land immediately. Human swipes remain well
    // below this per-frame distance and still receive smoothing.
    if (Math.abs(delta) > .9) {
      cameraP = target; cameraV = 0;
    } else {
      const targetSpeed = Math.abs(targetStep)/Math.max(dt,1/240);
      const urgency = clamp(targetSpeed/5);
      const omega = geo.w <= 700 ? mix(46,56,urgency) : mix(38,46,urgency);
      const decay = Math.exp(-omega*dt);
      const temp = (cameraV + omega*delta)*dt;
      cameraP = target + (delta + temp)*decay;
      cameraV = (cameraV - omega*temp)*decay;
    }
    const settled = Math.abs(cameraP-target) < .00045 && Math.abs(cameraV) < .006;
    if (settled) { cameraP = target; cameraV = 0; }
    Object.assign(root._cameraState,{target,visual:cameraP,velocity:cameraV,settled});
    return settled;
  }
  function paint(p) {
    pendingStyles = new Map();
    const i=available.findLast(index=>p>=starts[index])??available[0];
    const phase=clamp((p-starts[i])/durations[i]), next=available[available.indexOf(i)+1];
    if(coordinateNode){const text=`SC ${String(i+1).padStart(2,'0')} · ${(phase*100).toFixed(1)} / ${(p/total*100).toFixed(1)}`;if(coordinateNode.textContent!==text)coordinateNode.textContent=text;}
    const u=next!==undefined?clamp((phase-.7)/.3):0;
    setActive(u>.65?next:i);
    // Masked controls must not receive focus while the camera is between scenes.
    if(u>0 && scenes.some(scene=>scene.contains(document.activeElement)))nav[active].focus({preventScroll:true});
    scenes.forEach((scene,j)=>{const inactive=u>0||j!==i;if(scene.inert!==inactive)scene.inert=inactive;});
    // Reset both participants from timeline state on every paint: reverse/seek is exact.
    for(const j of [i,...(u>0?[next]:[])]){
      copy[j].forEach(el=>{set(el,'clipPath','none');set(el,'transform','translate3d(0,0,0)');});
      sceneMotion(j,j===i?phase:-.35*(1-u));
    }
    scenes.forEach((scene,j)=>{
      const visible=j===i||(j===next&&u>0);
      set(scene,'visibility',visible?'visible':'hidden');set(scene,'opacity','1');
      let clip='inset(0 0 0 0)';
      if(j===next&&u>0){
        const aperture=cameraEase(clamp((u-.02)/.86)),a=anchor(i,phase),b=anchor(next,0);
        if(next===2)clip=`circle(${f(aperture*Math.hypot(geo.w,geo.h))}px at ${f(b.x)}px ${f(b.y)}px)`;
        else {const cx=mix(a.x,geo.w/2,aperture),half=geo.w*.55*aperture;clip=`inset(0 ${f(Math.max(0,geo.w-cx-half))}px 0 ${f(Math.max(0,cx-half))}px)`;}
      }
      set(scene,'clipPath',clip);
    });
    transition(i,next,u);drawRig(i,phase,next,u);
    const finalStyles=pendingStyles;pendingStyles=null;
    for(const [el,style] of finalStyles)for(const key in style)set(el,key,style[key]);
  }
  function frame(now) {
    raf = 0;
    if (!enabled || document.hidden || menu.open) return;
    if (dirty) measure();
    const settled = stepCamera(now);
    paint(cameraP);
    if (!settled) schedule();
  }
  function schedule() { if (!raf && enabled && !document.hidden && !menu.open) raf = requestAnimationFrame(frame); }
  function goTo(i, behavior = 'smooth') {
    if (!available.includes(i)) i = available[0];
    if (!enabled) { scenes[i].scrollIntoView({ behavior: 'instant' }); return; }
    if (dirty) measure();
    const phase = i === 9 ? .84 : i === 1 ? .06 : i === 0 ? 0 : .4;
    if (behavior === 'instant') { cameraReady = false; cameraTargetDir = 0; }
    scrollTo({ top: geo.top + (starts[i] + durations[i] * phase) * geo.h, behavior });
    schedule();
  }
  const hashScene = () => ['#contact','#credits'].includes(location.hash) ? 9 : scenes.findIndex(s => s.id && '#' + s.id === location.hash);
  function configure() {
    let previous = active;
    const nextEnabled = document.documentElement.dataset.motion !== 'off' && !reduced.matches && !forced.matches && innerHeight >= 650;
    // Static mode has no active camera scene. Read the reader's current section
    // before changing layout, including any native scrolling while motion was off.
    if (nextEnabled && !enabled && initialized) {
      const center = innerHeight / 2;
      let nearest = Infinity;
      for (const i of available) {
        const rect = scenes[i].getBoundingClientRect();
        const distance = Math.max(rect.top - center, center - rect.bottom, 0);
        if (distance < nearest) { nearest = distance; previous = i; }
      }
    }
    enabled = nextEnabled;
    if(!enabled){finishSignalLock(true);pointerInside=false;reticle?.classList.remove('is-visible','is-active');root.style.setProperty('--hero-parallax-x','0px');root.style.setProperty('--hero-parallax-y','0px');}
    cancelAnimationFrame(raf); raf = 0;
    root.classList.toggle('is-live', enabled); root.classList.toggle('is-static', !enabled);
    cache = new WeakMap();
    scenes.forEach((s, i) => {
      s.removeAttribute('style'); s.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
      s.inert = false; s.removeAttribute('aria-hidden');
      if (enabled) s.style.zIndex = String(i + 1);
    });
    if (enabled) copy.flat().forEach(el=>set(el,'transform','translate3d(0,0,0)'));
    if (!enabled) root.style.removeProperty('height');
    active = -1; dirty = true; measure();
    if (enabled) {
      if (!initialized && hashScene() >= 0) goTo(hashScene(), 'instant');
      else if (initialized && previous >= 0) goTo(previous, 'instant');
      cameraReady = false;
      paint(rawProgress());
    } else if (initialized && previous >= 0) scenes[previous].scrollIntoView({ behavior: 'instant' });
    initialized = true;
  }
  function closeMenu() {
    if (!menu.open) return;
    menu.close(); document.documentElement.style.overflow = savedOverflow;
    openers.forEach(b => b.setAttribute('aria-expanded', 'false'));
    opener?.focus({ preventScroll: true }); schedule();
  }
  openers.forEach(b => b.addEventListener('click', () => {
    opener = b; savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden'; menu.showModal();
    openers.forEach(el => el.setAttribute('aria-expanded', 'true'));
  }));
  menu.querySelector('[data-close-scenes]').addEventListener('click', closeMenu);
  menu.addEventListener('cancel', e => { e.preventDefault(); closeMenu(); });
  menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
  nav.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
  menuItems.forEach((b, i) => b.addEventListener('click', () => { closeMenu(); goTo(i); }));
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    const i = ['#contact','#credits'].includes(hash) ? 9 : scenes.findIndex(s => s.id && '#' + s.id === hash);
    if (i < 0) return;
    e.preventDefault(); history.replaceState(null, '', hash); goTo(i);
  }));
  addEventListener('hashchange', () => { const i = hashScene(); if (i >= 0) goTo(i); });
  // Reuse the public CMS projection; never fetch private gallery data here.
  document.addEventListener('portfolio:content', ({detail}) => {
    const c = detail?.content; if (!c) return;
    const safe = value => { try { const u = new URL(value, location.origin); return !u.username && !u.password && (u.protocol === 'https:' || u.origin === location.origin) ? u.href : ''; } catch { return ''; } };
    if (Array.isArray(c.dailyGaze)) {
      const photos = c.dailyGaze.filter(p => p.visible !== false);
      const featured = photos.some(p => p.featured) ? photos.filter(p => p.featured) : photos;
      // Keep decoded images alive across CMS refreshes, including reordering.
      const existing = new Map([...parts.strip.children].map(figure => [figure.dataset.photoId, figure]));
      const set = (el, name, value) => { if (el.getAttribute(name) !== String(value)) el.setAttribute(name, value); };
      const figures = featured.slice(0,6).map((photo,i) => {
        const id=String(photo.id||photo.preview||'');
        let figure=existing.get(id); existing.delete(id);
        if(!figure){
          figure=document.createElement('figure');
          const wrap=document.createElement('div'); wrap.append(document.createElement('img'));
          figure.append(wrap,document.createElement('figcaption'));
        }
        set(figure,'data-photo-id',id);
        const img=figure.querySelector('img'), caption=figure.querySelector('figcaption');
        const variants=(photo.derivatives||[]).filter(d => safe(d.url) && Number(d.width)>0);
        set(img,'alt',photo.alt||photo.title||'The Daily Gaze photograph');
        set(img,'width',Number(photo.width)||960);set(img,'height',Number(photo.height)||1200);
        set(img,'loading','eager');set(img,'fetchpriority','low');set(img,'decoding','async');
        if(variants.length){
          set(img,'sizes','(max-width:700px) 64vw, 33vw');
          const srcset=variants.map(d=>`${safe(d.url)} ${Number(d.width)}w`).join(', ');
          const current=(img.getAttribute('srcset')||'').split(',').filter(Boolean).map(candidate=>{
            const [url,width]=candidate.trim().split(/\s+/);return `${safe(url)} ${width}`;
          }).join(', ');
          if(current!==srcset)set(img,'srcset',srcset);
        }else{img.removeAttribute('srcset');img.removeAttribute('sizes');}
        const src=safe(variants[0]?.url||photo.preview);
        if(img.src!==src)set(img,'src',src);
        const text=`${String(i+1).padStart(2,'0')} · ${photo.title||'Moment'}`;
        if(caption.textContent!==text)caption.textContent=text;
        return figure;
      });
      // Do not detach unchanged nodes. Remove unpublished photos immediately.
      for(const figure of [...parts.strip.children])if(!figures.includes(figure))figure.remove();
      figures.forEach((figure,i)=>{if(parts.strip.children[i]!==figure)parts.strip.insertBefore(figure,parts.strip.children[i]||null);}); parts.total=photos.length; lastNumber=-1;
      parts.number.textContent=String(photos.length); q(1,'.gaze-readout em').textContent=`/ ${photos.length}`;
      q(0,'.opening-metrics>span:nth-child(2) strong').textContent=String(photos.length);
    }
    if(Array.isArray(c.projects)){
      const projects=c.projects.filter(p=>p.visible!==false);
      for(const cell of parts.work){const match=projects.find(p=>safe(p.url)===cell.href);cell.hidden=!match;if(match){cell.querySelector('.work-cell-caption strong').textContent=match.title;cell.querySelector('.work-cell-caption>span').textContent=match.tags;}}
      q(0,'.opening-metrics>span:first-child strong').textContent=String(parts.work.filter(p=>!p.hidden).length);
    }
    if(Array.isArray(c.career)&&c.career.length>=parts.jobs.length){
      const jobs=c.career.slice().reverse();
      parts.jobs.forEach((el,i)=>{const job=jobs[i];el.hidden=!job;if(job){el.querySelector('small').textContent=job.year;el.querySelector('strong').textContent=job.title;el.querySelector('div>span').textContent=job.company;}});
    }
    if(c.contact){
      const email=c.contact.email;if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email||'')){const a=q(9,'a[href^="mailto:"]');a.href='mailto:'+email;a.textContent=email;}
      const phone=c.contact.whatsappSriLanka;if(/^\d{7,20}$/.test(phone||'')){const a=q(9,'a[href^="https://wa.me/"]');a.href='https://wa.me/'+phone;a.textContent=c.contact.whatsappSriLankaDisplay||phone;}
    }
    const visibility={1:'showGaze',4:'showWork',5:'showCareer',7:'showEcosystem',9:'showContact'};
    for(const [index,key] of Object.entries(visibility))scenes[index].hidden=c.settings?.[key]===false;
    available=scenes.map((_,i)=>i).filter(i=>!scenes[i].hidden);
    let offset=0; starts=durations.map((d,i)=>{const start=offset;if(available.includes(i))offset+=d;return start;});total=offset;
    labelStacks[2].forEach((label,i) => { label.textContent=timecode(i); });
    nav.forEach((b,i)=>b.hidden=!available.includes(i));menuItems.forEach((b,i)=>b.hidden=!available.includes(i));
    dirty=true; if(enabled)schedule();else measure();
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => {
    const allowed = document.documentElement.dataset.motion !== 'off' && !reduced.matches && !forced.matches && innerHeight >= 650;
    if (allowed !== enabled) configure();
    else if (!enabled || stage.clientWidth !== geo.w || stage.clientHeight !== geo.h || map.width !== Math.round(geo.w * Math.min(devicePixelRatio || 1, 2))) {
      // Mobile toolbar resizing can leave the small-viewport stage unchanged.
      // In that case retain its canvas buffers and geometry instead of reallocating.
      dirty = true; if (enabled) schedule(); else measure();
    }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; cameraLast = 0; }
    else { cameraReady = false; cameraTargetDir = 0; schedule(); }
  });
  reduced.addEventListener('change', configure); forced.addEventListener('change', configure);
  new MutationObserver(configure).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  document.fonts.ready.then(() => { dirty = true; schedule(); });
  configure();
})();
