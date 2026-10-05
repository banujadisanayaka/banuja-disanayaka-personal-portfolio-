const CACHE='sathiw-moments-v1';
const BASE='/moments/sathiw-7th-birthday/';
const SHELL=[BASE,BASE+'index.html',BASE+'styles.css',BASE+'app.js',BASE+'manifest.webmanifest'];

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sathiw-moments-')&&k!==CACHE).map(k=>caches.delete(k))))));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  const isShell=url.origin===location.origin&&SHELL.includes(url.pathname);
  if(!isShell) return;
  e.respondWith(fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return res;}).catch(()=>caches.match(e.request)));
});
