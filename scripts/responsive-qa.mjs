import fs from 'node:fs';

const cssPath = 'public/styles.css';
if (!fs.existsSync(cssPath)) {
  console.error('Missing public/styles.css');
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(/orientation\s*:\s*landscape[\s\S]*max-height\s*:\s*600px/i.test(css), 'Short-height landscape breakpoint is required.');
check(/env\(safe-area-inset-top\)/.test(css), 'Top safe-area inset support is required.');
check(/env\(safe-area-inset-bottom\)/.test(css), 'Bottom safe-area inset support is required.');
check(/content-visibility\s*:\s*auto/.test(css), 'Below-fold rendering should use content-visibility.');
check(/contain-intrinsic-size/.test(css), 'content-visibility must reserve intrinsic space.');
check(/max-width\s*:\s*480px[\s\S]*\.eco-nodes[\s\S]*display\s*:\s*grid/i.test(css), 'Narrow ecosystem layout must flow as a grid rather than absolute-positioned nodes.');
check(/forced-colors\s*:\s*active/.test(css), 'Forced-colors fallback is required.');
check(/hover\s*:\s*none[\s\S]*\.gaze-card:hover img\s*\{\s*transform\s*:\s*none/i.test(css), 'Touch devices must not retain sticky gallery hover transforms.');
check(/scroll-padding-top\s*:\s*96px/.test(css), 'Anchor scrolling must account for the fixed header.');

if (failures.length) {
  failures.forEach(message => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log('Responsive QA passed.');
