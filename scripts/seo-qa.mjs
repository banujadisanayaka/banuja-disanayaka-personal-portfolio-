import assert from 'node:assert/strict';
import fs from 'node:fs';
import projects from '../content/projects.mjs';
const origin='https://banuja-personal-log.netlify.app';
const routes=['/','/about/','/resume/','/daily-gaze/',...projects.map(p=>`/work/${p.slug}/`)];
for(const route of routes){
  const html=fs.readFileSync('public'+route+'index.html','utf8');
  const meta=(name)=>html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`))?.[1];
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title.includes('Banuja Disanayaka'),route+' identifies its author');
  assert.equal(meta('og:title'),title);assert.equal(meta('twitter:title'),title);
  assert.equal(meta('og:description'),meta('description'));assert.equal(meta('twitter:description'),meta('description'));
  assert.equal(meta('og:url'),origin+route);assert.ok(meta('robots').includes('max-image-preview:large'));
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
  const person=graph.find(n=>n['@type']==='Person');assert.equal(person.name,'Banuja Disanayaka');
  assert.equal(person['@id'],origin+'/#person');
  const page=graph.find(n=>n['@id']===origin+route+'#webpage');assert.equal(page.author['@id'],person['@id']);
  if(route!=='/')assert.ok(graph.some(n=>n['@type']==='BreadcrumbList'));
  if(route.startsWith('/work/'))assert.ok(graph.some(n=>n['@type']==='CreativeWork'&&n.creator['@id']===person['@id']));
}
assert.match(fs.readFileSync('public/404.html','utf8'),/name="robots" content="noindex, follow"/);
console.log('SEO passed: nine canonical routes, consistent social metadata, named author, linked project entities, breadcrumbs and noindex 404.');
