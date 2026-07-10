import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

async function getDbData() {
  return new Promise((resolve, reject) => {
    const client = net.connect(3001, '127.0.0.1', () => {
      client.write(JSON.stringify({ action: 'getDbData' }));
    });
    
    let buffer = '';
    client.on('data', (data) => {
      buffer += data.toString();
    });
    
    client.on('end', () => {
      try {
        resolve(JSON.parse(buffer));
      } catch (err) {
        console.error("Failed to parse db data from worker", err);
        resolve([]);
      }
    });

    client.on('error', (err) => {
      console.error("Could not connect to worker. Is the main app running?", err.message);
      resolve([]); // Return empty array if worker is offline
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  // CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET' && req.url === '/api/data') {
    try {
      const data = await getDbData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Serve static files
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 DB Visualizer running at http://localhost:${PORT}`);
  console.log(`Note: This now fetches live data directly from the running main app via IPC!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  process.exit();
});
