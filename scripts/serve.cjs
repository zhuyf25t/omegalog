const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const port = Number(process.argv.find(x => x.startsWith('--port='))?.slice(7) ?? 5173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Missing dist/index.html: run npm run build');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.ico':'image/x-icon' };
const server = http.createServer((req,res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || pathname.includes('\0')) { res.writeHead(403).end(); return; }
  } catch { res.writeHead(400).end(); return; }
  fs.stat(file, (error,stat) => {
    if (error || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    const headers = { 'Content-Type':types[path.extname(file)] ?? 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' };
    let start = 0, end = stat.size-1, status = 200;
    if (req.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!range || (!range[1] && !range[2])) { res.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }).end(); return; }
      if (!range[1]) start = Math.max(0, stat.size-Number(range[2]));
      else { start = Number(range[1]); if (range[2]) end = Math.min(end,Number(range[2])); }
      if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }).end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = end-start+1;
    res.writeHead(status,headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(file,{start,end});
    stream.on('error',() => res.destroy()); stream.pipe(res);
  });
});
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use. Close the previous local server, or run with --port=5174.` : e.message); process.exitCode = 1; });
server.listen(port,'127.0.0.1',() => console.log(`OmegaLog local: http://127.0.0.1:${port}/\nKeep this window open. Ctrl+C stops the server.`));
