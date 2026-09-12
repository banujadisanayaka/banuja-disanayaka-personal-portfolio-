// Original portfolio photographs form the spatial scenes. No entrance gate.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photo = (g, eager = false) => `<img src="${esc(g.derivatives?.[1]?.url || g.preview)}" width="${g.width}" height="${g.height}" alt="${esc(g.alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async" draggable="false">`;

export function opening(picture, featured, profile) {
  return `<section class="hero v10-hero" id="opening" aria-label="Introduction">
    <div class="edition-line"><span>INDEPENDENT MIND. CONNECTED DISCIPLINES.</span><span data-text="profile.location">Based in Sri Lanka</span></div>
    <h1><span data-text="profile.firstName">Banuja</span><span data-text="profile.lastName">Disanayaka</span></h1>
    <div class="hero-copy"><p class="eyebrow" data-text="profile.heroEyebrow">${esc(profile.heroEyebrow)}</p><p class="hero-lede" data-text="profile.heroLede">${esc(profile.heroLede)}</p><div class="hero-actions"><a class="button primary" href="#work">Explore selected work <span aria-hidden="true">↗</span></a><a class="text-link" href="/about/">My story ↗</a></div></div>
    <div class="hero-image" data-hero-scene>
      <div class="perspective-orbit" role="group" aria-label="Explore my perspectives" data-orbit>
        <div class="orbit-track" aria-hidden="true"></div>
        <button class="hero-card" type="button" data-hero-select="0" aria-label="Bring the person forward" aria-pressed="true"><span class="portrait-frame" data-depth>${picture('portrait','Banuja Disanayaka in a navy suit, standing in a studio.','',true)}</span><span class="hero-card-caption"><span>01 / THE PERSON</span><span>People & process</span></span></button>
        <button class="hero-card" type="button" data-hero-select="1" aria-label="Bring the designer forward" aria-pressed="false"><span class="hero-card-image">${picture('about','Banuja beside a display of his graphic design work.')}</span><span class="hero-card-caption"><span>02 / THE DESIGNER</span><span>Form & meaning</span></span></button>
        <button class="hero-card" type="button" data-hero-select="2" aria-label="Bring the photographer forward" aria-pressed="false"><span class="hero-card-image">${photo(featured[0],true)}</span><span class="hero-card-caption"><span>03 / THE OBSERVER</span><span>The Daily Gaze</span></span></button>
      </div>
      <div class="orbit-controls" hidden><span>Drag to turn the perspective</span><div><button type="button" data-orbit-prev aria-label="Previous perspective">←</button><button type="button" data-orbit-next aria-label="Next perspective">→</button></div><span data-orbit-status role="status" aria-live="polite">01 / 03</span></div>
    </div>
    <div class="opening-foot"><span>PEOPLE. SYSTEMS. VISUAL STORIES.</span><a href="#approach">Scroll to unfold <span aria-hidden="true">↓</span></a></div>
  </section>`;
}

export function story(featured) {
  return `<section class="v10-story" id="approach" aria-labelledby="approach-heading">
    <div class="story-heading"><p class="eyebrow">HOW I SEE. HOW I MAKE.</p><h2 id="approach-heading">Everything starts<br>with <em>a closer look.</em></h2><span class="story-intro-note">An observation becomes a connection.<br>A connection becomes something useful.</span></div>
    <div class="story-journey">
      <div class="story-visual" aria-label="Observation, design and a working system">
        <div class="story-words" aria-hidden="true"><span data-word="0">OBSERVE</span><span data-word="1">CONNECT</span><span data-word="2">CREATE</span></div>
        <div class="story-path" aria-hidden="true"><i></i></div>
        <figure class="story-art is-current" data-art="0"><div class="story-photo">${photo(featured[0])}</div><figcaption><span>THE DAILY GAZE</span><strong>A different way of seeing.</strong><span>01 / OBSERVATION</span></figcaption></figure>
        <figure class="story-art" data-art="1"><div class="story-photo"><img src="/assets/v9/about-960.webp" width="628" height="628" alt="Banuja presenting his graphic design work." loading="lazy" decoding="async" draggable="false"></div><figcaption><span>VISUAL DESIGN</span><strong>Make the message clear.</strong><span>02 / CONNECTION</span></figcaption></figure>
        <figure class="story-art story-system" data-art="2"><div class="story-system-sheet"><div class="system-masthead"><span>TFC / ORDER FLOW</span><span aria-hidden="true">↗</span></div><span class="system-title">An idea.<br>A system.<br><em>A clear next step.</em></span><ol><li><span>01</span><div><strong>Capture the order</strong><small>One shared starting point</small></div><i aria-hidden="true"></i></li><li><span>02</span><div><strong>Coordinate production</strong><small>The right task, at the right time</small></div><i aria-hidden="true"></i></li><li><span>03</span><div><strong>Track fulfilment</strong><small>Carry the detail through</small></div><i aria-hidden="true"></i></li></ol><a class="text-link" href="/work/tfc-orders-tracker/">Explore the system ↗</a></div><figcaption><span>PRODUCT WORK</span><strong>Ideas, made useful.</strong><span>03 / CREATION</span></figcaption></figure>
      </div>
      <div class="story-beats">
        <article class="story-beat" data-beat="0"><div><span class="story-index">01 / OBSERVE</span><h3>Notice what<br>others pass by.</h3><p>A quiet street. A small detail. A process that gets in someone’s way. Paying attention is where my work begins.</p><a class="text-link" href="#photography">Through my lens ↗</a></div></article>
        <article class="story-beat" data-beat="1"><div><span class="story-index">02 / CONNECT</span><h3>Find the shape<br>inside the details.</h3><p>Design and operations taught me to see relationships: between people, a message and the way a task gets done.</p><a class="text-link" href="/about/">The experiences behind it ↗</a></div></article>
        <article class="story-beat" data-beat="2"><div><span class="story-index">03 / CREATE</span><h3>Turn an observation<br>into something useful.</h3><p>An idea earns its place when it helps. I build products and creative systems, then examine how they work in practice.</p><a class="text-link" href="#work">See the work ↗</a></div></article>
      </div>
    </div>
  </section>`;
}

export function chapterRail() {
  return `<nav class="scene-nav" aria-label="Portfolio chapters" hidden>${[['opening','Start'],['work','Work'],['photography','Gaze'],['about','About'],['contact','Contact']].map(([id,label],i)=>`<a href="#${id}" aria-label="Jump to ${label.toLowerCase()}"${i===0?' aria-current="location"':''}><span>${String(i+1).padStart(2,'0')}</span><span class="scene-nav-label">${label}</span></a>`).join('')}</nav>`;
}
