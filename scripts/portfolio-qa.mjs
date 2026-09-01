import fs from 'node:fs';
import path from 'node:path';

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

const requiredPages = [
  'public/index.html',
  'public/404.html',
  'public/admin/index.html',
  'public/work/tfc-orders-tracker/index.html',
  'public/work/class-tracker/index.html',
  'public/work/second-brain/index.html',
  'public/work/banu-2/index.html'
];

for (const page of requiredPages) assert(exists(page), `Missing required page: ${page}`);

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
}

const sourceFiles = [
  'public/index.html', 'public/app.js', 'public/admin/admin.js', 'server/content-schema.mjs'
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

if (exists('public/app.js')) {
  const app = read('public/app.js');
  warn(/prefers-reduced-motion/i.test(app), 'app.js should honor prefers-reduced-motion');
  warn(/AbortController/.test(app), 'CMS fetch should have an abort/timeout path');
}

console.log(`Portfolio QA: ${requiredPages.length} required routes checked.`);
for (const message of warnings) console.warn(`WARN: ${message}`);
if (failures.length) {
  console.error(`\nQA failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log('Portfolio QA passed.');
