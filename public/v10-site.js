(() => {
  'use strict';
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const html = document.documentElement;
  const story = q('.v10-story');
  const beats = qa('[data-beat]', story || document);
  const art = qa('[data-art]', story || document);
  const rail = q('.scene-nav');
  const chapters = rail ? qa('a', rail) : [];
  let frame = 0;
  function updateScene() {
    frame = 0;
    if (document.hidden) return;
    if (story && beats.length) {
      let active = 0;
      beats.forEach((beat, i) => { if (beat.getBoundingClientRect().top <= innerHeight * .52) active = i; });
      art.forEach((item, i) => item.classList.toggle('is-current', i === active));
      story.dataset.scene = String(active);
    }
    const available = chapters.filter(link => {
      const target = q(link.hash);
      const visible = !!target && !target.hidden;
      link.hidden = !visible;
      return visible;
    });
    let active = available[0];
    available.forEach(link => { if (q(link.hash).getBoundingClientRect().top <= innerHeight * .4) active = link; });
    available.forEach(link => {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const requestScene = () => { if (!frame) frame = requestAnimationFrame(updateScene); };
  if (story || rail) {
    story?.classList.add('is-tracking');
    if (rail) rail.hidden = false;
    addEventListener('scroll', requestScene, {passive:true});
    addEventListener('resize', requestScene, {passive:true});
    document.addEventListener('visibilitychange', requestScene);
    requestScene();
  }

  const viewer = q('.gaze-viewer');
  const photos = q('.featured-photos');
  const controls = q('.gaze-controls');
  const thumbnails = q('.gaze-thumbnails');
  const status = q('[data-gaze-status]');
  const animations = new Set();
  let items = [], buttons = [], current = 0, currentId = '';
  function cancelAnimations() { animations.forEach(a => a.cancel()); animations.clear(); }
  function choose(index, animate = true) {
    if (!items.length) return;
    current = (index + items.length) % items.length;
    currentId = items[current].dataset.photoId;
    items.forEach((item, i) => {
      item.classList.toggle('is-current', i === current);
      item.setAttribute('aria-hidden', String(i !== current));
      q('a', item).tabIndex = i === current ? 0 : -1;
      buttons[i].setAttribute('aria-pressed', String(i === current));
    });
    viewer.dataset.selectedPhoto = currentId;
    status.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    cancelAnimations();
    if (animate && html.dataset.motion === 'on' && !document.hidden && items[current].animate) {
      const animation = items[current].animate([{opacity:.4,translate:'12px 0'},{opacity:1,translate:'0 0'}], {duration:480,easing:'cubic-bezier(.22,1,.36,1)'});
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    }
  }
  function setupGaze() {
    if (!viewer || !photos || !controls || !thumbnails) return;
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
      image.src = source.getAttribute('src'); image.alt = ''; image.width = 60; image.height = 50;
      image.loading = 'lazy'; image.decoding = 'async';
      const name = document.createElement('span'); name.className = 'gaze-thumb-title'; name.textContent = title;
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
      button.append(image, name, number);
      button.addEventListener('click', () => choose(index));
      button.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); choose(next); buttons[current].focus();
      });
      return button;
    });
    thumbnails.replaceChildren(...buttons);
    viewer.classList.toggle('is-ready', items.length > 0);
    const previous = items.findIndex(item => item.dataset.photoId === currentId);
    choose(previous < 0 ? 0 : previous, false);
    if (hadFocus && buttons.length) buttons[current].focus({preventScroll:true});
  }
  q('[data-gaze-prev]')?.addEventListener('click', () => choose(current - 1));
  q('[data-gaze-next]')?.addEventListener('click', () => choose(current + 1));
  new MutationObserver(() => { if (html.dataset.motion !== 'on') cancelAnimations(); }).observe(html, {attributes:true,attributeFilter:['data-motion']});
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimations(); });
  document.addEventListener('portfolio:content', () => { setupGaze(); requestScene(); });
  setupGaze();
})();
