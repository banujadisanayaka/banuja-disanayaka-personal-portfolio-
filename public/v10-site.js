(() => {
  'use strict';
  const loadScript = (src, marker) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[${marker}]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute(marker, '');
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

  loadScript('/v10-site-legacy.js?v=2615826a0e8b', 'data-v10-legacy')
    .catch(() => {})
    .finally(() => loadScript('/v12-site.js?v=1200', 'data-v12-engine').catch(() => {}));
})();
