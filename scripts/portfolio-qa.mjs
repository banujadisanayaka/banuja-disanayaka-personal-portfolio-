import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const failures = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}
function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function walk(dir) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

const requiredPages = [
  'public/index.html',
  'public/404.html',
  'public/admin/index.html',
  'public/work/tfc-orders-tracker/index.html',
  'public/work/class-tracker/index.html',
  'public/work/second-brain/index.html',
  'public/work/banu-2/index.html'
];

const requiredDeliveryFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'public/favicon.svg',
  'public/.well-known/security.txt'
];

for (const page of requiredPages) assert(exists(page), `Missing required page: ${page}`);
for (const file of requiredDeliveryFiles) assert(exists(file), `Missing required delivery file: ${file}`);

const publicPages = requiredPages.filter((p) => !p.includes('/admin/'));
for (const page of publicPages) {
  if (!exists(page)) continue;
  const html = read(page);
  assert(/<title>[^<]{8,}<\/title>/i.test(html), `${page}: missing useful <title>`);
  assert(/<meta\s+name="description"\s+content="[^"]{40,}"/i.test(html), `${page}: missing useful meta description`);
  if (page !== 'public/404.html') {
    assert(/<link\s+rel="canonical"\s+href="https:\/\/[^"]+"/i.test(html), `${page}: missing HTTPS canonical URL`);
    assert(/<meta\s+property="og:title"/i.test(html), `${page}: missing og:title`);
    assert(/<meta\s+property="og:description"/i.test(html), `${page}: missing og:description`);
    assert(/<meta\s+property="og:url"\s+content="https:\/\/[^"]+"/i.test(html), `${page}: missing HTTPS og:url`);
  }
  assert(!/target="_blank"(?![^>]*rel="[^"]*noreferrer)/i.test(html), `${page}: target=_blank without noreferrer`);
  assert(!/http:\/\//i.test(html), `${page}: insecure http:// reference found`);
}

if (exists('public/admin/index.html')) {
  const admin = read('public/admin/index.html');
  assert(/noindex/i.test(admin), 'Admin page must explicitly be noindex');
}

if (exists('public/robots.txt')) {
  const robots = read('public/robots.txt');
  assert(/Disallow:\s*\/admin\//i.test(robots), 'robots.txt must disallow /admin/');
  assert(/Disallow:\s*\/api\//i.test(robots), 'robots.txt must disallow /api/');
  assert(/Sitemap:\s*https:\/\//i.test(robots), 'robots.txt must advertise HTTPS sitemap');
}

if (exists('public/sitemap.xml')) {
  const sitemap = read('public/sitemap.xml');
  const expected = [
    'https://banuja-personal-log.netlify.app/',
    '/work/tfc-orders-tracker/',
    '/work/class-tracker/',
    '/work/second-brain/',
    '/work/banu-2/'
  ];
  for (const value of expected) assert(sitemap.includes(value), `sitemap.xml missing ${value}`);
  assert(/<lastmod>2026-09-02<\/lastmod>/.test(sitemap), 'sitemap.xml should expose the latest significant update date');
}

if (exists('public/index.html')) {
  const home = read('public/index.html');
  assert(/<title>Banuja Disanayaka\s*\|/i.test(home), 'Homepage title should lead with the exact branded name');
  assert(/Official portfolio of Banuja Disanayaka/i.test(home), 'Homepage description should clearly identify this as the official portfolio');
  assert(/"@type":\s*"ProfilePage"/.test(home), 'Homepage should include ProfilePage structured data');
  assert(/"alternateName":\s*\[[^\]]*"Banu"/.test(home), 'Person structured data should include the public short name');
  assert(/instagram\.com\/banuja_disanayaka\//i.test(home), 'Person structured data should connect the verified Instagram handle');
  assert(/<meta\s+property="og:image"\s+content="https:\/\/banuja-personal-log\.netlify\.app\/og-card\.svg"/i.test(home), 'Homepage should expose the branded Open Graph preview image');
  assert(/<meta\s+name="twitter:image"\s+content="https:\/\/banuja-personal-log\.netlify\.app\/og-card\.svg"/i.test(home), 'Homepage should expose the branded Twitter preview image');
}

if (exists('public/favicon.svg')) {
  const favicon = read('public/favicon.svg');
  assert(/<svg\b/i.test(favicon), 'favicon.svg must contain valid SVG markup');
  assert(/viewBox=/i.test(favicon), 'favicon.svg must define a viewBox');
}

if (exists('public/.well-known/security.txt')) {
  const security = read('public/.well-known/security.txt');
  assert(/^Contact:\s*mailto:/mi.test(security), 'security.txt must provide a mailto Contact');
  assert(/^Canonical:\s*https:\/\//mi.test(security), 'security.txt must provide an HTTPS Canonical URL');
  assert(/^Expires:\s*\d{4}-\d{2}-\d{2}T/mi.test(security), 'security.txt must provide an expiry timestamp');
}

if (exists('netlify.toml')) {
  const netlify = read('netlify.toml');
  const controls = [
    ['Content-Security-Policy', /Content-Security-Policy/i],
    ['Strict-Transport-Security', /Strict-Transport-Security/i],
    ['X-Content-Type-Options', /X-Content-Type-Options/i],
    ['Referrer-Policy', /Referrer-Policy/i],
    ['Permissions-Policy', /Permissions-Policy/i],
    ['X-Frame-Options', /X-Frame-Options/i]
  ];
  for (const [name, pattern] of controls) assert(pattern.test(netlify), `netlify.toml missing ${name}`);
  assert(/for\s*=\s*"\/admin\/\*"[\s\S]*X-Robots-Tag/i.test(netlify), 'Admin headers must include X-Robots-Tag');
  assert(/from\s*=\s*"\/favicon\.ico"[\s\S]*to\s*=\s*"\/favicon\.svg"/i.test(netlify), 'Netlify must route favicon.ico to the branded favicon');
  assert(/for\s*=\s*"\/\*\.html"[\s\S]*max-age=0[\s\S]*must-revalidate/i.test(netlify), 'HTML must revalidate so releases do not serve stale documents');
  assert(/for\s*=\s*"\/assets\/\*"[\s\S]*max-age=31536000[\s\S]*immutable/i.test(netlify), 'Versioned assets should retain immutable long-term caching');
}

const sourceFiles = [
  'public/index.html',
  'public/app.js',
  'public/admin/admin.js',
  'server/content-schema.mjs',
  'server/security.mjs',
  'netlify/functions/admin-media.mjs'
].filter(exists);
const sensitivePatterns = [
  /passport\s*(number|no\.?)/i,
  /national\s*id/i,
  /birth\s*certificate/i,
  /private[_ -]?key/i,
  /client[_ -]?secret/i,
  /api[_ -]?key\s*[:=]/i
];
for (const file of sourceFiles) {
  const body = read(file);
  for (const pattern of sensitivePatterns) {
    assert(!pattern.test(body), `${file}: potentially sensitive material matched ${pattern}`);
  }
}

const syntaxFiles = [
  ...walk('public').filter((file) => file.endsWith('.js')),
  ...walk('server').filter((file) => file.endsWith('.mjs') || file.endsWith('.js')),
  ...walk('netlify/functions').filter((file) => file.endsWith('.mjs') || file.endsWith('.js')),
  ...walk('scripts').filter((file) => file.endsWith('.mjs') || file.endsWith('.js'))
];

for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  assert(result.status === 0, `${file}: JavaScript syntax check failed${result.stderr ? ` — ${result.stderr.trim().split('\n').slice(-1)[0]}` : ''}`);
}

if (exists('netlify/functions/content.mjs')) {
  const publicContent = read('netlify/functions/content.mjs');
  assert(/x-robots-tag':\s*'noindex, nofollow, noarchive'/.test(publicContent), 'Public content API must emit full noindex policy');
  assert(/referrer-policy':\s*'no-referrer'/.test(publicContent), 'Public content API must suppress referrers');
  assert(/cross-origin-resource-policy':\s*'same-origin'/.test(publicContent), 'Public content API must stay same-origin');
  assert(/max-age=0[\s\S]*must-revalidate/.test(publicContent), 'Published CMS content should revalidate immediately');
}

if (exists('public/case-study.css')) {
  const caseCss = read('public/case-study.css');
  assert(!/\.reveal\s*\{\s*opacity\s*:\s*0/i.test(caseCss), 'Case-study reveals must fail open when JavaScript is unavailable');
  assert(/@media\s*print/.test(caseCss), 'Case studies should expose print-safe content');
}

if (exists('public/index.html')) {
  const home = read('public/index.html');
  const gazeImages = [...home.matchAll(/<img[^>]+The Daily Gaze[^>]+>/gi)].map(match => match[0]);
  assert(gazeImages.length >= 3, 'Homepage should include the three verified Daily Gaze images');
  for (const img of gazeImages) {
    assert(/\bwidth="\d+"/i.test(img) && /\bheight="\d+"/i.test(img), 'Daily Gaze images need intrinsic dimensions');
    assert(/\bsrcset=/i.test(img) && /\bsizes=/i.test(img), 'Daily Gaze images need responsive source hints');
  }
}

if (exists('public/app.js')) {
  const app = read('public/app.js');
  warn(/prefers-reduced-motion/i.test(app), 'app.js should honor prefers-reduced-motion');
  warn(/AbortController/.test(app), 'CMS fetch should have an abort/timeout path');
  assert(/reveal-pending/.test(app), 'Reveal system should be progressively enhanced instead of hiding content by default');
  assert(/heroVisible/.test(app), 'Animation budget should pause hero-only work while the hero is off-screen');
  assert(/profile\.cvUrl/.test(app), 'Public renderer should bind the CMS CV URL');
  assert(/profile\.aboutImage/.test(app), 'Public renderer should bind the CMS About image');
}

if (exists('public/styles.css')) {
  const css = read('public/styles.css');
  assert(!/\.reveal\s*\{\s*opacity\s*:\s*0/i.test(css), 'Reveal content must remain visible when JavaScript fails');
}

if (exists('netlify/functions/admin-content.mjs')) {
  const adminContent = read('netlify/functions/admin-content.mjs');
  assert(/VERSION_CONFLICT/.test(adminContent), 'Admin publishing must protect against concurrent overwrite');
  assert(/baseVersion/.test(adminContent), 'Admin publishing must compare a client content version');
}

if (exists('public/admin/admin.js')) {
  const admin = read('public/admin/admin.js');
  assert(/baseVersion:state\.version/.test(admin), 'Admin client must submit the loaded content version when publishing');
}

console.log(`Portfolio QA: ${requiredPages.length} required routes, ${requiredDeliveryFiles.length} delivery files and ${syntaxFiles.length} JavaScript modules checked.`);
for (const message of warnings) console.warn(`WARN: ${message}`);
if (failures.length) {
  console.error(`\nQA failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log('Portfolio QA passed.');
