// The photographs and stories are first-party portfolio material.
// Motion is a progressive enhancement; the complete page is readable without it.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photo = (g, sizes = '45vw') => `<img src="${esc(g.derivatives?.[1]?.url || g.preview)}" width="${g.width}" height="${g.height}" alt="${esc(g.alt)}" loading="lazy" decoding="async" sizes="${sizes}">`;

export function opening(picture, featured, profile) {
  return `<section class="hero v10-hero" id="opening" aria-label="Introduction">
    <div class="edition-line"><span>PERSONAL PORTFOLIO — VOL. 10</span><span>A WORK IN OBSERVATION <span aria-hidden="true">↗</span></span></div>
    <h1><span data-text="profile.firstName">Banuja</span><span data-text="profile.lastName">Disanayaka</span></h1>
    <div class="v10-hero-layout">
      <div class="hero-copy"><p class="eyebrow" data-text="profile.heroEyebrow">${esc(profile.heroEyebrow)}</p><p class="hero-lede" data-text="profile.heroLede">${esc(profile.heroLede)}</p><div class="hero-actions"><a class="button primary" href="#work">Explore selected work <span aria-hidden="true">↗</span></a><a class="text-link" href="/about/">My story ↗</a></div><div class="hero-note"><span class="availability-dot" aria-hidden="true"></span><span data-text="profile.location">Based in Sri Lanka</span></div></div>
      <div class="hero-image" data-hero-scene>
        <figure class="portrait-frame" data-depth>${picture('portrait','Banuja Disanayaka in a navy suit, standing in a studio.','',true)}<figcaption class="portrait-label"><span>The person</span><span>01 / BD</span></figcaption></figure>
        <figure class="hero-observation">${photo(featured[0])}<figcaption><span>The perspective</span><span>The Daily Gaze ↗</span></figcaption></figure>
      </div>
    </div>
    <div class="opening-foot"><span>PEOPLE. SYSTEMS. VISUAL STORIES.</span><a href="#approach">Follow the thread <span aria-hidden="true">↓</span></a></div>
  </section>`;
}

export function story(featured) {
  return `<section class="v10-story section" id="approach" aria-labelledby="approach-heading">
    <div class="story-heading"><p class="eyebrow">THE THREAD THROUGH IT ALL</p><h2 id="approach-heading">A practical mind.<br><em>A visual instinct.</em></h2></div>
    <div class="story-journey">
      <div class="story-beats">
        <article class="story-beat" data-beat="0"><span>01 / OBSERVE</span><h3>Notice what<br>others pass by.</h3><p>A quiet street. A small detail. A process that gets in someone’s way. Paying attention is where my work begins.</p><a class="text-link" href="#photography">Through my lens ↗</a></article>
        <article class="story-beat" data-beat="1"><span>02 / CONNECT</span><h3>Find the shape<br>inside the details.</h3><p>Design and operations taught me to see relationships: between people, a message and the way a task gets done.</p><a class="text-link" href="/about/">The experiences behind it ↗</a></article>
        <article class="story-beat" data-beat="2"><span>03 / MAKE</span><h3>Turn an observation<br>into something useful.</h3><p>An idea earns its place when it helps. I build products and creative systems, then examine how they work in practice.</p><a class="text-link" href="#work">See the work ↗</a></article>
      </div>
      <div class="story-visual" aria-label="Observation, design and a working system">
        <figure class="story-art is-current" data-art="0">${photo(featured[1])}<figcaption>A different way of seeing.<span>THE DAILY GAZE / 01</span></figcaption></figure>
        <figure class="story-art" data-art="1"><img src="/assets/v9/about-960.webp" width="628" height="628" alt="Banuja presenting his graphic design work." loading="lazy" decoding="async"><figcaption>Making the message clear.<span>VISUAL DESIGN / 02</span></figcaption></figure>
        <figure class="story-art story-system" data-art="2"><div class="story-system-sheet"><p>TFC ORDERS TRACKER</p><span class="system-title">From an order.<br><em>To a clear next step.</em></span><ol><li><span>01</span>Capture the order</li><li><span>02</span>Coordinate production</li><li><span>03</span>Track fulfilment</li></ol><a class="text-link" href="/work/tfc-orders-tracker/">Explore the system ↗</a></div><figcaption>Ideas, made useful.<span>PRODUCT WORK / 03</span></figcaption></figure>
      </div>
    </div>
  </section>`;
}

export function chapterRail() {
  return `<nav class="scene-nav" aria-label="Portfolio chapters" hidden>${[['opening','Start'],['work','Work'],['photography','Gaze'],['about','About'],['contact','Contact']].map(([id,label],i)=>`<a href="#${id}" aria-label="Jump to ${label.toLowerCase()}"${i===0?' aria-current="location"':''}><span>${String(i+1).padStart(2,'0')}</span><span class="scene-nav-label">${label}</span></a>`).join('')}</nav>`;
}
