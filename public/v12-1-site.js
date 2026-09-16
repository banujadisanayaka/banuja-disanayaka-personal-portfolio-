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

  addStyle('/v12-1-site.css?v=1211', 'data-v121-style');
  addStyle('/v12-1-compositions.css?v=1212', 'data-v121-compositions');
  html.dataset.v121 = 'on';
  body.dataset.v121Experience = 'cinematic-system';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const coarse = matchMedia('(pointer: coarse)');

  const sceneSpec = [
    {selector:'#opening', kind:'identity', label:'Identity', word:'BANUJA', tone:'#d8bb79', tone2:'#6f8169', x:76, y:24},
    {selector:'#work', kind:'work', label:'Selected work', word:'MAKE', tone:'#cda967', tone2:'#8a6654', x:72, y:30},
    {selector:'#photography', kind:'photography', label:'The Daily Gaze', word:'GAZE', tone:'#9aaa80', tone2:'#d5bd7c', x:22, y:48},
    {selector:'#about', kind:'about', label:'The person', word:'HUMAN', tone:'#d7bf8a', tone2:'#865c4c', x:76, y:40},
    {selector:'#perspectives', kind:'perspectives', label:'Perspectives', word:'THINK', tone:'#acbd83', tone2:'#d0a86e', x:28, y:42},
    {selector:'#experience', kind:'experience', label:'Journey', word:'MOVE', tone:'#c9a96b', tone2:'#657a68', x:72, y:34},
    {selector:'#ecosystem', kind:'ecosystem', label:'VELORIA', word:'EVOLVE', tone:'#dcc17f', tone2:'#80584d', x:28, y:48},
    {selector:'#contact', kind:'contact', label:'Contact', word:'HELLO', tone:'#e0c684', tone2:'#71836d', x:76, y:46}
  ];

  const scenes = sceneSpec.map((spec, index) => {
    const el = q(spec.selector);
    if (!el) return null;
    el.classList.add('v121-chapter');
    el.dataset.v121Index = String(index);
    el.dataset.v121Kind = spec.kind;
    el.dataset.v121Label = spec.label;
    el.style.setProperty('--v121-tone', spec.tone);
    el.style.setProperty('--v121-tone-2', spec.tone2);
    return {...spec, el, index};
  }).filter(Boolean);

  if (!scenes.length) return;

  const stage = document.createElement('div');
  stage.className = 'v121-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = [
    '<span class="v121-stage__wash"></span>',
    '<div class="v121-stage__media-deck"></div>',
    '<span class="v121-stage__grain"></span>',
    '<span class="v121-stage__frame"></span>',
    '<span class="v121-stage__beam"></span>',
    '<span class="v121-stage__word"></span>',
    '<span class="v121-stage__rule"></span>',
    '<span class="v121-stage__meta"><i class="v121-stage__index"></i><b class="v121-stage__label"></b></span>'
  ].join('');
  body.prepend(stage);

  const stageWord = q('.v121-stage__word', stage);
  const stageIndex = q('.v121-stage__index', stage);
  const stageLabel = q('.v121-stage__label', stage);
  const mediaDeck = q('.v121-stage__media-deck', stage);
  const mediaObservers = [];

  const mediaSpec = [
    {
      kind:'identity',
      selector:'#opening .hero-visual img, #opening .portrait img, #opening img',
      fallback:'/assets/v9/portrait-960.webp',
      label:'Banuja Disanayaka portrait'
    },
    {
      kind:'photography',
      selector:'#photography .gaze-feature img, #photography .photo-grid img, #photography img',
      fallback:'/assets/v9/gaze-168481-4a4cb46cbf2a.webp',
      label:'The Daily Gaze featured photograph'
    },
    {
      kind:'about',
      selector:'#about .about-visual img, #about img',
      fallback:'/assets/v9/about-960.webp',
      label:'Banuja Disanayaka design portrait'
    }
  ];

  const mirrorImage = (source, target, fallback) => {
    const src = source?.getAttribute('src') || fallback;
    const srcset = source?.getAttribute('srcset');
    const sizes = source?.getAttribute('sizes');
    if (src) target.setAttribute('src', src);
    if (srcset) target.setAttribute('srcset', srcset); else target.removeAttribute('srcset');
    if (sizes) target.setAttribute('sizes', sizes); else target.removeAttribute('sizes');
  };

  mediaSpec.forEach(({kind, selector, fallback, label}) => {
    const source = q(selector);
    const figure = document.createElement('figure');
    figure.className = 'v121-stage__media';
    figure.dataset.v121Media = kind;
    figure.innerHTML = '<span class="v121-stage__media-edge"></span>';

    const image = document.createElement('img');
    image.className = 'v121-stage__image';
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    image.setAttribute('aria-label', label);
    mirrorImage(source, image, fallback);
    figure.prepend(image);
    mediaDeck.append(figure);

    if (source) {
      const observer = new MutationObserver(() => mirrorImage(source, image, fallback));
      observer.observe(source, {attributes:true, attributeFilter:['src','srcset','sizes']});
      mediaObservers.push(observer);
    }
  });

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
    version: '12.1-art-direction-2',
    scenes: scenes.length,
    mediaPlanes: mediaSpec.length,
    scrollListener: false,
    geometryReadsOnScroll: false,
    activation: 'IntersectionObserver',
    motion: 'CSS compositor ambience + live-image scene planes + fixed composition planes',
    semanticBase: body.dataset.version || 'unknown'
  });
})();