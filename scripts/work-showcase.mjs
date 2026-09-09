// Keep complete links and summaries in the HTML; the carousel is an enhancement.
export function projectCards(projects, map, esc) {
  return projects.map((p, i) => `<article class="project" data-reveal data-project="${p.slug}" data-work-tone="${p.color}">
    <a class="project-visual" data-depth href="/work/${p.slug}/" tabindex="-1" aria-hidden="true">${map(p)}</a>
    <div class="project-copy">
      <p class="eyebrow">${esc(p.category)} <span>${String(i + 1).padStart(2, '0')}</span></p>
      <h3><a href="/work/${p.slug}/">${esc(p.title)} <span aria-hidden="true">↗</span></a></h3>
      <p>${esc(p.description)}</p>
      <span class="project-status">${esc(p.status)}</span>
    </div>
    <template class="project-preview-content">
      <p class="work-preview-kicker">${esc(p.kicker)}</p>
      <div class="work-preview-facts"><div><h3>My role</h3><p>${esc(p.role)}</p></div><div><h3>Built with</h3><p>${esc(p.stack)}</p></div></div>
      <div class="work-preview-story"><h3>The starting point</h3><p>${esc(p.problem)}</p><h3>The approach</h3><p>${esc(p.approach)}</p></div>
    </template>
  </article>`).join('');
}

export function workShowcase(cards) {
  return `<div class="work-showcase" data-work-showcase>
    <div class="work-ambience" aria-hidden="true"><span data-glow-tone="sage"></span><span data-glow-tone="lavender"></span><span data-glow-tone="sand"></span><span data-glow-tone="blue"></span><span data-glow-tone="gold"></span></div>
    <div class="project-grid">${cards}</div>
    <div class="work-navigation" hidden>
      <p class="work-instruction">Choose a project. Explore the story.</p>
      <div class="work-dock" role="group" aria-label="Project navigation">
        <button class="work-previous" type="button" aria-label="Previous project"><span aria-hidden="true">←</span></button>
        <div class="work-picker" role="group" aria-label="Choose a project"></div>
        <button class="work-next" type="button" aria-label="Next project"><span aria-hidden="true">→</span></button>
      </div>
      <p class="work-announcement" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
  </div>
  <dialog class="work-preview" id="work-preview" aria-labelledby="work-preview-title">
    <div class="work-preview-top"><span>Selected work</span><button type="button" class="work-preview-close" aria-label="Close project preview" autofocus>Close <span aria-hidden="true">×</span></button></div>
    <div class="work-preview-layout">
      <div class="work-preview-cover" aria-hidden="true"></div>
      <div class="work-preview-copy"><p class="work-preview-category"></p><h2 id="work-preview-title"></h2><p class="work-preview-description"></p><p class="work-preview-status"></p><div class="work-preview-details"></div><a class="button primary work-case-link">View full case study <span aria-hidden="true">↗</span></a></div>
    </div>
  </dialog>`;
}
