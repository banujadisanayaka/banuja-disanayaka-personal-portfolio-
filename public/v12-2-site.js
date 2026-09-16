(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  if (!body || html.dataset.v122 === 'on') return;

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const addStyle = (href, marker) => {
    if (q(`link[${marker}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, '');
    document.head.append(link);
  };

  addStyle('/v12-2-site.css?v=1220', 'data-v122-style');
  html.dataset.v122 = 'on';
  body.dataset.v122Experience = 'immersive-worlds';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const coarse = matchMedia('(pointer: coarse)');
  const desktopProfile = () => !reduced.matches && !compact.matches && !coarse.matches;

  const sceneSpec = [
    {selector:'#opening', kind:'identity', label:'Identity', word:'BANUJA', kicker:'Independent mind · connected disciplines', accent:'#d8bb79', accent2:'#6f8169', fallbacks:['/assets/v9/portrait-960.webp','/assets/v9/about-960.webp','/assets/v9/gaze-168481-4a4cb46cbf2a.webp']},
    {selector:'#work', kind:'work', label:'Selected work', word:'BUILD', kicker:'Ideas made useful', accent:'#cda967', accent2:'#8a6654', fallbacks:['/assets/v9/daily-gaze-suite.webp','/assets/v9/about-960.webp','/assets/v9/gaze-168490-f15a98f3b3b0.webp']},
    {selector:'#photography', kind:'photography', label:'The Daily Gaze', word:'GAZE', kicker:'Photography as observation', accent:'#9aaa80', accent2:'#d5bd7c', fallbacks:['/assets/v9/gaze-168481-4a4cb46cbf2a.webp','/assets/v9/gaze-168480-245211822b4e.webp','/assets/v9/gaze-171008-0c0c005948ab.webp']},
    {selector:'#about', kind:'about', label:'The person', word:'HUMAN', kicker:'Process begins with people', accent:'#d7bf8a', accent2:'#865c4c', fallbacks:['/assets/v9/about-960.webp','/assets/v9/portrait-960.webp','/assets/v9/gaze-171171-ea2da9c57045.webp']},
    {selector:'#perspectives', kind:'perspectives', label:'Perspectives', word:'THINK', kicker:'Observe · connect · create', accent:'#acbd83', accent2:'#d0a86e', fallbacks:['/assets/v9/gaze-171724-00e645291003.webp','/assets/v9/about-960.webp','/assets/v9/gaze-177228-c1f0821034e3.webp']},
    {selector:'#experience', kind:'experience', label:'Journey', word:'MOVE', kicker:'Operations · design · technology', accent:'#c9a96b', accent2:'#657a68', fallbacks:['/assets/v9/portrait-960.webp','/assets/v9/daily-gaze-suite.webp','/assets/v9/gaze-168974-aec1f17729bc.webp']},
    {selector:'#ecosystem', kind:'ecosystem', label:'VELORIA', word:'EVOLVE', kicker:'An ecosystem of ideas', accent:'#dcc17f', accent2:'#80584d', fallbacks:['/assets/v9/banuja-logo-gold.webp','/assets/v9/daily-gaze-suite.webp','/assets/v9/gaze-171717-eee836bd55bb.webp']},
    {selector:'#contact', kind:'contact', label:'Contact', word:'HELLO', kicker:'Start a conversation', accent:'#e0c684', accent2:'#71836d', fallbacks:['/assets/v9/portrait-960.webp','/assets/v9/banuja-logo-gold.webp','/assets/v9/gaze-168481-4a4cb46cbf2a.webp']}
  ];

  const scenes = sceneSpec.map((spec, index) => {
    const el = q(spec.selector);
    if (!el) return null;
    el.classList.add('v122-chapter');
    el.dataset.v122Index = String(index);
    el.dataset.v122Kind = spec.kind;
    return {...spec, el, index, metric:{top:0, height:1, center:0}, world:null};
  }).filter(Boolean);

  if (!scenes.length) return;

  const stage = document.createElement('div');
  stage.className = 'v122-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `
    <div class="v122-stage__worlds"></div>
    <div class="v122-stage__veil"></div>
    <div class="v122-stage__grain"></div>
    <div class="v122-stage__frame"></div>
    <div class="v122-stage__hud">
      <span class="v122-stage__counter">01</span>
      <span class="v122-stage__label">Identity</span>
      <span class="v122-stage__line"></span>
      <span class="v122-stage__progress"><i></i></span>
    </div>
    <div class="v122-stage__scroll">SCROLL TO TRANSFORM <span>↓</span></div>
  `;
  body.prepend(stage);

  const worldsRoot = q('.v122-stage__worlds', stage);
  const counter = q('.v122-stage__counter', stage);
  const label = q('.v122-stage__label', stage);
  const progressBar = q('.v122-stage__progress i', stage);
  const sourceObservers = [];

  const uniqueImages = scene => {
    const seen = new Set();
    return qa('img', scene.el).filter(img => {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (!src || seen.has(src)) return false;
      seen.add(src);
      return true;
    }).slice(0, 3);
  };

  const mirror = (source, target, fallback) => {
    const src = source?.getAttribute('src') || fallback;
    const srcset = source?.getAttribute('srcset');
    const sizes = source?.getAttribute('sizes');
    if (src) target.setAttribute('src', src);
    if (srcset) target.setAttribute('srcset', srcset); else target.removeAttribute('srcset');
    if (sizes) target.setAttribute('sizes', sizes); else target.removeAttribute('sizes');
  };

  scenes.forEach(scene => {
    const world = document.createElement('article');
    world.className = 'v122-world';
    world.dataset.v122Kind = scene.kind;
    world.dataset.v122Index = String(scene.index);
    world.style.setProperty('--v122-accent', scene.accent);
    world.style.setProperty('--v122-accent-2', scene.accent2);
    world.innerHTML = `
      <span class="v122-world__atmosphere"></span>
      <span class="v122-world__orb"></span>
      <span class="v122-world__plate v122-world__plate--a"></span>
      <span class="v122-world__plate v122-world__plate--b"></span>
      <div class="v122-world__media-deck"></div>
      <span class="v122-world__word">${scene.word}</span>
      <span class="v122-world__outline">${scene.word}</span>
      <span class="v122-world__kicker">${scene.kicker}</span>
    `;

    const mediaDeck = q('.v122-world__media-deck', world);
    const sources = uniqueImages(scene);
    scene.fallbacks.slice(0, 3).forEach((fallback, mediaIndex) => {
      const figure = document.createElement('figure');
      figure.className = `v122-world__media v122-world__media--${String.fromCharCode(97 + mediaIndex)}`;
      figure.innerHTML = '<span class="v122-world__media-edge"></span>';
      const image = document.createElement('img');
      image.className = 'v122-world__image';
      image.alt = '';
      image.decoding = 'async';
      image.loading = mediaIndex === 0 && scene.index === 0 ? 'eager' : 'lazy';
      image.draggable = false;
      const source = sources[mediaIndex] || null;
      mirror(source, image, fallback);
      figure.prepend(image);
      mediaDeck.append(figure);

      if (source) {
        const observer = new MutationObserver(() => mirror(source, image, fallback));
        observer.observe(source, {attributes:true, attributeFilter:['src','srcset','sizes']});
        sourceObservers.push(observer);
      }
    });

    worldsRoot.append(world);
    scene.world = world;
  });

  let activeIndex = -1;
  let scrollRaf = 0;
  let pointerRaf = 0;
  let metricsRaf = 0;
  let pointerX = 0;
  let pointerY = 0;
  let lightweightObserver = null;

  const setStageActive = index => {
    if (!scenes[index] || index === activeIndex) return;
    scenes[activeIndex]?.el.removeAttribute('data-v122-active');
    scenes[index].el.dataset.v122Active = 'true';
    activeIndex = index;
    stage.dataset.v122Active = String(index);
    stage.dataset.v122Kind = scenes[index].kind;
    stage.style.setProperty('--v122-accent', scenes[index].accent);
    stage.style.setProperty('--v122-accent-2', scenes[index].accent2);
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    if (label) label.textContent = scenes[index].label;
  };

  const syncMetrics = () => {
    metricsRaf = 0;
    const pageY = scrollY;
    scenes.forEach(scene => {
      const rect = scene.el.getBoundingClientRect();
      const top = rect.top + pageY;
      const height = Math.max(rect.height, innerHeight * 0.85, 1);
      scene.metric = {top, height, center: top + height / 2};
    });
    if (desktopProfile()) scheduleScrollPaint();
  };

  const scheduleMetrics = () => {
    if (!metricsRaf) metricsRaf = requestAnimationFrame(syncMetrics);
  };

  const paintWorlds = () => {
    scrollRaf = 0;
    if (!desktopProfile()) return;

    const viewportCenter = scrollY + innerHeight * 0.5;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    scenes.forEach(scene => {
      const {center, height} = scene.metric;
      const denominator = Math.max(height * 0.92, innerHeight * 0.96, 1);
      const signed = clamp((viewportCenter - center) / denominator, -1.6, 1.6);
      const distance = Math.abs(viewportCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = scene.index;
      }

      const presence = clamp(1 - Math.abs(signed) * 0.92, 0, 1);
      const easedPresence = presence * presence * (3 - 2 * presence);
      const x = signed * -7.5;
      const y = signed * -10.5;
      const scale = 1 - Math.min(Math.abs(signed), 1) * 0.055;

      scene.world.style.setProperty('--v122-presence', easedPresence.toFixed(4));
      scene.world.style.setProperty('--v122-shift-x', `${x.toFixed(3)}vw`);
      scene.world.style.setProperty('--v122-shift-y', `${y.toFixed(3)}vh`);
      scene.world.style.setProperty('--v122-scale', scale.toFixed(4));
      scene.world.style.zIndex = String(100 - Math.round(Math.abs(signed) * 10));
    });

    setStageActive(nearestIndex);
    const first = scenes[0].metric.center;
    const last = scenes.at(-1).metric.center;
    const overall = clamp((viewportCenter - first) / Math.max(last - first, 1), 0, 1);
    if (progressBar) progressBar.style.transform = `scaleX(${overall.toFixed(4)})`;
  };

  const scheduleScrollPaint = () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(paintWorlds);
  };

  const paintPointer = () => {
    pointerRaf = 0;
    if (!desktopProfile() || html.dataset.motion !== 'on') return;
    stage.style.setProperty('--v122-pointer-x', `${pointerX.toFixed(2)}px`);
    stage.style.setProperty('--v122-pointer-y', `${pointerY.toFixed(2)}px`);
  };

  const onPointerMove = event => {
    if (!desktopProfile() || html.dataset.motion !== 'on') return;
    pointerX = ((event.clientX / Math.max(innerWidth, 1)) - 0.5) * 24;
    pointerY = ((event.clientY / Math.max(innerHeight, 1)) - 0.5) * 18;
    if (!pointerRaf) pointerRaf = requestAnimationFrame(paintPointer);
  };

  const setupLightweight = () => {
    lightweightObserver?.disconnect();
    lightweightObserver = null;
    scenes.forEach(scene => {
      scene.el.removeAttribute('data-v122-active');
      scene.world.style.removeProperty('--v122-presence');
      scene.world.style.removeProperty('--v122-shift-x');
      scene.world.style.removeProperty('--v122-shift-y');
      scene.world.style.removeProperty('--v122-scale');
    });

    if (desktopProfile()) {
      html.dataset.v122Profile = 'desktop';
      scheduleMetrics();
      scheduleScrollPaint();
      return;
    }

    html.dataset.v122Profile = reduced.matches ? 'reduced' : 'mobile';
    lightweightObserver = new IntersectionObserver(entries => {
      let best = null;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
      });
      if (!best) return;
      const index = Number(best.target.dataset.v122Index);
      scenes.forEach(scene => scene.world.style.setProperty('--v122-presence', scene.index === index ? '1' : '0'));
      setStageActive(index);
      if (progressBar) progressBar.style.transform = `scaleX(${index / Math.max(scenes.length - 1, 1)})`;
    }, {rootMargin:'-22% 0px -22% 0px', threshold:[0.05,0.25,0.5,0.75]});
    scenes.forEach(scene => lightweightObserver.observe(scene.el));
    scenes.forEach(scene => scene.world.style.setProperty('--v122-presence', scene.index === 0 ? '1' : '0'));
    activeIndex = -1;
    setStageActive(0);
  };

  addEventListener('scroll', scheduleScrollPaint, {passive:true});
  addEventListener('pointermove', onPointerMove, {passive:true});
  addEventListener('resize', scheduleMetrics, {passive:true});
  compact.addEventListener?.('change', setupLightweight);
  coarse.addEventListener?.('change', setupLightweight);
  reduced.addEventListener?.('change', setupLightweight);

  const resizeObserver = new ResizeObserver(scheduleMetrics);
  scenes.forEach(scene => resizeObserver.observe(scene.el));

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

  setupLightweight();
  scheduleMetrics();

  window.__V122_DIAGNOSTICS__ = Object.freeze({
    version:'12.2-immersive-worlds-1',
    scenes:scenes.length,
    worlds:scenes.length,
    maxMediaPlanesPerWorld:3,
    architecture:'fixed multi-world stage with continuous cross-scene transforms',
    desktopActivation:'cached geometry + passive scroll + requestAnimationFrame',
    lightweightActivation:'IntersectionObserver',
    geometryReadsInScrollHandler:false,
    layoutReadsPerAnimationFrame:0,
    pointerPaint:'requestAnimationFrame',
    semanticBase:body.dataset.version || 'unknown'
  });
})();