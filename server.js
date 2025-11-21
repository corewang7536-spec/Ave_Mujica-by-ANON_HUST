// Simple static file server for local debugging
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const host = process.env.HOST || '127.0.0.1';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' ) reqPath = '/Untitled-2.html';
    const filePath = path.join(__dirname, reqPath.replace(/^\//, ''));

    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('404 Not Found');
        return;
      }

      if (stats.isDirectory()) {
        // try index.html
        const indexFile = path.join(filePath, 'index.html');
        fs.access(indexFile, fs.constants.R_OK, (ie) => {
          if (ie) {
            res.statusCode = 403; res.end('Forbidden');
            return;
          }
          streamFile(indexFile, res);
        });
      } else {
        streamFile(filePath, res);
      }
    });
  } catch (e) {
    res.statusCode = 500; res.end('500 Server Error');
  }
});

function streamFile(fp, res) {
  const ext = path.extname(fp).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  res.statusCode = 200;
  res.setHeader('Content-Type', type);
  const stream = fs.createReadStream(fp);
  stream.on('error', () => { res.statusCode = 500; res.end('500 Server Error'); });
  stream.pipe(res);
}

server.listen(port, host, () => {
  console.log(`Static server running at http://${host}:${port}/`);
});
