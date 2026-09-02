(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const meter = document.querySelector('#caseMeter');

  const updateMeter = () => {
    if (!meter) return;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = Math.min(100, Math.max(0, scrollY / max * 100));
    meter.style.width = `${progress}%`;
  };

  let ticking = false;
  const scheduleMeter = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateMeter();
      ticking = false;
    });
  };

  addEventListener('scroll', scheduleMeter, { passive: true });
  addEventListener('resize', scheduleMeter, { passive: true });
  addEventListener('orientationchange', scheduleMeter, { passive: true });
  addEventListener('pageshow', scheduleMeter, { passive: true });
  updateMeter();

  const items = [...document.querySelectorAll('.reveal')];
  if (!reduced && 'IntersectionObserver' in window) items.forEach(el => el.classList.add('reveal-pending'));
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => observer.observe(el));
  }
})();