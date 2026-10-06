(() => {
  'use strict';
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const html = document.documentElement;
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
  const motion = () => html.dataset.motion === 'on' && !document.hidden;
  const animations = new Set();
  function animate(el, frames, options) {
    if (!motion() || !el?.animate) return;
    const animation = el.animate(frames, {duration:800,easing:'cubic-bezier(.22,1,.36,1)',...options});
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  function cancelAnimations() { animations.forEach(a => a.cancel()); animations.clear(); }

  // A real, reversible spatial change: the selected photograph comes forward.
  const orbit = q('[data-orbit]');
  const cards = qa('[data-hero-select]');
  let selected = 0, drag = null, suppressClick = false;
  function paintOrbit(displacement = 0) {
    if (!orbit) return;
    const spread = Math.min(orbit.clientWidth * .31, 190);
    cards.forEach((card, i) => {
      const slot = ((i - selected + cards.length + 1) % cards.length) - 1;
      const side = Math.abs(slot);
      card.style.setProperty('--card-x', `${(slot * spread + displacement).toFixed(1)}px`);
      card.style.setProperty('--card-y', `${slot * 23}px`);
      card.style.setProperty('--card-z', `${-side * 175}px`);
      card.style.setProperty('--card-ry', `${-slot * 33 + displacement * .04}deg`);
      card.style.setProperty('--card-rz', `${slot * 8 + displacement * .015}deg`);
      card.style.setProperty('--card-scale', String(1 - side * .14));
    });
  }
  function chooseHero(index) {
    selected = (index + cards.length) % cards.length;
    cards.forEach((card, i) => card.setAttribute('aria-pressed', String(i === selected)));
    orbit.dataset.selectedPerspective = String(selected);
    q('[data-orbit-status]').textContent = `${String(selected + 1).padStart(2,'0')} / 03`;
    paintOrbit();
  }
  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    // Touch begins with implicit capture on the image's child element. Moving
    // capture to the depth surface must not cancel the gesture we just started.
    if (event?.type === 'lostpointercapture' && event.target !== drag.capture) return;
    const completed = event?.type === 'pointerup' && drag.horizontal;
    const distance = drag.dx;
    suppressClick = completed && Math.abs(distance) > 12;
    drag = null;
    orbit.classList.remove('is-dragging');
    if (completed && Math.abs(distance) > 60) chooseHero(selected + (distance < 0 ? 1 : -1));
    else paintOrbit();
  }
  if (orbit && cards.length) {
    q('.orbit-controls').hidden = false;
    chooseHero(0);
    cards.forEach((card, index) => {
      card.addEventListener('click', event => {
        if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
        chooseHero(index);
      });
      card.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? selected + 1 : event.key === 'ArrowLeft' ? selected - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); chooseHero(next); cards[selected].focus({preventScroll:true});
      });
    });
    q('[data-orbit-prev]').addEventListener('click', () => chooseHero(selected - 1));
    q('[data-orbit-next]').addEventListener('click', () => chooseHero(selected + 1));
    orbit.addEventListener('dragstart', event => event.preventDefault());
    orbit.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button > 0) return;
      suppressClick = false;
      drag = {id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,horizontal:false,capture:event.target.closest('[data-depth]') || orbit};
    }, {passive:true});
    orbit.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.horizontal && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { endDrag(); return; }
      if (!drag.horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        drag.horizontal = true;
        drag.capture.setPointerCapture(event.pointerId);
        orbit.classList.add('is-dragging');
      }
      drag.dx = dx;
      if (drag.horizontal && motion()) paintOrbit(clamp(dx * .5, -90, 90));
    }, {passive:true});
    orbit.addEventListener('pointerup', endDrag, {passive:true});
    orbit.addEventListener('pointercancel', endDrag, {passive:true});
    orbit.addEventListener('lostpointercapture', endDrag, {passive:true});
    orbit.addEventListener('pointerleave', event => { if (drag && !drag.horizontal) endDrag(event); }, {passive:true});
  }

  // The browser pins one stage containing both imagery and copy. Text never
  // counter-scrolls in JavaScript: that raced native touch scrolling on Android.
  const story = q('.v10-story');
  const journey = q('.story-journey');
  const visual = q('.story-visual');
  const beats = qa('[data-beat]', story || document);
  const art = qa('[data-art]', story || document);
  const words = qa('[data-word]', story || document);
  const storyControls = q('.story-controls');
  const storyButtons = qa('[data-story-select]');
  const path = q('.story-path i');
  const rail = q('.scene-nav');
  const chapters = rail ? qa('a', rail).map(link => ({link, target:q(link.hash)})) : [];
  let frame = 0, layoutDirty = true, cinematic = false, lastPosition = -1, activeScene = -1;
  let sceneGeometry = null, chapterGeometry = [], currentChapter = null;
  const requestScene = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(updateScene); };
  const invalidateScene = () => { layoutDirty = true; requestScene(); };

  function configureScene() {
    const next = motion() && innerHeight > 560;
    if (next !== cinematic) {
      cinematic = next;
      story?.classList.toggle('is-cinematic', cinematic);
      if (storyControls) storyControls.hidden = !cinematic;
      activeScene = -1; lastPosition = -1;
      if (!cinematic) {
        art.forEach(item => { item.style.removeProperty('transform'); item.style.removeProperty('opacity'); });
        words.forEach(word => { word.style.removeProperty('transform'); word.style.removeProperty('opacity'); });
      }
    }
    invalidateScene();
  }

  function setScene(index) {
    if (index === activeScene) return;
    activeScene = index;
    story.dataset.scene = String(index);
    beats.forEach((beat, i) => {
      const inactive = cinematic && i !== index;
      beat.classList.toggle('is-current', i === index);
      beat.inert = inactive;
      beat.setAttribute('aria-hidden', String(inactive));
    });
    art.forEach((item, i) => {
      const inactive = cinematic && i !== index;
      item.classList.toggle('is-current', i === index);
      item.setAttribute('aria-hidden', String(inactive));
      item.inert = inactive;
    });
    storyButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }

  function updateScene() {
    frame = 0;
    if (document.hidden) return;
    const y = scrollY;
    // Geometry is measured together, only when layout changes. Scrolling uses
    // these cached coordinates and writes transforms on the affected layers.
    if (layoutDirty) {
      sceneGeometry = journey && cinematic ? {
        top:journey.getBoundingClientRect().top + y,
        height:visual.clientHeight,
        width:journey.clientWidth,
        widths:art.map(item => item.offsetWidth),
        compact:innerWidth <= 700
      } : null;
      chapterGeometry = chapters.map(chapter => ({...chapter,
        visible:!!chapter.target && !chapter.target.hidden,
        top:chapter.target ? chapter.target.getBoundingClientRect().top + y : 0
      }));
      chapterGeometry.forEach(({link,visible}) => { link.hidden = !visible; });
      layoutDirty = false; lastPosition = -1;
    }
    if (story && beats.length) {
      if (!cinematic || !sceneGeometry?.height) setScene(0);
      else {
        const {top,height,width,widths,compact} = sceneGeometry;
        const position = clamp((y-top)/height, 0, 2);
        if (Math.abs(position-lastPosition) > .0001) {
          lastPosition = position;
          setScene(Math.min(2, Math.floor(position + .5)));
          if (path) path.style.transform = `scaleX(${(position / 2).toFixed(4)})`;
          art.forEach((item, i) => {
            const d = i-position, away = Math.abs(d);
            const x = width*(compact ? .5 : .69)-widths[i]/2+d*width*(compact ? .72 : .42);
            const cardY = height*(compact ? .085 : .17)+Math.sin(d*1.2)*(compact ? 12 : 55);
            item.style.transform = `translate3d(${x.toFixed(2)}px,${cardY.toFixed(2)}px,${compact ? 0 : (-away*340).toFixed(2)}px) rotateY(${compact ? 0 : (-d*32).toFixed(2)}deg) rotateZ(${(d*(compact ? 3 : 7)).toFixed(2)}deg) scale(${(1-Math.min(away,1.6)*(compact ? .12 : .22)).toFixed(4)})`;
            item.style.opacity = String(clamp(1-away*.62,0,1));
          });
          words.forEach((word, i) => {
            const d = i-position;
            word.style.opacity = String(clamp(1-Math.abs(d),0,1));
            word.style.transform = `translate3d(${(d*10).toFixed(2)}%,${(d*65).toFixed(2)}%,0)`;
          });
        }
      }
    }
    const available = chapterGeometry.filter(chapter => chapter.visible);
    let next = available[0]?.link;
    available.forEach(chapter => { if (chapter.top <= y+innerHeight*.4) next = chapter.link; });
    if (next !== currentChapter) {
      currentChapter?.removeAttribute('aria-current');
      next?.setAttribute('aria-current','location');
      currentChapter = next;
    }
  }
  if (story || rail) {
    storyButtons.forEach((button, i) => button.addEventListener('click', () => {
      if (sceneGeometry) scrollTo({top:sceneGeometry.top+sceneGeometry.height*i,behavior:motion() ? 'smooth' : 'instant'});
    }));
    if (rail) rail.hidden = false;
    addEventListener('scroll', requestScene, {passive:true});
    document.fonts?.ready.then(invalidateScene);
    if ('ResizeObserver' in window) new ResizeObserver(invalidateScene).observe(document.body);
    // Loading below-the-fold media can move an anchor without changing body height.
    document.addEventListener('load', invalidateScene, {capture:true,passive:true});
    configureScene();
  }

  const viewer = q('.gaze-viewer');
  const photos = q('.featured-photos');
  const controls = q('.gaze-controls');
  const thumbnails = q('.gaze-thumbnails');
  const status = q('[data-gaze-status]');
  let items = [], buttons = [], current = 0, currentId = '';
  function choose(index, transition = true) {
    if (!items.length) return;
    cancelAnimations();
    current = (index + items.length) % items.length;
    currentId = items[current].dataset.photoId;
    const origin = q('img', buttons[current]).getBoundingClientRect();
    items.forEach((item, i) => {
      item.classList.toggle('is-current', i === current);
      item.setAttribute('aria-hidden', String(i !== current));
      q('a', item).tabIndex = i === current ? 0 : -1;
      buttons[i].setAttribute('aria-pressed', String(i === current));
    });
    viewer.dataset.selectedPhoto = currentId;
    status.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    const image = q('img', items[current]);
    viewer.style.setProperty('--gaze-backdrop', `url(${JSON.stringify(image.getAttribute('src'))})`);
    if (transition && motion()) {
      const target = image.getBoundingClientRect();
      const scale = origin.width / Math.max(target.width, 1);
      const x = origin.left - target.left;
      const y = origin.top + origin.height / 2 - target.top - target.height * scale / 2;
      animate(image, [{transform:`translate3d(${x}px,${y}px,0) scale(${scale})`,opacity:.5},{transform:'translate3d(0,0,0) scale(1)',opacity:1}]);
      animate(q('figcaption', items[current]), [{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}], {duration:650});
    }
  }
  function setupGaze() {
    if (!viewer || !photos || !controls || !thumbnails) return;
    cancelAnimations();
    const hadFocus = thumbnails.contains(document.activeElement);
    items = qa('.photo-tile', photos);
    controls.hidden = items.length < 2;
    q('.gaze-empty').hidden = items.length > 0;
    buttons = items.map((item, index) => {
      const title = q('.photo-title', item).textContent;
      const source = q('img', item);
      q('a', item).removeAttribute('data-depth');
      source.sizes = '(max-width:700px) 88vw, (max-width:1100px) 62vw, 65vw';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'gaze-thumbnail';
      button.setAttribute('aria-label', 'Choose photograph: ' + title);
      button.setAttribute('aria-controls', 'featured-photographs');
      const image = document.createElement('img');
      image.src = source.getAttribute('src'); image.alt = ''; image.width = 120; image.height = 110;
      image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      const name = document.createElement('span'); name.className = 'gaze-thumb-title'; name.textContent = title;
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
      button.append(image, name, number);
      button.addEventListener('click', () => choose(index));
      button.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); choose(next); buttons[current].focus({preventScroll:true});
        buttons[current].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      });
      return button;
    });
    thumbnails.replaceChildren(...buttons);
    viewer.classList.toggle('is-ready', items.length > 0);
    if (!items.length) {
      currentId = ''; viewer.removeAttribute('data-selected-photo');
      viewer.style.removeProperty('--gaze-backdrop'); status.textContent = '';
      return;
    }
    const previous = items.findIndex(item => item.dataset.photoId === currentId);
    choose(previous < 0 ? 0 : previous, false);
    if (hadFocus && buttons.length) buttons[current].focus({preventScroll:true});
  }
  q('[data-gaze-prev]')?.addEventListener('click', () => choose(current - 1));
  q('[data-gaze-next]')?.addEventListener('click', () => choose(current + 1));
  new MutationObserver(() => {
    if (!motion()) { cancelAnimations(); endDrag(); }
    configureScene();
  }).observe(html, {attributes:true,attributeFilter:['data-motion']});
  let viewportWidth = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== viewportWidth) { cancelAnimations(); endDrag(); paintOrbit(); viewportWidth = innerWidth; }
    configureScene();
  }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimations(); endDrag(); }
    else configureScene();
  });
  document.addEventListener('portfolio:content', () => { setupGaze(); invalidateScene(); });
  setupGaze();
})();


// V10.3 chapter transformations
(() => {
  'use strict';
  const html = document.documentElement;
  const scenes = ['#work','#photography','#about','#perspectives','#contact'].map(selector => document.querySelector('.section'+selector)).filter(Boolean);
  if (!scenes.length || !('IntersectionObserver' in window)) return;
  html.dataset.sceneTransitions = 'on';
  const phaseFor = section => {
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= innerHeight * .24) return 'past';
    if (rect.top >= innerHeight * .76) return 'next';
    return 'active';
  };
  const paint = section => {
    const phase = phaseFor(section);
    if (section.dataset.scenePhase !== phase) section.dataset.scenePhase = phase;
  };
  scenes.forEach((section,index) => {
    section.classList.add('chapter-scene');
    section.dataset.sceneIndex = String(index);
    paint(section);
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => paint(entry.target)), {rootMargin:'-18% 0px -18% 0px',threshold:[0,.08,.32,.68]});
  scenes.forEach(section => observer.observe(section));
  let resizeFrame = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => scenes.forEach(paint));
  }, {passive:true});
})();
