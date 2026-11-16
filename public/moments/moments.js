const albums = [
  {
    slug: 'mahi-21st',
    title: 'Mahi’s 21st Birthday',
    date: '14 November 2026',
    location: 'Sri Lanka',
    count: 116,
    privacy: 'public',
    description: 'A collection of memories celebrating Mahi’s 21st birthday.',
    href: '/moments/mahi-21st/',
    cover: '/.netlify/images?url=%2F.netlify%2Ffunctions%2Fmahi-photo%3Fid%3D037%26v%3D20261116-037&w=1800&h=1300&fit=cover&fm=webp&q=88'
  },
  {
    slug: 'sathiw-7th-birthday',
    title: 'Sathiw’s 7th Birthday',
    date: 'September 2026',
    location: 'Sri Lanka',
    count: 44,
    privacy: 'public',
    description: 'Seven years of laughter, family and candlelight — kept as a story to return to.',
    href: '/moments/sathiw-7th-birthday/',
    cover: '/.netlify/images?url=%2F.netlify%2Ffunctions%2Fsathiw-photo%3Fid%3D026&w=1800&h=1300&fit=cover&fm=webp&q=88'
  }
];const grid = document.querySelector('#momentGrid');
const intro = document.querySelector('#momentsIntro');
const pinDialog = document.querySelector('#pinDialog');
const pinForm = document.querySelector('#pinForm');
const pinInputs = [...document.querySelectorAll('.pin-row input')];
const pinStatus = document.querySelector('#pinStatus');
const pinDescription = document.querySelector('#pinDescription');
const unlockButton = document.querySelector('#unlockButton');
let activeAlbum = null;

function iconLock() {
  return `<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.8a4.5 4.5 0 0 1 9 0V10M6 10h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

function cardMarkup(album, index) {
  const privateAlbum = album.privacy === 'private';
  const classes = ['moment-card'];
  if (index === 0) classes.push('featured');
  const access = privateAlbum
    ? `<span class="access">${iconLock()} Private</span>`
    : '<span class="access">Public story</span>';
  const label = privateAlbum ? 'Unlock private story' : 'Open story';
  return `
    <a class="${classes.join(' ')}" href="${privateAlbum ? '#private' : album.href}" data-slug="${album.slug}" data-private="${privateAlbum}" aria-label="${label}: ${album.title}">
      <img class="cover" src="${album.cover}" alt="" decoding="async" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
      <div class="card-top">
        <span class="index">Moment ${String(index + 1).padStart(2, '0')}</span>
        ${access}
      </div>
      <div class="card-copy">
        <div>
          <h3>${album.title}</h3>
          <p>${album.description}</p>
          <p class="meta">${album.date} · ${album.count} photographs · ${album.location}</p>
        </div>
        <span class="open-mark" aria-hidden="true">${privateAlbum ? '⌁' : '↗'}</span>
      </div>
    </a>`;
}

function renderAlbums() {
  grid.innerHTML = albums.map(cardMarkup).join('') + `
    <aside class="coming">
      <div>
        <p class="eyebrow">Your story could be next</p>
        <h3>A gallery made for your memories.</h3>
      </div>
      <div>
        <p>Birthday, portrait, family or a small celebration — your finished photographs can live here as a public story or a PIN-protected private Moment.</p>
        <a class="pill gold" href="https://wa.me/94760313533?text=Hi%20Banu%2C%20I%20saw%20Moments%20by%20The%20Daily%20Gaze%20and%20I%27d%20like%20to%20book%20a%20photoshoot." rel="noopener noreferrer">Book your Moment ↗</a>
      </div>
    </aside>`;

  grid.querySelectorAll('[data-private="true"]').forEach(card => {
    card.addEventListener('click', event => {
      event.preventDefault();
      const album = albums.find(item => item.slug === card.dataset.slug);
      if (album) openPin(album);
    });
  });
}

function showIntro(force = false) {
  if (!force && localStorage.getItem('tdg-moments-intro-v1') === 'seen') return;
  if (!intro.open) intro.showModal();
}

function closeIntro() {
  localStorage.setItem('tdg-moments-intro-v1', 'seen');
  if (intro.open) intro.close();
}

function resetPin() {
  pinInputs.forEach(input => { input.value = ''; });
  pinStatus.textContent = '';
  pinStatus.classList.remove('error');
  unlockButton.disabled = false;
  unlockButton.textContent = 'Unlock Moment →';
}

function openPin(album) {
  activeAlbum = album;
  resetPin();
  pinDescription.textContent = `${album.title} is a private client story. Enter the 4-digit code shared by The Daily Gaze.`;
  if (!pinDialog.open) pinDialog.showModal();
  requestAnimationFrame(() => pinInputs[0]?.focus());
}

function closePin() {
  activeAlbum = null;
  if (pinDialog.open) pinDialog.close();
  resetPin();
}

pinInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(-1);
    if (input.value && index < pinInputs.length - 1) pinInputs[index + 1].focus();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && !input.value && index > 0) pinInputs[index - 1].focus();
    if (event.key === 'ArrowLeft' && index > 0) pinInputs[index - 1].focus();
    if (event.key === 'ArrowRight' && index < pinInputs.length - 1) pinInputs[index + 1].focus();
  });
  input.addEventListener('paste', event => {
    const digits = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 4);
    if (!digits) return;
    event.preventDefault();
    [...digits].forEach((digit, i) => { if (pinInputs[i]) pinInputs[i].value = digit; });
    pinInputs[Math.min(digits.length, 4) - 1]?.focus();
  });
});

pinForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!activeAlbum) return;

  const pin = pinInputs.map(input => input.value).join('');
  if (!/^\d{4}$/.test(pin)) {
    pinStatus.textContent = 'Enter all four digits.';
    pinStatus.classList.add('error');
    return;
  }

  unlockButton.disabled = true;
  unlockButton.textContent = 'Checking…';
  pinStatus.textContent = '';
  pinStatus.classList.remove('error');

  try {
    const response = await fetch('/.netlify/functions/moments-unlock', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({slug: activeAlbum.slug, pin})
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'That code did not match.');
    }

    pinStatus.textContent = 'Unlocked. Opening your Moment…';
    window.location.assign(activeAlbum.href);
  } catch (error) {
    pinStatus.textContent = error.message || 'Could not unlock this Moment.';
    pinStatus.classList.add('error');
    pinInputs.forEach(input => { input.value = ''; });
    pinInputs[0]?.focus();
    unlockButton.disabled = false;
    unlockButton.textContent = 'Unlock Moment →';
  }
});

document.querySelector('#aboutMoments')?.addEventListener('click', () => showIntro(true));
document.querySelectorAll('[data-close-intro]').forEach(button => button.addEventListener('click', closeIntro));
document.querySelector('#closePin')?.addEventListener('click', closePin);

intro.addEventListener('click', event => {
  if (event.target === intro) closeIntro();
});
pinDialog.addEventListener('click', event => {
  if (event.target === pinDialog) closePin();
});

renderAlbums();

const unlockSlug = new URLSearchParams(location.search).get('unlock');
if (unlockSlug) {
  const album = albums.find(item => item.slug === unlockSlug && item.privacy === 'private');
  if (album) openPin(album);
  history.replaceState(null, '', '/moments/');
} else {
  requestAnimationFrame(() => showIntro());
}
