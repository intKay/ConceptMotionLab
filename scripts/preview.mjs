import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.wav':'audio/wav','.mp4':'video/mp4','.jpg':'image/jpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{
  let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return}
  if(path===root)path=resolve(root,'index.html');
  if(!path.startsWith(root+sep)||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404).end();return}
  const total=statSync(path).size;let start=0,end=total-1;const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(start>end||start>=total){res.writeHead(416,{'Content-Range':`bytes */${total}`}).end();return}}
  res.writeHead(range?206:200,{'Content-Type':types[extname(path)]||'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache',...(range?{'Content-Range':`bytes ${start}-${end}/${total}`}:{})});
  createReadStream(path,{start,end}).pipe(res);
});
server.listen(8780,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8780'));
