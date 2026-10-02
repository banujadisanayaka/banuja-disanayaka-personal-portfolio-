import assert from 'node:assert/strict';
import fs from 'node:fs';
import projects from '../content/projects.mjs';
import {siteOrigin} from './seo.mjs';
const origin=siteOrigin;
const legacyOrigin='https://banuja-personal-log.netlify.app';
const routes=['/','/about/','/resume/','/daily-gaze/',...projects.map(p=>`/work/${p.slug}/`)];
const titles=new Set(),descriptions=new Set();
for(const route of routes){
  const html=fs.readFileSync('public'+route+'index.html','utf8');
  const meta=(name)=>html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`))?.[1];
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,route+' has one primary heading');
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,route+' has one canonical');
  assert.ok(html.includes(`rel="canonical" href="${origin+route}"`));
  assert.ok(!titles.has(title),route+' has a distinct search title');titles.add(title);
  assert.ok(meta('description')&&!descriptions.has(meta('description')),route+' has a distinct description');descriptions.add(meta('description'));
  assert.ok(!html.includes(legacyOrigin),route+' does not expose the retired site origin');
  assert.ok(title.includes('Banuja Disanayaka'),route+' identifies its author');
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
  if(route.startsWith('/work/'))assert.ok(graph.some(n=>n['@type']==='CreativeWork'&&n.creator['@id']===person['@id']));
  if(route==='/daily-gaze/'){
    const images=graph.filter(n=>n['@type']==='ImageObject');
    assert.equal(images.length,6,'Six representative original photographs have author metadata');
    for(const image of images){
      assert.equal(image.creator['@id'],person['@id']);
      assert.ok(html.includes(image.contentUrl.slice(origin.length)),'Structured photo is present in the journal');
      assert.ok(fs.existsSync('public'+image.contentUrl.slice(origin.length)),'Structured photo resolves to an original asset');
      assert.ok(image.name&&image.description&&image.creditText);
    }
  }
}
for (const file of ['public/robots.txt','public/sitemap.xml']) {
  const source=fs.readFileSync(file,'utf8');
  assert.ok(source.includes(origin),file+' references the canonical origin');
  assert.ok(!source.includes(legacyOrigin),file+' does not reference the retired origin');
}
assert.match(fs.readFileSync('public/404.html','utf8'),/name="robots" content="noindex, follow"/);
const robots=fs.readFileSync('public/robots.txt','utf8');
assert.ok(!/Disallow: \/v(?:9|81)\//.test(robots),'Allow Google to follow legacy-route redirects');
const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
const pageUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual([...pageUrls].sort(),routes.map(route=>origin+route).sort(),'Sitemap contains exactly the nine canonical pages');
assert.equal(new Set(pageUrls).size,pageUrls.length);
assert.equal((sitemap.match(/<image:image>/g)||[]).length,115,'All original gallery photos remain discoverable');
assert.ok(!sitemap.includes('<lastmod>'),'Do not publish an unverified modification date');
assert.equal(fs.readFileSync('public/google04a6a5bea33dd9ae.html','utf8').trim(),'google-site-verification: google04a6a5bea33dd9ae.html','Existing Search Console verification remains intact');
console.log('SEO passed: nine unique canonical pages, complete social metadata, author/project/photo entities, 115 sitemap images, verification file and noindex 404.');
