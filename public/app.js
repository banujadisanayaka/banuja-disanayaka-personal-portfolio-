(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  const state = {
    content: null,
    roles: ["DESIGN", "SYSTEMS", "PHOTOGRAPHY", "PRODUCT"],
    roleIndex: 0,
    bootDone: false,
    heroVisible: true
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setText(selector, value) {
    const el = qs(selector);
    if (el && typeof value === "string") el.textContent = value.trim();
  }

  function safeExternalAnchor(anchor, url) {
    if (!anchor || !url) return;
    anchor.href = url;
    if (/^https:\/\//i.test(url)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  }

  function finishBoot() {
    if (state.bootDone) return;
    state.bootDone = true;
    const boot = qs("#boot");
    const progress = qs("#bootProgress");
    if (progress) progress.style.width = "100%";
    window.setTimeout(() => {
      if (boot) boot.classList.add("is-done");
      try { sessionStorage.setItem("bd-visited", "1"); } catch {}
    }, reducedMotion ? 0 : 220);
  }

  function runBoot() {
    const boot = qs("#boot");
    const progress = qs("#bootProgress");
    const label = qs("#bootLabel");
    if (!boot || !progress) return;

    let visited = false;
    try { visited = sessionStorage.getItem("bd-visited") === "1"; } catch {}

    if (visited || reducedMotion) {
      progress.style.width = "100%";
      finishBoot();
      return;
    }

    const sequence = [
      [18, "READING PROFILE"],
      [39, "MAPPING PROJECTS"],
      [63, "CALIBRATING VISUAL SYSTEM"],
      [84, "LOADING EXPERIENCE"],
      [100, "READY"]
    ];

    let index = 0;
    const tick = () => {
      if (index >= sequence.length) {
        finishBoot();
        return;
      }
      const [value, text] = sequence[index++];
      progress.style.width = value + "%";
      if (label) label.textContent = text;
      window.setTimeout(tick, index === sequence.length ? 120 : 180);
    };
    tick();

    window.setTimeout(finishBoot, 1900);
  }

  async function loadContent() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2600);
    try {
      const response = await fetch("/api/content", {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal,
        credentials: "same-origin"
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && payload.content ? payload.content : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function applyProfile(content) {
    const profile = content && content.profile;
    if (!profile) return;

    const bindings = {
      "profile.heroEyebrow": profile.heroEyebrow,
      "profile.firstName": profile.firstName,
      "profile.lastName": profile.lastName,
      "profile.heroLede": profile.heroLede,
      "profile.location": profile.location,
      "profile.focus": profile.focus,
      "profile.aboutHeading": profile.aboutHeading,
      "profile.aboutIntro": profile.aboutIntro
    };

    Object.entries(bindings).forEach(([key, value]) => {
      if (typeof value !== "string") return;
      qsa(`[data-bind="${key}"]`).forEach(el => { el.textContent = value; });
    });

    if (Array.isArray(profile.roles) && profile.roles.length) {
      state.roles = profile.roles.filter(Boolean).slice(0, 8);
    }

    const cvLink = qs("#cvLink");
    if (cvLink) {
      if (profile.cvUrl) {
        safeExternalAnchor(cvLink, profile.cvUrl);
        cvLink.hidden = false;
      } else {
        cvLink.hidden = true;
      }
    }

    const aboutPortrait = qs("#aboutPortrait");
    const aboutPortraitFrame = qs("#aboutPortraitFrame");
    if (aboutPortrait && aboutPortraitFrame) {
      aboutPortraitFrame.hidden = true;
      if (profile.aboutImage) {
        aboutPortrait.onload = () => { aboutPortraitFrame.hidden = false; };
        aboutPortrait.onerror = () => { aboutPortraitFrame.hidden = true; };
        aboutPortrait.src = profile.aboutImage;
      } else {
        aboutPortrait.removeAttribute("src");
      }
    }

    const aboutSupport = qs("#aboutSupport");
    setText("#aboutCardTitle", profile.aboutCardTitle || "");
    setText("#aboutCardBody", profile.aboutCardBody || "");
    if (aboutSupport) aboutSupport.hidden = !(profile.aboutCardTitle || profile.aboutCardBody);

    const portraitUrl = profile.suitImage || profile.aboutImage;
    const img = qs("#heroPortrait");
    const placeholder = qs("#portraitPlaceholder");
    if (img) {
      img.hidden = true;
      if (placeholder) placeholder.hidden = false;
      if (portraitUrl) {
        img.onload = () => {
          img.hidden = false;
          if (placeholder) placeholder.hidden = true;
        };
        img.onerror = () => {
          img.hidden = true;
          if (placeholder) placeholder.hidden = false;
        };
        img.src = portraitUrl;
      } else {
        img.removeAttribute("src");
      }
    }

    if (content.settings) {
      setText("#bootLabel", content.settings.bootText || "");
      setText("#footerLeft", content.settings.footerLeft || "");
      setText("#footerRight", content.settings.footerRight || "");
      const archive = qs("#gazeArchiveLink");
      if (archive) safeExternalAnchor(archive, content.settings.dailyGazeArchive || "#contact");
    }
  }

  function buildProject(project, index) {
    const article = document.createElement("article");
    const tones = ["tone-amber", "tone-ice", "tone-violet", "tone-signal"];
    article.className = `project-card reveal ${tones[index % tones.length]}`;
    article.dataset.project = "";

    const number = document.createElement("div");
    number.className = "project-index";
    number.textContent = project.no || String(index + 1).padStart(2, "0");

    const visual = document.createElement("div");
    visual.className = "project-visual";
    const wire = document.createElement("div");
    wire.className = "wireframe";
    const visualNumber = document.createElement("div");
    visualNumber.className = "visual-number";
    visualNumber.textContent = project.no || String(index + 1).padStart(2, "0");
    const scanline = document.createElement("span");
    scanline.className = "scanline";
    visual.append(wire, visualNumber, scanline);

    const copy = document.createElement("div");
    copy.className = "project-copy";

    const kicker = document.createElement("p");
    kicker.className = "project-kicker";
    kicker.textContent = project.tags || "SELECTED PROJECT";

    const title = document.createElement("h3");
    title.textContent = project.title || "Untitled Project";

    const description = document.createElement("p");
    description.className = "project-desc";
    description.textContent = project.description || "";

    const tags = document.createElement("p");
    tags.className = "project-tags";
    tags.textContent = project.tags || "";

    copy.append(kicker, title, description, tags);

    const open = document.createElement("a");
    open.className = "project-open";
    open.append(document.createTextNode(project.url ? "Explore " : "Case study "), document.createElement("span"));
    open.lastElementChild.textContent = "↗";
    safeExternalAnchor(open, project.url || "#contact");

    article.append(number, visual, copy, open);
    return article;
  }

  function applyProjects(content) {
    if (!content || !Array.isArray(content.projects)) return;
    const list = qs("#projectList");
    if (!list) return;
    list.replaceChildren(...content.projects.slice(0, 8).map(buildProject));
  }

  function buildGazeCard(item, index) {
    const article = document.createElement("article");
    article.className = "gaze-card";
    const label = document.createElement("span");
    label.textContent = item.category || item.title || `IMAGE ${String(index + 1).padStart(2, "0")}`;

    if (item.preview) {
      const img = document.createElement("img");
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.alt = item.alt || item.title || "The Daily Gaze photograph";
      img.width = 1000;
      img.height = 1250;
      img.sizes = "(max-width: 650px) 86vw, 34vw";
      img.src = item.preview;
      try {
        const previewUrl = new URL(item.preview, location.origin);
        if (previewUrl.hostname === "drive.google.com" && previewUrl.pathname === "/thumbnail") {
          const id = previewUrl.searchParams.get("id");
          if (id) {
            img.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000`;
            img.srcset = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600 600w, https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000 1000w`;
          }
        }
      } catch {}
      article.append(img);
    } else {
      article.classList.add("placeholder-photo", ["one", "two", "three"][index % 3]);
    }

    article.append(label);

    if (item.download) {
      const anchor = document.createElement("a");
      anchor.href = item.download;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-label", `Open ${item.title || "photograph"}`);
      anchor.style.position = "absolute";
      anchor.style.inset = "0";
      anchor.style.zIndex = "3";
      article.append(anchor);
    }

    return article;
  }

  function applyDailyGaze(content) {
    if (!content || !Array.isArray(content.dailyGaze)) return;
    const track = qs("#gazeTrack");
    if (!track) return;
    track.replaceChildren(...content.dailyGaze.slice(0, 6).map(buildGazeCard));
  }

  function applyEcosystem(content) {
    if (!content || !Array.isArray(content.ecosystem)) return;
    const nodes = qs("#ecoNodes");
    if (!nodes) return;

    const cards = content.ecosystem.slice(0, 6).map(item => {
      const article = document.createElement("article");
      if (item.logo) {
        const img = document.createElement("img");
        img.src = item.logo;
        img.alt = "";
        img.loading = "lazy";
        img.style.width = "34px";
        img.style.height = "34px";
        img.style.objectFit = "contain";
        img.style.marginBottom = "8px";
        article.append(img);
      }
      const strong = document.createElement("strong");
      strong.textContent = item.name || "VELORIA";
      const span = document.createElement("span");
      span.textContent = item.description || "Brand ecosystem";
      article.append(strong, span);
      return article;
    });

    nodes.replaceChildren(...cards);
  }

  function applyCareer(content) {
    if (content && Array.isArray(content.metrics)) {
      const metrics = qs("#metrics");
      if (metrics) {
        const cells = content.metrics.slice(0, 4).map(item => {
          const div = document.createElement("div");
          const strong = document.createElement("strong");
          strong.textContent = item.value || "—";
          const span = document.createElement("span");
          span.textContent = item.label || "";
          div.append(strong, span);
          return div;
        });
        metrics.replaceChildren(...cells);
      }
    }

    if (content && Array.isArray(content.career)) {
      const timeline = qs("#careerTimeline");
      if (timeline) {
        const rows = content.career.slice(0, 8).map(item => {
          const article = document.createElement("article");
          const year = document.createElement("span");
          year.textContent = item.year || "";
          const wrap = document.createElement("div");
          const title = document.createElement("h3");
          title.textContent = item.title || "";
          const company = document.createElement("p");
          company.textContent = item.company || "";
          wrap.append(title, company);
          article.append(year, wrap);
          return article;
        });
        timeline.replaceChildren(...rows);
      }
    }
  }

  function applyContact(content) {
    const contact = content && content.contact;
    if (!contact) return;

    if (contact.email) {
      const link = qs("#emailLink");
      if (link) {
        link.href = "mailto:" + contact.email;
        const strong = qs("strong", link);
        if (strong) strong.textContent = contact.email;
      }
    }

    const message = contact.whatsappMessage ? "?text=" + encodeURIComponent(contact.whatsappMessage) : "";

    if (contact.whatsappSriLanka) {
      const link = qs("#waSriLink");
      if (link) {
        link.href = "https://wa.me/" + contact.whatsappSriLanka + message;
        const strong = qs("strong", link);
        if (strong) strong.textContent = contact.whatsappSriLankaDisplay || "+" + contact.whatsappSriLanka;
      }
    }

    if (contact.whatsappMalaysia) {
      const link = qs("#waMyLink");
      if (link) {
        link.href = "https://wa.me/" + contact.whatsappMalaysia + message;
        const strong = qs("strong", link);
        if (strong) strong.textContent = contact.whatsappMalaysiaDisplay || "+" + contact.whatsappMalaysia;
      }
    }

    if (contact.github) {
      const link = qs("#githubLink");
      if (link) {
        safeExternalAnchor(link, contact.github);
        const strong = qs("strong", link);
        if (strong && contact.githubDisplay) strong.textContent = contact.githubDisplay;
      }
    }
  }

  function applyVisibilitySettings(content) {
    const settings = content && content.settings;
    if (!settings) return;

    const mapping = {
      showWork: "#work",
      showGaze: "#photography",
      showEcosystem: "#ecosystem",
      showAbout: "#about",
      showCareer: "#experience",
      showContact: "#contact"
    };

    Object.entries(mapping).forEach(([key, selector]) => {
      const hidden = settings[key] === false;
      const section = qs(selector);
      if (section) section.hidden = hidden;
      qsa(`a[href="${selector}"]`).forEach(a => { a.hidden = hidden; });
    });
  }

  function applyContent(content) {
    if (!content) return;
    state.content = content;
    applyProfile(content);
    applyProjects(content);
    applyDailyGaze(content);
    applyEcosystem(content);
    applyCareer(content);
    applyContact(content);
    applyVisibilitySettings(content);
  }

  function initRoleCycle() {
    const word = qs("#roleWord");
    if (!word || reducedMotion) return;

    window.setInterval(() => {
      if (!state.roles.length || document.hidden || !state.heroVisible) return;
      state.roleIndex = (state.roleIndex + 1) % state.roles.length;
      word.classList.remove("swap");
      void word.offsetWidth;
      word.textContent = state.roles[state.roleIndex];
      word.classList.add("swap");
    }, 2200);
  }

  function initReveal() {
    const elements = qsa(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add("is-visible"));
      return;
    }

    elements.forEach(el => el.classList.add("reveal-pending"));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    elements.forEach(el => observer.observe(el));
  }

  function initVisibilityBudget() {
    if (!("IntersectionObserver" in window)) return;

    const hero = qs("#home");
    const about = qs("#about");

    if (hero) {
      const heroObserver = new IntersectionObserver(([entry]) => {
        state.heroVisible = Boolean(entry?.isIntersecting);
        hero.classList.toggle("is-in-view", state.heroVisible);
      }, { threshold: 0.02 });
      heroObserver.observe(hero);
    }

    if (about) {
      const aboutObserver = new IntersectionObserver(([entry]) => {
        about.classList.toggle("is-in-view", Boolean(entry?.isIntersecting));
      }, { threshold: 0.05 });
      aboutObserver.observe(about);
    }
  }

  function initMenu() {
    const button = qs("#menuToggle");
    const panel = qs("#navPanel");
    const identity = qs(".identity");
    const main = qs("#main");
    const footer = qs(".footer");
    if (!button || !panel) return;

    const desktopQuery = window.matchMedia("(min-width: 981px)");
    const focusable = () => qsa('a[href]:not([hidden]),button:not([disabled]),[tabindex]:not([tabindex="-1"])', panel)
      .filter(el => !el.hidden && el.getClientRects().length);

    const setInert = (elements, value) => {
      elements.filter(Boolean).forEach(el => {
        if (value) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
      });
    };

    const setPanelClosedState = () => {
      if (desktopQuery.matches) {
        panel.removeAttribute("inert");
        panel.removeAttribute("aria-hidden");
      } else {
        panel.setAttribute("inert", "");
        panel.setAttribute("aria-hidden", "true");
      }
    };

    const close = ({ restoreFocus = true } = {}) => {
      const wasOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      setInert([identity, main, footer], false);
      setPanelClosedState();
      const label = qs("span", button);
      if (label) label.textContent = "Menu";
      if (wasOpen && restoreFocus) button.focus({ preventScroll: true });
    };

    const open = () => {
      if (desktopQuery.matches) return;
      button.setAttribute("aria-expanded", "true");
      panel.removeAttribute("inert");
      panel.removeAttribute("aria-hidden");
      panel.classList.add("is-open");
      document.body.classList.add("menu-open");
      setInert([identity, main, footer], true);
      const label = qs("span", button);
      if (label) label.textContent = "Close";
      requestAnimationFrame(() => focusable()[0]?.focus({ preventScroll: true }));
    };

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      if (isOpen) close();
      else open();
    });

    qsa("a", panel).forEach(a => a.addEventListener("click", () => close({ restoreFocus: false })));
    window.addEventListener("keydown", event => {
      if (button.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        button.focus({ preventScroll: true });
        return;
      }
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

    const syncMode = () => {
      if (desktopQuery.matches) close({ restoreFocus: false });
      else setPanelClosedState();
    };
    desktopQuery.addEventListener?.("change", syncMode);
    syncMode();
  }

  function initPointer() {
    if (coarsePointer || reducedMotion) return;

    const portrait = qs("#portraitStage");
    let pointerFrame = 0;
    let lastEvent = null;

    const renderPointer = () => {
      pointerFrame = 0;
      const event = lastEvent;
      if (!event) return;
      document.documentElement.style.setProperty("--mx", event.clientX + "px");
      document.documentElement.style.setProperty("--my", event.clientY + "px");

      if (portrait) {
        const rect = portrait.getBoundingClientRect();
        const px = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
        const py = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
        portrait.style.setProperty("--px", px.toFixed(3));
        portrait.style.setProperty("--py", py.toFixed(3));
      }
    };

    window.addEventListener("pointermove", event => {
      lastEvent = event;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
    }, { passive: true });

    qsa(".magnetic").forEach(el => {
      el.addEventListener("pointermove", event => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  function initProjectTilt() {
    if (coarsePointer || reducedMotion) return;

    qsa("[data-project]").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1200px) rotateX(${(-y * 1.8).toFixed(2)}deg) rotateY(${(x * 1.8).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  function initScrollMeter() {
    const meter = qs("#scrollMeter");
    if (!meter) return;
    let ticking = false;

    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      meter.style.width = (progress * 100).toFixed(2) + "%";
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  function initAmbientCanvas() {
    if (reducedMotion) return;
    const canvas = qs("#ambientCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let pageVisible = !document.hidden;
    let heroActive = true;

    const particles = Array.from({ length: coarsePointer ? 18 : 34 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.35 + Math.random() * 1.2,
      speed: 0.000018 + Math.random() * 0.00005,
      drift: (Math.random() - 0.5) * 0.000015,
      phase: i * 0.67
    }));

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(1.6, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const schedule = () => {
      if (frame || !pageVisible || !heroActive) return;
      frame = requestAnimationFrame(draw);
    };

    function draw(time) {
      frame = 0;
      if (!pageVisible || !heroActive) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(235,226,210,.36)";

      particles.forEach(p => {
        p.y -= p.speed * 16;
        p.x += p.drift * 16 + Math.sin(time * 0.0003 + p.phase) * 0.000004;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      schedule();
    }

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    document.addEventListener("visibilitychange", () => {
      pageVisible = !document.hidden;
      if (pageVisible) schedule();
      else stop();
    });

    if ("IntersectionObserver" in window) {
      const hero = qs("#home");
      if (hero) {
        const observer = new IntersectionObserver(([entry]) => {
          heroActive = Boolean(entry?.isIntersecting);
          if (heroActive) schedule();
          else stop();
        }, { threshold: 0.01 });
        observer.observe(hero);
      }
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();
    schedule();
  }

  async function boot() {
    runBoot();
    initMenu();
    initPointer();
    initScrollMeter();
    initVisibilityBudget();
    initAmbientCanvas();

    const content = await loadContent();
    applyContent(content);
    finishBoot();

    initRoleCycle();
    initReveal();
    initProjectTilt();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();