(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  if (!body || html.dataset.v12 === 'on') return;

  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const coarse = matchMedia('(pointer: coarse)');
  const isShortLandscape = () => innerWidth > innerHeight && innerHeight <= 500 && innerWidth <= 900;

  const addStyle = (href, marker) => {
    if (q(`link[${marker}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, '');
    document.head.append(link);
  };

  addStyle('/v12-site.css?v=1200', 'data-v12-style');
  addStyle('/v12-motion.css?v=1200', 'data-v12-motion');
  html.dataset.v12 = 'on';
  body.dataset.version = '12';

  const sceneSpec = [
    {id:'opening', label:'Identity', short:'Start', tone:'#d9c487', tone2:'#607665', bg:'#111915'},
    {id:'work', label:'Selected work', short:'Work', tone:'#d6b975', tone2:'#73866d', bg:'#0d1412'},
    {id:'photography', label:'The Daily Gaze', short:'Gaze', tone:'#75856f', tone2:'#c8b986', bg:'#e6e3d6'},
    {id:'about', label:'The person', short:'About', tone:'#d3aa78', tone2:'#6d4237', bg:'#4a3028'},
    {id:'perspectives', label:'Perspectives', short:'Lens', tone:'#a9ba83', tone2:'#d2bd80', bg:'#dce1d2'},
    {id:'experience', label:'Experience', short:'Path', tone:'#bd9f62', tone2:'#627769', bg:'#ece6d4'},
    {id:'ecosystem', label:'VELORIA', short:'Vision', tone:'#d9bd7d', tone2:'#775046', bg:'#151815'},
    {id:'contact', label:'Contact', short:'Next', tone:'#d8bc7b', tone2:'#637968', bg:'#e6dec6'}
  ];

  const scenes = sceneSpec.map((spec, index) => {
    const el = document.getElementById(spec.id);
    if (!el) return null;
    el.classList.add('v12-scene');
    el.dataset.v12Scene = String(index);
    el.style.setProperty('--v12-tone', spec.tone);
    el.style.setProperty('--v12-tone-2', spec.tone2);
    el.style.setProperty('--v12-bg', spec.bg);
    if (!q(':scope > .v12-scene-decor', el)) {
      const decor = document.createElement('div');
      decor.className = 'v12-scene-decor';
      decor.setAttribute('aria-hidden','true');
      decor.innerHTML = '<span></span><span></span><span></span>';
      el.prepend(decor);
    }
    const heading = q('h1,h2', el);
    if (heading && !q('.v12-ghost-title', el)) {
      const ghost = document.createElement('span');
      ghost.className = 'v12-ghost-title';
      ghost.setAttribute('aria-hidden','true');
      ghost.textContent = spec.label;
      el.prepend(ghost);
    }
    return {...spec, el, index, top:0, height:1, bottom:1, local:0, distance:99};
  }).filter(Boolean);

  if (!scenes.length) return;

  const world = document.createElement('div');
  world.className = 'v12-world';
  world.setAttribute('aria-hidden','true');
  world.innerHTML = `
    <div class="v12-world-wash"></div>
    <div class="v12-world-grid"></div>
    <div class="v12-world-orbit"><i></i><i></i><i></i></div>
    <div class="v12-world-thread"><i></i></div>
    <div class="v12-world-aperture"><i></i><i></i></div>
    <div class="v12-world-grain"></div>
    <div class="v12-world-caption"><span>01</span><strong>Identity</strong><i></i></div>
  `;
  body.prepend(world);

  const chapterNav = document.createElement('nav');
  chapterNav.className = 'v12-chapter-nav';
  chapterNav.id = 'v12-chapter-nav';
  chapterNav.setAttribute('aria-label','Portfolio scenes');
  chapterNav.innerHTML = scenes.map((scene, i) => `<a href="#${scene.id}" data-v12-jump="${scene.id}" aria-label="${String(i+1).padStart(2,'0')}: ${scene.label}"${i===0?' aria-current="location"':''}><span>${String(i+1).padStart(2,'0')}</span><strong>${scene.short}</strong><i></i></a>`).join('');
  body.append(chapterNav);

  const chapterToggle = document.createElement('button');
  chapterToggle.type = 'button';
  chapterToggle.className = 'v12-chapter-toggle';
  chapterToggle.setAttribute('aria-label','Open portfolio scene navigation');
  chapterToggle.setAttribute('aria-controls',chapterNav.id);
  chapterToggle.setAttribute('aria-expanded','false');
  chapterToggle.innerHTML = '<span aria-hidden="true">SC</span><i aria-hidden="true"></i>';
  body.append(chapterToggle);

  let compactNavOpen = false;
  const setCompactNavOpen = (open, {restoreFocus=false} = {}) => {
    const compact = isShortLandscape();
    compactNavOpen = compact && !!open;
    chapterNav.dataset.open = String(compactNavOpen);
    chapterToggle.setAttribute('aria-expanded',String(compactNavOpen));
    chapterToggle.setAttribute('aria-label',compactNavOpen ? 'Close portfolio scene navigation' : 'Open portfolio scene navigation');
    if (compact) {
      chapterNav.toggleAttribute('inert',!compactNavOpen);
      chapterNav.setAttribute('aria-hidden',String(!compactNavOpen));
    } else {
      chapterNav.removeAttribute('inert');
      chapterNav.removeAttribute('aria-hidden');
    }
    if (restoreFocus) chapterToggle.focus({preventScroll:true});
  };
  const syncCompactNav = () => {
    const compact = isShortLandscape();
    html.dataset.v12CompactNav = compact ? 'true' : 'false';
    chapterToggle.hidden = !compact;
    setCompactNavOpen(false);
  };
  chapterToggle.addEventListener('click', () => {
    setCompactNavOpen(!compactNavOpen);
    if (compactNavOpen) q('[aria-current="location"]',chapterNav)?.focus({preventScroll:true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && compactNavOpen) {
      event.preventDefault();
      setCompactNavOpen(false,{restoreFocus:true});
    }
  });
  syncCompactNav();

  const cursor = document.createElement('div');
  cursor.className = 'v12-cursor';
  cursor.setAttribute('aria-hidden','true');
  cursor.innerHTML = '<span></span>';
  body.append(cursor);

  const transition = document.createElement('div');
  transition.className = 'v12-transition';
  transition.setAttribute('aria-hidden','true');
  transition.innerHTML = '<span class="v12-transition-a"></span><span class="v12-transition-b"></span><span class="v12-transition-line"></span>';
  body.append(transition);

  const captionNo = q('.v12-world-caption span', world);
  const captionLabel = q('.v12-world-caption strong', world);
  const navLinks = qa('[data-v12-jump]', chapterNav);
  const siteHeader = q('.site-header');

  const profile = () => {
    const memory = Number(navigator.deviceMemory || 4);
    const cores = Number(navigator.hardwareConcurrency || 4);
    const compact = innerWidth <= 900 || coarse.matches;
    let tier = 'high';
    if (compact || memory <= 4 || cores <= 4) tier = 'medium';
    if (innerWidth <= 420 || memory <= 2 || cores <= 2) tier = 'lite';
    if (reduced.matches || forced.matches) tier = 'reduced';
    html.dataset.v12Profile = tier;
    html.dataset.v12Pointer = coarse.matches ? 'coarse' : 'fine';
    return tier;
  };
  let tier = profile();

  const enhanceHero = () => {
    const stage = q('.journey-stage');
    if (!stage || q('.v12-hero-signature', stage)) return;
    const signature = document.createElement('div');
    signature.className = 'v12-hero-signature';
    signature.setAttribute('aria-hidden','true');
    signature.innerHTML = '<span>BD</span><i></i><em>Creative practice / 2026</em>';
    stage.append(signature);

    const frame = document.createElement('div');
    frame.className = 'v12-hero-frame';
    frame.setAttribute('aria-hidden','true');
    frame.innerHTML = '<i></i><i></i><i></i><i></i>';
    stage.append(frame);
  };
  enhanceHero();

  const enhanceWork = () => {
    const section = q('#work');
    const showcase = q('.work-showcase', section || document);
    if (!section || !showcase || q('.v12-work-index', section)) return;
    const index = document.createElement('div');
    index.className = 'v12-work-index';
    index.setAttribute('aria-hidden','true');
    index.innerHTML = '<span>01</span><strong>Selected work</strong><i></i>';
    section.prepend(index);
    const sync = () => {
      const cards = qa('.project', showcase);
      const active = cards.findIndex(card => card.classList.contains('is-selected'));
      const chosen = active >= 0 ? active : 0;
      const title = q('h3 a', cards[chosen] || showcase)?.textContent?.replace('↗','').trim() || 'Selected work';
      q('.v12-work-index span', section).textContent = String(chosen + 1).padStart(2,'0');
      q('.v12-work-index strong', section).textContent = title;
    };
    new MutationObserver(sync).observe(showcase,{attributes:true,subtree:true,attributeFilter:['class']});
    sync();
  };
  enhanceWork();

  const enhancePhotography = () => {
    const viewer = q('.gaze-viewer');
    if (!viewer || q('.v12-photo-meter', viewer)) return;
    const meter = document.createElement('div');
    meter.className = 'v12-photo-meter';
    meter.setAttribute('aria-hidden','true');
    meter.innerHTML = '<span>FRAME</span><i></i><strong>THE DAILY GAZE</strong>';
    viewer.append(meter);
  };
  enhancePhotography();

  const enhanceContact = () => {
    const section = q('#contact');
    if (!section || q('.v12-contact-orbit', section)) return;
    const orbit = document.createElement('div');
    orbit.className = 'v12-contact-orbit';
    orbit.setAttribute('aria-hidden','true');
    orbit.innerHTML = '<i></i><i></i><span>LET\'S TALK</span>';
    section.append(orbit);
  };
  enhanceContact();

  const publicOrigin = 'https://banujadisanayaka.netlify.app';
  const currentUrl = publicOrigin + location.pathname;
  q('link[rel="canonical"]')?.setAttribute('href', currentUrl);
  q('meta[property="og:url"]')?.setAttribute('content', currentUrl);
  const oldOrigin = 'https://banuja-personal-log.netlify.app';
  ['meta[property="og:image"]','meta[name="twitter:image"]'].forEach(selector => {
    const node = q(selector);
    if (node?.content?.startsWith(oldOrigin)) node.content = node.content.replace(oldOrigin, publicOrigin);
  });
  const ld = q('script[type="application/ld+json"]');
  if (ld?.textContent) ld.textContent = ld.textContent.replaceAll(oldOrigin, publicOrigin);

  let geometryDirty = true;
  let raf = 0;
  let activeIndex = -1;
  let lastY = scrollY;
  let direction = 1;
  let px = .5, py = .5, ptx = .5, pty = .5;
  let cursorX = -100, cursorY = -100, cursorTargetX = -100, cursorTargetY = -100;
  let pointerFrame = 0;

  const setActive = index => {
    if (index === activeIndex) return;
    activeIndex = index;
    const scene = scenes[index];
    if (!scene) return;
    scenes.forEach((item, i) => {
      const activeValue = String(i === index);
      if (item.el.dataset.v12Active !== activeValue) item.el.dataset.v12Active = activeValue;
      const nextWillChange = tier === 'lite'
        ? 'auto'
        : i === index || Math.abs(i-index) === 1 ? 'transform, opacity' : 'auto';
      if (item.el.style.willChange !== nextWillChange) item.el.style.willChange = nextWillChange;
    });
    navLinks.forEach((link, i) => {
      if (i === index) {
        if (link.getAttribute('aria-current') !== 'location') link.setAttribute('aria-current','location');
      } else if (link.hasAttribute('aria-current')) {
        link.removeAttribute('aria-current');
      }
    });
    html.dataset.v12Scene = String(index);
    html.style.setProperty('--v12-tone', scene.tone);
    html.style.setProperty('--v12-tone-2', scene.tone2);
    html.style.setProperty('--v12-world-bg', scene.bg);
    // The caption is hidden on the lite profile; changing its text while
    // hidden still forces avoidable layout bookkeeping during the journey.
    if (tier !== 'lite') {
      captionNo.textContent = String(index + 1).padStart(2,'0');
      captionLabel.textContent = scene.label;
    }
  };

  const measure = () => {
    const y = scrollY;
    scenes.forEach(scene => {
      const r = scene.el.getBoundingClientRect();
      scene.top = r.top + y;
      scene.height = Math.max(r.height, 1);
      scene.bottom = scene.top + scene.height;
    });
    geometryDirty = false;
  };

  const paint = () => {
    raf = 0;
    if (document.hidden) return;
    if (geometryDirty) measure();
    const y = scrollY;
    const vh = Math.max(innerHeight, 1);
    const center = y + vh * .48;
    direction = y >= lastY ? 1 : -1;
    lastY = y;
    let best = 0;
    let bestDistance = Infinity;

    scenes.forEach((scene, index) => {
      const local = clamp((center - scene.top) / scene.height, 0, 1);
      scene.local = local;
      const inScene = center >= scene.top && center <= scene.bottom;
      const distance = inScene ? 0 : center < scene.top ? (scene.top - center) / vh : (center - scene.bottom) / vh;
      scene.distance = distance;
      const abs = Math.abs(distance);
      if (abs < bestDistance) { bestDistance = abs; best = index; }

      const near = inScene || abs < 1.15;
      const nearValue = String(near);
      if (scene.el.dataset.v12Near !== nearValue) scene.el.dataset.v12Near = nearValue;
      // Small touch devices keep the full art direction and scene navigation,
      // but the proven opening journey owns continuous scroll choreography.
      // Avoid inherited custom-property writes across large section subtrees.
      if (!near || tier === 'lite') return;

      const entry = smooth(clamp((local + .10) / .35));
      const exit = smooth(clamp((1.08 - local) / .36));
      const focus = Math.min(entry, exit);
      const signed = inScene ? (local - .5) : clamp(distance, -1, 1);
      scene.el.style.setProperty('--v12-local', local.toFixed(4));
      scene.el.style.setProperty('--v12-entry', entry.toFixed(4));
      scene.el.style.setProperty('--v12-exit', exit.toFixed(4));
      scene.el.style.setProperty('--v12-focus', focus.toFixed(4));
      scene.el.style.setProperty('--v12-y', `${(signed * (tier === 'high' ? -26 : -12)).toFixed(2)}px`);
      scene.el.style.setProperty('--v12-scale', (1 - (1-focus) * (tier === 'high' ? .025 : .012)).toFixed(4));
      scene.el.style.setProperty('--v12-ghost-x', `${lerp(-7, 7, local).toFixed(2)}vw`);
      scene.el.style.setProperty('--v12-ghost-alpha', String(clamp(.025 + focus * .045, .02, .08)));
    });

    setActive(best);
    const active = scenes[best];
    const local = active?.local ?? .5;
    if (tier !== 'lite') {
      const transitionStart = .80;
      const cut = smooth(clamp((local - transitionStart) / (1 - transitionStart)));
      html.style.setProperty('--v12-cut', cut.toFixed(4));
      html.style.setProperty('--v12-progress', ((y / Math.max(1, document.documentElement.scrollHeight - vh))).toFixed(5));
      html.style.setProperty('--v12-orbit-r', `${(best * 18 + local * 15).toFixed(2)}deg`);
      html.style.setProperty('--v12-world-x', `${((local - .5) * (tier === 'high' ? -36 : -16)).toFixed(2)}px`);
      html.style.setProperty('--v12-world-y', `${((local - .5) * (tier === 'high' ? 28 : 10)).toFixed(2)}px`);
      html.style.setProperty('--v12-thread-y', `${((best + local) / Math.max(1, scenes.length) * 100).toFixed(2)}%`);
      html.style.setProperty('--v12-scroll-dir', String(direction));

      px += (ptx - px) * .14;
      py += (pty - py) * .14;
      html.style.setProperty('--v12-px', ((px - .5) * 2).toFixed(4));
      html.style.setProperty('--v12-py', ((py - .5) * 2).toFixed(4));
    }
    const scrolled = String(y > 40);
    if (html.dataset.v12Scrolled !== scrolled) html.dataset.v12Scrolled = scrolled;
    if (siteHeader?.hasAttribute('data-compact') !== (y > 60)) siteHeader?.toggleAttribute('data-compact', y > 60);
  };

  const schedule = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(paint);
  };
  const invalidate = () => { geometryDirty = true; schedule(); };

  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', () => { tier = profile(); syncCompactNav(); invalidate(); }, {passive:true});
  addEventListener('orientationchange', () => { syncCompactNav(); invalidate(); }, {passive:true});
  document.addEventListener('load', invalidate, {capture:true, passive:true});
  document.fonts?.ready?.then(invalidate);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(invalidate);
    scenes.forEach(scene => ro.observe(scene.el));
  }

  if (!coarse.matches) {
    addEventListener('pointermove', event => {
      ptx = clamp(event.clientX / Math.max(innerWidth, 1));
      pty = clamp(event.clientY / Math.max(innerHeight, 1));
      cursorTargetX = event.clientX;
      cursorTargetY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(function moveCursor(){
        pointerFrame = 0;
        cursorX += (cursorTargetX - cursorX) * .42;
        cursorY += (cursorTargetY - cursorY) * .42;
        cursor.style.transform = `translate3d(${cursorX.toFixed(1)}px,${cursorY.toFixed(1)}px,0)`;
      });
      schedule();
    }, {passive:true});

    document.addEventListener('pointerover', event => {
      const interactive = event.target.closest('a,button,.photo-tile,.project');
      cursor.dataset.state = interactive ? 'active' : 'idle';
    }, {passive:true});
  }

  const magnetic = qa('.button,.journey-link,.text-link,.work-open').slice(0,40);
  magnetic.forEach(el => {
    el.classList.add('v12-magnetic');
    el.addEventListener('pointermove', event => {
      if (tier !== 'high' || reduced.matches) return;
      const r = el.getBoundingClientRect();
      const dx = clamp((event.clientX - (r.left+r.width/2)) / Math.max(r.width,1), -.5,.5) * 10;
      const dy = clamp((event.clientY - (r.top+r.height/2)) / Math.max(r.height,1), -.5,.5) * 7;
      el.style.setProperty('--v12-mx', `${dx.toFixed(2)}px`);
      el.style.setProperty('--v12-my', `${dy.toFixed(2)}px`);
    }, {passive:true});
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--v12-mx','0px');
      el.style.setProperty('--v12-my','0px');
    }, {passive:true});
  });

  chapterNav.addEventListener('click', event => {
    const link = event.target.closest('[data-v12-jump]');
    if (!link) return;
    const target = document.getElementById(link.dataset.v12Jump);
    if (!target) return;
    event.preventDefault();
    if (isShortLandscape()) setCompactNavOpen(false);
    target.scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth', block:'start'});
    history.replaceState(null,'',`#${target.id}`);
  });

  const syncMotion = () => {
    const enabled = html.dataset.motion !== 'off' && !reduced.matches && !forced.matches;
    html.dataset.v12Motion = enabled ? 'on' : 'off';
    if (!enabled) {
      html.style.setProperty('--v12-cut','0');
      html.style.setProperty('--v12-px','0');
      html.style.setProperty('--v12-py','0');
      scenes.forEach(scene => {
        scene.el.style.setProperty('--v12-y','0px');
        scene.el.style.setProperty('--v12-scale','1');
      });
    }
    schedule();
  };
  new MutationObserver(syncMotion).observe(html,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener?.('change', () => { tier = profile(); syncMotion(); invalidate(); });
  forced.addEventListener?.('change', () => { tier = profile(); syncMotion(); invalidate(); });

  document.addEventListener('portfolio:content', () => {
    enhanceWork();
    enhancePhotography();
    enhanceContact();
    invalidate();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });

  syncMotion();
  invalidate();
})();