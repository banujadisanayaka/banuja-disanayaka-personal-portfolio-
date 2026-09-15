(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  if (!body || html.dataset.v11 === 'on') return;

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
  const q = (s, root = document) => root.querySelector(s);
  const addStyle = (href, marker) => {
    if (q(`link[${marker}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, '');
    document.head.append(link);
  };

  addStyle('/v11-site.css?v=1100', 'data-v11-style');
  addStyle('/v11-motion.css?v=1100', 'data-v11-motion');
  html.dataset.v11 = 'on';
  body.dataset.version = '11';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const setProfile = () => {
    const mobile = innerWidth <= 900 || coarse.matches;
    html.dataset.v11Profile = mobile ? 'mobile' : 'desktop';
  };
  setProfile();

  const sceneSpec = [
    ['#opening', 'Identity', '#e7ca88', '#6f8568', 72, 24],
    ['#approach', 'Observe · Connect · Create', '#829675', '#d6c48f', 78, 36],
    ['#work', 'Selected work', '#cfb576', '#637d68', 82, 24],
    ['#photography', 'The Daily Gaze', '#75856d', '#c7b57d', 18, 46],
    ['#about', 'The person', '#d7b67b', '#8d5846', 78, 34],
    ['#perspectives', 'Perspectives', '#aec07f', '#d5b67b', 72, 42],
    ['#experience', 'Journey', '#c5a869', '#5f7868', 24, 36],
    ['#ecosystem', 'VELORIA', '#dfc382', '#855647', 72, 46],
    ['#contact', 'Contact', '#e7ca88', '#6d8466', 82, 42]
  ];

  const scenes = sceneSpec.map(([selector, label, accent, accent2, x, y], index) => {
    const el = q(selector);
    if (!el) return null;
    el.classList.add('v11-scene');
    el.dataset.v11Index = String(index);
    el.style.setProperty('--v11-accent', accent);
    if (!el.querySelector(':scope > .v11-scene-edge.top')) {
      const top = document.createElement('span');
      const bottom = document.createElement('span');
      top.className = 'v11-scene-edge top'; bottom.className = 'v11-scene-edge bottom';
      top.setAttribute('aria-hidden', 'true'); bottom.setAttribute('aria-hidden', 'true');
      el.append(top, bottom);
    }
    return {el, label, accent, accent2, x, y, top:0, bottom:0, height:0, local:0};
  }).filter(Boolean);

  if (!scenes.length) return;

  const ambient = document.createElement('div');
  ambient.className = 'v11-ambient';
  ambient.setAttribute('aria-hidden', 'true');
  ambient.innerHTML = '<span class="v11-ambient-orbit"></span><span class="v11-ambient-glint"></span><span class="v11-ambient-label"><span>V11 / SCENE</span><strong></strong></span>';
  body.prepend(ambient);
  const ambientLabel = q('.v11-ambient-label strong', ambient);

  let geometryDirty = true;
  let raf = 0;
  let current = -1;
  let viewportWidth = innerWidth;

  const measure = () => {
    const y = scrollY;
    scenes.forEach(scene => {
      const rect = scene.el.getBoundingClientRect();
      scene.top = rect.top + y;
      scene.height = Math.max(rect.height, 1);
      scene.bottom = scene.top + scene.height;
    });
    geometryDirty = false;
  };

  const activate = index => {
    if (index === current) return;
    current = index;
    scenes.forEach((scene, i) => scene.el.dataset.v11Active = String(i === index));
    const scene = scenes[index];
    if (!scene) return;
    html.dataset.v11Scene = String(index);
    html.style.setProperty('--v11-accent', scene.accent);
    html.style.setProperty('--v11-accent-2', scene.accent2);
    html.style.setProperty('--v11-x', `${scene.x}%`);
    html.style.setProperty('--v11-y', `${scene.y}%`);
    html.style.setProperty('--v11-glint-x', `${scene.x}%`);
    html.style.setProperty('--v11-glint-y', `${scene.y}%`);
    if (ambientLabel) ambientLabel.textContent = `${String(index + 1).padStart(2,'0')} · ${scene.label}`;
  };

  const paint = () => {
    raf = 0;
    if (document.hidden) return;
    if (geometryDirty) measure();

    const y = scrollY;
    const vh = Math.max(innerHeight, 1);
    const center = y + vh * .5;
    let best = 0;
    let bestDistance = Infinity;

    scenes.forEach((scene, index) => {
      const inside = center >= scene.top && center <= scene.bottom;
      let distance;
      if (inside) distance = 0;
      else if (center < scene.top) distance = (scene.top - center) / vh;
      else distance = (center - scene.bottom) / vh;

      const absolute = Math.abs(distance);
      if (absolute < bestDistance) { bestDistance = absolute; best = index; }
      const local = clamp((center - scene.top) / scene.height, 0, 1);
      scene.local = local;

      if (absolute > 1.45 && !inside) {
        if (scene.el.dataset.v11Near !== 'false') scene.el.dataset.v11Near = 'false';
        return;
      }

      scene.el.dataset.v11Near = 'true';
      const focus = inside ? 1 : clamp(1 - absolute * .72, .2, 1);
      const drift = inside ? (local - .5) * (scene.el.id === 'approach' ? 0 : 20) : clamp(distance * 52, -58, 58);
      const scale = .965 + focus * .035;
      const alpha = .54 + focus * .46;
      const tilt = clamp((inside ? local - .5 : distance) * .7, -.55, .55);

      scene.el.style.setProperty('--v11-focus', focus.toFixed(3));
      scene.el.style.setProperty('--v11-shift', `${drift.toFixed(2)}px`);
      scene.el.style.setProperty('--v11-scale', scale.toFixed(4));
      scene.el.style.setProperty('--v11-alpha', alpha.toFixed(3));
      scene.el.style.setProperty('--v11-tilt', `${tilt.toFixed(3)}deg`);
      scene.el.style.setProperty('--v11-edge', String(clamp(.12 + (1 - focus) * .45, .12, .5)));
    });

    activate(best);
    const active = scenes[best];
    const local = active?.local ?? .5;
    html.style.setProperty('--v11-ambient-x', `${((local - .5) * -28).toFixed(2)}px`);
    html.style.setProperty('--v11-ambient-y', `${((local - .5) * 20).toFixed(2)}px`);
    html.style.setProperty('--v11-orbit-x', `${((local - .5) * -18).toFixed(2)}px`);
    html.style.setProperty('--v11-orbit-y', `${((local - .5) * 24).toFixed(2)}px`);
    html.style.setProperty('--v11-orbit-r', `${(best * 7 + local * 8).toFixed(2)}deg`);
    html.style.setProperty('--v11-grid-y', `${(-y % 44).toFixed(2)}px`);
  };

  const requestPaint = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(paint);
  };
  const invalidate = () => { geometryDirty = true; requestPaint(); };

  addEventListener('scroll', requestPaint, {passive:true});
  addEventListener('resize', () => {
    const widthChanged = innerWidth !== viewportWidth;
    viewportWidth = innerWidth;
    if (widthChanged) setProfile();
    invalidate();
  }, {passive:true});
  addEventListener('orientationchange', invalidate, {passive:true});
  document.addEventListener('load', invalidate, {capture:true,passive:true});
  document.fonts?.ready.then(invalidate);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(invalidate);
    scenes.forEach(scene => ro.observe(scene.el));
  }

  // Keep the canonical/search identity aligned with the current public portfolio domain.
  const publicOrigin = 'https://banujadisanayaka.netlify.app';
  const canonicalUrl = publicOrigin + location.pathname;
  q('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  q('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
  const oldOrigin = 'https://banuja-personal-log.netlify.app';
  ['meta[property="og:image"]','meta[name="twitter:image"]'].forEach(selector => {
    const node = q(selector);
    if (node?.content?.startsWith(oldOrigin)) node.content = node.content.replace(oldOrigin, publicOrigin);
  });
  q('script[type="application/ld+json"]')?.textContent && (() => {
    const node = q('script[type="application/ld+json"]');
    node.textContent = node.textContent.replaceAll(oldOrigin, publicOrigin);
  })();

  // Motion-off must remain a true accessibility/performance switch.
  const syncMotion = () => {
    const enabled = html.dataset.motion === 'on' && !reduced.matches;
    html.dataset.v11Motion = enabled ? 'on' : 'off';
    if (!enabled) {
      scenes.forEach(scene => {
        scene.el.style.setProperty('--v11-shift','0px');
        scene.el.style.setProperty('--v11-scale','1');
        scene.el.style.setProperty('--v11-alpha','1');
      });
    } else requestPaint();
  };
  new MutationObserver(syncMotion).observe(html,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener?.('change', syncMotion);

  syncMotion();
  invalidate();
})();
