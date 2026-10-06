(() => {
  'use strict';

  const root = document.querySelector('[data-experience]');
  if (!root) return;

  const html = document.documentElement;
  const stage = root.querySelector('.experience-stage');
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const sceneButtons = [...root.querySelectorAll('[data-scene-select]')];
  const progress = root.querySelector('[data-timeline-progress]');
  const counter = root.querySelector('[data-scene-count]');
  const timelineCaption = root.querySelector('[data-timeline-caption]');
  const sceneNames = ['Opening','The Gaze','Work','Journey','VELORIA','Contact'];
  const menu = document.querySelector('#experience-menu');
  const menuButtons = [...document.querySelectorAll('[data-menu-scene]')];
  const openMenu = root.querySelector('[data-open-scenes]');
  const openMenuMini = root.querySelector('[data-open-scenes-mini]');
  const closeMenu = menu?.querySelector('[data-close-scenes]');
  const utility = root.querySelector('.experience-utility');
  const motionToggle = document.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
  const smooth = (a,b,v) => {
    const t = clamp((v-a)/(b-a));
    return t*t*(3-2*t);
  };

  const parts = scenes.map(scene => ({
    scene,
    title: scene.querySelector('.act-heading,.opening-title,.contact-frame'),
    openingPortrait: scene.querySelector('.opening-portrait'),
    portraitMain: scene.querySelector('.portrait-main'),
    portraitDetail: scene.querySelector('.portrait-detail'),
    openingProof: scene.querySelector('.opening-proof'),
    gazeReel: scene.querySelector('.gaze-reel'),
    gazeOrbit: scene.querySelector('.gaze-orbit'),
    workReel: scene.querySelector('.work-reel'),
    workFrames: [...scene.querySelectorAll('.work-frame')],
    shutterBars: [...scene.querySelectorAll('.work-shutter i')],
    route: scene.querySelector('.journey-route'),
    routeItems: [...scene.querySelectorAll('.journey-route li')],
    journeyMap: scene.querySelector('.journey-map'),
    arc: scene.querySelector('.journey-arc'),
    sphere: scene.querySelector('.world-sphere'),
    worldNodes: [...scene.querySelectorAll('.world-node')],
    signalBars: [...scene.querySelectorAll('.world-signal span')],
    contactLedger: scene.querySelector('.contact-ledger'),
    contactRows: [...scene.querySelectorAll('.contact-ledger a')],
    contactSignoff: scene.querySelector('.contact-signoff'),
    stat: scene.querySelector('.scene-stat')
  }));

  let enabled = false;
  let geometry = null;
  let dirty = true;
  let raf = 0;
  let value = 0;
  let target = 0;
  let last = 0;
  let active = -1;
  let initialized = false;

  function motionAllowed() {
    return html.dataset.motion !== 'off' && !reduced.matches && !forced.matches;
  }

  function placeMotionToggle() {
    if (!motionToggle || !utility) return;
    if (motionToggle.parentElement !== utility) utility.append(motionToggle);
    motionToggle.hidden = false;
  }

  function setInteractive(index) {
    if (active === index) return;
    active = index;
    scenes.forEach((scene,i) => {
      const on = i === index;
      scene.classList.toggle('is-current', on);
      scene.setAttribute('aria-hidden', String(!on));
      scene.inert = !on;
    });
    sceneButtons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === index)));
    if (counter) counter.textContent = String(index + 1).padStart(2,'0');
    if (timelineCaption) timelineCaption.textContent = `${sceneNames[index].toUpperCase()} / SC ${String(index + 1).padStart(2,'0')}`;
    root.dataset.scene = String(index);
  }

  function measure() {
    const h = stage.clientHeight;
    const w = stage.clientWidth;
    const step = h * (w <= 700 ? 1.02 : 1.08);
    const top = root.getBoundingClientRect().top + scrollY;
    const runway = h * .22;
    geometry = {h,w,step,top,runway};
    root.style.height = (h + step * (scenes.length - 1) + runway) + 'px';
    dirty = false;
  }

  function paint(p) {
    const {h,w} = geometry;
    const current = Math.min(scenes.length - 1, Math.max(0, Math.round(p)));
    setInteractive(current);

    scenes.forEach((scene,i) => {
      const d = i - p;
      const distance = Math.abs(d);
      const opacity = clamp(1 - smooth(.28,.86,distance));
      const enter = clamp(d,0,1);
      const leave = clamp(-d,0,1);
      const y = enter * h * .12 - leave * h * .07;
      const x = (i % 2 ? 1 : -1) * (enter * w * .028 + leave * w * .018);
      const scale = 1 - enter * .035 + leave * .035;

      scene.style.opacity = opacity.toFixed(4);
      scene.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${(-distance*90).toFixed(2)}px) scale(${scale.toFixed(4)})`;
      scene.style.zIndex = String(20 - Math.round(distance * 4));

      const part = parts[i];
      const local = clamp(p - i, 0, 1);
      const before = clamp(i - p, 0, 1);

      if (part.title) {
        const titleY = -local * h * .075 + before * h * .04;
        const titleScale = 1 + local * .075 - before * .03;
        part.title.style.transform = `translate3d(0,${titleY.toFixed(2)}px,0) scale(${titleScale.toFixed(4)})`;
        part.title.style.opacity = clamp(opacity * (1 - local * .24)).toFixed(4);
      }

      if (part.openingPortrait) {
        part.openingPortrait.style.transform = `translate3d(${(-local*w*.025).toFixed(2)}px,${(-local*h*.02).toFixed(2)}px,0) scale(${(1+local*.08).toFixed(4)})`;
      }
      if (part.portraitMain) {
        part.portraitMain.style.transform = `translate3d(${(-local*w*.075).toFixed(2)}px,${(-local*h*.015).toFixed(2)}px,0) scale(${(1+local*.16).toFixed(4)})`;
        part.portraitMain.style.opacity = clamp(1-local*.62).toFixed(4);
      }
      if (part.portraitDetail) {
        part.portraitDetail.style.transform = `translate3d(${(local*w*.115).toFixed(2)}px,${(-local*h*.045).toFixed(2)}px,0) scale(${(1+local*.28).toFixed(4)})`;
        part.portraitDetail.style.opacity = clamp(1-local*.38).toFixed(4);
      }
      if (part.openingProof) {
        part.openingProof.style.opacity = (1-local*.98).toFixed(4);
        part.openingProof.style.transform = `translate3d(0,${(-local*28).toFixed(2)}px,0)`;
      }
      if (part.gazeReel) {
        const phase = clamp(p - 1,-.72,.82);
        const travel = phase * h * .48;
        part.gazeReel.style.transform = `translate3d(${(phase*w*.018).toFixed(2)}px,${(-travel).toFixed(2)}px,0) rotate(${(-2.5 + phase*5.5).toFixed(2)}deg) scale(${(1+Math.max(0,phase)*.05).toFixed(4)})`;
      }
      if (part.gazeOrbit) {
        const phase = clamp(p - 1,-.8,.9);
        part.gazeOrbit.style.transform = `rotate(${(-8+phase*34).toFixed(2)}deg) scale(${(.9+clamp(1-Math.abs(phase),0,1)*.1).toFixed(4)})`;
        part.gazeOrbit.style.opacity = clamp(1-Math.abs(phase)*.72).toFixed(4);
      }
      if (part.workReel) {
        const phase = clamp(p - 2,-.85,.9);
        part.workReel.style.transform = `translate3d(0,${(-phase*h*.055).toFixed(2)}px,0) rotate(${(-5+phase*5).toFixed(2)}deg) scale(${(.96+clamp(1-Math.abs(phase),0,1)*.04).toFixed(4)})`;
        part.workFrames.forEach((frame,index) => {
          const delay = index * .075;
          const enterFrame = clamp((phase + .72 - delay)/.48,0,1);
          const leaveFrame = clamp((phase - .20 - delay)/.55,0,1);
          const side = index % 2 ? 1 : -1;
          const tx = (1-enterFrame)*side*w*.09 - leaveFrame*side*w*.055;
          const ty = (1-enterFrame)*h*.07 - leaveFrame*h*.035;
          const rz = (1-enterFrame)*side*7 + leaveFrame*side*4;
          frame.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${rz.toFixed(2)}deg)`;
          frame.style.opacity = clamp(enterFrame*(1-leaveFrame*.7)).toFixed(4);
        });
        part.shutterBars.forEach((bar,index) => {
          const wave = .16 + .84*Math.abs(Math.sin((index+1)*.74 + phase*2.6));
          bar.style.transform = `scaleY(${wave.toFixed(4)})`;
        });
      }
      if (part.route) {
        const phase = clamp(p - 3,-.75,.9);
        part.route.style.transform = `translate3d(0,${(-phase*h*.032).toFixed(2)}px,0)`;
        part.routeItems.forEach((item,index) => {
          const reveal = clamp((phase + .68 - index*.16)/.42,0,1);
          const exit = clamp((phase - .38 - index*.08)/.5,0,1);
          item.style.opacity = clamp(reveal*(1-exit*.55)).toFixed(4);
          item.style.transform = `translate3d(${((1-reveal)*w*.05).toFixed(2)}px,${((1-reveal)*18-exit*10).toFixed(2)}px,0)`;
        });
      }
      if (part.journeyMap) {
        const phase = clamp(p-3,-.8,.9);
        part.journeyMap.style.transform = `rotate(${(-8+phase*10).toFixed(2)}deg) scale(${(.94+clamp(1-Math.abs(phase),0,1)*.06).toFixed(4)})`;
      }
      if (part.arc) {
        const phase = clamp((p - 2.72) / .82, 0, 1);
        part.arc.style.transform = `rotate(-8deg) scaleX(${phase.toFixed(4)})`;
      }
      if (part.sphere) {
        const phase = clamp(p - 4,-.9,.9);
        part.sphere.style.transform = `rotateZ(${(phase*18).toFixed(2)}deg) rotateY(${(phase*22).toFixed(2)}deg) scale(${(.94+clamp(1-Math.abs(phase),0,1)*.06).toFixed(4)})`;
        part.worldNodes.forEach((node,index) => {
          const orbit = phase*(index%2?1:-1);
          node.style.transform = `translate3d(${(Math.sin((index+1)*1.7+phase)*orbit*w*.016).toFixed(2)}px,${(Math.cos((index+1)*1.2+phase)*orbit*h*.012).toFixed(2)}px,0)`;
        });
        part.signalBars.forEach((bar,index) => {
          const pulse = .28 + .72*Math.abs(Math.sin((index+1)*1.11 + phase*3.2));
          bar.style.transform = `scaleY(${pulse.toFixed(4)})`;
        });
      }
      if (part.contactLedger) {
        const phase = clamp(p - 5,-.75,.5);
        part.contactLedger.style.transform = `translate3d(0,${(-phase*h*.03).toFixed(2)}px,0)`;
        part.contactRows.forEach((row,index) => {
          const reveal = clamp((phase + .72 - index*.11)/.34,0,1);
          row.style.opacity = reveal.toFixed(4);
          row.style.transform = `translate3d(${((1-reveal)*w*.055).toFixed(2)}px,0,0)`;
        });
      }
      if (part.contactSignoff) {
        const phase = clamp((p - 4.65) / .55, 0, 1);
        part.contactSignoff.style.opacity = phase.toFixed(4);
        part.contactSignoff.style.transform = `translate3d(0,${((1-phase)*35).toFixed(2)}px,0) scale(${(.92+phase*.08).toFixed(4)})`;
      }
      if (part.stat) {
        const phase = clamp(Math.abs(p-i),0,1);
        part.stat.style.transform = `translate3d(0,${(phase*24).toFixed(2)}px,0)`;
      }
    });

    if (progress) progress.style.transform = `scaleX(${(p/(scenes.length-1)).toFixed(5)})`;
  }

  function frame(now) {
    raf = 0;
    if (!enabled || document.hidden) return;
    if (dirty || !geometry) measure();

    target = clamp((scrollY - geometry.top) / geometry.step, 0, scenes.length - 1);
    const compact = geometry.w <= 700;
    if (compact) {
      value = target;
    } else {
      const dt = last ? Math.min((now-last)/1000,.05) : 1/60;
      value += (target-value) * (1-Math.exp(-dt/.06));
    }
    last = now;
    paint(value);

    if (!compact && Math.abs(value-target) > .00025) schedule();
    else last = 0;
  }

  function schedule() {
    if (!raf && enabled && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function goTo(index, behavior='smooth') {
    if (!enabled || !geometry) return;
    const destination = geometry.top + geometry.step * clamp(index,0,scenes.length-1);
    scrollTo({top:destination,behavior});
    schedule();
  }

  function configure() {
    const next = motionAllowed();
    if (next === enabled && initialized) {
      dirty = true;
      schedule();
      return;
    }

    enabled = next;
    root.classList.toggle('is-live', enabled);
    root.classList.toggle('is-static', !enabled);

    if (enabled) {
      scenes.forEach(scene => { scene.inert = true; });
      dirty = true;
      measure();
      const hashIndex = scenes.findIndex(scene => scene.id && '#'+scene.id === location.hash);
      value = target = hashIndex >= 0 ? hashIndex : clamp((scrollY-geometry.top)/geometry.step,0,scenes.length-1);
      if (hashIndex >= 0 && !initialized) scrollTo({top:geometry.top+geometry.step*hashIndex,behavior:'instant'});
      paint(value);
      schedule();
    } else {
      root.style.removeProperty('height');
      scenes.forEach(scene => {
        scene.inert = false;
        scene.removeAttribute('aria-hidden');
        scene.style.removeProperty('opacity');
        scene.style.removeProperty('transform');
        scene.style.removeProperty('z-index');
      });
    }
    initialized = true;
  }

  sceneButtons.forEach((button,i) => button.addEventListener('click', () => goTo(i)));
  menuButtons.forEach((button,i) => button.addEventListener('click', () => {
    menu?.close();
    requestAnimationFrame(() => goTo(i));
  }));

  const showMenu = () => { if (!menu?.open) menu.showModal(); };
  openMenu?.addEventListener('click', showMenu);
  openMenuMini?.addEventListener('click', showMenu);
  closeMenu?.addEventListener('click', () => menu?.close());
  menu?.addEventListener('click', event => { if (event.target === menu) menu.close(); });

  document.addEventListener('keydown', event => {
    if (!enabled || menu?.open || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest('input,textarea,select,[contenteditable],button,a')) return;
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault(); goTo(Math.min(scenes.length-1, active+1));
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault(); goTo(Math.max(0, active-1));
    }
  });

  addEventListener('scroll', schedule, {passive:true});
  let width = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== width) width = innerWidth;
    dirty = true;
    schedule();
  }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { last=0; schedule(); }
  });

  reduced.addEventListener('change', configure);
  forced.addEventListener('change', configure);
  new MutationObserver(configure).observe(html,{attributes:true,attributeFilter:['data-motion']});
  document.fonts?.ready.then(() => { dirty=true; schedule(); });

  placeMotionToggle();
  configure();
})();