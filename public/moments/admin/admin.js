(() => {
  const SUPABASE_URL = 'https://higdlmiobpityynbxdwh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_BEGpmbL4GxAgUh-yie_-CQ_UYkfEv_P';
  const ADMIN_EMAIL = 'banuja2005@gmail.com';
  const BUCKET = 'moments-photos';
  const $ = (id) => document.getElementById(id);
  const login = $('login'), app = $('app'), loginStatus = $('loginStatus');
  let client, currentUser = null;

  function message(el, text, type='') { el.textContent = text; el.className = 'status' + (type ? ' '+type : ''); }
  function safe(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function slugify(value) { return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  async function init() {
    if (!window.supabase?.createClient) { message(loginStatus, 'The authentication library did not load. Refresh this page.', 'error'); return; }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    $('googleLogin').addEventListener('click', signIn);
    $('signOut').addEventListener('click', signOut);
    $('albumForm').addEventListener('submit', saveAlbum);
    $('resetForm').addEventListener('click', resetForm);
    $('title').addEventListener('input', () => { if (!$('albumId').value) $('slug').value = slugify($('title').value); });
    client.auth.onAuthStateChange((_event, session) => { setTimeout(() => handleSession(session), 0); });
    const { data:{session} } = await client.auth.getSession();
    await handleSession(session);
  }

  async function signIn() {
    message(loginStatus, 'Opening Google sign-in…');
    const { error } = await client.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.origin + '/moments/admin/' } });
    if (error) message(loginStatus, error.message, 'error');
  }
  async function signOut() { await client.auth.signOut(); currentUser=null; showLogin(); }
  function showLogin() { app.hidden=true; login.hidden=false; $('signOut').hidden=true; $('userEmail').textContent=''; }
  async function handleSession(session) {
    const user = session?.user;
    if (!user) { showLogin(); return; }
    if ((user.email || '').toLowerCase() !== ADMIN_EMAIL) {
      await client.auth.signOut();
      message(loginStatus, 'This Google account is not authorised for Moments administration.', 'error');
      showLogin(); return;
    }
    currentUser=user; login.hidden=true; app.hidden=false; $('signOut').hidden=false; $('userEmail').textContent=user.email;
    await loadAlbums();
  }

  async function signedImage(path) {
    const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 1800);
    if (error) return '';
    return data.signedUrl;
  }
  async function loadAlbums() {
    const host=$('albumList'); host.innerHTML='<p class="hint">Loading albums…</p>';
    const { data, error } = await client.from('moments_albums').select('*, moments_photos(id,storage_path,sort_order)').order('created_at',{ascending:false});
    if (error) { host.innerHTML=''; message($('listStatus'), error.message, 'error'); return; }
    message($('listStatus'), data.length ? data.length+' album(s)' : 'No albums yet.');
    if (!data.length) { host.innerHTML='<p class="hint">Your first story starts here.</p>'; return; }
    const rows=await Promise.all(data.map(async album => {
      const photos=(album.moments_photos||[]).sort((a,b)=>a.sort_order-b.sort_order);
      const cover=photos[0] ? await signedImage(photos[0].storage_path) : '';
      return {album,photos,cover};
    }));
    host.innerHTML=rows.map(({album,photos,cover})=>'<article class="album"><img class="thumb" src="'+safe(cover)+'" alt=""><div><h3>'+safe(album.title)+'</h3><div class="meta">'+photos.length+' photos · '+safe(album.slug)+'</div><p><span class="tag '+(album.status==='published'?'live':'')+'">'+safe(album.status)+'</span><span class="tag">'+safe(album.privacy)+'</span></p><div class="album-actions"><button class="btn small" data-edit="'+album.id+'">Edit</button><button class="btn small" data-publish="'+album.id+'" data-status="'+album.status+'">'+(album.status==='published'?'Unpublish':'Publish')+'</button><button class="btn small" data-delete="'+album.id+'">Delete</button></div></div></article>').join('');
    host.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editAlbum(data.find(a=>a.id===b.dataset.edit))));
    host.querySelectorAll('[data-publish]').forEach(b=>b.addEventListener('click',()=>togglePublish(b.dataset.publish,b.dataset.status)));
    host.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteAlbum(b.dataset.delete)));
  }

  function editAlbum(a) {
    $('albumId').value=a.id; $('title').value=a.title; $('slug').value=a.slug; $('description').value=a.description||'';
    $('eventDate').value=a.event_date||''; $('location').value=a.location||'';
    $('formTitle').textContent='Edit album'; $('saveAlbum').textContent='Save changes & upload'; window.scrollTo({top:0,behavior:'smooth'});
  }
  function resetForm() { $('albumForm').reset(); $('albumId').value=''; $('formTitle').textContent='Create an album'; $('saveAlbum').textContent='Save album & upload'; message($('formStatus'),''); }

  async function saveAlbum(event) {
    event.preventDefault();
    const button=$('saveAlbum'), id=$('albumId').value, files=[...$('photos').files];
    const payload={title:$('title').value.trim(),slug:$('slug').value.trim(),description:$('description').value.trim(),event_date:$('eventDate').value||null,location:$('location').value.trim()};
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) { message($('formStatus'),'Use a lowercase URL slug with hyphens only.','error'); return; }
    if (files.some(f=>f.size>20*1024*1024)) { message($('formStatus'),'Each photo must be 20 MB or smaller.','error'); return; }
    button.disabled=true; message($('formStatus'),'Saving album…');
    try {
      let albumId=id;
      if (id) {
        const {error}=await client.from('moments_albums').update(payload).eq('id',id);
        if(error) throw error;
      } else {
        const {data,error}=await client.from('moments_albums').insert(payload).select('id').single();
        if(error) throw error; albumId=data.id;
      }
      let uploaded=0;
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error('Unsupported image type: '+file.name);
        const clean=file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-100);
        const path=albumId+'/'+crypto.randomUUID()+'-'+clean;
        const {error:uploadError}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
        if(uploadError) throw uploadError;
        const {data:photo,error:photoError}=await client.from('moments_photos').insert({album_id:albumId,storage_path:path,alt_text:file.name,sort_order:Date.now()+uploaded}).select('id').single();
        if(photoError) { await client.storage.from(BUCKET).remove([path]); throw photoError; }
        uploaded++;
        message($('formStatus'),'Uploaded '+uploaded+' of '+files.length+' photo(s)…');
      }
      const {data:existing}=await client.from('moments_albums').select('cover_photo_id').eq('id',albumId).single();
      if(!existing?.cover_photo_id) {
        const {data:first}=await client.from('moments_photos').select('id').eq('album_id',albumId).order('sort_order').limit(1).maybeSingle();
        if(first) await client.from('moments_albums').update({cover_photo_id:first.id}).eq('id',albumId);
      }
      message($('formStatus'),'Album saved'+(uploaded?' · '+uploaded+' photo(s) uploaded':'')+'. It remains a draft until published.','ok');
      resetForm(); await loadAlbums();
    } catch(error) { message($('formStatus'),error.message||'Could not save album.','error'); }
    finally { button.disabled=false; }
  }

  async function togglePublish(id,status) {
    const next=status==='published'?'draft':'published';
    const {error}=await client.from('moments_albums').update({status:next,updated_at:new Date().toISOString()}).eq('id',id);
    if(error) message($('listStatus'),error.message,'error'); else { message($('listStatus'),'Album '+next+'.','ok'); await loadAlbums(); }
  }
  async function deleteAlbum(id) {
    if(!confirm('Delete this album and its uploaded photos permanently?')) return;
    const {data:photos,error:photoError}=await client.from('moments_photos').select('storage_path').eq('album_id',id);
    if(photoError) { message($('listStatus'),photoError.message,'error'); return; }
    if(photos?.length) {
      const {error}=await client.storage.from(BUCKET).remove(photos.map(p=>p.storage_path));
      if(error) { message($('listStatus'),'Storage deletion failed: '+error.message,'error'); return; }
    }
    const {error}=await client.from('moments_albums').delete().eq('id',id);
    if(error) message($('listStatus'),error.message,'error'); else { message($('listStatus'),'Album deleted.','ok'); await loadAlbums(); }
  }

  document.addEventListener('DOMContentLoaded',init);
})();
