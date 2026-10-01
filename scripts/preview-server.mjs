// Local review server. Production continues to use Netlify's existing build.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2), value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const root=path.resolve('public');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://preview.local');
    if(url.pathname==='/__review'){
      const width=Math.max(320,Math.min(1440,Number(url.searchParams.get('width'))||390));
      const height=Math.max(600,Math.min(1000,Number(url.searchParams.get('height'))||844));
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(`<!doctype html><html><head><title>Portfolio responsive review</title><style>body{margin:0;background:#ddd}iframe{display:block;border:0;width:${width}px;height:${height}px}</style></head><body><iframe title="Portfolio preview" src="/"></iframe></body></html>`);return;
    }
    if(url.pathname==='/api/content'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({content:JSON.parse(await readFile(path.join(root,'content-default.json'),'utf8'))}));return;}
    let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(value('--port','4173')),value('--host','0.0.0.0'),()=>console.log('Portfolio review server ready'));
