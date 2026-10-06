const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function immersiveHome({picture,gallery,profile,ecosystem,projects,career,contact}) {
  const visibleGallery = (gallery || []).filter(item => item.visible !== false);
  const filmPhotos = (visibleGallery.filter(item => item.featured).length
    ? visibleGallery.filter(item => item.featured)
    : visibleGallery).slice(0, 8);

  const projectList = (projects || []).slice(0, 5);
  const worldList = (ecosystem || []).slice(0, 6);
  const journeyList = [...(career || [])].reverse().filter((_,i,list)=>i===0 || i===Math.floor((list.length-1)/2) || i===list.length-1);

  const photoImg = (g, eager=false) => {
    const src = g?.derivatives?.[0]?.url || g?.preview || '';
    const srcset = Array.isArray(g?.derivatives) ? g.derivatives.map(d=>`${esc(d.url)} ${d.width}w`).join(', ') : '';
    return `<img src="${esc(src)}"${srcset?` srcset="${srcset}" sizes="(max-width:700px) 72vw, 30vw"`:''} width="${g?.width||960}" height="${g?.height||1280}" alt="${esc(g?.alt||g?.title||'The Daily Gaze photograph')}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async" draggable="false">`;
  };

  const projectFrames = projectList.map((p,i)=>`
    <a class="work-frame work-frame-${i}" href="/work/${esc(p.slug)}/">
      <span class="work-frame-no">TAKE ${String(i+1).padStart(2,'0')}</span>
      <span class="work-frame-title">${esc(p.title)}</span>
      <span class="work-frame-category">${esc(p.category)}</span>
      <span class="work-frame-arrow" aria-hidden="true">↗</span>
    </a>`).join('');

  const photoFrames = filmPhotos.map((g,i)=>`
    <figure class="gaze-frame gaze-frame-${i}">
      <div class="gaze-frame-image">${photoImg(g,i<2)}</div>
      <figcaption><span>${String(i+1).padStart(2,'0')}</span><span>${esc(g.title||g.category||'Moment')}</span></figcaption>
    </figure>`).join('');

  const route = journeyList.map((item,i)=>`
    <li>
      <span class="route-point"><i></i><b>${String(i+1).padStart(2,'0')}</b></span>
      <div><small>${esc(item.year)}</small><strong>${esc(item.title)}</strong><span>${esc(item.company)}</span></div>
    </li>`).join('');

  const worlds = worldList.map((world,i)=>`
    <a class="world-node world-node-${i}" href="${world.name==='The Daily Gaze'?'/daily-gaze/':'/work/veloria/'}">
      <span>0${i+1}</span><strong>${esc(world.name)}</strong><small>${esc(world.description)}</small>
    </a>`).join('');

  const sceneNames = ['Opening','The Gaze','Work','Journey','VELORIA','Contact'];

  return `
  <a class="experience-skip" href="#contact">Skip cinematic introduction</a>
  <section class="experience" id="opening" data-experience aria-label="Banuja Disanayaka portfolio experience">
    <div class="experience-stage">
      <div class="experience-topline" aria-hidden="true">
        <span>PORTFOLIO / 2026</span><span>BASED IN SRI LANKA</span>
      </div>

      <button class="experience-menu-toggle" type="button" data-open-scenes aria-haspopup="dialog" aria-controls="experience-menu">
        <span>SCENES</span><i></i><i></i>
      </button>
      <div class="experience-scene-count" aria-hidden="true">SCENE <strong data-scene-count>01</strong> / 06</div>

      <article class="experience-scene opening-scene is-current" data-scene="0" aria-labelledby="exp-title-0">
        <div class="opening-grid" aria-hidden="true"></div>
        <div class="opening-portrait" aria-label="Portrait of Banuja Disanayaka">
          <span class="portrait-halo"></span>
          <div class="portrait-window portrait-main">${picture('portrait','Banuja Disanayaka in a navy suit, standing in a studio.','',true)}</div>
          <div class="portrait-window portrait-detail" aria-hidden="true">${picture('portrait','','',true)}</div>
          <span class="portrait-index">PORTRAIT / 01</span>
        </div>
        <div class="opening-title" id="exp-title-0">
          <p>AN INDEPENDENT MIND / CONNECTED DISCIPLINES</p>
          <h1><span>${esc(profile.firstName)}</span><em>${esc(profile.lastName)}</em></h1>
          <div class="opening-statement"><strong>People. Systems.<br>Visual stories.</strong><span>${esc(profile.heroLede)}</span></div>
        </div>
        <div class="opening-proof" aria-label="Portfolio overview">
          <span><b>${projectList.length}</b> selected projects</span>
          <span><b>${visibleGallery.length}</b> photographs</span>
          <span><b>${worldList.length}</b> connected worlds</span>
          <span><b>2</b> countries</span>
        </div>
      </article>

      <article class="experience-scene gaze-scene" data-scene="1" id="photography" aria-labelledby="exp-title-1">
        <header class="act-heading">
          <p>ACT ONE / OBSERVATION</p>
          <h2 id="exp-title-1">The Daily <em>Gaze.</em></h2>
          <span>Light, life and the things we walk past.</span>
        </header>
        <div class="gaze-reel" aria-label="A film reel of photographs">${photoFrames}</div>
        <div class="gaze-orbit" aria-hidden="true">
          <span class="gaze-orbit-ring"></span>
          <i class="gaze-point gaze-point-sl"></i>
          <i class="gaze-point gaze-point-my"></i>
          <b>SRI LANKA</b><b>MALAYSIA</b>
        </div>
        <div class="scene-stat">
          <strong>${visibleGallery.length}<sup>+</sup></strong>
          <span>moments kept<br>in one visual journal</span>
        </div>
        <a class="scene-link" href="/daily-gaze/">Enter the journal <span>↗</span></a>
      </article>

      <article class="experience-scene work-scene" data-scene="2" id="work" aria-labelledby="exp-title-2">
        <header class="act-heading">
          <p>ACT TWO / CRAFT</p>
          <h2 id="exp-title-2">Ideas, made <em>useful.</em></h2>
          <span>Projects shaped by real work, not decoration.</span>
        </header>
        <div class="work-reel" aria-label="Selected work film reel">${projectFrames}</div>
        <div class="work-shutter" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>
        <div class="scene-stat scene-stat-work">
          <strong>${projectList.length}</strong>
          <span>selected systems,<br>products & identities</span>
        </div>
      </article>

      <article class="experience-scene journey-scene" data-scene="3" id="about" aria-labelledby="exp-title-3">
        <header class="act-heading">
          <p>ACT THREE / THE LINE</p>
          <h2 id="exp-title-3">A life of <em>looking closer.</em></h2>
          <span>Sri Lanka → Kuala Lumpur → Sri Lanka</span>
        </header>
        <div class="journey-map" aria-hidden="true"><span class="journey-arc"></span><i class="journey-origin"></i><i class="journey-away"></i><i class="journey-return"></i></div>
        <ol class="journey-route">${route}</ol>
        <div class="journey-statement" aria-hidden="true"><span>DESIGN</span><b>→</b><span>OPERATIONS</span><b>→</b><span>PRODUCT</span></div>
        <a class="scene-link" href="/about/">Read the full story <span>↗</span></a>
      </article>

      <article class="experience-scene worlds-scene" data-scene="4" id="ecosystem" aria-labelledby="exp-title-4">
        <header class="act-heading">
          <p>ACT FOUR / ONE LINE, SIX WORLDS</p>
          <h2 id="exp-title-4">VELORIA<span class="gold-dot">.</span></h2>
          <span>Evolve Beyond.</span>
        </header>
        <div class="world-signal" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="world-sphere" aria-label="Six connected VELORIA worlds">
          <div class="sphere-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="sphere-core" aria-hidden="true"><strong>V</strong><span>ONE SHARED VISION</span></div>
          ${worlds}
        </div>
        <a class="scene-link" href="/work/veloria/">Explore the architecture <span>↗</span></a>
      </article>

      <article class="experience-scene contact-scene" data-scene="5" id="contact" aria-labelledby="exp-title-5">
        <div class="contact-frame">
          <p>THE LAST FRAME</p>
          <h2 id="exp-title-5">Let’s make<br>something <em>matter.</em></h2>
          <span>Have a project, an opportunity or a story to share?</span>
        </div>
        <div class="contact-ledger">
          <a href="mailto:${esc(contact.email)}"><span>EMAIL</span><strong>${esc(contact.email)}</strong><b>↗</b></a>
          <a href="https://wa.me/${esc(contact.whatsappSriLanka)}" rel="noopener noreferrer"><span>WHATSAPP</span><strong>${esc(contact.whatsappSriLankaDisplay)}</strong><b>↗</b></a>
          <a href="/moments/"><span>PHOTOGRAPHY</span><strong>Moments by The Daily Gaze</strong><b>↗</b></a>
          <a href="/resume/"><span>PROFILE</span><strong>Résumé</strong><b>↗</b></a>
        </div>
        <div class="contact-signoff" aria-hidden="true"><span>Banuja</span><em>Disanayaka</em></div>
      </article>

      <nav class="experience-timeline" aria-label="Portfolio scenes">
        <div class="timeline-track" aria-hidden="true"><span data-timeline-progress></span></div>
        <span class="timeline-caption" data-timeline-caption>OPENING / SC 01</span>
        <div class="timeline-dots">
          ${sceneNames.map((name,i)=>`<button type="button" data-scene-select="${i}" data-label="${name}" aria-label="Go to scene ${i+1}: ${name}" aria-pressed="${i===0}"><span>0${i+1}</span></button>`).join('')}
        </div>
        <div class="timeline-links"><button type="button" data-open-scenes-mini>SCENES</button><a href="/moments/">MOMENTS</a><a href="#contact">CONTACT</a></div>
      </nav>
      <div class="experience-scroll-note" aria-hidden="true">SCROLL TO PLAY ↓</div>
      <div class="experience-utility"></div>
    </div>
  </section>

  <dialog class="experience-menu" id="experience-menu" aria-labelledby="experience-menu-title">
    <div class="experience-menu-inner">
      <div class="menu-meta"><span>SIX CHAPTERS / ONE PERSPECTIVE</span><button type="button" data-close-scenes>Close ×</button></div>
      <div class="menu-layout">
        <nav aria-labelledby="experience-menu-title">
          <h2 id="experience-menu-title" class="sr-only">Portfolio scenes</h2>
          ${sceneNames.map((name,i)=>`<button type="button" data-menu-scene="${i}"><span>0${i+1}</span><strong>${name}</strong><small>${['The person','Through my lens','Ideas made useful','The path behind the work','One line, six worlds','A new conversation'][i]}</small></button>`).join('')}
        </nav>
        <aside>
          <p>People.<br>Systems.<br><em>Visual stories.</em></p>
          <div><a href="/daily-gaze/">The Daily Gaze ↗</a><a href="/moments/">Moments ↗</a><a href="/about/">About ↗</a><a href="/resume/">Résumé ↗</a></div>
        </aside>
      </div>
    </div>
  </dialog>`;
}
