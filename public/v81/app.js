(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safeExternal(anchor, url) {
    if (!anchor || typeof url !== "string" || !url) return;
    anchor.href = url;
    if (/^https:\/\//i.test(url)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  }

  async function loadContent() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch("/api/content", {
        method: "GET",
        credentials: "same-origin",
        headers: { accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && payload.content ? payload.content : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  function bindProfile(content) {
    const profile = content && content.profile;
    if (!profile) return;
    const values = {
      "profile.heroEyebrow": profile.heroEyebrow,
      "profile.firstName": profile.firstName,
      "profile.lastName": profile.lastName,
      "profile.heroLede": profile.heroLede,
      "profile.location": profile.location,
      "profile.focus": profile.focus,
      "profile.aboutHeading": profile.aboutHeading,
      "profile.aboutIntro": profile.aboutIntro
    };
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value !== "string" || !value.trim()) return;
      qsa(`[data-bind="${key}"]`).forEach((node) => { node.textContent = value.trim(); });
    });

    const cv = qs("#cvLink");
    if (cv && profile.cvUrl) safeExternal(cv, profile.cvUrl);

    const portraitUrl = profile.suitImage || profile.aboutImage;
    const portrait = qs("#heroPortrait");
    const fallback = qs("#portraitFallback");
    if (portrait && portraitUrl) {
      portrait.onload = () => {
        portrait.hidden = false;
        if (fallback) fallback.hidden = true;
      };
      portrait.onerror = () => {
        portrait.hidden = true;
        if (fallback) fallback.hidden = false;
      };
      portrait.src = portraitUrl;
    }
  }

  function setupMenu() {
    const button = qs("#menuButton");
    const nav = qs("#siteNav");
    if (!button || !nav) return;

    const close = (focusButton = false) => {
      nav.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      if (focusButton) button.focus({ preventScroll: true });
    };

    button.addEventListener("click", () => {
      const opening = button.getAttribute("aria-expanded") !== "true";
      nav.classList.toggle("open", opening);
      button.setAttribute("aria-expanded", String(opening));
      document.body.classList.toggle("menu-open", opening);
      if (opening) {
        const first = qs("a", nav);
        if (first) first.focus({ preventScroll: true });
      }
    });

    qsa("a", nav).forEach((link) => link.addEventListener("click", () => close(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) close(true);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820 && nav.classList.contains("open")) close(false);
    }, { passive: true });
  }

  function setupReveal() {
    if (reducedMotion || !("IntersectionObserver" in window)) return;
    const targets = qsa(".project-card,.photo-card,.timeline article,.capabilities span,.veloria-card,.contact-grid a");
    targets.forEach((node) => node.classList.add("reveal-ready"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    targets.forEach((node) => observer.observe(node));
  }

  function ensureFocusVisibility() {
    document.addEventListener("focusin", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const rect = target.getBoundingClientRect();
      if (rect.top < 76 || rect.bottom > window.innerHeight - 12) {
        target.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      }
    });
  }

  setupMenu();
  setupReveal();
  ensureFocusVisibility();
  loadContent().then(bindProfile);
})();