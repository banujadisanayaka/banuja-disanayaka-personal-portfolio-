const TOTAL = 116

function photoSource(n, {download = false, width = 0, quality = 86} = {}) {
  const origin = `/.netlify/functions/mahi-photo?id=${n}${download ? '&download=1' : ''}`;
  if (download || !width) return origin;
  return `/.netlify/images?url=${encodeURIComponent(origin)}&w=${width}&fm=webp&q=${quality}`;
}

const photos = Array.from({length: TOTAL}, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return {
    id: i + 1,
    n,
    thumb: photoSource(n, {width: 420, quality: 76}),
    preview: photoSource(n, {width: 1200, quality: 82}),
    full: photoSource(n, {width: 2200, quality: 90}),
    download: photoSource(n, {download: true}),
    filename: `Mahi_21st_Birthday_Photo_${n}.png`,
    alt: `Mahi's 21st birthday memory ${i + 1}`
  };
});

const chapters = [
  {start:1, end:10, label:'Portraits & first smiles'},
  {start:11, end:22, label:'Family moments'},
  {start:23, end:34, label:'Cake, candles & celebration'},
  {start:35, end:116, label:'Evening memories'}
];

const state = { page: 0, lightboxIndex: 0, selected: new Set(), animating: false };
let finishTurn = null;
const landing = document.querySelector('#landing');
const albumShell = document.querySelector('#albumShell');
const spreadEl = document.querySelector('#spread');
const turnSheet = document.querySelector('#turnSheet');
const progressLabel = document.querySelector('#progressLabel');
const prevPage = document.querySelector('#prevPage');
const nextPage = document.querySelector('#nextPage');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxCounter = document.querySelector('#lightboxCounter');
const downloadCurrent = document.querySelector('#downloadCurrent');
const toggleSelectCurrent = document.querySelector('#toggleSelectCurrent');
const selectionDialog = document.querySelector('#selectionDialog');
const selectionGrid = document.querySelector('#selectionGrid');
const selectionCount = document.querySelector('#selectionCount');
const downloadDialog = document.querySelector('#downloadDialog');
const downloadBar = document.querySelector('#downloadBar');
const downloadProgress = document.querySelector('#downloadProgress');
const downloadTitle = document.querySelector('#downloadTitle');
const downloadMessage = document.querySelector('#downloadMessage');
const downloadDeviceTitle = document.querySelector('#downloadDeviceTitle');
const downloadDeviceHelp = document.querySelector('#downloadDeviceHelp');
const downloadPrimary = document.querySelector('#downloadPrimary');
const downloadFallback = document.querySelector('#downloadFallback');
const downloadChoose = document.querySelector('#downloadChoose');
const downloadProgressWrap = document.querySelector('#downloadProgressWrap');
const closeDownloadDialog = document.querySelector('#closeDownloadDialog');
const shareToast = document.querySelector('#shareToast');

const downloadState = {
  list: [],
  preparedFiles: [],
  shareBatches: [],
  batchIndex: 0,
  busy: false,
  controller: null,
  failedItems: []
};

// Each original appears once; page 10 gives the birthday portrait room to breathe.
const photoPages = (() => {
 const pages=[];
 for(let id=1;id<=108;id+=3) pages.push({layout:'trio',ids:[id,id+1,id+2]});
 pages.push({layout:'quartet',ids:[109,110,111,112]});
 pages.push({layout:'quartet',ids:[113,114,115,116]});
 return pages;
})();
const LAST_PAGE = photoPages.length + 1;
const mobileQuery = matchMedia('(max-width: 900px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function chapterFor(photoId){ return chapters.find(c => photoId >= c.start && photoId <= c.end)?.label || 'Birthday memories'; }
function currentMobile(){ return mobileQuery.matches; }
function visiblePage(){
  if(currentMobile() || state.page === 0 || state.page === LAST_PAGE) return state.page;
  return Math.floor((state.page - 1) / 2) * 2 + 1;
}

function makeTextPage(side, closing=false, companion=false){
  const page = document.createElement('article');
  page.className = `album-page text-page ${closing ? 'closing-page' : ''} ${side}`;

  if (closing && companion) {
    page.innerHTML = `
      <p class="chapter-no">Moments by The Daily Gaze</p>
      <h2>Thank you for trusting us with a day worth keeping.</h2>
      <p>These photographs are small pieces of a day filled with family, laughter and love — presented as a memory experience, not just a folder of files.</p>`;
  } else if (closing) {
    page.innerHTML = `
      <div class="seal">21</div>
      <p class="chapter-no">Until the next chapter</p>
      <h2>21 years of love, joy & beautiful memories.</h2>
      <p>Happy 21st Birthday, Mahi. May this little album always bring this night back to life.</p>
      <div class="closing-actions">
        <button class="gold-btn" data-download-all>Save all 116 photos</button>
        <button class="ghost-btn" data-share-album>Share memories</button>
        <button class="ghost-btn" data-open-selection>Choose favourites</button>
      </div>
      <div class="tdg-signoff">
        <p class="tdg-mark">The Daily Gaze · Moments</p>
        <p class="tdg-copy">Photography should feel like a memory, not a file transfer.</p>
        <div class="closing-actions">
          <a class="gold-btn link-btn" href="/">Visit portfolio</a>
          <a class="ghost-btn link-btn" href="https://wa.me/94760313533?text=Hi%20Banu%2C%20I%20saw%20your%20Moments%20gallery%20and%20I%27d%20like%20to%20book%20a%20photoshoot." target="_blank" rel="noopener noreferrer">Book a photoshoot</a>
        </div>
      </div>`;
  } else if (companion) {
    page.innerHTML = `
      <div class="seal">21</div>
      <p class="chapter-no">Your album</p>
      <h2>Turn the pages. Open a memory. Keep the ones you love.</h2>
      <p>Tap any photograph to see it full-screen. Save one image, choose favourites, or keep the complete collection in original quality — without opening Google Drive.</p>`;
  } else {
    page.innerHTML = `
      <p class="chapter-no">14 November 2026 · 21st</p>
      <h2>A beautiful celebration of love, laughter & memories.</h2>
      <p>Every smile, every candle and every little moment made this day unforgettable. Turn the pages and keep the memories that matter to you.</p>
      <div class="closing-actions"><button class="gold-btn" data-download-all>Save all 116 photos</button></div>`;
  }
  return page;
}

function makePhotoPage(composition, side, pageNumber){
  const page = document.createElement('article');
  page.className = `album-page photo-page ${side}`;
  page.setAttribute('aria-label', `Album page ${pageNumber}: ${chapterFor(composition.ids[0])}`);
  const grain = document.createElement('div');
  grain.className = 'page-paper-grain';
  grain.setAttribute('aria-hidden', 'true');
  const heading = document.createElement('header');
  heading.className = 'page-heading';
  heading.innerHTML = `<span>Mahi · 21st</span><span>${String(pageNumber).padStart(2, '0')}</span>`;
  const grid = document.createElement('div');
  grid.className = `photo-composition ${composition.layout}`;
  composition.ids.forEach((id, position) => {
    const photo = photos[id - 1];
    const mount = document.querySelector('#photoMountTemplate').content.firstElementChild.cloneNode(true);
    const img = mount.querySelector('img');
    mount.dataset.photoId = id;
    mount.setAttribute('aria-label', `Open photo ${id} of ${TOTAL}`);
    // The photograph itself stays uncropped and unfiltered.
    mount.style.setProperty('--tilt', ['-.65deg', '.6deg', '-.3deg', '.4deg'][(pageNumber + position) % 4]);
    img.alt = photo.alt;
    img.addEventListener('load', () => {
      mount.classList.remove('is-loading','is-error');
      mount.classList.add('is-loaded');
    }, {once:true});
    img.addEventListener('error', () => {
      mount.classList.remove('is-loading','is-loaded');
      mount.classList.add('is-error');
    }, {once:true});
    img.src = photo.preview;
    mount.querySelector('.print-number').textContent = photo.n;
    grid.append(mount);
  });
  const footer = document.createElement('footer');
  footer.className = 'page-footer';
  footer.innerHTML = `<span class="page-caption">${chapterFor(composition.ids[0])}</span><span class="page-folio">${composition.ids.length === 1 ? 'A moment to remember' : `${composition.ids.length} little memories`}</span>`;
  page.append(grain, heading, grid, footer);
  return page;
}

function pageNodes(index){
  const mobile = currentMobile();
  if(index === 0) return mobile
    ? [makeTextPage('right')]
    : [makeTextPage('left'), makeTextPage('right', false, true)];
  if(index === LAST_PAGE) return mobile
    ? [makeTextPage('right', true)]
    : [makeTextPage('left', true, true), makeTextPage('right', true)];
  return mobile
    ? [makePhotoPage(photoPages[index - 1], 'right', index)]
    : [makePhotoPage(photoPages[index - 1], 'left', index), makePhotoPage(photoPages[index], 'right', index + 1)];
}

const warmedPhotos = new Set();
function warmNearbyPhotos(){
  if(navigator.connection?.saveData) return;
  const index = visiblePage();
  const nearby = photoPages.slice(Math.max(0, index - 2), Math.min(photoPages.length, index + (currentMobile() ? 1 : 2)));
  const run = () => nearby.forEach(page => page.ids.forEach(id => {
    if(warmedPhotos.has(id)) return;
    warmedPhotos.add(id);
    const image = new Image();
    image.decoding = 'async';
    image.src = photos[id - 1].preview;
  }));
  if('requestIdleCallback' in window) requestIdleCallback(run, {timeout:700});
  else setTimeout(run, 80);
}

function updateProgress(){
  const index = visiblePage();
  const mobile = currentMobile();
  if(index === 0) progressLabel.textContent = mobile ? 'Opening page' : 'Opening pages';
  else if(index === LAST_PAGE) progressLabel.textContent = mobile ? 'Closing page' : 'Closing pages';
  else {
    const first = photoPages[index - 1].ids[0];
    const last = photoPages[mobile ? index - 1 : index].ids.at(-1);
    const pageLabel = mobile ? `Page ${index}` : `Pages ${index}–${index + 1}`;
    progressLabel.textContent = `${pageLabel} / ${photoPages.length} · ${first === last ? `Photo ${first}` : `Photos ${first}–${last}`}`;
  }
  document.querySelector('#mobileHint').textContent = mobile
    ? 'Swipe or use the arrows · Tap a photo to open'
    : 'Use the arrows to turn · Click a photograph to open';
  prevPage.disabled = index === 0;
  nextPage.disabled = index === LAST_PAGE;
  prevPage.setAttribute('aria-label', mobile ? 'Previous page' : 'Previous spread');
  nextPage.setAttribute('aria-label', mobile ? 'Next page' : 'Next spread');
  document.querySelector('#readingProgress').style.width = `${index / LAST_PAGE * 100}%`;
  document.querySelector('#book').style.setProperty('--read-progress', index / LAST_PAGE);
}

function renderSpread(){
  spreadEl.replaceChildren(...pageNodes(visiblePage()));
  updateProgress();
  warmNearbyPhotos();
}

// Delegate actions so moving real pages during a turn keeps every photo interactive.
spreadEl.addEventListener('click', event => {
  if(state.animating || Date.now() < suppressPhotoClickUntil) return;
  const photo = event.target.closest('[data-photo-id]');
  if(photo) return openLightbox(Number(photo.dataset.photoId) - 1);
  if(event.target.closest('[data-download-all]')) downloadMany(photos);
  if(event.target.closest('[data-open-selection]')) openSelection();
  if(event.target.closest('[data-share-album]')) shareAlbum();
});

function turn(delta){
  if(state.animating || !albumShell.classList.contains('active')) return;
  const mobile = currentMobile();
  const current = visiblePage();
  const step = mobile || current === 0 && delta > 0 || current === 1 && delta < 0 ? 1 : 2;
  const next = Math.max(0, Math.min(LAST_PAGE, current + delta * step));
  if(next === current) return;
  if(reducedMotion.matches){ state.page = next; renderSpread(); return; }

  state.animating = true;
  spreadEl.inert = true;
  const incoming = pageNodes(next);
  const outgoing = [...spreadEl.children];
  const front = document.createElement('div');
  const back = document.createElement('div');
  front.className = 'turn-face turn-front';
  back.className = 'turn-face turn-back';
  front.inert = true;
  back.inert = true;
  if(mobile){
    front.append(outgoing[0]);
    // The arriving page lies beneath the outgoing sheet on a small screen.
    spreadEl.replaceChildren(...incoming);
  } else if(delta > 0){
    front.append(outgoing[1]);
    back.append(incoming[0]);
    spreadEl.replaceChildren(outgoing[0], incoming[1]);
  } else {
    front.append(outgoing[0]);
    back.append(incoming[1]);
    spreadEl.replaceChildren(incoming[0], outgoing[1]);
  }
  turnSheet.replaceChildren(front, back);
  turnSheet.className = `turn-sheet ${delta > 0 ? 'active-next' : 'active-prev'}`;
  const book = document.querySelector('#book');
  book.classList.add('is-turning');
  let fallback;
  const finish = () => {
    if(finishTurn !== finish) return;
    clearTimeout(fallback);
    turnSheet.removeEventListener('animationend', onEnd);
    state.page = next;
    state.animating = false;
    finishTurn = null;
    turnSheet.className = 'turn-sheet';
    turnSheet.replaceChildren();
    book.classList.remove('is-turning');
    spreadEl.inert = false;
    renderSpread();
  };
  const onEnd = event => { if(event.target === turnSheet) finish(); };
  finishTurn = finish;
  turnSheet.addEventListener('animationend', onEnd);
  fallback = setTimeout(finish, 1000);
}

function openLightbox(index){
  state.lightboxIndex = Math.max(0, Math.min(TOTAL - 1, index));
  updateLightbox();
  if(!lightbox.open) lightbox.showModal();
}
function updateLightbox(){
  const p = photos[state.lightboxIndex];
  lightboxImage.classList.add('loading');
  lightboxImage.src = p.full; lightboxImage.alt = p.alt;
  lightboxImage.onload = () => lightboxImage.classList.remove('loading');
  lightboxImage.onerror = () => lightboxImage.classList.remove('loading');
  [state.lightboxIndex - 1, state.lightboxIndex + 1].forEach(index => {
    const wrapped = (index + TOTAL) % TOTAL;
    const image = new Image();
    image.decoding = 'async';
    image.src = photos[wrapped].full;
  });
  lightboxCounter.textContent = `Photo ${p.id} of ${TOTAL}`;
  downloadCurrent.href = p.download; downloadCurrent.download = p.filename;
  toggleSelectCurrent.textContent = state.selected.has(p.id) ? 'Remove from selection' : 'Add to selection';
}
function moveLightbox(delta){ state.lightboxIndex = (state.lightboxIndex + delta + TOTAL) % TOTAL; updateLightbox(); }

function renderSelection(){
  selectionGrid.replaceChildren();
  photos.forEach(p => {
    const b = document.createElement('button');
    b.className = `select-tile ${state.selected.has(p.id) ? 'selected' : ''}`;
    b.setAttribute('aria-label', `Select photo ${p.id}`);
    b.setAttribute('aria-pressed', String(state.selected.has(p.id)));
    b.innerHTML = `<img src="${p.thumb}" alt="${p.alt}" loading="lazy" decoding="async"><span class="check">${state.selected.has(p.id) ? '✓' : '+'}</span>`;
    b.addEventListener('click', () => { state.selected.has(p.id) ? state.selected.delete(p.id) : state.selected.add(p.id); renderSelection(); });
    selectionGrid.appendChild(b);
  });
  selectionCount.textContent = `${state.selected.size} selected`;
  document.querySelector('#downloadSelected').disabled = state.selected.size === 0;
}
function openSelection(){ renderSelection(); if(!selectionDialog.open) selectionDialog.showModal(); }

async function fetchBlob(photo, signal, retries=2){
  let lastError;
  for(let attempt=0;attempt<=retries;attempt++){
    if(signal?.aborted) throw new DOMException('Aborted','AbortError');
    try{
      const res = await fetch(photo.download, {cache:'no-store', signal});
      if(!res.ok) throw new Error(`Could not fetch ${photo.filename} (HTTP ${res.status})`);
      const type=(res.headers.get('content-type')||'').toLowerCase();
      if(!type.startsWith('image/')) throw new Error('Photo endpoint returned a non-image response');
      const blob=await res.blob();
      if(!blob.size) throw new Error(`Empty image: ${photo.filename}`);
      return blob;
    }catch(err){
      if(err?.name==='AbortError'||signal?.aborted) throw err;
      lastError=err;
      if(attempt<retries) await new Promise((resolve,reject)=>{
        const timer=setTimeout(resolve, attempt===0?800:2000);
        signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));},{once:true});
      });
    }
  }
  throw lastError||new Error('Photo download failed');
}

function deviceLabel(){
  const ua = navigator.userAgent || '';
  if(/iPhone|iPad|iPod/i.test(ua)) return 'iPhone / iPad';
  if(/Android/i.test(ua)) return 'Android phone';
  if(/Windows/i.test(ua)) return 'Windows computer';
  if(/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  return 'This device';
}

function resetDownloadState(){
  downloadState.list=[];
  downloadState.preparedFiles=[];
  downloadState.shareBatches=[];
  downloadState.batchIndex=0;
  downloadState.busy=false;
  downloadState.controller=null;
  downloadState.failedItems=[];
  downloadPrimary.disabled=false;
  downloadFallback.classList.add('hidden');
  downloadChoose.classList.add('hidden');
  downloadProgressWrap.classList.add('hidden');
  downloadBar.style.width='0%';
  downloadProgress.textContent='0 / 0';
}

function updateDownloadProgress(done,total){
  downloadProgressWrap.classList.remove('hidden');
  downloadBar.style.width=`${Math.round(done/total*100)}%`;
  downloadProgress.textContent=`${done} / ${total}`;
}

function finishDownload(title,message){
  downloadTitle.textContent=title;
  downloadMessage.textContent=message;
  downloadPrimary.classList.add('hidden');
  downloadFallback.classList.add('hidden');
  closeDownloadDialog.textContent='Done';
}

function supportsDirectorySave(){
  const ua=navigator.userAgent||'';
  const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints>1 && window.innerWidth<900);
  let topLevel=false;
  try{ topLevel=window.self===window.top; }catch{}
  return !mobile && window.isSecureContext===true && topLevel &&
    typeof window.showDirectoryPicker==='function';
}

function configureDownloadDialog(list){
  resetDownloadState();
  downloadState.list=list;
  closeDownloadDialog.textContent='Close';
  downloadPrimary.classList.remove('hidden');
  const count=list.length;
  const label=count===TOTAL?'all 116 photos':`${count} selected photo${count===1?'':'s'}`;
  downloadTitle.textContent=`Save ${label}`;
  downloadMessage.textContent='No ZIP file. Photos are saved as individual original-quality images.';
  if(count===TOTAL){
    downloadChoose.classList.remove('hidden');
    downloadChoose.onclick=()=>{downloadDialog.close();resetDownloadState();openSelection();};
  }

  if(supportsDirectorySave()){
    downloadDeviceTitle.textContent=`${deviceLabel()} · Save to a folder`;
    downloadDeviceHelp.textContent='Choose one folder and every photo will be written there as a normal image.';
    downloadPrimary.textContent='Choose folder & save';
    downloadPrimary.onclick=()=>saveToFolder(list);
    downloadFallback.textContent='Use normal downloads instead';
    downloadFallback.classList.remove('hidden');
    downloadFallback.onclick=()=>normalDownloads(list);
  }else if(navigator.share&&navigator.canShare){
    downloadDeviceTitle.textContent=`${deviceLabel()} · Phone save menu`;
    downloadDeviceHelp.textContent='Prepare up to 10 photos at a time, then tap each batch to open your phone save menu.';
    downloadPrimary.textContent=`Prepare batch 1 (${Math.min(10,count)} photos)`;
    downloadPrimary.onclick=()=>prepareNativeSave(list);
    downloadFallback.textContent='Use normal downloads instead';
    downloadFallback.classList.remove('hidden');
    downloadFallback.onclick=()=>normalDownloads(list);
  }else{
    downloadDeviceTitle.textContent=`${deviceLabel()} · Normal image downloads`;
    downloadDeviceHelp.textContent='Your browser may ask once to allow multiple downloads. Each item remains a normal image file.';
    downloadPrimary.textContent=`Download ${count} photo${count===1?'':'s'}`;
    downloadPrimary.onclick=()=>normalDownloads(list);
  }
}

async function saveToFolder(list){
  if(downloadState.busy) return;
  let dir;
  try{
    // Keep this call directly in the button gesture; cancellation is not a fallback.
    dir=await window.showDirectoryPicker({mode:'readwrite'});
  }catch(err){
    if(err?.name==='AbortError') return;
    downloadTitle.textContent='Folder picker unavailable';
    downloadMessage.textContent='Use normal downloads or the phone save menu instead.';
    return;
  }
  downloadState.busy=true;
  downloadState.controller=new AbortController();
  downloadPrimary.disabled=true;
  closeDownloadDialog.textContent='Cancel';
  try{
    let done=0;
    for(const p of list){
      const blob=await fetchBlob(p,downloadState.controller.signal);
      const handle=await dir.getFileHandle(p.filename,{create:true});
      const writable=await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      updateDownloadProgress(++done,list.length);
    }
    finishDownload('All memories saved',`${list.length} normal image files were saved to your chosen folder.`);
  }catch(err){
    if(err?.name==='AbortError'){
      downloadTitle.textContent='Save cancelled';
      downloadMessage.textContent='Folder saving stopped. No automatic fallback was started.';
    }else{
      downloadTitle.textContent='Folder save could not finish';
      downloadMessage.textContent=`${err.message||'A photo could not be saved.'} You can retry or use normal downloads.`;
      downloadFallback.classList.remove('hidden');
    }
    downloadPrimary.disabled=false;
  }finally{
    downloadState.busy=false;
    downloadState.controller=null;
    closeDownloadDialog.textContent='Close';
  }
}

async function prepareNativeSave(list){
  if(downloadState.busy||!list.length) return;
  downloadState.list=list;
  downloadState.failedItems=[];
  downloadState.preparedFiles=[];
  downloadState.batchIndex=0;
  await prepareShareBatch(0);
}

async function prepareShareBatch(batchIndex){
  if(downloadState.busy) return;
  const start=batchIndex*10;
  const batch=downloadState.list.slice(start,start+10);
  if(!batch.length){
    finishDownload('All batches prepared and shared','The save flow is complete.');
    return;
  }
  downloadState.busy=true;
  downloadState.controller=new AbortController();
  downloadPrimary.disabled=true;
  downloadFallback.classList.add('hidden');
  closeDownloadDialog.textContent='Cancel';
  const label=`Batch ${batchIndex+1} of ${Math.ceil(downloadState.list.length/10)} · Photos ${batch[0].n}–${batch[batch.length-1].n}`;
  downloadTitle.textContent='Preparing your photos…';
  downloadMessage.textContent=`Preparing ${label}. Only this batch is held in memory.`;
  updateDownloadProgress(0,batch.length);
  const files=new Array(batch.length);
  let cursor=0,done=0;
  const failedThisBatch=[];
  try{
    const workers=Array.from({length:Math.min(3,batch.length)},async()=>{
      while(cursor<batch.length){
        const i=cursor++;
        const p=batch[i];
        try{
          const blob=await fetchBlob(p,downloadState.controller.signal);
          files[i]=new File([blob],p.filename,{type:blob.type||'image/png'});
        }catch(err){
          if(err?.name==='AbortError') throw err;
          failedThisBatch.push(p);
          downloadState.failedItems.push(p);
        }
        updateDownloadProgress(++done,batch.length);
      }
    });
    await Promise.all(workers);
    if(failedThisBatch.length) throw new Error(`${failedThisBatch.length} photo(s) failed after retries: ${failedThisBatch.map(p=>p.n).join(', ')}`);
    downloadState.preparedFiles=files.filter(Boolean);
    downloadState.batchIndex=batchIndex;
    if(!downloadState.preparedFiles.length) throw new Error('No photos in this batch could be prepared.');
    downloadTitle.textContent=`${label} ready`;
    downloadMessage.textContent=downloadState.failedItems.length
      ? `${downloadState.preparedFiles.length} ready. ${downloadState.failedItems.length} photo(s) failed and can be retried separately.`
      : 'Tap the button below to open the phone save menu. The next batch will prepare after this one is shared.';
    downloadPrimary.disabled=false;
    downloadPrimary.textContent=`Tap to Save / Share Batch ${batchIndex+1}`;
    downloadPrimary.onclick=sharePreparedBatch;
    downloadFallback.textContent='Use normal downloads instead';
    downloadFallback.classList.remove('hidden');
    downloadFallback.onclick=()=>normalDownloads(batch);
  }catch(err){
    downloadState.preparedFiles=[];
    if(err?.name==='AbortError'){
      downloadTitle.textContent='Preparation cancelled';
      downloadMessage.textContent='No fallback downloads were started.';
    }else{
      downloadTitle.textContent='Could not prepare this batch';
      downloadMessage.textContent=`${err.message||'Network error'} You can retry this batch.`;
      downloadPrimary.disabled=false;
      downloadPrimary.textContent='Retry this batch';
      downloadPrimary.onclick=()=>prepareShareBatch(batchIndex);
    }
  }finally{
    downloadState.busy=false;
    downloadState.controller=null;
    closeDownloadDialog.textContent='Close';
  }
}

async function sharePreparedBatch(){
  const files=downloadState.preparedFiles;
  if(!files.length||downloadState.busy) return;
  const index=downloadState.batchIndex;
  const total=Math.ceil(downloadState.list.length/10);
  let sharePromise;
  try{
    // Invoke share synchronously in the click handler before awaiting anything else.
    if(!navigator.share||!navigator.canShare||!navigator.canShare({files})){
      throw new Error('This device cannot share these image files.');
    }
    sharePromise=navigator.share({files,title:'Mahi’s 21st Birthday',text:`Birthday memories · batch ${index+1} of ${total}`});
    await sharePromise;
  }catch(err){
    if(err?.name==='AbortError'){
      downloadMessage.textContent='Share sheet closed. Your prepared batch is still ready; tap again when you want to continue.';
      return;
    }
    downloadTitle.textContent='Could not open the phone save menu';
    downloadMessage.textContent=`${err.message||'Sharing is unavailable.'} Use normal downloads instead.`;
    downloadFallback.classList.remove('hidden');
    return;
  }

  // Drop every strong reference before preparing the next group.
  downloadState.preparedFiles.length=0;
  downloadState.preparedFiles=[];
  downloadPrimary.disabled=true;
  const next=index+1;
  if(next<total){
    await prepareShareBatch(next);
  }else{
    finishDownload('Share batches completed','The phone share flow finished. Confirm the files in the save destination you selected.');
    downloadState.list=[];
  }
}

async function normalDownloads(list){
  if(downloadState.busy||!list.length) return;
  downloadState.busy=true;
  downloadState.controller=new AbortController();
  downloadPrimary.disabled=true;
  closeDownloadDialog.textContent='Cancel';
  downloadFallback.classList.add('hidden');
  downloadTitle.textContent='Starting image downloads…';
  downloadMessage.textContent='Each photo is requested as an individual file. Your browser may ask permission for multiple downloads.';
  try{
    let done=0;
    for(const p of list){
      if(downloadState.controller.signal.aborted) throw new DOMException('Aborted','AbortError');
      const a=document.createElement('a');
      a.href=p.download;
      a.download=p.filename;
      a.rel='noopener';
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      updateDownloadProgress(++done,list.length);
      if(done<list.length) await new Promise((resolve,reject)=>{
        const signal=downloadState.controller.signal;
        const timer=setTimeout(resolve,350);
        signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));},{once:true});
      });
    }
    finishDownload('Downloads started',`${list.length} individual image downloads were requested. Check Downloads or Files if they do not appear in Photos automatically.`);
  }catch(err){
    downloadTitle.textContent=err?.name==='AbortError'?'Downloads stopped':'Could not finish downloads';
    downloadMessage.textContent=err?.name==='AbortError'?'Some downloads may already have started. No additional downloads will be triggered.':(err.message||'Try fewer photos.');
    downloadPrimary.disabled=false;
  }finally{
    downloadState.busy=false;
    downloadState.controller=null;
    closeDownloadDialog.textContent='Close';
  }
}

function downloadMany(list){
  if(!list.length) return;
  configureDownloadDialog(list);
  if(!downloadDialog.open) downloadDialog.showModal();
}

function showShareToast(message='Album link copied'){
  shareToast.textContent = message;
  shareToast.classList.add('show');
  clearTimeout(showShareToast.timer);
  showShareToast.timer = setTimeout(()=>shareToast.classList.remove('show'), 2200);
}

async function shareAlbum(){
  const shareData = {
    title: 'Mahi’s 21st Birthday',
    text: 'Mahi’s 21st birthday memories, captured by The Daily Gaze.',
    url: 'https://banujadisanayaka.netlify.app/moments/mahi-21st/'
  };
  try{
    if(navigator.share){
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    showShareToast();
  } catch(err){
    if(err?.name === 'AbortError') return;
    try{
      await navigator.clipboard.writeText(shareData.url);
      showShareToast();
    } catch {
      showShareToast('Copy this link: banujadisanayaka.netlify.app/moments/mahi-21st/');
    }
  }
}

function closeAlbum(){
  albumShell.classList.remove('active');
  albumShell.setAttribute('aria-hidden','true');
  document.body.classList.remove('album-open');
  landing.style.display='grid';
  landing.classList.remove('opening');
  finishTurn?.();
  state.page=0;
  renderSpread();
  document.querySelector('#openAlbum').focus();
}

document.querySelector('#openAlbum').addEventListener('click',()=>{
  landing.classList.add('opening');
  setTimeout(()=>{
    landing.style.display='none';
    albumShell.classList.add('active');
    albumShell.setAttribute('aria-hidden','false');
    document.body.classList.add('album-open');
    renderSpread();
    document.querySelector('#closeAlbum').focus({preventScroll:true});
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 720);
});
document.querySelector('#closeAlbum').addEventListener('click',closeAlbum);
prevPage.addEventListener('click',()=>turn(-1)); nextPage.addEventListener('click',()=>turn(1));
document.querySelectorAll('.album-toolbar [data-download-all]').forEach(b=>b.addEventListener('click',()=>downloadMany(photos)));
document.querySelector('#shareAlbum').addEventListener('click',shareAlbum);
document.querySelector('#selectPhotos').addEventListener('click',openSelection);
document.querySelector('#closeSelection').addEventListener('click',()=>selectionDialog.close());
document.querySelector('#clearSelection').addEventListener('click',()=>{state.selected.clear();renderSelection();});
document.querySelector('#downloadSelected').addEventListener('click',()=>{
  const selected = photos.filter(p=>state.selected.has(p.id));
  selectionDialog.close();
  downloadMany(selected);
});
closeDownloadDialog.addEventListener('click',()=>{
  if(downloadState.busy){
    downloadState.controller?.abort();
    downloadState.preparedFiles.length=0;
    downloadState.preparedFiles=[];
    return;
  }
  downloadDialog.close();
  resetDownloadState();
});
document.querySelectorAll('[data-close-lightbox]').forEach(x=>x.addEventListener('click',()=>lightbox.close()));
document.querySelector('#lightboxPrev').addEventListener('click',()=>moveLightbox(-1));
document.querySelector('#lightboxNext').addEventListener('click',()=>moveLightbox(1));
toggleSelectCurrent.addEventListener('click',()=>{ const id=photos[state.lightboxIndex].id; state.selected.has(id)?state.selected.delete(id):state.selected.add(id); updateLightbox(); });

let touchStartX = 0, touchStartY = 0, suppressPhotoClickUntil = 0;
const book = document.querySelector('#book');
book.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, {passive:true});
book.addEventListener('touchend', event => {
  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;
  if(Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4){
    suppressPhotoClickUntil = Date.now() + 450;
    turn(dx < 0 ? 1 : -1);
  }
}, {passive:true});

let lightboxTouchX=0;
const lightboxImageWrap = document.querySelector('.lightbox-image-wrap');
lightboxImageWrap.addEventListener('touchstart',e=>{lightboxTouchX=e.changedTouches[0].clientX},{passive:true});
lightboxImageWrap.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-lightboxTouchX;
  if(Math.abs(dx)>45) moveLightbox(dx<0?1:-1);
},{passive:true});

document.addEventListener('keydown',e=>{
  if(lightbox.open){ if(e.key==='ArrowLeft') moveLightbox(-1); if(e.key==='ArrowRight') moveLightbox(1); return; }
  if(selectionDialog.open||downloadDialog.open) return;
  if(!albumShell.classList.contains('active')) return;
  if(e.key==='ArrowLeft'){ e.preventDefault(); turn(-1); }
  if(e.key==='ArrowRight'){ e.preventDefault(); turn(1); }
});

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('/moments/mahi-21st/sw.js',{scope:'/moments/mahi-21st/'}).catch(()=>{})); }
renderSpread();

mobileQuery.addEventListener('change', () => { finishTurn?.(); renderSpread(); });
reducedMotion.addEventListener('change', () => { if(reducedMotion.matches) finishTurn?.(); });

