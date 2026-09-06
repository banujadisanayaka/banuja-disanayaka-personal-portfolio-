(() => {
  'use strict';
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const toggle = q('.motion-toggle');
  const animations = new Set();
  let preference = 'full';
  try { preference = sessionStorage.getItem('bd-motion') || 'full'; } catch { /* Optional preference storage. */ }
  let enabled = false;
  let active = null, bounds = null, pointerId = null, point = null, pointerFrame = 0, scrollFrame = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

  function animate(el, frames, options = {}) {
    if (!enabled || document.hidden || !el?.animate) return;
    const animation = el.animate(frames, {duration:650, easing:'cubic-bezier(.16,1,.3,1)', ...options});
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }

  function resetDepth() {
    cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    if (active) {
      active.classList.remove('depth-active');
      active.style.removeProperty('--depth-x');
      active.style.removeProperty('--depth-y');
    }
    active = null; bounds = null; point = null; pointerId = null;
  }

  function paintDepth() {
    pointerFrame = 0;
    if (!enabled || !active?.isConnected || !bounds || !point || document.hidden) return;
    const x = clamp((point.x - bounds.left) / bounds.width, 0, 1);
    const y = clamp((point.y - bounds.top) / bounds.height, 0, 1);
    active.style.setProperty('--depth-x', ((.5 - y) * 8).toFixed(2) + 'deg');
    active.style.setProperty('--depth-y', ((x - .5) * 12).toFixed(2) + 'deg');
    active.style.setProperty('--touch-x', (x * 100).toFixed(1) + '%');
    active.style.setProperty('--touch-y', (y * 100).toFixed(1) + '%');
    active.classList.add('depth-active');
  }

  function startDepth(event) {
    if (!enabled || !event.isPrimary || (event.type === 'pointerdown' && event.button > 0)) return;
    const el = event.target.closest('[data-depth]');
    if (!el || (active === el && pointerId === event.pointerId)) return;
    resetDepth(); active = el; pointerId = event.pointerId;
    // Read geometry once per interaction. Scrolling and resizing invalidate it.
    bounds = el.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return resetDepth();
    point = {x:event.clientX, y:event.clientY};
    pointerFrame = requestAnimationFrame(paintDepth);
  }

  document.addEventListener('pointerover', e => { if (e.pointerType !== 'touch') startDepth(e); }, {passive:true});
  document.addEventListener('pointerdown', startDepth, {passive:true});
  document.addEventListener('pointermove', e => {
    if (!enabled || !active || e.pointerId !== pointerId) return;
    point = {x:e.clientX, y:e.clientY};
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintDepth);
  }, {passive:true});
  document.addEventListener('pointerout', e => { if (active && !active.contains(e.relatedTarget)) resetDepth(); }, {passive:true});
  document.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') resetDepth(); }, {passive:true});
  document.addEventListener('pointercancel', resetDepth, {passive:true});

  const hero = q('[data-hero-scene]');
  const statement = q('.story-statement');
  const chapterLinks = qa('.chapter-nav a');
  const chapters = chapterLinks.map(a => q(a.hash)).filter(Boolean);
  function paintScroll() {
    scrollFrame = 0;
    if (document.hidden) return;
    const distance = html.scrollHeight - html.clientHeight;
    html.style.setProperty('--read-progress', distance > 0 ? clamp(scrollY / distance, 0, 1).toFixed(4) : '0');
    if (enabled && hero) {
      const r = hero.getBoundingClientRect();
      const progress = clamp(-r.top / Math.max(r.height, 1), 0, 1);
      hero.style.setProperty('--scene-turn', (progress * 65).toFixed(1) + 'deg');
      hero.style.setProperty('--scene-scale', (1 + progress * .13).toFixed(3));
      hero.style.setProperty('--scene-y', (-progress * 65).toFixed(1) + 'px');
    }
    if (enabled && statement) {
      const r = statement.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) statement.style.setProperty('--statement-y', (clamp((innerHeight-r.top)/(innerHeight+r.height),0,1)*90-45).toFixed(1)+'px');
    }
    if (chapters.length) {
      let index = 0;
      chapters.forEach((el,i) => { if (el.getBoundingClientRect().top <= 150) index = i; });
      chapterLinks.forEach((a,i) => { if (i === index) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
    }
  }
  const requestScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScroll); };
  window.addEventListener('scroll', () => { resetDepth(); requestScroll(); }, {passive:true});
  window.addEventListener('resize', () => { resetDepth(); requestScroll(); }, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(requestScroll).observe(document.body);

  const seen = new WeakSet();
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      revealObserver.unobserve(entry.target);
      if (seen.has(entry.target)) continue;
      seen.add(entry.target);
      animate(entry.target, [{opacity:.3, translate:'0 35px'}, {opacity:1, translate:'0 0'}]);
    }
  }, {threshold:.08}) : null;

  const initializedExplorers = new WeakSet();
  function setupExplorers() {
    qa('[data-explorer]').forEach(explorer => {
      if (initializedExplorers.has(explorer)) return;
      const controls = q('.explorer-controls', explorer);
      const buttons = qa('[data-select]', explorer);
      const panels = qa('[data-panel]', explorer);
      if (!controls || !buttons.length || buttons.length !== panels.length) return;
      initializedExplorers.add(explorer);
      function select(index, motion = true) {
        buttons.forEach((b,i) => b.setAttribute('aria-pressed', String(i === index)));
        panels.forEach((panel,i) => { panel.hidden = i !== index; });
        if (motion) {
          animate(panels[index], [{opacity:.2,translate:'0 24px'},{opacity:1,translate:'0 0'}], {duration:500});
          qa('.workflow-signal i', panels[index]).forEach((bar,i) => animate(bar, [{scale:'1 .2'},{scale:'1 1'}], {duration:500,delay:i*55}));
        }
        requestScroll();
      }
      buttons.forEach((button,i) => {
        button.addEventListener('click', () => select(i));
        button.addEventListener('keydown', e => {
          let next = i;
          if (e.key === 'ArrowRight') next = (i + 1) % buttons.length;
          else if (e.key === 'ArrowLeft') next = (i - 1 + buttons.length) % buttons.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = buttons.length - 1;
          else return;
          e.preventDefault(); select(next); buttons[next].focus();
        });
      });
      const anchored = panels.findIndex(panel => '#' + panel.id === location.hash);
      select(anchored < 0 ? 0 : anchored, false); controls.hidden = false;
      window.addEventListener('hashchange', () => {
        const index = panels.findIndex(panel => '#' + panel.id === location.hash);
        if (index >= 0) select(index);
      });
    });
  }

  function observeContent() {
    if (revealObserver) qa('[data-reveal],.section-heading,.featured-photos .photo-tile,.archive-grid .photo-tile,.biography-grid>div,.career-list li').forEach(el => {
      if (!seen.has(el)) revealObserver.observe(el);
    });
    setupExplorers(); requestScroll();
  }

  function applyPreference() {
    enabled = preference !== 'reduced' && !reduced.matches && !forced.matches;
    html.dataset.motion = enabled ? 'on' : 'off';
    if (toggle) {
      toggle.hidden = false;
      toggle.setAttribute('aria-pressed',String(enabled));
      q('[data-motion-label]',toggle).textContent = enabled ? 'Motion on' : 'Motion off';
      // The operating-system preference always wins. The state remains readable.
      toggle.setAttribute('aria-disabled',String(reduced.matches || forced.matches));
    }
    qa('.touch-hint').forEach(el => { el.hidden = !enabled; });
    if (!enabled) { resetDepth(); animations.forEach(a => a.cancel()); animations.clear(); }
    requestScroll();
  }
  toggle?.addEventListener('click', () => {
    if (reduced.matches || forced.matches) return;
    preference = enabled ? 'reduced' : 'full';
    try { sessionStorage.setItem('bd-motion',preference); } catch { /* Storage is optional. */ }
    applyPreference();
  });
  reduced.addEventListener('change',applyPreference);
  forced.addEventListener('change',applyPreference);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resetDepth(); cancelAnimationFrame(scrollFrame); scrollFrame = 0; animations.forEach(a => a.cancel()); animations.clear(); }
    else requestScroll();
  });
  window.addEventListener('pagehide',resetDepth);
  window.addEventListener('pageshow',requestScroll);
  document.addEventListener('portfolio:content', observeContent);
  document.addEventListener('portfolio:filter', () => {
    animate(q('.archive-grid'), [{opacity:.35,translate:'0 15px'},{opacity:1,translate:'0 0'}], {duration:400});
    observeContent();
  });
  q('#lightbox-image')?.addEventListener('load', e => {
    if (q('#lightbox')?.open) animate(e.target,[{opacity:.3,scale:'.985'},{opacity:1,scale:'1'}],{duration:350});
  });

  applyPreference(); observeContent();
  qa('.hero-copy>*,.case-hero>h1,.about-hero h1,.gallery-heading h1').forEach((el,i) => animate(el,[{opacity:.2,translate:'0 28px'},{opacity:1,translate:'0 0'}],{duration:850,delay:Math.min(i*60,240)}));
})();
