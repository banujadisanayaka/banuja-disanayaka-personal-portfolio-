import assert from 'node:assert/strict';
import fs from 'node:fs';
import projects from '../content/projects.mjs';
import {siteOrigin} from './seo.mjs';
const origin=siteOrigin;
const legacyOrigin='https://banuja-personal-log.netlify.app';
const routes=['/','/about/','/resume/','/daily-gaze/',...projects.map(p=>`/work/${p.slug}/`)];
for(const route of routes){
  const html=fs.readFileSync('public'+route+'index.html','utf8');
  const meta=(name)=>html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`))?.[1];
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(!html.includes(legacyOrigin),route+' does not expose the retired site origin');
  assert.ok(title.includes('Banuja Disanayaka'),route+' identifies its author');
  assert.ok(title.length<=65,route+' keeps a concise search title: '+title.length);
  assert.ok((meta('description')||'').length>=70&&meta('description').length<=180,route+' keeps a useful search description');
  assert.equal(meta('og:title'),title);assert.equal(meta('twitter:title'),title);
  assert.equal(meta('og:description'),meta('description'));assert.equal(meta('twitter:description'),meta('description'));
  assert.equal(meta('og:url'),origin+route);assert.ok(meta('robots').includes('max-image-preview:large'));
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
  const person=graph.find(n=>n['@type']==='Person');assert.equal(person.name,'Banuja Disanayaka');
  assert.deepEqual(person.sameAs,[
    'https://github.com/banujadisanayaka',
    'https://www.linkedin.com/in/banuja-disanayaka-730904278',
    'https://www.instagram.com/banuja_disanayaka/'
  ],route+' keeps Banuja Disanayaka entity references');
  assert.equal(person['@id'],origin+'/#person');
  const page=graph.find(n=>n['@id']===origin+route+'#webpage');assert.equal(page.author['@id'],person['@id']);
  if(route!=='/')assert.ok(graph.some(n=>n['@type']==='BreadcrumbList'));
  if(route.startsWith('/work/')){
    const work=graph.find(n=>n['@type']==='CreativeWork'&&n.creator['@id']===person['@id']);
    assert.ok(work,route+' exposes a CreativeWork');
    assert.ok(Array.isArray(work.keywords)&&work.keywords.length>=3,route+' exposes project keywords');
  }
  if(route==='/resume/')assert.equal(page['@type'],'ProfilePage','Résumé reinforces the person entity');
  if(route==='/daily-gaze/'){
    assert.ok(graph.some(n=>n['@type']==='ImageGallery'),'Daily Gaze exposes ImageGallery semantics');
    assert.ok(graph.filter(n=>n['@type']==='ImageObject').length>=6,'Daily Gaze exposes representative ImageObjects');
    assert.ok(!meta('og:image').endsWith('/assets/v9/social-card.jpg'),'Daily Gaze uses a representative photograph for sharing/search');
  }
}
const moments=fs.readFileSync('public/moments/index.html','utf8');
assert.match(moments,/name="robots" content="index,follow,max-image-preview:large"/);
assert.match(moments,/rel="canonical" href="https:\/\/banujadisanayaka\.netlify\.app\/moments\/"/);
assert.match(moments,/name="twitter:card" content="summary_large_image"/);
const momentsSchema=JSON.parse(moments.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.ok(momentsSchema['@graph'].some(n=>n['@type']==='Service'),'Moments exposes photography Service schema');
assert.ok(momentsSchema['@graph'].some(n=>n['@type']==='Person'&&n.name==='Banuja Disanayaka'),'Moments connects the service to Banuja');
const sathiw=fs.readFileSync('public/moments/sathiw-7th-birthday/index.html','utf8');
assert.match(sathiw,/name="robots" content="noindex,nofollow,noarchive,noimageindex"/);
const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
assert.ok(sitemap.includes(origin+'/moments/'),'Sitemap includes the public Moments collection');
assert.ok(sitemap.includes('<image:title>')&&sitemap.includes('<image:caption>'),'Image sitemap carries titles and captions');
assert.ok(!sitemap.includes('<lastmod>'),'Sitemap does not manufacture lastmod dates on every build');
for (const file of ['public/robots.txt','public/sitemap.xml']) {
  const source=fs.readFileSync(file,'utf8');
  assert.ok(source.includes(origin),file+' references the canonical origin');
  assert.ok(!source.includes(legacyOrigin),file+' does not reference the retired origin');
}
assert.match(fs.readFileSync('public/404.html','utf8'),/name="robots" content="noindex, follow"/);
console.log('SEO passed: nine canonical routes, consistent social metadata, named author, linked project entities, breadcrumbs and noindex 404.');
