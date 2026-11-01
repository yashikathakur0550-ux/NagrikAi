import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { handleApiRoute } from './server/api';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  // Try API route first
  if (req.url && req.url.startsWith('/api/')) {
    const handled = await handleApiRoute(req, res);
    if (handled) return;
  }

  // Serve static files from dist
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : (req.url?.split('?')[0] || 'index.html'));

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Please run npm run build first.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NagrikAI Server running on port ${PORT}`);
});
