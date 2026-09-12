// Dependency-free local static server. Run from the repository root.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname === '/test.html') {
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
      .replace(/<script src="https:\/\/www.gstatic.com\/firebasejs\/[^\"]+"><\/script>/g,'')
      .replace('</head>','<script src="tests/mock-firebase.js"></script></head>');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');res.end(html);return;
  }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || pathname.split('/').some(p => p.startsWith('.'))) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' })[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store'); res.end(data);
  });
}).listen(8765, '127.0.0.1', () => console.log('Local app: http://127.0.0.1:8765'));
