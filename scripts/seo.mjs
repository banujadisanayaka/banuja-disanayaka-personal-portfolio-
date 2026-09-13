const origin = 'https://banuja-personal-log.netlify.app';
const personId = origin + '/#person';
const websiteId = origin + '/#website';

// One named author connects the biography, work and photographic journal.
// Only public, verified profile facts belong in this graph.
export function structuredData({title, description, path, projects}) {
  const url = origin + path;
  const project = projects.find(item => path === `/work/${item.slug}/`);
  const profile = path === '/' || path === '/about/';
  const person = {
    '@type':'Person', '@id':personId, name:'Banuja Disanayaka',
    givenName:'Banuja', familyName:'Disanayaka', alternateName:'Banu',
    url:origin + '/about/', image:origin + '/assets/v9/portrait-960.webp',
    description:'Banuja Disanayaka works across operations, product development, graphic design and photography in Sri Lanka and Malaysia.',
    knowsAbout:['Operations', 'Product development', 'Graphic design', 'Photography'],
    sameAs:['https://github.com/banujadisanayaka']
  };
  const page = {
    '@type':profile ? 'ProfilePage' : path === '/daily-gaze/' ? 'CollectionPage' : 'WebPage',
    '@id':url + '#webpage', url, name:title, description, inLanguage:'en',
    isPartOf:{'@id':websiteId}, about:{'@id':personId}, author:{'@id':personId}
  };
  if (profile) page.mainEntity = {'@id':personId};
  if (project) page.mainEntity = {'@id':url + '#project'};
  if (path === '/') page.hasPart = projects.map(p => ({'@type':'CreativeWork', name:p.title, url:origin + `/work/${p.slug}/`, creator:{'@id':personId}}));
  const graph = [person, {'@type':'WebSite', '@id':websiteId, url:origin + '/', name:'Banuja Disanayaka', inLanguage:'en', publisher:{'@id':personId}}, page];
  if (project) graph.push({'@type':'CreativeWork', '@id':url + '#project', name:project.title, description:project.description, url, creator:{'@id':personId}, mainEntityOfPage:{'@id':url + '#webpage'}});
  if (path !== '/' && path !== '/404.html') {
    const label = project?.title || ({'/about/':'About Banuja Disanayaka', '/daily-gaze/':'The Daily Gaze', '/resume/':'Résumé'}[path]);
    const breadcrumbId = url + '#breadcrumb';
    page.breadcrumb = {'@id':breadcrumbId};
    graph.push({'@type':'BreadcrumbList', '@id':breadcrumbId, itemListElement:[
      {'@type':'ListItem', position:1, name:'Banuja Disanayaka', item:origin + '/'},
      {'@type':'ListItem', position:2, name:label, item:url}
    ]});
  }
  return {'@context':'https://schema.org', '@graph':graph};
}
