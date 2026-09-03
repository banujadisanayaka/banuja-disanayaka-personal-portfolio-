(() => {
  "use strict";

  const FALLBACK_PORTRAIT = "/banu-portrait.svg";

  function installPortraitFallback() {
    const img = document.querySelector("#heroPortrait");
    const placeholder = document.querySelector("#portraitPlaceholder");
    if (!img) return;

    let fallbackApplied = false;
    const useFallback = () => {
      const src = img.getAttribute("src") || "";
      if (src && !src.startsWith("blob:") && src !== FALLBACK_PORTRAIT && !img.hidden) return;
      fallbackApplied = true;
      img.onload = () => {
        img.hidden = false;
        if (placeholder) placeholder.hidden = true;
      };
      img.onerror = null;
      img.src = FALLBACK_PORTRAIT;
      img.hidden = false;
      if (placeholder) placeholder.hidden = true;
    };

    const observer = new MutationObserver(() => {
      if (fallbackApplied && img.getAttribute("src") === FALLBACK_PORTRAIT) return;
      if (!img.getAttribute("src") || img.hidden) useFallback();
    });
    observer.observe(img, { attributes: true, attributeFilter: ["src", "hidden"] });

    window.setTimeout(useFallback, 120);
    window.setTimeout(useFallback, 2900);
    window.setTimeout(() => observer.disconnect(), 5200);
  }

  function tagProjectVisuals() {
    document.querySelectorAll("[data-project]").forEach((card, index) => {
      const visual = card.querySelector(".project-visual");
      if (!visual) return;
      visual.setAttribute("aria-hidden", "true");
      visual.dataset.system = String(index + 1).padStart(2, "0");
    });
  }

  function init() {
    installPortraitFallback();
    tagProjectVisuals();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
