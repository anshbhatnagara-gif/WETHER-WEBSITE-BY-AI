// Simple HTTP server for the weather app
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const server = http.createServer((req, res) => {
  // Default to index.html
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Get file extension
  const ext = path.extname(filePath);
  
  // Set content type
  let contentType = 'text/html';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.js') contentType = 'application/javascript';
  if (ext === '.json') contentType = 'application/json';
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) contentType = 'image/' + ext.slice(1);
  
  // Read and send file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File not found</h1>', 'utf-8');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}/`);
  console.log(`📂 Serving files from: ${__dirname}`);
});
