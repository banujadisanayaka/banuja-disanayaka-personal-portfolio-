// A semantic introduction first; the browser progressively pins and choreographs it.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function sceneJourney(picture, gallery, profile, ecosystem, projects = []) {
  const forest = gallery.find(g => g.preview.includes('gaze-168481-')) || gallery[0];
  const city = gallery.find(g => g.preview.includes('gaze-177310-')) || gallery[1];
  const photo = g => `<img data-scene-photo="${esc(g.id)}" src="${esc(g.derivatives?.[0]?.url || g.preview)}" srcset="${g.derivatives.map(d => `${esc(d.url)} ${d.width}w`).join(', ')}" sizes="(max-width:700px) 65vw, 35vw" width="${g.width}" height="${g.height}" alt="${esc(g.alt)}" loading="lazy" decoding="async">`;
  const workProjects = Array.isArray(projects) ? projects.slice(0, 5) : [];
  const projectDock = workProjects.length ? `<div class="journey-project-dock" role="group" aria-label="Selected work projects">${workProjects.map((p,i)=>`<a class="journey-project-chip${i===0?' is-selected':''}" href="/work/${esc(p.slug)}/" data-journey-project="${i}" data-project-path="/work/${esc(p.slug)}/" data-project-title="${esc(p.title)}" data-project-summary="${esc(p.description)}" data-project-category="${esc(p.category)}" data-project-kicker="${esc(p.kicker)}" data-project-flow="${esc((p.flow||[]).join('|'))}" ${i===0?'aria-current="true"':''}><span>0${i+1}</span><span class="journey-project-title">${esc(p.title)}</span></a>`).join('')}</div>` : '';
  const primaryWork=workProjects[0]||{title:'Selected work',category:'Operations → product',kicker:'A working system.',flow:['Project context','Core workflow','Implementation','Outcome']};
  const primaryFlow=(primaryWork.flow||[]).slice(0,4);
  const workArt=`<div class="journey-system"><div class="journey-sheet-top"><span class="journey-system-category">${esc(primaryWork.category)}</span><span class="journey-system-index">01</span></div><span class="journey-system-label">Project map</span><p class="journey-sheet-title">${esc(primaryWork.title)}</p><ol>${primaryFlow.map((step,i)=>`<li><span>0${i+1}</span><b class="journey-flow-label">${esc(step)}</b></li>`).join('')}</ol><small class="journey-system-footer">${esc(primaryWork.kicker)}</small></div>`;
  const scenes = [
    {name:'Identity',word:'PERSPECTIVE',theme:'moss',kicker:'01 / AN INDEPENDENT MIND',
      heading:`<h1><span data-text="profile.firstName">${esc(profile.firstName)}</span><em data-text="profile.lastName">${esc(profile.lastName)}</em></h1>`,
      copy:'People. Systems. Visual stories.',note:esc(profile.location),href:'#work',action:'Explore selected work',
      art:`<div class="portrait-frame" data-depth>${picture('portrait','Banuja Disanayaka in a navy suit, standing in a studio.','',true)}</div>`,label:'THE PERSON / BANUJA DISANAYAKA'},
    {name:'Work',word:'MAKE IT WORK',theme:'workproof',kicker:'02 / SELECTED WORK',section:'#work',
      heading:'<h2>Ideas,<br>made <em>useful.</em></h2>',copy:'From everyday work to a working system.',note:'TFC ORDERS TRACKER',href:'/work/tfc-orders-tracker/',action:'Inside the project',
      art:workArt,label:`PROJECT MAP / ${esc(primaryWork.title).toUpperCase()}`},
    {name:'Gaze',word:'LOOK CLOSER',theme:'sage',kicker:'03 / THROUGH MY LENS',section:'#photography',
      heading:'<h2>The Daily<br><em>Gaze.</em></h2>',copy:'A closer look at the everyday.',note:'ORIGINAL PHOTOGRAPHY',href:'/daily-gaze/',action:'Enter the photographic journal',art:photo(forest),label:'THE DAILY GAZE / INTO THE MIST'},
    {name:'Journey',word:'BECOMING',theme:'clay',kicker:'04 / THE PERSON BEHIND THE WORK',section:'#about',
      heading:'<h2>A life of<br><em>looking closer.</em></h2>',copy:'Sri Lanka · Kuala Lumpur',note:'DESIGN / OPERATIONS / DIGITAL PRODUCTS',href:'/about/',action:'Read my full story',
      art:picture('about','Banuja beside a display of his graphic design and artwork.'),label:'DESIGN & EXPERIENCE'},
    {name:'VELORIA',word:'VELORIA',theme:'charcoal',kicker:'05 / A SHARED CREATIVE VISION',section:'#ecosystem',
      heading:'<h2>Many voices.<br><em>One vision.</em></h2>',copy:'Room for ideas to become something.',note:'VELORIA / SIX CONNECTED DIVISIONS',href:'/work/veloria/',action:'Explore the brand architecture',
      art:`<div class="journey-ecosystem"><div class="journey-brand">VELORIA<span>Evolve Beyond.</span></div><div class="journey-brands">${ecosystem.map(e=>`<span>${esc(e.name)}</span>`).join('')}</div></div>`,label:'EVOLVE BEYOND'},
    {name:'Contact',word:'WHAT COMES NEXT',theme:'cream',kicker:'06 / YOUR NEXT IDEA',section:'#contact',
      heading:'<h2>Let’s make<br>something <em>matter.</em></h2>',copy:'A conversation is a good beginning.',note:'BANUJA DISANAYAKA',href:'#contact',action:'Let’s talk',
      art:picture('personal','Banuja in an orange polo shirt at a celebration.'),label:'A PERSON, BEFORE A PORTFOLIO'}
  ];
  const contours = Array.from({length:22},(_,i)=>`<path d="M -120 ${i*34-180} C 150 ${i*22-65}, 260 ${i*44-60}, 540 ${i*24+120} S 920 ${i*28-60}, 1320 ${i*24+90}"/>`).join('');
  return `<section class="scene-journey" id="opening" aria-label="Banuja’s portfolio in six scenes">
    <div class="journey-stage">
      <div class="journey-backgrounds" aria-hidden="true">${scenes.map(s=>`<div class="journey-background ${s.theme}"></div>`).join('')}</div>
      <svg class="journey-contours" viewBox="0 0 1200 800" fill="none" aria-hidden="true" focusable="false">${contours}</svg>
      <div class="journey-orbit" aria-hidden="true"></div>
      <div class="journey-paper" aria-hidden="true"></div>
      <div class="journey-satellite" aria-hidden="true">${photo(city)}</div>
      <div class="stage2-identity-back" data-stage2-proof-layer aria-hidden="true"></div>
      <div class="stage2-identity-middle" data-stage2-proof-layer aria-hidden="true"></div>
      <div class="stage2-identity-front" data-stage2-proof-layer aria-hidden="true"></div>
      <div class="stage2-transition-plane" data-stage2-proof-layer aria-hidden="true"></div>
      <svg class="stage2-signal" data-stage2-proof-layer viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path class="stage2-signal-desktop" d="M60 382 C245 332 430 414 615 370 L615 118 L946 118"/>
        <circle class="stage2-signal-desktop" cx="615" cy="370" r="6"/>
        <path class="stage2-signal-mobile" d="M42 342 C238 302 604 388 940 350 L940 258 L992 258"/>
        <circle class="stage2-signal-mobile" cx="940" cy="350" r="7"/>
      </svg>
      ${scenes.map((s,i)=>`<article class="journey-panel ${s.theme}" data-journey-scene="${i}"${s.section?` data-section="${s.section}"`:''} aria-labelledby="journey-title-${i}">
        ${i===1?'<div class="journey-work-environment" aria-hidden="true"><span class="journey-work-rail rail-a"></span><span class="journey-work-rail rail-b"></span><span class="journey-work-rail rail-c"></span><span class="journey-work-foreground"></span></div><span class="journey-work-copy-slab" aria-hidden="true"></span>':''}
        <span class="journey-word" aria-hidden="true">${s.word}</span>
        <div class="journey-heading" id="journey-title-${i}"><p class="journey-kicker">${s.kicker}</p>${s.heading}</div>
        <figure class="journey-art"><div class="journey-art-inner">${s.art}</div><figcaption>${s.label}</figcaption></figure>
        <div class="journey-caption"><p${i===1?' data-journey-project-copy':''}>${i===1&&workProjects[0]?esc(workProjects[0].description):s.copy}</p><span${i===0?' data-text="profile.location"':''}${i===1?' data-journey-project-note':''}>${i===1&&workProjects[0]?esc(workProjects[0].category):s.note}</span><a class="journey-link"${i===1?' data-journey-project-open':''} href="${i===1&&workProjects[0]?`/work/${esc(workProjects[0].slug)}/`:s.href}">${i===1&&workProjects[0]?`Open ${esc(workProjects[0].title)}`:s.action} <span aria-hidden="true">↗</span></a></div>
        ${i===1?projectDock:''}
      </article>`).join('')}
      <nav class="journey-controls" aria-label="Scene navigation" hidden>
        <div class="journey-buttons">${scenes.map((s,i)=>`<button type="button" data-journey-select="${i}" aria-label="Scene ${i+1}: ${s.name}" aria-pressed="${i===0}"><span>0${i+1}</span><span>${s.name}</span></button>`).join('')}</div>
        <a href="#work" class="journey-skip">Skip to work <span aria-hidden="true">↗</span></a>
        <div class="journey-progress" aria-hidden="true"><span></span></div>
      </nav>
      <span class="journey-scroll-note" aria-hidden="true">SCROLL TO UNFOLD ↓</span>
    </div>
  </section>`;
}
