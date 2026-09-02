import fs from 'node:fs';
import path from 'node:path';

const commit = String(process.env.COMMIT_REF || process.env.GITHUB_SHA || 'local').trim();
const context = String(process.env.CONTEXT || process.env.DEPLOY_CONTEXT || 'local').trim();
const payload = { commit, context, generatedAt: new Date().toISOString() };

fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'public', 'build-info.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Build info generated for ${commit} (${context}).`);
