(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  if (!body || html.dataset.v12 === 'on') return;

  const q = (selector, root = document) => root.querySelector(selector);
  const addStyle = (href, marker) => {
    if (q(`link[${marker}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, '');
    document.head.append(link);
  };

  addStyle('/v12-site.css?v=1201', 'data-v12-style');
  html.dataset.v12 = 'on';
  body.dataset.v12Experience = 'cinematic-rebuild';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const coarse = matchMedia('(pointer: coarse)');

  const sceneSpec = [
    ['#opening', 'identity', 'Identity', '#e7ca88', '#6f8568', 76, 22],
    ['#work', 'work', 'Selected work', '#cfb576', '#637d68', 78, 28],
    ['#photography', 'photography', 'The Daily Gaze', '#75856d', '#c7b57d', 20, 48],
    ['#about', 'about', 'The person', '#d7b67b', '#8d5846', 74, 38],
    ['#perspectives', 'perspectives', 'Perspectives', '#aec07f', '#d5b67b', 26, 42],
    ['#experience', 'experience', 'Journey', '#c5a869', '#5f7868', 74, 32],
    ['#ecosystem', 'ecosystem', 'VELORIA', '#dfc382', '#855647', 28, 46],
    ['#contact', 'contact', 'Contact', '#e7ca88', '#6d8466', 78, 44]
  ];

  const scenes = sceneSpec.map(([selector, kind, label, tone, tone2, x, y], index) => {
    const el = q(selector);
    if (!el) return null;
    el.classList.add('v12-scene');
    el.dataset.v12Index = String(index);
    el.dataset.v12Kind = kind;
    el.dataset.v12Label = label;
    el.style.setProperty('--v12-scene-tone', tone);
    el.style.setProperty('--v12-scene-tone-2', tone2);
    return {el, kind, label, tone, tone2, x, y, index};
  }).filter(Boolean);

  if (!scenes.length) return;

  const world = document.createElement('div');
  world.className = 'v12-world';
  world.setAttribute('aria-hidden', 'true');
  world.innerHTML = [
    '<span class="v12-world-grid"></span>',
    '<span class="v12-world-orbit"></span>',
    '<span class="v12-world-glow"></span>',
    '<span class="v12-world-edge"></span>',
    '<span class="v12-world-label"><small>V12 / CINEMATIC EXHIBITION</small><strong></strong></span>'
  ].join('');
  body.prepend(world);

  const worldLabel = q('.v12-world-label strong', world);
  const ratios = new Map(scenes.map(scene => [scene.index, 0]));
  let activeIndex = -1;
  let pointerRaf = 0;
  let pointerX = 0;
  let pointerY = 0;

  const setActive = index => {
    if (index === activeIndex || !scenes[index]) return;
    const previous = scenes[activeIndex];
    const current = scenes[index];

    if (previous) previous.el.dataset.v12Active = 'false';
    current.el.dataset.v12Active = 'true';
    activeIndex = index;

    world.dataset.v12Scene = String(index);
    world.dataset.v12Kind = current.kind;
    world.style.setProperty('--v12-tone', current.tone);
    world.style.setProperty('--v12-tone-2', current.tone2);
    world.style.setProperty('--v12-origin-x', `${current.x}%`);
    world.style.setProperty('--v12-origin-y', `${current.y}%`);
    if (worldLabel) worldLabel.textContent = `${String(index + 1).padStart(2, '0')} · ${current.label}`;
  };

  const chooseActive = () => {
    let bestIndex = activeIndex >= 0 ? activeIndex : 0;
    let bestRatio = -1;
    ratios.forEach((ratio, index) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIndex = index;
      }
    });
    if (bestRatio > 0) setActive(bestIndex);
  };

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const index = Number(entry.target.dataset.v12Index);
      ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
    }
    chooseActive();
  }, {
    root: null,
    rootMargin: '-24% 0px -24% 0px',
    threshold: [0, 0.15, 0.3, 0.5, 0.7]
  });

  scenes.forEach(scene => observer.observe(scene.el));
  setActive(0);

  const syncProfile = () => {
    const profile = reduced.matches ? 'reduced' : (compact.matches || coarse.matches ? 'mobile' : 'desktop');
    if (html.dataset.v12Profile !== profile) html.dataset.v12Profile = profile;
  };

  const syncMotion = () => {
    const enabled = html.dataset.motion === 'on' && !reduced.matches;
    const value = enabled ? 'on' : 'off';
    if (html.dataset.v12Motion !== value) html.dataset.v12Motion = value;
  };

  const paintPointer = () => {
    pointerRaf = 0;
    if (html.dataset.v12Profile !== 'desktop' || html.dataset.v12Motion !== 'on') return;
    world.style.setProperty('--v12-pointer-x', `${pointerX.toFixed(2)}px`);
    world.style.setProperty('--v12-pointer-y', `${pointerY.toFixed(2)}px`);
  };

  addEventListener('pointermove', event => {
    if (html.dataset.v12Profile !== 'desktop' || html.dataset.v12Motion !== 'on') return;
    pointerX = ((event.clientX / Math.max(innerWidth, 1)) - 0.5) * 22;
    pointerY = ((event.clientY / Math.max(innerHeight, 1)) - 0.5) * 16;
    if (!pointerRaf) pointerRaf = requestAnimationFrame(paintPointer);
  }, {passive:true});

  compact.addEventListener?.('change', syncProfile);
  coarse.addEventListener?.('change', syncProfile);
  reduced.addEventListener?.('change', () => {
    syncProfile();
    syncMotion();
  });
  new MutationObserver(syncMotion).observe(html, {attributes:true, attributeFilter:['data-motion']});

  const publicOrigin = 'https://banujadisanayaka.netlify.app';
  const oldOrigin = 'https://banuja-personal-log.netlify.app';
  const canonicalUrl = publicOrigin + location.pathname;
  q('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  q('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
  ['meta[property="og:image"]', 'meta[name="twitter:image"]'].forEach(selector => {
    const node = q(selector);
    if (node?.content?.startsWith(oldOrigin)) node.content = node.content.replace(oldOrigin, publicOrigin);
  });
  const ld = q('script[type="application/ld+json"]');
  if (ld?.textContent?.includes(oldOrigin)) ld.textContent = ld.textContent.replaceAll(oldOrigin, publicOrigin);

  syncProfile();
  syncMotion();

  window.__V12_DIAGNOSTICS__ = Object.freeze({
    version: '12-rebuild-2',
    scenes: scenes.length,
    scrollListener: false,
    geometryReadsOnScroll: false,
    activation: 'IntersectionObserver',
    motion: 'CSS view timeline + isolated pointer ambient',
    semanticBase: body.dataset.version || 'unknown'
  });
})();
