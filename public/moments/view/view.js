(() => {
 const URL='https://higdlmiobpityynbxdwh.supabase.co', KEY='sb_publishable_BEGpmbL4GxAgUh-yie_-CQ_UYkfEv_P', BUCKET='moments-photos';
 const $=id=>document.getElementById(id);
 const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function run(){
  const slug=new URLSearchParams(location.search).get('album');
  if(!slug||!window.supabase?.createClient){$('status').textContent='This story could not be found.';return;}
  const db=window.supabase.createClient(URL,KEY);
  const {data:album,error}=await db.from('moments_albums').select('id,title,description,event_date,location,moments_photos(id,storage_path,sort_order)').eq('slug',slug).eq('status','published').eq('privacy','public').single();
  if(error||!album){$('title').innerHTML='Moment <em>unavailable.</em>';$('status').textContent='This story is not available or has not been published.';return;}
  const photos=(album.moments_photos||[]).sort((a,b)=>a.sort_order-b.sort_order);
  $('title').textContent=album.title;
  $('meta').textContent=[album.event_date?new Date(album.event_date+'T00:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'}):'',album.location,photos.length+' photographs'].filter(Boolean).join(' · ');
  $('description').textContent=album.description||'A story by The Daily Gaze.';
  const urls=await Promise.all(photos.map(async photo=>{
   const {data,error}=await db.storage.from(BUCKET).createSignedUrl(photo.storage_path,3600);
   return error?null:{url:data.signedUrl,alt:photo.alt_text||album.title};
  }));
  $('gallery').innerHTML=urls.filter(Boolean).map(item=>'<img src="'+safe(item.url)+'" alt="'+safe(item.alt)+'" loading="lazy" decoding="async">').join('');
  $('status').hidden=true;
  if(!urls.some(Boolean)){$('status').hidden=false;$('status').textContent='Photographs are not available yet.';}
 }
 document.addEventListener('DOMContentLoaded',()=>run().catch(e=>{$('status').textContent='Could not load this Moment. Please try again later.';console.error(e);}));
})();