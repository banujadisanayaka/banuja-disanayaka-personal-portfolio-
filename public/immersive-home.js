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
  const menu = document.querySelector('#experience-menu');
  const menuButtons = [...document.querySelectorAll('[data-menu-scene]')];
  const openMenu = root.querySelector('[data-open-scenes]');
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
    openingProof: scene.querySelector('.opening-proof'),
    gazeReel: scene.querySelector('.gaze-reel'),
    workReel: scene.querySelector('.work-reel'),
    route: scene.querySelector('.journey-route'),
    arc: scene.querySelector('.journey-arc'),
    sphere: scene.querySelector('.world-sphere'),
    contactLedger: scene.querySelector('.contact-ledger'),
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
      const opacity = clamp(1 - smooth(.2,1.0,distance));
      const enter = clamp(d,0,1);
      const leave = clamp(-d,0,1);
      const y = enter * h * .19 - leave * h * .12;
      const x = (i % 2 ? 1 : -1) * (enter * w * .055 + leave * w * .028);
      const scale = 1 - enter * .055 + leave * .065;

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
        part.openingPortrait.style.transform = `translate3d(${(-local*w*.045).toFixed(2)}px,${(-local*h*.045).toFixed(2)}px,0) scale(${(1+local*.18).toFixed(4)})`;
      }
      if (part.openingProof) {
        part.openingProof.style.opacity = (1-local*.92).toFixed(4);
        part.openingProof.style.transform = `translate3d(0,${(-local*22).toFixed(2)}px,0)`;
      }
      if (part.gazeReel) {
        const travel = (p - 1) * h * .26;
        part.gazeReel.style.transform = `translate3d(0,${(-travel).toFixed(2)}px,0) rotate(${(-1.5 + (p-1)*2.2).toFixed(2)}deg)`;
      }
      if (part.workReel) {
        const phase = p - 2;
        part.workReel.style.transform = `translate3d(0,${(-phase*h*.11).toFixed(2)}px,0) rotate(${(-5+phase*7).toFixed(2)}deg) scale(${(1+Math.max(0,phase)*.035).toFixed(4)})`;
      }
      if (part.route) {
        const phase = clamp(p - 3, -.6, .9);
        part.route.style.transform = `translate3d(0,${(-phase*h*.055).toFixed(2)}px,0)`;
      }
      if (part.arc) {
        const phase = clamp((p - 2.72) / .9, 0, 1);
        part.arc.style.transform = `rotate(-8deg) scaleX(${phase.toFixed(4)})`;
      }
      if (part.sphere) {
        const phase = p - 4;
        part.sphere.style.transform = `rotateZ(${(phase*10).toFixed(2)}deg) rotateY(${(phase*13).toFixed(2)}deg) scale(${(1+Math.max(0,phase)*.035).toFixed(4)})`;
      }
      if (part.contactLedger) {
        const phase = clamp(p - 5, -.7, .5);
        part.contactLedger.style.transform = `translate3d(0,${(-phase*h*.045).toFixed(2)}px,0)`;
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

  openMenu?.addEventListener('click', () => {
    if (!menu?.open) menu.showModal();
  });
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