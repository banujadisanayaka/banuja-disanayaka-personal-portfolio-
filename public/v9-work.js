(() => {
  'use strict';
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const showcase = q('[data-work-showcase]');
  const grid = q('.project-grid', showcase || document);
  const dialog = q('#work-preview');
  if (!showcase || !grid || !dialog?.showModal) return;
  const picker = q('.work-picker', showcase);
  const navigation = q('.work-navigation', showcase);
  const closeButton = q('.work-preview-close', dialog);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const compact = matchMedia('(max-width: 700px)');
  const cardStates = new WeakMap();
  let cardStep = 240;
  const tones = {sage:'113, 207, 164', lavender:'177, 152, 246', sand:'234, 177, 112', blue:'112, 184, 238', gold:'209, 183, 128'};
  let cards = [], buttons = [], selected = 0, selectedHref = '', trigger = null;
  let gesture = null, suppressClickUntil = 0, resizeFrame = 0, previousOverflow = '', dialogAnimation = null, closing = false;
  let bookFrame = 0, dialogSession = false, openingScroll = 0;
  const motion = () => document.documentElement.dataset.motion === 'on' && !reduced.matches && !forced.matches;
  const heading = card => q('h3 a', card);
  const title = card => heading(card)?.textContent.replace(/\s*↗\s*$/, '').trim() || 'Project';
  const tone = card => Object.hasOwn(tones, card.dataset.workTone) ? card.dataset.workTone : 'sage';
  const button = (cls, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label); return b; };
  const href = card => {
    try {
      const url = new URL(heading(card)?.getAttribute('href'), location.href);
      if (url.username || url.password || (url.protocol !== 'https:' && url.origin !== location.origin)) return '';
      return url.href;
    } catch { return ''; }
  };

  function measure() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (!showcase.classList.contains('is-ready')) return;
      cardStep = parseFloat(getComputedStyle(grid).getPropertyValue('--work-step')) || 240;
      const height = Math.max(0, ...cards.map(card => card.offsetHeight));
      grid.style.minHeight = `${height + 80}px`;
      layout();
    });
  }

  function cardPose(distance) {
    const magnitude = Math.abs(distance);
    const scale = magnitude === 0 ? 1 : magnitude === 1 ? .86 : .73;
    // Phones use a single flat card surface; the printed book keeps its own depth.
    const depth = compact.matches ? 0 : -magnitude * 65;
    const angle = compact.matches || !distance ? 0 : -Math.sign(distance) * 18;
    return `translate3d(calc(-50% + ${distance * cardStep}px + var(--work-drag, 0px)),0,${depth}px) rotateY(${angle}deg) scale(${scale})`;
  }

  function stopCards() {
    cards.forEach(card => {
      cardStates.get(card)?.animation?.cancel();
      const state = cardStates.get(card);
      if (state) { state.animation = null; state.recycled = false; }
    });
  }

  function layout(animate = false) {
    const moving = animate && motion();
    // Read interrupted positions together, before writing any new card styles.
    // Rapid taps reverse from the frame on screen instead of restarting a transition.
    const starts = cards.map(card => {
      const state = cardStates.get(card);
      if (!state) return null;
      const live = state.animation?.playState === 'running' ? getComputedStyle(card) : null;
      return { ...state, transform: live?.transform || state.transform,
        opacity: live?.opacity || state.opacity, zIndex: live?.zIndex || state.zIndex };
    });
    cards.forEach((card, index) => {
      let distance = index - selected;
      if (distance > cards.length / 2) distance -= cards.length;
      if (distance < -cards.length / 2) distance += cards.length;
      const magnitude = Math.abs(distance), active = index === selected;
      const transform = cardPose(distance);
      const opacity = active ? '1' : magnitude === 1 ? '.64' : '.3';
      const zIndex = String(10 - magnitude);
      const start = starts[index];
      start?.animation?.cancel();
      card.style.transform = transform;
      card.style.zIndex = zIndex;
      card.style.opacity = opacity;
      card.style.visibility = magnitude > 2 ? 'hidden' : 'visible';
      const state = {distance, transform, opacity, zIndex, animation:null};
      cardStates.set(card, state);
      if (!moving || !start || start.distance === distance || !card.animate) return;
      const recycled = Math.abs(distance - start.distance) > cards.length / 2 || start.recycled;
      state.recycled = recycled;
      let frames;
      if (recycled) {
        // Recycle at the outside edge while invisible. Never sweep a back card
        // across the selected project when the circular list wraps.
        frames = [
          {transform:start.transform, opacity:start.opacity, offset:0},
          {transform:start.transform, opacity:0, offset:.35},
          {transform, opacity:0, offset:.35},
          {transform, opacity, offset:1}
        ];
      } else {
        frames = [{transform:start.transform, opacity:start.opacity},
          {transform, opacity}];
      }
      state.animation = card.animate(frames, {
        duration:compact.matches ? 480 : 560,
        easing:'cubic-bezier(.22,.61,.36,1)'
      });
      const animation = state.animation;
      animation.finished.then(() => {
        if (state.animation === animation) { state.animation = null; state.recycled = false; }
      }).catch(() => {});
    });
  }

  function select(index, announce = true) {
    if (!cards.length) return;
    const previous = selected;
    selected = (index + cards.length) % cards.length;
    selectedHref = href(cards[selected]);
    showcase.style.setProperty('--work-rgb', tones[tone(cards[selected])]);
    qa('[data-glow-tone]', showcase).forEach(layer => layer.classList.toggle('is-current', layer.dataset.glowTone === tone(cards[selected])));
    showcase.dataset.selectedProject = cards[selected].dataset.project || String(selected);
    cards.forEach((card, i) => {
      const active = i === selected;
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-hidden', String(!active));
      heading(card).tabIndex = active ? 0 : -1;
      q('.work-open', card).tabIndex = active ? 0 : -1;
      q('.work-card-select', card).hidden = active;
      buttons[i].setAttribute('aria-pressed', String(active));
    });
    if (previous !== selected || !cardStates.has(cards[selected])) layout(true);
    if (announce) q('.work-announcement', showcase).textContent = `${selected + 1} of ${cards.length}: ${title(cards[selected])}`;
  }

  function cardTransform() {
    const card = trigger?.closest('.journey-art') || cards[selected];
    if (!card) return null;
    const a = card.getBoundingClientRect(), b = dialog.getBoundingClientRect();
    if (!a.width || !b.width || a.bottom < 0 || a.top > innerHeight) return null;
    return `translate(${a.left + a.width / 2 - b.left - b.width / 2}px, ${a.top + a.height / 2 - b.top - b.height / 2}px) scale(${a.width / b.width}, ${a.height / b.height})`;
  }

  function animateDialog(opening) {
    dialogAnimation?.cancel();
    if (!motion() || !dialog.animate) return Promise.resolve();
    const from = cardTransform() || 'translateY(18px) scale(.97)';
    const frames = opening ? [{transform:from, opacity:.25}, {transform:'none', opacity:1}] : [{transform:'none', opacity:1}, {transform:from, opacity:0}];
    dialogAnimation = dialog.animate(frames, {duration:opening ? 440 : 240, easing:'cubic-bezier(.2,.75,.2,1)'});
    return dialogAnimation.finished.catch(() => {});
  }

  function renderPreview(card) {
    const url = href(card);
    dialog.dataset.workTone = tone(card);
    q('#work-preview-title').textContent = title(card);
    q('.work-preview-category', dialog).textContent = q('.project-copy .eyebrow', card)?.firstChild.textContent.trim() || '';
    q('.work-preview-description', dialog).textContent = q('.project-copy>p:not(.eyebrow)', card)?.textContent || '';
    q('.work-preview-status', dialog).textContent = q('.project-status', card)?.textContent || '';
    const visual = q('.project-visual', card)?.firstElementChild;
    q('.work-preview-cover', dialog).replaceChildren(...(visual ? [visual.cloneNode(true)] : []));
    const template = q('.project-preview-content', card);
    q('.work-preview-details', dialog).replaceChildren(...(template ? [template.content.cloneNode(true)] : []));
    dialog.classList.toggle('is-simple', !visual);
    q('.work-case-link', dialog).href = url;
  }

  function open(card, source) {
    if (!href(card) || dialog.open) return;
    trigger = source;
    openingScroll = scrollY;
    closing = false;
    renderPreview(card);
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    dialogSession = true;
    document.dispatchEvent(new CustomEvent('portfolio:project-dialog'));
    document.documentElement.style.overflow = 'hidden';
    dialog.scrollTop = 0;
    closeButton.focus({preventScroll:true});
    // Modal focus and scrollbar changes must not move a pinned scene.
    scrollTo({top:openingScroll,behavior:'instant'});
    animateDialog(true);
    bookFrame = requestAnimationFrame(() => { bookFrame = requestAnimationFrame(() => {
      if (dialog.open) dialog.classList.add('is-book-open');
    }); });
  }

  function cleanClose() {
    if (!dialogSession || dialog.open) return;
    dialogSession = false;
    cancelAnimationFrame(bookFrame);
    dialog.classList.remove('is-book-open');
    dialogAnimation?.cancel(); dialogAnimation = null; closing = false;
    document.documentElement.style.overflow = previousOverflow;
    scrollTo({top:openingScroll,behavior:'instant'});
    const restore = trigger?.isConnected && !trigger.closest('[inert],[hidden]') ? trigger : buttons[selected];
    restore?.focus({preventScroll:true});
    trigger = null;
    document.dispatchEvent(new CustomEvent('portfolio:project-dialog'));
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    dialog.close();
    cleanClose();
  }

  function refresh() {
    const hadFocus = picker.contains(document.activeElement);
    cards = qa('.project', grid).filter(card => heading(card) && href(card));
    if (!cards.length) {
      if (dialog.open) dialog.close();
      showcase.classList.remove('is-ready');
      navigation.hidden = true;
      grid.style.removeProperty('min-height');
      picker.replaceChildren();
      return;
    }
    buttons = cards.map((card, i) => {
      card.removeAttribute('data-reveal');
      q('.project-visual', card)?.removeAttribute('data-depth');
      card.classList.toggle('is-empty-cover', !q('.project-visual', card));
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `${i + 1} of ${cards.length}`);
      const coverTitle = q('.cover-bottom', card);
      if (coverTitle) coverTitle.firstChild.textContent = title(card);
      if (!q('.work-open', card)) {
        const openButton = button('work-open', `Explore ${title(card)}`);
        openButton.append(document.createTextNode('Explore project'));
        const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); openButton.append(arrow);
        card.append(openButton);
        const selector = button('work-card-select', `Select ${title(card)}`);
        selector.tabIndex = -1; selector.setAttribute('aria-hidden', 'true'); card.append(selector);
      }
      q('.work-open', card).setAttribute('aria-label', `Explore ${title(card)}`);
      const b = button('work-pick', `Show ${title(card)}`);
      b.textContent = String(i + 1).padStart(2, '0');
      b.addEventListener('click', () => select(i));
      return b;
    });
    picker.replaceChildren(...buttons);
    navigation.hidden = false;
    showcase.classList.add('is-ready');
    showcase.setAttribute('role', 'region');
    showcase.setAttribute('aria-roledescription', 'carousel');
    showcase.setAttribute('aria-label', 'Selected projects');
    const retained = cards.findIndex(card => href(card) === selectedHref);
    select(retained >= 0 ? retained : 0, false);
    if (dialog.open) { if (retained >= 0) renderPreview(cards[selected]); else dialog.close(); }
    if (hadFocus) buttons[selected].focus({preventScroll:true});
    q('.work-previous', showcase).disabled = cards.length < 2;
    q('.work-next', showcase).disabled = cards.length < 2;
    measure();
  }

  grid.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const card = e.target.closest('.project');
    const i = cards.indexOf(card);
    if (i < 0) return;
    if (performance.now() < suppressClickUntil) { e.preventDefault(); return; }
    if (i !== selected) { e.preventDefault(); select(i); return; }
    const source = e.target.closest('a, .work-open');
    if (source) { e.preventDefault(); open(card, source); }
  });
  // The opening scene and archive share the same canonical project preview.
  document.querySelector('.scene-journey')?.addEventListener('click', e => {
    const source=e.target.closest('[data-journey-book],[data-journey-project-open]');
    if(!source || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    const index=cards.findIndex(card=>href(card)===source.href);
    if(index<0)return; // Native case-study link remains the fallback.
    e.preventDefault();select(index,false);open(cards[index],source);
  });
  document.querySelectorAll('[data-journey-book],[data-journey-project-open]').forEach(el=>el.setAttribute('aria-haspopup','dialog'));
  q('.work-previous', showcase).addEventListener('click', () => select(selected - 1));
  q('.work-next', showcase).addEventListener('click', () => select(selected + 1));
  showcase.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? cards.length - 1 : selected + (e.key === 'ArrowRight' ? 1 : -1);
    select(next);
    buttons[selected]?.focus({preventScroll:true});
  });

  function cancelGesture() {
    gesture = null;
    showcase.classList.remove('is-dragging');
    cards.forEach(card => card.style.removeProperty('--work-drag'));
  }
  grid.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0 || cards.length < 2) return;
    gesture = {id:e.pointerId, x:e.clientX, y:e.clientY, dx:0, dy:0};
  }, {passive:true});
  grid.addEventListener('pointermove', e => {
    if (!gesture || e.pointerId !== gesture.id) return;
    gesture.dx = e.clientX - gesture.x; gesture.dy = e.clientY - gesture.y;
    if (Math.abs(gesture.dy) > 14 && Math.abs(gesture.dy) > Math.abs(gesture.dx)) return cancelGesture();
    if (Math.abs(gesture.dx) < 10 || Math.abs(gesture.dx) < Math.abs(gesture.dy) * 1.3) return;
    if (!grid.hasPointerCapture(e.pointerId)) grid.setPointerCapture(e.pointerId);
    if (motion()) {
      showcase.classList.add('is-dragging');
      cards[selected].style.setProperty('--work-drag', `${Math.max(-35,Math.min(35,gesture.dx * .22))}px`);
    }
  }, {passive:true});
  grid.addEventListener('pointerup', e => {
    if (!gesture || e.pointerId !== gesture.id) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    cancelGesture();
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { suppressClickUntil = performance.now() + 400; select(selected + (dx < 0 ? 1 : -1)); }
  }, {passive:true});
  grid.addEventListener('pointercancel', cancelGesture, {passive:true});
  grid.addEventListener('lostpointercapture', cancelGesture, {passive:true});
  grid.addEventListener('dragstart', e => e.preventDefault());
  closeButton.addEventListener('click', close);
  dialog.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = qa('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', dialog).filter(el => el.getClientRects().length && !el.closest('[hidden]'));
    const first = focusable[0], last = focusable.at(-1);
    if (!first) { e.preventDefault(); return; }
    if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });
  dialog.addEventListener('close', cleanClose);
  const stopAnimation = () => { if (!motion()) { dialogAnimation?.cancel(); stopCards(); cancelGesture(); } };
  new MutationObserver(stopAnimation).observe(document.documentElement, {attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change', stopAnimation);
  forced.addEventListener('change', stopAnimation);
  let measuredWidth = innerWidth;
  window.addEventListener('resize', () => {
    if (innerWidth === measuredWidth) return; // Browser chrome changes height during a phone swipe.
    measuredWidth = innerWidth; cancelGesture(); measure();
  }, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(grid);
  document.addEventListener('portfolio:content', refresh);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelGesture(); stopCards(); dialogAnimation?.cancel(); } });
  window.addEventListener('pagehide', () => { if (dialog.open) dialog.close(); stopCards(); cancelGesture(); });
  refresh();
  document.fonts?.ready.then(measure);
})();
