import {projectBook} from './project-book.mjs';
// V15: this source owns the generated homepage hero and preloader markup.
// Runtime animation remains single-owner in public/immersive-home.js.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function immersiveHome({picture,gallery,profile,ecosystem,projects,career,contact}) {
  const photos=(gallery||[]).filter(x=>x.visible!==false);
  const featured=(photos.filter(x=>x.featured).length?photos.filter(x=>x.featured):photos).slice(0,6);
  const work=(projects||[]).slice(0,5);
  const worlds=(ecosystem||[]).slice(0,6);
  const jobs=[...(career||[])].reverse();
  const gazeTags=[...new Set(photos.map(item=>item.category).filter(Boolean))].slice(0,4);

  const photo = g => {
    const src=g?.derivatives?.[0]?.url||g?.preview||'';
    const set=Array.isArray(g?.derivatives)?g.derivatives.map(d=>`${esc(d.url)} ${d.width}w`).join(', '):'';
    return `<img src="${esc(src)}"${set?` srcset="${set}" sizes="(max-width:700px) 64vw, 33vw"`:''} alt="${esc(g?.alt||g?.title||'The Daily Gaze photograph')}" width="${Number(g?.width)||960}" height="${Number(g?.height)||1200}" loading="eager" fetchpriority="low" decoding="async">`;
  };

  const sceneNames=['Opening','Gaze','Places','Act II','Work','Journey','Act III','VELORIA','Approach','Credits'];

  return `
  <a class="experience-skip" href="#contact">Skip cinematic introduction</a>
  <div class="signal-lock-preloader" aria-hidden="true"><div class="signal-lock-frame"><span class="signal-lock-kicker">VELORIA STUDIO / SIGNAL LOCK</span><img class="signal-lock-mark" src="/assets/v9/banuja-logo-gold.webp" width="56" height="56" alt=""><svg class="signal-lock-signature-svg" viewBox="0 0 1200 1283" aria-hidden="true"><defs><mask id="signal-lock-mask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1400" height="1500"><path class="signal-lock-pen" pathLength="1" d="M160 725 C90 650 520 315 615 335 C680 385 270 710 305 780 C360 840 685 320 740 325 C800 355 870 175 935 140 M600 340 L535 825 M30 1250 Q585 655 1175 30" fill="none" stroke="white" stroke-width="150" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><image href="/assets/signature/banuja-signature.svg" width="1200" height="1283" mask="url(#signal-lock-mask)"/></svg><div class="signal-lock-readout"><span>INITIALISING VISUAL SYSTEM</span><strong data-lock-progress>00%</strong></div><span class="signal-lock-horizon"></span></div></div>
  <div class="magnetic-reticle" aria-hidden="true"><span class="reticle-ring"></span><span class="reticle-pill">[ EXPLORE ]</span></div>
  <section class="experience v3-film" data-experience aria-label="Banuja Disanayaka portfolio film">
    <div class="experience-stage">
      <div class="signal-rig" aria-hidden="true">
        <div class="signal-gate"></div><div class="signal-circle"></div><div class="signal-dot"></div>
        <canvas class="signal-map"></canvas>
      </div>
      <div class="film-topbar"><span data-film-label>OPENING · SC 01</span><span>BASED IN SRI LANKA</span></div>
      <button class="film-menu" type="button" data-open-scenes aria-haspopup="dialog" aria-controls="experience-menu" aria-expanded="false">SCENES</button>

      <article class="film-scene opening-shot is-current" data-scene="0" id="opening">
        <div class="opening-photo"><img src="/assets/v9/portrait-cutout-8a7c9e4c1dc9.webp" width="720" height="1080" alt="Banuja Disanayaka in a navy suit" fetchpriority="high" decoding="async"></div>
        <h1 class="opening-name"><span>Banuja</span><em>Disanayaka</em></h1>
        <div class="opening-copy"><b>People. Systems.<br><i>Visual stories.</i></b><span>Operations, product, design and photography.<br>A different way of looking.</span></div>
        <div class="opening-metrics">
          <span><strong>${work.length}</strong> PROJECTS</span>
          <span><strong>${photos.length}</strong> PHOTOGRAPHS</span>
          <span><strong>${worlds.length}</strong> VELORIA WORLDS</span>
        </div>
        <aside class="opening-telemetry-hud" aria-label="Studio telemetry"><div class="telemetry-time"><span>CMB // KUL</span><strong data-dual-clock>--:--:-- / --:--:--</strong></div><div class="telemetry-coordinate"><span>STUDIO COORDINATES</span><strong>06.93°N / 079.86°E</strong></div><div class="telemetry-status"><i aria-hidden="true"></i><span>SIGNAL ACTIVE</span></div></aside>
      </article>

      <article class="film-scene gaze-shot" data-scene="1" id="photography">
        <div class="gaze-intro">
          <small>NOW SHOWING</small>
          <h2>The Daily <em>Gaze.</em></h2>
          <p>One frame at a time — the light, places and small details worth keeping.</p>
          <div class="gaze-tags">${(gazeTags.length?gazeTags:['Photography','Street','Travel','Moments']).map(tag=>`<span>+ ${esc(tag)}</span>`).join('')}</div>
        </div>
        <div class="gaze-reel-window"><div class="filmstrip" data-gaze-strip>
          ${featured.map((g,i)=>`<figure data-photo-id="${esc(g.id||g.preview)}"><div>${photo(g)}</div><figcaption>${String(i+1).padStart(2,'0')} · ${esc(g.title||'Moment')}</figcaption></figure>`).join('')}
          </div></div>
        <a class="gaze-visit film-action" href="/daily-gaze/">Explore the journal <span aria-hidden="true">↗</span></a>
        <div class="gaze-readout">
          <span>MOMENTS</span>
          <strong data-gaze-number>0</strong>
          <em>/ ${photos.length}</em>
        </div>
        <div class="gaze-channel-note">THE DAILY GAZE · VISUAL JOURNAL</div>
      </article>

      <article class="film-scene reach-shot" data-scene="2">
        <div class="reach-globe"><canvas data-world aria-label="Globe showing Sri Lanka and Malaysia"></canvas><div class="place-labels"><span>SRI LANKA · 6.9° N</span><span>MALAYSIA · 3.1° N</span></div></div>
        <div class="reach-copy"><small>PLACES · SC 03</small><h2>Two places.<br><em>One point of view.</em></h2><p>Sri Lanka and Malaysia shaped how I observe people, work and visual culture.</p></div>
        <div class="reach-stat"><strong>02</strong><span>COUNTRIES<br>ONE CONTINUING LINE</span></div>
      </article>

      <article class="film-scene intertitle" data-scene="3">
        <div><small>CRAFTSMANSHIP · ACT TWO</small><h2>Craftsmanship</h2><p>Practical systems, visual clarity and work that earns its place.</p></div>
      </article>

      <article class="film-scene work-shot" data-scene="4" id="work">
        <div class="work-wall">
          ${work.map((p,i)=>`<a href="/work/${esc(p.slug)}/" class="work-cell c${i}">${projectBook(p,i)}<div class="work-cell-caption"><small>0${i+1} / ${esc(p.year)}</small><strong>${esc(p.title)}</strong><span>${esc(p.category)}</span></div></a>`).join('')}
        </div>
        <div class="work-caption"><small>WORK · SC 05</small><h2>Ideas, made<br><em>useful.</em></h2></div>
      </article>

      <article class="film-scene journey-shot" data-scene="5" id="about">
        
        <ol class="journey-list">
          ${jobs.map((j,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><div><small>${esc(j.year)}</small><strong>${esc(j.title)}</strong><span>${esc(j.company)}</span></div></li>`).join('')}
        </ol>
        <div class="journey-copy"><small>PATH · SC 06</small><h2>Every role.<br><em>A new perspective.</em></h2><p>Six chapters that shaped how I work.</p></div>
      </article>

      <article class="film-scene intertitle" data-scene="6">
        <div><small>CURIOSITY · ACT THREE</small><h2>Curiosity</h2><p>A habit of noticing. A willingness to ask. A reason to make something better.</p></div>
      </article>

      <article class="film-scene veloria-shot" data-scene="7" id="ecosystem">
        <div class="veloria-orbit">
          <div class="veloria-core">V</div>
          ${worlds.map((w,i)=>`<a href="${w.name==='The Daily Gaze'?'/daily-gaze/':'/work/veloria/'}" class="orbit-node n${i}"><small>0${i+1}</small><strong>${esc(w.name)}</strong><span>${esc(w.description)}</span></a>`).join('')}
        </div>
        <div class="veloria-copy"><small>VELORIA · SC 08</small><h2>One line.<br><em>Six worlds.</em></h2><p>Evolve Beyond.</p></div>
      </article>

      <article class="film-scene curiosity-shot" data-scene="8">
        <div class="curiosity-question"><small>THE WAY I WORK</small><h2>Look closer.<br><em>Build better.</em></h2><p>What happens when you keep looking long enough?</p></div>
        <div class="curiosity-answer"><span>Photography notices.</span><span>Operations reveals friction.</span><span>Design gives it shape.</span><span>Product connects the pieces.</span></div>
      </article>

      <article class="film-scene credits-shot" data-scene="9" id="contact">
        <div class="credits-roll">
          <small class="credits-kicker">A BANUJA DISANAYAKA PICTURE</small>
          <div class="credits-list">
            <div><span>WORK</span><strong>Product · Design · Operations</strong></div>
            <div><span>PHOTOGRAPHY</span><strong><a href="/daily-gaze/">The Daily Gaze ↗</a></strong></div>
            <div><span>CLIENT GALLERIES</span><strong><a href="/moments/">Moments ↗</a></strong></div>
            <div><span>EMAIL</span><strong><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></strong></div>
            <div><span>WHATSAPP</span><strong><a href="https://wa.me/${esc(contact.whatsappSriLanka)}">${esc(contact.whatsappSriLankaDisplay)}</a></strong></div>
          </div>
          <small class="made-in">MADE IN SRI LANKA</small>
          <div class="signature-stage" aria-label="Banuja handwritten signature">
            <svg class="signature-performance" viewBox="0 0 1200 1283" aria-hidden="true">
              <defs><mask id="signature-draw" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1400" height="1500"><path class="signature-pen" pathLength="1" d="M160 725 C90 650 520 315 615 335 C680 385 270 710 305 780 C360 840 685 320 740 325 C800 355 870 175 935 140 M600 340 L535 825 M30 1250 Q585 655 1175 30" fill="none" stroke="white" stroke-width="150" stroke-linecap="round" stroke-linejoin="round"/></mask></defs>
              <image href="/assets/signature/banuja-signature.svg" width="1200" height="1283" mask="url(#signature-draw)"/>
            </svg>
          </div>
          <small class="credits-copy">© 2026 BANUJA DISANAYAKA</small>
          <nav class="credits-more" aria-label="More about Banuja"><a href="/about/">Full story ↗</a><a href="/resume/">Résumé ↗</a><a href="https://www.linkedin.com/in/banuja-disanayaka-730904278" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://www.instagram.com/banuja_disanayaka/" rel="noopener noreferrer">Instagram ↗</a><a href="https://github.com/banujadisanayaka" rel="noopener noreferrer">GitHub ↗</a></nav>
        </div>
      </article>

      <div class="film-bottombar">
        <div class="film-status"><span class="film-time" data-film-time aria-hidden="true">00:00:00:00</span><span data-scene-status aria-live="polite">01 / OPENING</span></div>
        <nav class="film-dots" aria-label="Scenes">${sceneNames.map((n,i)=>`<button type="button" data-scene-select="${i}" aria-label="${n}" aria-pressed="${i===0}"><span class="film-nav-index">${String(i+1).padStart(2,'0')}</span><span class="film-nav-title">${n}</span></button>`).join('')}</nav>
        <div class="film-links"><button type="button" data-open-scenes-mini aria-haspopup="dialog" aria-controls="experience-menu" aria-expanded="false">SCENES</button><a href="/moments/">MOMENTS</a><a href="#contact">CONTACT</a></div>
      </div>
      <div class="experience-utility"></div>
    </div>
  </section>

  <dialog class="experience-menu" id="experience-menu" aria-labelledby="scene-menu-title">
    <div class="experience-menu-inner">
      <div class="menu-meta"><span id="scene-menu-title">TEN CHAPTERS / ONE PERSPECTIVE</span><button type="button" data-close-scenes autofocus>Close ×</button></div>
      <div class="menu-layout"><nav>
      ${sceneNames.map((n,i)=>`<button type="button" data-menu-scene="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${n}</strong></button>`).join('')}
      </nav><aside><p>People.<br>Systems.<br><em>Visual stories.</em></p><div><a href="/daily-gaze/">The Daily Gaze ↗</a><a href="/moments/">Moments ↗</a><a href="/about/">About ↗</a><a href="/resume/">Résumé ↗</a></div></aside></div>
    </div>
  </dialog>`;
}
