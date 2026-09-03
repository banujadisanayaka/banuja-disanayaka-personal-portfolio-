(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  function safeExternal(anchor, url) {
    if (!anchor || typeof url !== "string" || !url.trim()) return;
    anchor.href = url.trim();
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

    const focusables = () => qsa("a[href]", nav).filter((node) => !node.hasAttribute("hidden"));

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
      if (opening) focusables()[0]?.focus({ preventScroll: true });
    });

    qsa("a", nav).forEach((link) => link.addEventListener("click", () => close(false)));

    document.addEventListener("pointerdown", (event) => {
      if (!nav.classList.contains("open")) return;
      if (nav.contains(event.target) || button.contains(event.target)) return;
      close(false);
    });

    document.addEventListener("keydown", (event) => {
      if (!nav.classList.contains("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820 && nav.classList.contains("open")) close(false);
    }, { passive: true });
  }

  function setupReveal() {
    const targets = qsa(".project-card,.photo-card,.timeline article,.capabilities span,.edu-card,.veloria-card,.contact-grid a");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((node) => node.classList.add("reveal-in"));
      return;
    }
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

  function setupActiveNavigation() {
    const nav = qs("#siteNav");
    const sections = qsa("[data-nav-section]");
    if (!nav || !sections.length || !("IntersectionObserver" in window)) return;

    const links = qsa("a[href^='#']", nav);
    const setActive = (id) => {
      links.forEach((link) => {
        const active = link.getAttribute("href") === `#${id}`;
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) setActive(visible[0].target.id);
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: "-22% 0px -55% 0px" });

    sections.forEach((section) => observer.observe(section));
    setActive("home");
  }

  function setupMobileDock() {
    const dock = qs("#mobileDock");
    const contact = qs("#contact");
    if (!dock || !contact) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => dock.classList.toggle("is-hidden", entry.isIntersecting));
    }, { threshold: 0.18 });
    observer.observe(contact);
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

  function setupPointerDepth() {
    if (reducedMotion || coarsePointer) return;
    const shell = qs("#portraitShell");
    if (!shell) return;

    shell.addEventListener("pointermove", (event) => {
      const rect = shell.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      shell.style.transform = `perspective(1000px) rotateY(${x * 2.8}deg) rotateX(${y * -2.2}deg)`;
    });
    shell.addEventListener("pointerleave", () => { shell.style.transform = ""; });
  }

  setupMenu();
  setupReveal();
  setupActiveNavigation();
  setupMobileDock();
  ensureFocusVisibility();
  setupPointerDepth();
  loadContent().then(bindProfile);
})();