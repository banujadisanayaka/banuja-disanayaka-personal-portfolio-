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

  loadScript('/v10-site-legacy.js?v=d3e532549626', 'data-v10-legacy')
    .catch(() => {})
    .finally(() => loadScript('/v11-site.js?v=1100', 'data-v11-engine').catch(() => {}));
})();
