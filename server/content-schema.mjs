const max = {
  short: 120,
  medium: 500,
  long: 5000,
  url: 2048
};

function text(value, limit = max.medium) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, limit);
}

function bool(value, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

function safeUrl(value, { allowRelative = true, allowFragment = false } = {}) {
  const raw = text(value, max.url);
  if (!raw) return '';
  if (allowFragment && raw.startsWith('#')) return raw.slice(0, 128);
  if (allowRelative && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  let parsed;
  try { parsed = new URL(raw); } catch { return ''; }
  if (parsed.protocol !== 'https:') return '';
  if (parsed.username || parsed.password) return '';
  return parsed.toString();
}

const canonicalProjectRoutes = new Map([
  ['tfc orders tracker', '/work/tfc-orders-tracker/'],
  ['class tracker tdg', '/work/class-tracker/'],
  ['tuition class tracker', '/work/class-tracker/'],
  ['second brain', '/work/second-brain/'],
  ['banu 2.0', '/work/banu-2/']
]);

function canonicalAssetUrl(value) {
  return safeUrl(value);
}

function canonicalProjectUrl(project) {
  const key = text(project?.title, 160).toLowerCase();
  return canonicalProjectRoutes.get(key) || project?.url || '';
}

function email(value) {
  const raw = text(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : '';
}

function phone(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 20);
}

function array(value, limit) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function role(value) {
  const r = text(value, 30).toUpperCase();
  if (!r || r === 'AI' || r === 'AI DESIGNER') return '';
  return r;
}

export function sanitizeContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Content must be an object.');
  const p = input.profile || {};
  const s = input.settings || {};
  const c = input.contact || {};

  const content = {
    profile: {
      heroEyebrow: text(p.heroEyebrow, 120),
      firstName: text(p.firstName, 60),
      lastName: text(p.lastName, 60),
      roles: array(p.roles, 8).map(role).filter(Boolean),
      heroLede: text(p.heroLede, 1000),
      location: text(p.location, 120),
      focus: text(p.focus, 240),
      suitImage: canonicalAssetUrl(p.suitImage),
      aboutImage: canonicalAssetUrl(p.aboutImage),
      cvUrl: safeUrl(p.cvUrl),
      aboutHeading: text(p.aboutHeading, 500),
      aboutIntro: text(p.aboutIntro, 3000),
      aboutCardTitle: text(p.aboutCardTitle, 300),
      aboutCardBody: text(p.aboutCardBody, 3000)
    },
    career: array(input.career, 30).map(item => ({
      year: text(item?.year, 80),
      title: text(item?.title, 160),
      company: text(item?.company, 220)
    })),
    metrics: array(input.metrics, 10).map(item => ({
      value: text(item?.value, 30),
      label: text(item?.label, 120)
    })),
    projects: array(input.projects, 50).map((item, index) => ({
      no: text(item?.no || String(index + 1).padStart(2, '0'), 10),
      tags: text(item?.tags, 300),
      title: text(item?.title, 160),
      description: text(item?.description, 2500),
      url: safeUrl(item?.url, { allowRelative: true, allowFragment: true }),
      visible: bool(item?.visible, true)
    })),
    dailyGaze: array(input.dailyGaze, 500).map(item => ({
      category: text(item?.category, 100),
      title: text(item?.title, 180),
      preview: canonicalAssetUrl(item?.preview),
      download: safeUrl(item?.download),
      alt: text(item?.alt, 300),
      visible: bool(item?.visible, true),
      downloadable: bool(item?.downloadable, true)
    })),
    ecosystem: array(input.ecosystem, 20).map(item => ({
      name: text(item?.name, 100),
      description: text(item?.description, 400),
      logo: canonicalAssetUrl(item?.logo),
      visible: bool(item?.visible, true)
    })),
    contact: {
      email: email(c.email),
      whatsappSriLanka: phone(c.whatsappSriLanka),
      whatsappSriLankaDisplay: text(c.whatsappSriLankaDisplay, 40),
      whatsappMalaysia: phone(c.whatsappMalaysia),
      whatsappMalaysiaDisplay: text(c.whatsappMalaysiaDisplay, 40),
      github: safeUrl(c.github, { allowRelative: false }),
      githubDisplay: text(c.githubDisplay, 100),
      whatsappMessage: text(c.whatsappMessage, 300)
    },
    settings: {
      siteTitle: text(s.siteTitle, 160),
      metaDescription: text(s.metaDescription, 500),
      bootText: text(s.bootText, 120),
      footerLeft: text(s.footerLeft, 200),
      footerRight: text(s.footerRight, 240),
      dailyGazeArchive: safeUrl(s.dailyGazeArchive),
      showAbout: bool(s.showAbout, true),
      showWork: bool(s.showWork, true),
      showCareer: bool(s.showCareer, true),
      showGaze: bool(s.showGaze, true),
      showEcosystem: bool(s.showEcosystem, true),
      showContact: bool(s.showContact, true)
    }
  };

  if (!content.profile.roles.length) content.profile.roles = ['OPERATIONS', 'PRODUCT', 'DESIGN', 'PHOTOGRAPHY'];
  if (!content.contact.email) content.contact.email = 'banuja2005@gmail.com';
  return content;
}

export function publicProjection(master) {
  const c = sanitizeContent(master);
  return {
    profile: c.profile,
    career: c.settings.showCareer ? c.career : [],
    metrics: c.metrics,
    projects: c.projects.filter(x => x.visible).map(({ visible, ...x }) => ({
      ...x,
      url: canonicalProjectUrl(x)
    })),
    dailyGaze: c.dailyGaze.filter(x => x.visible).map(({ visible, downloadable, ...x }) => ({
      ...x,
      downloadable,
      download: downloadable ? x.download : ''
    })),
    ecosystem: c.ecosystem.filter(x => x.visible).map(({ visible, ...x }) => x),
    contact: c.contact,
    settings: c.settings
  };
}