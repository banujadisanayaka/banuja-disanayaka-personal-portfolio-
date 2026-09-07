import {build} from 'esbuild';
import fs from 'node:fs/promises';
// Only the small entry module is requested initially. Three.js is a first-party,
// separately cached dynamic import, loaded only while the welcome is in use.
await fs.mkdir('public/assets/welcome',{recursive:true});
await build({entryPoints:['src/welcome/entry.js'],outdir:'public/assets/welcome',entryNames:'welcome',chunkNames:'[name]-[hash]',bundle:true,splitting:true,format:'esm',minify:true,target:['es2022'],legalComments:'external',metafile:true}).then(async result=>{
  const current=new Set(Object.keys(result.metafile.outputs).map(p=>p.replace('public/assets/welcome/','')));
  for(const file of await fs.readdir('public/assets/welcome'))if(/^(scene-|chunk-|welcome\.).*(\.js|\.LEGAL\.txt)$/.test(file)&&!current.has(file)&&!current.has(file.replace('.LEGAL.txt','')))await fs.unlink('public/assets/welcome/'+file);
});
await fs.copyFile('node_modules/three/LICENSE','public/assets/welcome/THREE-LICENSE.txt');
