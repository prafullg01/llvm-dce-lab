const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ll': 'text/plain',
  '.c': 'text/plain',
  '.cpp': 'text/plain',
  '.java': 'text/plain',
  '.py': 'text/plain',
  '.md': 'text/plain'
};

const server = http.createServer((req, res) => {
  // API: list test files
  if (req.url === '/api/tests') {
    const testsDir = path.join(__dirname, 'tests');
    const tests = {};
    try {
      const dirs = ['c', 'cpp', 'java', 'python'];
      dirs.forEach(d => {
        const dir = path.join(testsDir, d);
        if (fs.existsSync(dir)) {
          tests[d] = fs.readdirSync(dir).map(f => ({
            name: f,
            content: fs.readFileSync(path.join(dir, f), 'utf-8')
          }));
        }
      });
      // Also add .ll files
      tests.llvm = fs.readdirSync(testsDir)
        .filter(f => f.endsWith('.ll'))
        .map(f => ({
          name: f,
          content: fs.readFileSync(path.join(testsDir, f), 'utf-8')
        }));
    } catch (e) { /* ignore */ }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tests));
    return;
  }

  // API: list pass source files
  if (req.url === '/api/passes') {
    const passesDir = path.join(__dirname, 'passes', 'src');
    const includeDir = path.join(__dirname, 'passes', 'include');
    const files = {};
    try {
      [passesDir, includeDir].forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach(f => {
            files[f] = fs.readFileSync(path.join(dir, f), 'utf-8');
          });
        }
      });
    } catch (e) { /* ignore */ }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    return;
  }

  // API: get docs
  if (req.url === '/api/docs/side-effects') {
    const docPath = path.join(__dirname, 'docs', 'side-effects.md');
    try {
      const content = fs.readFileSync(docPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(content);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  // Serve static files from frontend/
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(FRONTEND_DIR, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ⚡ DCE Lab server running at http://localhost:${PORT}\n`);
});
