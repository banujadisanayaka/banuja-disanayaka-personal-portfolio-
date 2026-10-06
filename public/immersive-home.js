(() => {
  'use strict';
  const root=document.querySelector('[data-experience]');
  if(!root) return;

  const stage=root.querySelector('.experience-stage');
  const scenes=[...root.querySelectorAll('[data-scene]')];
  const dots=[...root.querySelectorAll('[data-scene-select]')];
  const time=root.querySelector('[data-film-time]');
  const label=root.querySelector('[data-film-label]');
  const menu=document.querySelector('#experience-menu');
  const menuButtons=[...document.querySelectorAll('[data-menu-scene]')];
  const openers=[root.querySelector('[data-open-scenes]'),root.querySelector('[data-open-scenes-mini]')].filter(Boolean);
  const closer=menu?.querySelector('[data-close-scenes]');
  const utility=root.querySelector('.experience-utility');
  const motionToggle=document.querySelector('.motion-toggle');
  const names=['OPENING','CHANNELS','AUDIENCE','CRAFTSMANSHIP','WORK','PATH','CURIOSITY','VELORIA','QUESTION','CREDITS'];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const forced=matchMedia('(forced-colors: active)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};

  let enabled=false,geo=null,value=0,target=0,active=-1,raf=0,last=0,dirty=true,initialized=false;

  const parts=scenes.map(scene=>({
    scene,
    openingPhoto:scene.querySelector('.opening-photo'),
    openingName:scene.querySelector('.opening-name'),
    openingMetrics:scene.querySelector('.opening-metrics'),
    filmstrip:scene.querySelector('.filmstrip'),
    gazeCaption:scene.querySelector('.gaze-caption'),
    gazeCount:scene.querySelector('.gaze-count'),
    globe:scene.querySelector('.reach-globe'),
    reachCopy:scene.querySelector('.reach-copy'),
    reachStat:scene.querySelector('.reach-stat'),
    intertitle:scene.querySelector('.intertitle>div'),
    workWall:scene.querySelector('.work-wall'),
    workCells:[...scene.querySelectorAll('.work-cell')],
    workCaption:scene.querySelector('.work-caption'),
    journeyList:scene.querySelector('.journey-list'),
    journeyItems:[...scene.querySelectorAll('.journey-list li')],
    journeyCopy:scene.querySelector('.journey-copy'),
    veloriaOrbit:scene.querySelector('.veloria-orbit'),
    nodes:[...scene.querySelectorAll('.orbit-node')],
    veloriaCopy:scene.querySelector('.veloria-copy'),
    curiosityQ:scene.querySelector('.curiosity-question'),
    curiosityA:[...scene.querySelectorAll('.curiosity-answer span')],
    creditsTitle:scene.querySelector('.credits-title'),
    creditsRows:[...scene.querySelectorAll('.credits-list>div')],
    signature:scene.querySelector('.signature')
  }));

  function motionAllowed(){return document.documentElement.dataset.motion!=='off'&&!reduced.matches&&!forced.matches}
  function placeMotion(){if(motionToggle&&utility&&motionToggle.parentElement!==utility){utility.append(motionToggle);motionToggle.hidden=false}}

  function measure(){
    const h=stage.clientHeight,w=stage.clientWidth;
    const step=h*(w<=700?.92:1.0);
    const top=root.getBoundingClientRect().top+scrollY;
    geo={h,w,step,top};
    root.style.height=(h+step*(scenes.length-1))+'px';
    dirty=false;
  }

  function setActive(i){
    if(active===i)return;
    active=i;
    scenes.forEach((s,j)=>{const on=i===j;s.classList.toggle('is-current',on);s.setAttribute('aria-hidden',String(!on));s.inert=!on});
    dots.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
    if(label) label.textContent=`${names[i]} · SC ${String(i+1).padStart(2,'0')}`;
  }

  function set(el,prop,val){if(el)el.style[prop]=val}

  function paint(p){
    const {h,w}=geo;
    const current=clamp(Math.round(p),0,scenes.length-1);
    setActive(current);

    scenes.forEach((scene,i)=>{
      const d=i-p,dist=Math.abs(d);
      const enter=clamp(d,0,1),leave=clamp(-d,0,1);
      const opacity=clamp(1-smooth(.34,.82,dist));
      const z=-dist*100;
      const y=enter*h*.065-leave*h*.035;
      const scale=1-enter*.025+leave*.025;
      set(scene,'opacity',opacity.toFixed(4));
      set(scene,'transform',`translate3d(0,${y.toFixed(2)}px,${z.toFixed(1)}px) scale(${scale.toFixed(4)})`);
      set(scene,'zIndex',String(30-Math.round(dist*4)));

      const part=parts[i];
      const phase=p-i;

      if(i===0){
        const t=clamp(phase,0,1);
        set(part.openingPhoto,'transform',`translate3d(${(-t*w*.05).toFixed(2)}px,${(-t*h*.04).toFixed(2)}px,0) scale(${(1+t*.18).toFixed(4)})`);
        set(part.openingName,'transform',`translate3d(${(t*w*.07).toFixed(2)}px,${(-t*h*.07).toFixed(2)}px,0) scale(${(1+t*.1).toFixed(4)})`);
        set(part.openingMetrics,'opacity',(1-t*.92).toFixed(4));
      }
      if(i===1){
        set(part.filmstrip,'transform',`translate3d(0,${(-phase*h*.44).toFixed(2)}px,0) rotate(${(-1.5+phase*4).toFixed(2)}deg)`);
        set(part.gazeCaption,'transform',`translate3d(0,${(-phase*h*.055).toFixed(2)}px,0)`);
        set(part.gazeCount,'transform',`translate3d(0,${(phase*h*.035).toFixed(2)}px,0)`);
      }
      if(i===2){
        set(part.globe,'transform',`rotate(${(phase*22).toFixed(2)}deg) scale(${(.96+clamp(1-Math.abs(phase),0,1)*.04).toFixed(4)})`);
        set(part.reachCopy,'transform',`translate3d(${(-phase*w*.025).toFixed(2)}px,0,0)`);
        set(part.reachStat,'transform',`translate3d(0,${(phase*h*.035).toFixed(2)}px,0)`);
      }
      if(i===3||i===6){
        const inner=scene.firstElementChild;
        if(inner){
          const t=clamp(Math.abs(phase),0,1);
          set(inner,'transform',`scale(${(1-t*.12).toFixed(4)})`);
          set(inner,'opacity',clamp(1-t*.78).toFixed(4));
        }
      }
      if(i===4){
        set(part.workWall,'transform',`translate3d(0,${(-phase*h*.045).toFixed(2)}px,0) rotate(${(-3+phase*5).toFixed(2)}deg)`);
        part.workCells.forEach((cell,j)=>{
          const delay=j*.07;
          const reveal=clamp((phase+.72-delay)/.42,0,1);
          const exit=clamp((phase-.25-delay)/.55,0,1);
          const side=j%2?1:-1;
          set(cell,'transform',`translate3d(${(((1-reveal)*side*w*.05)-(exit*side*w*.035)).toFixed(2)}px,${((1-reveal)*h*.06-exit*h*.025).toFixed(2)}px,0) rotate(${(((1-reveal)*side*5)+(exit*side*3)).toFixed(2)}deg)`);
          set(cell,'opacity',clamp(reveal*(1-exit*.55)).toFixed(4));
        });
      }
      if(i===5){
        part.journeyItems.forEach((item,j)=>{
          const reveal=clamp((phase+.68-j*.14)/.38,0,1);
          const exit=clamp((phase-.42-j*.07)/.5,0,1);
          set(item,'opacity',clamp(reveal*(1-exit*.5)).toFixed(4));
          set(item,'transform',`translate3d(${((1-reveal)*w*.04).toFixed(2)}px,${((1-reveal)*15-exit*8).toFixed(2)}px,0)`);
        });
      }
      if(i===7){
        set(part.veloriaOrbit,'transform',`rotate(${(phase*15).toFixed(2)}deg) scale(${(.95+clamp(1-Math.abs(phase),0,1)*.05).toFixed(4)})`);
        part.nodes.forEach((n,j)=>set(n,'transform',`translate3d(${(Math.sin((j+1)*1.2+phase)*phase*w*.012).toFixed(2)}px,${(Math.cos((j+1)*1.4+phase)*phase*h*.01).toFixed(2)}px,0)`));
      }
      if(i===8){
        part.curiosityA.forEach((row,j)=>{
          const reveal=clamp((phase+.66-j*.11)/.34,0,1);
          set(row,'opacity',reveal.toFixed(4));
          set(row,'transform',`translate3d(${((1-reveal)*w*.04).toFixed(2)}px,0,0)`);
        });
      }
      if(i===9){
        part.creditsRows.forEach((row,j)=>{
          const reveal=clamp((phase+.7-j*.09)/.32,0,1);
          set(row,'opacity',reveal.toFixed(4));
          set(row,'transform',`translate3d(0,${((1-reveal)*16).toFixed(2)}px,0)`);
        });
        if(part.signature){
          const r=clamp((phase+.45)/.5,0,1);
          set(part.signature,'opacity',r.toFixed(4));
          set(part.signature,'transform',`translate3d(0,${((1-r)*30).toFixed(2)}px,0)`);
        }
      }
    });

    if(time){
      const totalSeconds=p*5.8;
      const sec=Math.floor(totalSeconds);
      const frame=Math.floor((totalSeconds-sec)*24);
      time.textContent=`00:${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}:${String(frame).padStart(2,'0')}`;
    }
  }

  function frame(now){
    raf=0;
    if(!enabled||document.hidden)return;
    if(dirty||!geo)measure();
    target=clamp((scrollY-geo.top)/geo.step,0,scenes.length-1);
    const compact=geo.w<=700;
    if(compact)value=target;
    else{
      const dt=last?Math.min((now-last)/1000,.05):1/60;
      value+=(target-value)*(1-Math.exp(-dt/.055));
    }
    last=now;
    paint(value);
    if(!compact&&Math.abs(value-target)>.0003)schedule();else last=0;
  }
  function schedule(){if(!raf&&enabled&&!document.hidden)raf=requestAnimationFrame(frame)}
  function goTo(i,behavior='smooth'){if(!geo)return;scrollTo({top:geo.top+geo.step*clamp(i,0,scenes.length-1),behavior});schedule()}

  function configure(){
    enabled=motionAllowed();
    root.classList.toggle('is-live',enabled);
    root.classList.toggle('is-static',!enabled);
    if(enabled){
      dirty=true;measure();
      const hashIndex=scenes.findIndex(s=>s.id&&'#'+s.id===location.hash);
      value=target=hashIndex>=0?hashIndex:clamp((scrollY-geo.top)/geo.step,0,scenes.length-1);
      if(hashIndex>=0&&!initialized)scrollTo({top:geo.top+geo.step*hashIndex,behavior:'instant'});
      paint(value);schedule();
    }else{
      root.style.removeProperty('height');
      scenes.forEach(s=>{s.inert=false;s.removeAttribute('aria-hidden');s.style.removeProperty('opacity');s.style.removeProperty('transform');s.style.removeProperty('z-index')});
    }
    initialized=true;
  }

  dots.forEach((b,i)=>b.addEventListener('click',()=>goTo(i)));
  menuButtons.forEach((b,i)=>b.addEventListener('click',()=>{menu?.close();requestAnimationFrame(()=>goTo(i))}));
  const showMenu=()=>{if(!menu?.open)menu.showModal()};
  openers.forEach(b=>b.addEventListener('click',showMenu));
  closer?.addEventListener('click',()=>menu?.close());
  menu?.addEventListener('click',e=>{if(e.target===menu)menu.close()});

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>{dirty=true;schedule()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else{last=0;schedule()}});
  reduced.addEventListener('change',configure);forced.addEventListener('change',configure);
  new MutationObserver(configure).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  placeMotion();
  configure();
})();