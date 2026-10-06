(() => {
  'use strict';
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
  const names = nav.map(b => b.getAttribute('aria-label'));
  // Each chapter has time to tell its story; the reel needs several scroll beats.
  const durations = [1.6, 3.6, 1.8, .9, 2.3, 2.4, .9, 1.8, 1.4, 1.8];
  let starts = durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0));
  let total = durations.reduce((a, b) => a + b, 0);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  let available = scenes.map((_,i) => i);
  let enabled = false, initialized = false, active = -1, raf = 0, dirty = true, geo;
  let opener, savedOverflow = '', lastNumber = -1;
  let cache = new WeakMap();
  function set(el, key, value) {
    if (!el) return;
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
    signature: q(9, '.signature-stage'), lime: q(9, '.signature-lime')
  };
  const canvas = q(2, '[data-world]'), ctx = canvas.getContext('2d');
  let land = [], globeSize = 0, globePhase = -1;
  function drawWorld(phase = .4) {
    if (!ctx || !globeSize) return;
    if (Math.abs(phase - globePhase) < .006) return;
    globePhase = phase;
    const size = globeSize, r = size * .46, center = size / 2;
    const lon0 = (82 + phase * 18) * Math.PI / 180, lat0 = 15 * Math.PI / 180;
    const project = (lon, lat) => {
      const l = lon * Math.PI / 180 - lon0, a = lat * Math.PI / 180;
      return [center + r * Math.cos(a) * Math.sin(l), center - r * (Math.cos(lat0) * Math.sin(a) - Math.sin(lat0) * Math.cos(a) * Math.cos(l)), Math.sin(lat0) * Math.sin(a) + Math.cos(lat0) * Math.cos(a) * Math.cos(l)];
    };
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#111a12'; ctx.beginPath(); ctx.arc(center, center, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#45552b'; ctx.lineWidth = .6; ctx.stroke();
    // Real land coordinates from public-domain Natural Earth, projected orthographically.
    for (const [lon, lat] of land) {
      const [x, y, z] = project(lon, lat);
      if (z <= 0) continue;
      ctx.fillStyle = `rgba(197,237,35,${(.2 + z * .7).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(x, y, Math.max(.75, size / 340), 0, Math.PI * 2); ctx.fill();
    }
    for (const [lon, lat] of [[79.86, 6.93], [101.69, 3.14]]) {
      const [x, y, z] = project(lon, lat);
      if (z <= 0) continue;
      ctx.fillStyle = '#f0ece1'; ctx.strokeStyle = '#c5ed23'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
    }
  }
  fetch('/assets/data/land-points.json').then(r => r.ok ? r.json() : []).then(points => {
    land = points; globePhase = -1;
    if (!enabled || active === 2) drawWorld();
  }).catch(() => {});

  function measure() {
    const h = stage.clientHeight, w = stage.clientWidth;
    geo = { h, w, top: root.getBoundingClientRect().top + scrollY,
      reelTravel: Math.max(0, parts.strip.scrollHeight - parts.window.clientHeight) };
    if (enabled) root.style.height = `${h * (total + 1)}px`;
    globeSize = canvas.clientWidth;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(globeSize * dpr); canvas.height = Math.round(globeSize * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); globePhase = -1;
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
    root.querySelector('[data-film-label]').textContent = `${names[i].toUpperCase()} · SC ${String(i + 1).padStart(2, '0')}`;
    root.querySelector('[data-scene-status]').textContent = `${String(i + 1).padStart(2, '0')} / ${names[i].toUpperCase()}`;
  }
  function reveal(elements, t, spacing = .035) {
    elements.forEach((el, i) => {
      const progress = ease(i * spacing, .12 + i * spacing, t);
      set(el, 'opacity', progress.toFixed(3));
      set(el, 'transform', `translate3d(0,${((1 - progress) * 24).toFixed(1)}px,0)`);
    });
  }
  function sceneMotion(i, t) {
    if (i === 0) {
      const exit = ease(.5, 1, t);
      set(parts.photo, 'transform', `scale(${(1 + exit * .045).toFixed(4)})`);
      set(parts.name, 'transform', `translate3d(0,${(-exit * 20).toFixed(1)}px,0)`);
    } else if (i === 1) {
      const title = 1 - ease(.18, .29, t), reel = ease(.26, .35, t);
      set(parts.intro, 'opacity', title.toFixed(3));
      set(parts.intro, 'transform', `translate3d(0,${((1 - title) * -24).toFixed(1)}px,0)`);
      set(parts.strip, 'opacity', reel.toFixed(3));
      const travel = ease(.31, .86, t) * geo.reelTravel;
      set(parts.strip, 'transform', `translateX(-50%) translate3d(0,${((1 - reel) * 60 - travel).toFixed(1)}px,0)`);
      set(parts.readout, 'opacity', reel.toFixed(3)); set(parts.note, 'opacity', reel.toFixed(3));
      const number = parts.total;
      if (number !== lastNumber) { parts.number.textContent = String(number); lastNumber = number; }
    } else if (i === 2) drawWorld(t);
    else if (i === 4) reveal(parts.work, t);
    else if (i === 5) reveal(parts.jobs, t, .045);
    else if (i === 8) reveal(parts.answers, t, .04);
    else if (i === 9) {
      reveal(parts.credits, t, .03);
      const draw = ease(.35, .65, t);
      set(parts.signature, 'clipPath', `inset(0 ${((1 - draw) * 100).toFixed(2)}% 0 0)`);
      set(parts.signature, 'opacity', draw.toFixed(3));
      set(parts.lime, 'opacity', ease(.7, .82, t).toFixed(3));
    }
  }
  function paint() {
    const p = clamp((scrollY - geo.top) / geo.h, 0, total);
    let i = available.findLast(index => p >= starts[index]) ?? available[0];
    i = Math.max(0, i);
    const phase = clamp((p - starts[i]) / durations[i]);
    const next = available[available.indexOf(i) + 1];
    const incoming = next !== undefined ? ease(.86, 1, phase) : 0;
    setActive(incoming > .5 ? next : i);
    scenes.forEach((scene, j) => {
      set(scene, 'visibility', j === i || (j === next && incoming > 0) ? 'visible' : 'hidden');
      set(scene, 'opacity', j === i ? '1' : j === next ? incoming.toFixed(3) : '0');
    });
    sceneMotion(i, phase);
    if (incoming > 0) sceneMotion(next, 0);
    const seconds = Math.floor(starts[active] * 4);
    const stamp = `00:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}:00`;
    const time = root.querySelector('[data-film-time]');
    if (time.textContent !== stamp) time.textContent = stamp;
  }
  function frame() { raf = 0; if (!enabled || document.hidden || menu.open) return; if (dirty) measure(); paint(); }
  function schedule() { if (!raf && enabled && !document.hidden && !menu.open) raf = requestAnimationFrame(frame); }
  function goTo(i, behavior = 'smooth') {
    if (!available.includes(i)) i = available[0];
    if (!enabled) { scenes[i].scrollIntoView({ behavior: 'instant' }); return; }
    if (dirty) measure();
    const phase = i === 9 ? .84 : i === 1 ? .06 : i === 0 ? 0 : .4;
    scrollTo({ top: geo.top + (starts[i] + durations[i] * phase) * geo.h, behavior });
    schedule();
  }
  const hashScene = () => location.hash === '#contact' ? 9 : scenes.findIndex(s => s.id && '#' + s.id === location.hash);
  function configure() {
    const previous = active;
    enabled = document.documentElement.dataset.motion !== 'off' && !reduced.matches && !forced.matches && innerHeight >= 650;
    cancelAnimationFrame(raf); raf = 0;
    root.classList.toggle('is-live', enabled); root.classList.toggle('is-static', !enabled);
    cache = new WeakMap();
    scenes.forEach((s, i) => {
      s.removeAttribute('style'); s.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
      s.inert = false; s.removeAttribute('aria-hidden');
      if (enabled) s.style.zIndex = String(i + 1);
    });
    if (!enabled) root.style.removeProperty('height');
    active = -1; dirty = true; measure();
    if (enabled) {
      if (!initialized && hashScene() >= 0) goTo(hashScene(), 'instant');
      else if (initialized && previous >= 0) goTo(previous, 'instant');
      paint();
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
    const i = hash === '#contact' ? 9 : scenes.findIndex(s => s.id && '#' + s.id === hash);
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
      const figures = featured.slice(0,6).map((photo,i) => {
        const figure=document.createElement('figure'), wrap=document.createElement('div'), img=document.createElement('img'), caption=document.createElement('figcaption');
        const variants=(photo.derivatives||[]).filter(d => safe(d.url) && Number(d.width)>0);
        img.src=safe(variants[0]?.url||photo.preview); img.alt=photo.alt||photo.title||'The Daily Gaze photograph'; img.loading='lazy'; img.decoding='async';
        if(variants.length){img.srcset=variants.map(d=>`${safe(d.url)} ${Number(d.width)}w`).join(', ');img.sizes='(max-width:700px) 64vw, 33vw';}
        caption.textContent=`${String(i+1).padStart(2,'0')} · ${photo.title||'Moment'}`; wrap.append(img); figure.append(wrap,caption); return figure;
      });
      parts.strip.replaceChildren(...figures); parts.total=photos.length; lastNumber=-1;
      parts.number.textContent=String(photos.length); q(1,'.gaze-readout em').textContent=`/ ${photos.length}`;
      q(0,'.opening-metrics>span:nth-child(2) strong').textContent=String(photos.length);
    }
    if(Array.isArray(c.projects)){
      const projects=c.projects.filter(p=>p.visible!==false);
      for(const cell of parts.work){const match=projects.find(p=>safe(p.url)===cell.href);cell.hidden=!match;if(match){cell.querySelector('.work-cell-caption strong').textContent=match.title;cell.querySelector('.work-cell-caption>span').textContent=match.tags;}}
      q(0,'.opening-metrics>span:first-child strong').textContent=String(parts.work.filter(p=>!p.hidden).length);
    }
    if(Array.isArray(c.career)){
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
    nav.forEach((b,i)=>b.hidden=!available.includes(i));menuItems.forEach((b,i)=>b.hidden=!available.includes(i));
    dirty=true; if(enabled)schedule();else measure();
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => {
    const allowed = document.documentElement.dataset.motion !== 'off' && !reduced.matches && !forced.matches && innerHeight >= 650;
    if (allowed !== enabled) configure(); else { dirty = true; if (enabled) schedule(); else measure(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else schedule(); });
  reduced.addEventListener('change', configure); forced.addEventListener('change', configure);
  new MutationObserver(configure).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  document.fonts.ready.then(() => { dirty = true; schedule(); });
  configure();
})();
