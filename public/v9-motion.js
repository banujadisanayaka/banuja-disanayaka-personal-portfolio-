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
  // The cinematic homepage owns its progress rail; its legacy bar is hidden.
  const readingBar = q('[data-experience]') ? null : q('.reading-progress span');
  const chapterLinks = qa('.chapter-nav a');
  const chapters = chapterLinks.map(a => q(a.hash)).filter(Boolean);
  const hasScrollEffects = !!(hero || statement || readingBar || chapters.length);
  let scrollGeometry = null, scrollLayoutDirty = true, chapterIndex = -1, lastRead = '';
  function paintScroll() {
    scrollFrame = 0;
    if (document.hidden) return;
    const y = scrollY;
    if (scrollLayoutDirty) {
      const heroRect = hero?.getBoundingClientRect(), statementRect = statement?.getBoundingClientRect();
      scrollGeometry = {
        distance:html.scrollHeight-html.clientHeight,
        hero:heroRect ? {top:heroRect.top+y,height:heroRect.height} : null,
        statement:statementRect ? {top:statementRect.top+y,height:statementRect.height} : null,
        chapters:chapters.map(el => el.getBoundingClientRect().top+y)
      };
      scrollLayoutDirty = false;
    }
    const {distance,hero:heroBox,statement:statementBox} = scrollGeometry;
    const progress = distance > 0 ? clamp(y/distance,0,1).toFixed(4) : '0';
    // An inherited custom property on <html> invalidated styles across the
    // entire photographic archive on every scroll frame. Update only the bar.
    if (readingBar && progress !== lastRead) { readingBar.style.transform = `scaleX(${progress})`; lastRead = progress; }
    if (enabled && heroBox && y < heroBox.top+heroBox.height) {
      const p = clamp((y-heroBox.top)/Math.max(heroBox.height,1),0,1);
      hero.style.setProperty('--scene-turn',(p*65).toFixed(1)+'deg');
      hero.style.setProperty('--scene-scale',(1+p*.13).toFixed(3));
      hero.style.setProperty('--scene-y',(-p*65).toFixed(1)+'px');
    }
    if (enabled && statementBox && statementBox.top < y+innerHeight && statementBox.top+statementBox.height > y) {
      // Scope the transform to the one visible line, not the section subtree.
      const p = clamp((y+innerHeight-statementBox.top)/(innerHeight+statementBox.height),0,1);
      q('p',statement).style.transform = `translate3d(0,${(p*50-25).toFixed(1)}px,0)`;
    }
    let index = 0;
    scrollGeometry.chapters.forEach((top,i) => { if (top <= y+150) index = i; });
    if (chapters.length && index !== chapterIndex) {
      chapterIndex = index;
      chapterLinks.forEach((a,i) => { if (i === index) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
    }
  }
  const requestScroll = () => { if (hasScrollEffects && !scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(paintScroll); };
  const invalidateScroll = () => { scrollLayoutDirty = true; requestScroll(); };
  window.addEventListener('scroll', () => { if (active) resetDepth(); requestScroll(); }, {passive:true});
  window.addEventListener('resize', () => { resetDepth(); invalidateScroll(); }, {passive:true});
  if (hasScrollEffects) {
    if ('ResizeObserver' in window) new ResizeObserver(invalidateScroll).observe(document.body);
    document.addEventListener('load',invalidateScroll,{capture:true,passive:true});
    document.fonts?.ready.then(invalidateScroll);
  }

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
    setupExplorers(); invalidateScroll();
  }

  function applyPreference() {
    enabled = preference !== 'reduced' && !reduced.matches && !forced.matches;
    html.dataset.motion = enabled ? 'on' : 'off';
    if (toggle) {
      toggle.hidden = false;
      toggle.setAttribute('aria-pressed',String(enabled));
      q('[data-motion-label]',toggle).textContent = enabled ? 'Motion effects on' : 'Motion effects off';
      // The operating-system preference always wins. The state remains readable.
      toggle.setAttribute('aria-disabled',String(reduced.matches || forced.matches));
    }
    qa('.touch-hint').forEach(el => { el.hidden = !enabled; });
    if (!enabled) { if (statement) q('p',statement).style.removeProperty('transform'); resetDepth(); animations.forEach(a => a.cancel()); animations.clear(); }
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
