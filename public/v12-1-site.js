(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  if (!body || html.dataset.v121 === 'on') return;

  const q = (selector, root = document) => root.querySelector(selector);
  const addStyle = (href, marker) => {
    if (q(`link[${marker}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, '');
    document.head.append(link);
  };

  addStyle('/v12-1-site.css?v=1210', 'data-v121-style');
  html.dataset.v121 = 'on';
  body.dataset.v121Experience = 'cinematic-system';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const coarse = matchMedia('(pointer: coarse)');

  const sceneSpec = [
    ['#opening', 'identity', 'Identity', 'BANUJA', '#d8bb79', '#6f8169', 76, 24],
    ['#work', 'work', 'Selected work', 'MAKE', '#cda967', '#8a6654', 72, 30],
    ['#photography', 'photography', 'The Daily Gaze', 'GAZE', '#9aaa80', '#d5bd7c', 22, 48],
    ['#about', 'about', 'The person', 'HUMAN', '#d7bf8a', '#865c4c', 76, 40],
    ['#perspectives', 'perspectives', 'Perspectives', 'THINK', '#acbd83', '#d0a86e', 28, 42],
    ['#experience', 'experience', 'Journey', 'MOVE', '#c9a96b', '#657a68', 72, 34],
    ['#ecosystem', 'ecosystem', 'VELORIA', 'EVOLVE', '#dcc17f', '#80584d', 28, 48],
    ['#contact', 'contact', 'Contact', 'HELLO', '#e0c684', '#71836d', 76, 46]
  ];

  const scenes = sceneSpec.map(([selector, kind, label, word, tone, tone2, x, y], index) => {
    const el = q(selector);
    if (!el) return null;
    el.classList.add('v121-chapter');
    el.dataset.v121Index = String(index);
    el.dataset.v121Kind = kind;
    el.dataset.v121Label = label;
    el.style.setProperty('--v121-tone', tone);
    el.style.setProperty('--v121-tone-2', tone2);
    return {el, kind, label, word, tone, tone2, x, y, index};
  }).filter(Boolean);

  if (!scenes.length) return;

  const stage = document.createElement('div');
  stage.className = 'v121-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = [
    '<span class="v121-stage__wash"></span>',
    '<span class="v121-stage__grain"></span>',
    '<span class="v121-stage__frame"></span>',
    '<span class="v121-stage__beam"></span>',
    '<span class="v121-stage__word"></span>',
    '<span class="v121-stage__meta"><i class="v121-stage__index"></i><b class="v121-stage__label"></b></span>'
  ].join('');
  body.prepend(stage);

  const stageWord = q('.v121-stage__word', stage);
  const stageIndex = q('.v121-stage__index', stage);
  const stageLabel = q('.v121-stage__label', stage);
  const ratios = new Map(scenes.map(scene => [scene.index, 0]));
  let activeIndex = -1;
  let pointerRaf = 0;
  let pointerX = 0;
  let pointerY = 0;

  const setActive = index => {
    if (index === activeIndex || !scenes[index]) return;
    const previous = scenes[activeIndex];
    const current = scenes[index];
    if (previous) previous.el.removeAttribute('data-v121-active');
    current.el.dataset.v121Active = 'true';
    activeIndex = index;

    stage.dataset.v121Scene = String(index);
    stage.dataset.v121Kind = current.kind;
    stage.style.setProperty('--v121-accent', current.tone);
    stage.style.setProperty('--v121-accent-2', current.tone2);
    stage.style.setProperty('--v121-origin-x', `${current.x}%`);
    stage.style.setProperty('--v121-origin-y', `${current.y}%`);
    if (stageWord) stageWord.textContent = current.word;
    if (stageIndex) stageIndex.textContent = String(index + 1).padStart(2, '0');
    if (stageLabel) stageLabel.textContent = current.label;
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
      const index = Number(entry.target.dataset.v121Index);
      ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
    }
    chooseActive();
  }, {
    root: null,
    rootMargin: '-22% 0px -22% 0px',
    threshold: [0, 0.1, 0.25, 0.45, 0.65]
  });

  scenes.forEach(scene => observer.observe(scene.el));
  setActive(0);

  const syncProfile = () => {
    const profile = reduced.matches ? 'reduced' : (compact.matches || coarse.matches ? 'mobile' : 'desktop');
    if (html.dataset.v121Profile !== profile) html.dataset.v121Profile = profile;
  };

  const syncMotion = () => {
    const enabled = html.dataset.motion === 'on' && !reduced.matches;
    const value = enabled ? 'on' : 'off';
    if (html.dataset.v121Motion !== value) html.dataset.v121Motion = value;
  };

  const paintPointer = () => {
    pointerRaf = 0;
    if (html.dataset.v121Profile !== 'desktop' || html.dataset.v121Motion !== 'on') return;
    stage.style.setProperty('--v121-pointer-x', `${pointerX.toFixed(2)}px`);
    stage.style.setProperty('--v121-pointer-y', `${pointerY.toFixed(2)}px`);
  };

  addEventListener('pointermove', event => {
    if (html.dataset.v121Profile !== 'desktop' || html.dataset.v121Motion !== 'on') return;
    pointerX = ((event.clientX / Math.max(innerWidth, 1)) - 0.5) * 18;
    pointerY = ((event.clientY / Math.max(innerHeight, 1)) - 0.5) * 12;
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
  const retiredOrigin = 'https://banuja-personal-log.netlify.app';
  const canonicalUrl = publicOrigin + location.pathname;
  q('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  q('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
  ['meta[property="og:image"]', 'meta[name="twitter:image"]'].forEach(selector => {
    const node = q(selector);
    if (node?.content?.startsWith(retiredOrigin)) node.content = node.content.replace(retiredOrigin, publicOrigin);
  });
  const ld = q('script[type="application/ld+json"]');
  if (ld?.textContent?.includes(retiredOrigin)) ld.textContent = ld.textContent.replaceAll(retiredOrigin, publicOrigin);

  syncProfile();
  syncMotion();

  window.__V121_DIAGNOSTICS__ = Object.freeze({
    version: '12.1-foundation-1',
    scenes: scenes.length,
    scrollListener: false,
    geometryReadsOnScroll: false,
    activation: 'IntersectionObserver',
    motion: 'CSS compositor ambience + scene-state transitions',
    semanticBase: body.dataset.version || 'unknown'
  });
})();
