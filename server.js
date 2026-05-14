const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeJoin(base, target) {
  const resolved = path.normalize(path.join(base, target));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  // Strip query string
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Health check for Railway / uptime monitors
  if (urlPath === '/health' || urlPath === '/healthz') {
    return send(res, 200, JSON.stringify({ status: 'ok', service: 'viro-wellness' }), {
      'Content-Type': 'application/json'
    });
  }

  // Default doc
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = safeJoin(PUBLIC_DIR, urlPath);
  if (!filePath) return send(res, 400, 'Bad request');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA-style fallback to index.html for clean routes
      const fallback = path.join(PUBLIC_DIR, 'index.html');
      return fs.readFile(fallback, (fbErr, data) => {
        if (fbErr) return send(res, 404, 'Not found');
        send(res, 200, data, { 'Content-Type': MIME['.html'] });
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    };

    fs.createReadStream(filePath)
      .on('error', () => send(res, 500, 'Server error'))
      .on('open', () => res.writeHead(200, headers))
      .pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[viro] listening on :${PORT}`);
});
