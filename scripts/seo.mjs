export const siteOrigin = 'https://banujadisanayaka.netlify.app';
const origin = siteOrigin;
const personId = origin + '/#person';
const websiteId = origin + '/#website';

const profileLinks = [
  'https://github.com/banujadisanayaka',
  'https://www.linkedin.com/in/banuja-disanayaka-730904278',
  'https://www.instagram.com/banuja_disanayaka/'
];

const education = [
  {'@type':'EducationalOrganization', name:'YES College', address:{'@type':'PostalAddress', addressCountry:'MY'}},
  {'@type':'CollegeOrUniversity', name:'NSBM Green University', address:{'@type':'PostalAddress', addressCountry:'LK'}},
  {'@type':'CollegeOrUniversity', name:'Curtin University'},
  {'@type':'EducationalOrganization', name:'Thurstan College', address:{'@type':'PostalAddress', addressCountry:'LK'}}
];

const language = name => ({'@type':'Language', name});

function imageObject(item, index = 0) {
  const contentUrl = origin + (item.preview || item.derivatives?.[0]?.url || '');
  const node = {
    '@type':'ImageObject',
    '@id':contentUrl + '#image',
    contentUrl,
    url:contentUrl,
    name:item.title || 'The Daily Gaze photograph',
    caption:item.alt || item.title || 'Photograph by Banuja Disanayaka',
    description:item.alt || item.title || 'Photograph by Banuja Disanayaka',
    creator:{'@id':personId},
    creditText:'Banuja Disanayaka',
    copyrightNotice:'© 2026 Banuja Disanayaka'
  };
  if (index === 0) node.representativeOfPage = true;
  if (item.location) node.contentLocation = {'@type':'Place', name:item.location};
  return node;
}

// One named author connects the biography, work and photographic journal.
// Only public, verified profile facts belong in this graph.
export function structuredData({title, description, path, projects, gallery = []}) {
  const url = origin + path;
  const project = projects.find(item => path === `/work/${item.slug}/`);
  const profile = path === '/' || path === '/about/' || path === '/resume/';
  const person = {
    '@type':'Person', '@id':personId, name:'Banuja Disanayaka',
    givenName:'Banuja', familyName:'Disanayaka', alternateName:'Banu',
    url:origin + '/about/',
    image:{'@type':'ImageObject', url:origin + '/assets/v9/portrait-960.webp', width:960, height:1442},
    description:'Banuja Disanayaka is a Sri Lanka-based professional with experience across payment processing, operations, product development, graphic design and photography.',
    jobTitle:'Payment Processing Officer',
    worksFor:{'@type':'Organization', name:'Port City BPO PVT LTD'},
    knowsAbout:['Payment processing','Operations','Product development','Graphic design','Photography'],
    knowsLanguage:[language('English'), language('Sinhala')],
    alumniOf:education,
    sameAs:profileLinks
  };

  const page = {
    '@type':profile ? 'ProfilePage' : path === '/daily-gaze/' ? 'CollectionPage' : 'WebPage',
    '@id':url + '#webpage', url, name:title, description, inLanguage:'en',
    isPartOf:{'@id':websiteId}, about:{'@id':personId}, author:{'@id':personId}
  };
  if (profile) page.mainEntity = {'@id':personId};
  if (project) {
    page.mainEntity = {'@id':url + '#project'};
    page.keywords = [project.title, project.category, project.role, ...String(project.stack||'').split('·').map(x=>x.trim()).filter(Boolean)].join(', ');
  }

  const graph = [
    person,
    {
      '@type':'WebSite', '@id':websiteId, url:origin + '/',
      name:'Banuja Disanayaka', alternateName:'Banuja Disanayaka Portfolio',
      description:'Portfolio of Banuja Disanayaka covering operations, digital products, graphic design and photography.',
      inLanguage:'en', publisher:{'@id':personId}
    },
    page
  ];

  if (path === '/') {
    page.hasPart = projects.map(p => ({
      '@type':'CreativeWork', name:p.title, url:origin + `/work/${p.slug}/`,
      creator:{'@id':personId}
    }));
  }

  if (project) {
    graph.push({
      '@type':'CreativeWork', '@id':url + '#project',
      name:project.title, description:project.description, url,
      genre:project.category, dateCreated:String(project.year || ''),
      keywords:[project.title, project.category, project.role, ...String(project.stack||'').split('·').map(x=>x.trim()).filter(Boolean)],
      creator:{'@id':personId}, author:{'@id':personId},
      isPartOf:{'@id':websiteId}, mainEntityOfPage:{'@id':url + '#webpage'},
      image:origin + '/assets/v9/social-card.jpg'
    });
  }

  if (path === '/daily-gaze/') {
    const candidates = gallery.filter(item => item.visible !== false);
    const selected = [
      ...candidates.filter(item => item.featured),
      ...candidates.filter(item => !item.featured)
    ].slice(0,12);
    const images = selected.map(imageObject);
    const galleryId = url + '#gallery';
    page.mainEntity = {'@id':galleryId};
    if (images[0]) page.primaryImageOfPage = {'@id':images[0]['@id']};
    graph.push({
      '@type':'ImageGallery', '@id':galleryId, url,
      name:'The Daily Gaze', description,
      creator:{'@id':personId}, author:{'@id':personId},
      inLanguage:'en',
      contentLocation:[
        {'@type':'Country', name:'Sri Lanka'},
        {'@type':'Country', name:'Malaysia'}
      ],
      associatedMedia:images.map(image=>({'@id':image['@id']}))
    }, ...images);
  }

  if (path !== '/' && path !== '/404.html') {
    const label = project?.title || ({
      '/about/':'About Banuja Disanayaka',
      '/daily-gaze/':'The Daily Gaze',
      '/resume/':'Banuja Disanayaka Résumé'
    }[path]);
    const breadcrumbId = url + '#breadcrumb';
    page.breadcrumb = {'@id':breadcrumbId};
    graph.push({
      '@type':'BreadcrumbList', '@id':breadcrumbId,
      itemListElement:[
        {'@type':'ListItem', position:1, name:'Banuja Disanayaka', item:origin + '/'},
        {'@type':'ListItem', position:2, name:label, item:url}
      ]
    });
  }

  return {'@context':'https://schema.org', '@graph':graph};
}
