// A semantic introduction first; the browser progressively pins and choreographs it.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function sceneJourney(picture, gallery, profile, ecosystem, projects = [], career = []) {
  const forest = gallery.find(g => g.preview.includes('gaze-168481-')) || gallery[0];
  const city = gallery.find(g => g.preview.includes('gaze-177310-')) || gallery[1];
  const photo = g => `<img data-scene-photo="${esc(g.id)}" src="${esc(g.derivatives?.[0]?.url || g.preview)}" srcset="${g.derivatives.map(d => `${esc(d.url)} ${d.width}w`).join(', ')}" sizes="(max-width:700px) 65vw, 35vw" width="${g.width}" height="${g.height}" alt="${esc(g.alt)}" loading="lazy" decoding="async">`;
  const workProjects = Array.isArray(projects) ? projects.slice(0, 5) : [];
  const projectDock = workProjects.length ? `<div class="journey-project-dock" role="group" aria-label="Selected work projects">${workProjects.map((p,i)=>`<a class="journey-project-chip${i===0?' is-selected':''}" href="/work/${esc(p.slug)}/" data-journey-project="${i}" data-project-path="/work/${esc(p.slug)}/" data-project-title="${esc(p.title)}" data-project-summary="${esc(p.description)}" data-project-category="${esc(p.category)}" data-project-kicker="${esc(p.kicker)}" data-project-flow="${esc((p.flow||[]).join('|'))}" ${i===0?'aria-current="true"':''}><span>0${i+1}</span><span class="journey-project-title">${esc(p.title)}</span></a>`).join('')}</div>` : '';
  const primaryWork=workProjects[0]||{title:'Selected work',category:'Operations → product',kicker:'A working system.',flow:['Project context','Core workflow','Implementation','Outcome']};
  const primaryFlow=(primaryWork.flow||[]).slice(0,4);
  const workArt=`<div class="journey-system"><div class="journey-sheet-top"><span class="journey-system-category">${esc(primaryWork.category)}</span><span class="journey-system-index">01</span></div><span class="journey-system-label">Project map</span><p class="journey-sheet-title">${esc(primaryWork.title)}</p><ol>${primaryFlow.map((step,i)=>`<li><span>0${i+1}</span><b class="journey-flow-label">${esc(step)}</b></li>`).join('')}</ol><small class="journey-system-footer">${esc(primaryWork.kicker)}</small></div>`;
  const route = [...career].reverse().filter((_, i, list) => i === 0 || i === 2 || i === list.length-1);
  const routeArt = `<div class="journey-route"><p class="route-label">EXPERIENCE / A CONTINUING LINE</p><ol>${route.map((item,i)=>`<li><span class="route-number">0${i+1}</span><div><small>${esc(item.year)}</small><strong>${esc(item.title)}</strong><span>${esc(item.company)}</span></div></li>`).join('')}</ol></div>`;
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
      art:routeArt,label:'DESIGN → OPERATIONS → PRODUCT'},
    {name:'VELORIA',word:'VELORIA',theme:'charcoal',kicker:'05 / A SHARED CREATIVE VISION',section:'#ecosystem',
      heading:'<h2>Many voices.<br><em>One vision.</em></h2>',copy:'Room for ideas to become something.',note:'VELORIA / SIX CONNECTED DIVISIONS',href:'/work/veloria/',action:'Explore the brand architecture',
      art:`<div class="journey-ecosystem"><p class="constellation-center">One shared<br><em>vision.</em></p><div class="journey-brands">${ecosystem.map((e,i)=>`<div class="constellation-node node-${i}"><span>0${i+1}</span><strong>${esc(e.name)}</strong><small>${esc(e.description)}</small></div>`).join('')}</div></div>`,label:'VELORIA / SIX CONNECTED DIVISIONS'},
    {name:'Contact',word:'WHAT COMES NEXT',theme:'cream',kicker:'06 / YOUR NEXT IDEA',section:'#contact',
      heading:'<h2>Let’s make<br>something <em>matter.</em></h2>',copy:'A conversation is a good beginning.',note:'BANUJA DISANAYAKA',href:'#contact',action:'Let’s talk',
      art:picture('personal','Banuja in an orange polo shirt at a celebration.'),label:'A PERSON, BEFORE A PORTFOLIO'}
  ];
  const contours = Array.from({length:22},(_,i)=>`<path d="M -120 ${i*34-180} C 150 ${i*22-65}, 260 ${i*44-60}, 540 ${i*24+120} S 920 ${i*28-60}, 1320 ${i*24+90}"/>`).join('');
  return `<section class="scene-journey" id="opening" aria-label="Banuja’s portfolio in six scenes">
    <div class="journey-stage">
      <div class="journey-backgrounds" aria-hidden="true">${scenes.map(s=>`<div class="journey-background ${s.theme}"></div>`).join('')}</div>
      <div class="journey-signal" aria-hidden="true"><span></span><i></i></div>
      ${scenes.map((s,i)=>`<article class="journey-panel ${s.theme}" data-journey-scene="${i}"${s.section?` data-section="${s.section}"`:''} aria-labelledby="journey-title-${i}">
        <div class="journey-environment environment-${i}" aria-hidden="true"><span></span><i></i><b></b></div>
        <span class="journey-word" aria-hidden="true">${s.word}</span>
        <div class="journey-heading" id="journey-title-${i}"><p class="journey-kicker">${s.kicker}</p>${s.heading}</div>
        <figure class="journey-art"><div class="journey-art-inner">${s.art}</div><figcaption>${s.label}</figcaption></figure>
        <div class="journey-caption"><p${i===1?' data-journey-project-copy':''}>${i===1&&workProjects[0]?esc(workProjects[0].description):s.copy}</p><span${i===0?' data-text="profile.location"':''}${i===1?' data-journey-project-note':''}>${i===1&&workProjects[0]?esc(workProjects[0].category):s.note}</span><a class="journey-link"${i===1?' data-journey-project-open':''} href="${i===1&&workProjects[0]?`/work/${esc(workProjects[0].slug)}/`:s.href}">${i===1&&workProjects[0]?`Open ${esc(workProjects[0].title)}`:s.action} <span aria-hidden="true">↗</span></a></div>
        ${i===1?projectDock:''}
        ${i===2?`<div class="journey-photo-picker" hidden role="group" aria-label="Choose an opening photograph"><button type="button" data-opening-photo="0" aria-pressed="true" aria-label="View ${esc(forest.title)}">01 / Nature</button><button type="button" data-opening-photo="1" aria-pressed="false" aria-label="View ${esc(city.title)}">02 / City</button></div><template data-opening-photo-template>${photo(city)}</template>`:''}
        ${i===5?'<a class="journey-resume" href="/resume/">View résumé ↗</a>':''}
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
