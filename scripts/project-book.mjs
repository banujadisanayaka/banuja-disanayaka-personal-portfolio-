// Shared ThreeUI cover geometry for the approved experiment and Work.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles=['Orders<br><em>in motion.</em>','A class<br><em>of clarity.</em>','Room for<br><em>thought.</em>','A voice.<br><em>An action.</em>','Many voices.<br><em>One vision.</em>'];
const marks=[
 '<path d="M20 30H140V70H60V110H140V150H20"/><circle cx="20" cy="30" r="7"/><circle cx="140" cy="70" r="7"/><circle cx="60" cy="110" r="7"/><circle cx="140" cy="150" r="7"/>',
 '<rect x="22" y="25" width="116" height="128" rx="3"/><path d="M22 57H138M55 25V153M95 25V153M22 89H138M22 121H138"/><path class="accent" d="M64 74l9 9 16-20M103 138l9 9 16-20"/>',
 '<circle cx="80" cy="90" r="53"/><ellipse cx="80" cy="90" rx="26" ry="72" transform="rotate(40 80 90)"/><ellipse cx="80" cy="90" rx="26" ry="72" transform="rotate(-40 80 90)"/><circle class="accent" cx="80" cy="90" r="6"/>',
 '<path d="M20 75V105M35 55V125M50 34V146M65 65V115M80 22V158M95 55V125M110 42V138M125 65V115M140 78V102"/>',
 '<path d="M80 20L140 55V125L80 160L20 125V55Z M80 20V160M20 55L140 125M140 55L20 125"/><circle cx="80" cy="90" r="24"/>'
];
export const cover=(p,i)=>`<span class="book" aria-hidden="true"><span class="book-back"></span><span class="page-block"></span><span class="page-fan"><i></i><i></i><i></i></span><span class="inside-page"><span>FIELD NOTES / 0${i+1}</span><strong>${esc(p.kicker)}</strong><span>${esc(p.category)}</span></span><span class="front-cover"><span class="cover-top">BANUJA DISANAYAKA <b>0${i+1}</b></span><span class="cover-title">${titles[i]}</span><svg class="cover-mark" viewBox="0 0 160 180" fill="none" stroke="currentColor" stroke-width="1.3">${marks[i]}</svg><span class="cover-bottom">${esc(p.title)}<small>${esc(p.year)} / SELECTED WORK</small></span></span></span>`;

export const projectBook=(p,i)=>`<span class="project-book book-theme-${i}">${cover(p,i)}</span>`;
