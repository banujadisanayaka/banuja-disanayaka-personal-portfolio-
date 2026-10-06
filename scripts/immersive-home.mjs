const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function immersiveHome({picture,gallery,profile,ecosystem,projects,career,contact}) {
  const photos=(gallery||[]).filter(x=>x.visible!==false);
  const featured=(photos.filter(x=>x.featured).length?photos.filter(x=>x.featured):photos).slice(0,6);
  const work=(projects||[]).slice(0,5);
  const worlds=(ecosystem||[]).slice(0,6);
  const jobs=[...(career||[])].reverse().filter((_,i,a)=>i===0||i===Math.floor((a.length-1)/2)||i===a.length-1);

  const photo = (g,i=0) => {
    const src=g?.derivatives?.[0]?.url||g?.preview||'';
    const set=Array.isArray(g?.derivatives)?g.derivatives.map(d=>`${esc(d.url)} ${d.width}w`).join(', '):'';
    return `<img src="${esc(src)}"${set?` srcset="${set}" sizes="(max-width:700px) 76vw, 36vw"`:''} alt="${esc(g?.alt||g?.title||'The Daily Gaze photograph')}" ${i<2?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
  };

  const sceneNames=['Opening','Gaze','Reach','Act II','Work','Journey','Act III','VELORIA','Curiosity','Credits'];

  return `
  <a class="experience-skip" href="#credits">Skip cinematic introduction</a>
  <section class="experience v3-film" data-experience aria-label="Banuja Disanayaka portfolio film">
    <div class="experience-stage">
      <div class="film-topbar"><span data-film-label>OPENING · SC 01</span><span>COLOMBO / SRI LANKA</span></div>
      <button class="film-menu" type="button" data-open-scenes>SCENES</button>

      <article class="film-scene opening-shot is-current" data-scene="0" id="opening">
        <div class="opening-photo">${picture('portrait','Banuja Disanayaka portrait','',true)}</div>
        <div class="opening-name"><span>Banuja</span><em>Disanayaka</em></div>
        <div class="opening-copy"><b>What's more <i>curious?</i></b><span>People, systems and visual stories—made useful.</span></div>
        <div class="opening-metrics">
          <span><strong>${work.length}</strong> PROJECTS</span>
          <span><strong>${photos.length}</strong> PHOTOGRAPHS</span>
          <span><strong>${worlds.length}</strong> WORLDS</span>
        </div>
      </article>

      <article class="film-scene gaze-shot" data-scene="1" id="photography">
        <div class="filmstrip">
          ${featured.map((g,i)=>`<figure><div>${photo(g,i)}</div><figcaption>${String(i+1).padStart(2,'0')} · ${esc(g.title||'Moment')}</figcaption></figure>`).join('')}
        </div>
        <div class="gaze-caption"><small>CHANNELS · SC 02</small><h2>The Daily<br><em>Gaze.</em></h2><p>A visual journal of light, life and the things we walk past.</p></div>
        <div class="gaze-count"><span>PHOTOGRAPHS</span><strong>${photos.length}<sup>+</sup></strong></div>
      </article>

      <article class="film-scene reach-shot" data-scene="2">
        <div class="reach-globe" aria-hidden="true">
          <div class="globe-lines"></div><i></i><i></i><i></i><i></i><i></i>
        </div>
        <div class="reach-copy"><small>AUDIENCE · SC 03</small><h2>Two places.<br><em>One point of view.</em></h2><p>Sri Lanka and Malaysia shaped how I observe people, work and visual culture.</p></div>
        <div class="reach-stat"><strong>02</strong><span>COUNTRIES<br>ONE CONTINUING LINE</span></div>
      </article>

      <article class="film-scene intertitle" data-scene="3">
        <div><small>CRAFTSMANSHIP · ACT TWO</small><h2>Craftsmanship</h2><p>Practical systems, visual clarity and work that earns its place.</p></div>
      </article>

      <article class="film-scene work-shot" data-scene="4" id="work">
        <div class="work-wall">
          ${work.map((p,i)=>`<a href="/work/${esc(p.slug)}/" class="work-cell c${i}"><small>TAKE ${String(i+1).padStart(2,'0')}</small><strong>${esc(p.title)}</strong><span>${esc(p.category)}</span></a>`).join('')}
        </div>
        <div class="work-caption"><small>WORK · SC 05</small><h2>Ideas, made<br><em>useful.</em></h2></div>
      </article>

      <article class="film-scene journey-shot" data-scene="5" id="about">
        <div class="journey-grid" aria-hidden="true"></div>
        <ol class="journey-list">
          ${jobs.map((j,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><div><small>${esc(j.year)}</small><strong>${esc(j.title)}</strong><span>${esc(j.company)}</span></div></li>`).join('')}
        </ol>
        <div class="journey-copy"><small>PATH · SC 06</small><h2>Design →<br>Operations →<br><em>Product.</em></h2></div>
      </article>

      <article class="film-scene intertitle" data-scene="6">
        <div><small>CURIOSITY · ACT THREE</small><h2>Curiosity</h2><p>An insatiable drive to explore the unknown and uncover hidden truths in tech, science and beyond.</p></div>
      </article>

      <article class="film-scene veloria-shot" data-scene="7" id="ecosystem">
        <div class="veloria-orbit">
          <div class="veloria-core">V</div>
          ${worlds.map((w,i)=>`<a href="${w.name==='The Daily Gaze'?'/daily-gaze/':'/work/veloria/'}" class="orbit-node n${i}"><small>0${i+1}</small><strong>${esc(w.name)}</strong><span>${esc(w.description)}</span></a>`).join('')}
        </div>
        <div class="veloria-copy"><small>VELORIA · SC 08</small><h2>One line.<br><em>Six worlds.</em></h2><p>Evolve Beyond.</p></div>
      </article>

      <article class="film-scene curiosity-shot" data-scene="8">
        <div class="curiosity-question"><small>AWARD · THE QUESTION</small><h2>Best Use<br>of <em>Observation.</em></h2><p>What happens when you keep looking long enough?</p></div>
        <div class="curiosity-answer"><span>Photography notices.</span><span>Operations reveals friction.</span><span>Design gives it shape.</span><span>Product connects the pieces.</span></div>
      </article>

      <article class="film-scene credits-shot" data-scene="9" id="credits">
        <div class="credits-title"><small>CREDITS · SC 10</small><h2>Banuja<br>Disanayaka</h2></div>
        <div class="credits-list">
          <div><span>WORK</span><strong>Product · Design · Operations</strong></div>
          <div><span>PHOTOGRAPHY</span><strong><a href="/daily-gaze/">The Daily Gaze ↗</a></strong></div>
          <div><span>CLIENT GALLERIES</span><strong><a href="/moments/">Moments ↗</a></strong></div>
          <div><span>EMAIL</span><strong><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></strong></div>
          <div><span>WHATSAPP</span><strong><a href="https://wa.me/${esc(contact.whatsappSriLanka)}">${esc(contact.whatsappSriLankaDisplay)}</a></strong></div>
        </div>
        <div class="signature-mark" aria-label="Banuja handwritten signature"><img src="/assets/signature/banuja-signature.svg" alt="Banuja handwritten signature"></div>
      </article>

      <div class="film-bottombar">
        <span class="film-time" data-film-time>00:00:00:00</span>
        <nav class="film-dots" aria-label="Scenes">${sceneNames.map((n,i)=>`<button type="button" data-scene-select="${i}" aria-label="${n}" aria-pressed="${i===0}"></button>`).join('')}</nav>
        <div class="film-links"><button type="button" data-open-scenes-mini>SCENES</button><a href="/moments/">MOMENTS</a><a href="#credits">CONTACT</a></div>
      </div>
      <div class="experience-utility"></div>
    </div>
  </section>

  <dialog class="experience-menu" id="experience-menu">
    <div class="experience-menu-inner">
      <div class="menu-meta"><span>TEN BEATS / ONE PERSPECTIVE</span><button type="button" data-close-scenes>Close ×</button></div>
      <div class="menu-layout"><nav>
      ${sceneNames.map((n,i)=>`<button type="button" data-menu-scene="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${n}</strong></button>`).join('')}
      </nav><aside><p>People.<br>Systems.<br><em>Visual stories.</em></p><div><a href="/daily-gaze/">The Daily Gaze ↗</a><a href="/moments/">Moments ↗</a><a href="/about/">About ↗</a><a href="/resume/">Résumé ↗</a></div></aside></div>
    </div>
  </dialog>`;
}
