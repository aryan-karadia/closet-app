// Local dev server for the closet API (refs ISSUE-21).
// Runs the same router as the Next.js API routes, with no dependencies and
// no real credentials, so Agent C live API tests can run against localhost.
// Usage:
//   CLOSET_TEST_MODE=1 PORT=3101 node scripts/dev-server.js
// In local mode, authenticate with: Authorization: Bearer test:<user-id>
// Example:
//   curl -H "Authorization: Bearer test:user-1" http://localhost:3101/api/auth/session
// The server binds to PORT (default 3101) and logs one line when ready.
// No em dashes are used in this file.
'use strict';

const http = require('node:http');
const { handleRequest } = require('../lib/api/router');

const PORT = Number(process.env.PORT || 3101);
const MAX_BODY_BYTES = 10 * 1024 * 1024;

function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text) });
  res.end(text);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      sendJson(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Request body is too large.' } });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', async () => {
    const text = Buffer.concat(chunks).toString('utf8');
    let body = null;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
      } catch (error) {
        sendJson(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON.' } });
        return;
      }
    }
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      headers[key.toLowerCase()] = value;
    }
    const query = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }
    try {
      const result = await handleRequest({
        method: req.method,
        path: url.pathname,
        query,
        headers,
        body,
      });
      if (result.file) {
        res.writeHead(result.status, { 'Content-Type': result.contentType || 'application/octet-stream', 'Content-Length': result.file.length });
        res.end(result.file);
        return;
      }
      if (result.zip) {
        res.writeHead(result.status, {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="' + result.filename + '"',
          'Content-Length': result.zip.length,
        });
        res.end(result.zip);
        return;
      }
      sendJson(res, result.status, result.body);
    } catch (error) {
      sendJson(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
    }
  });
});

server.listen(PORT, () => {
  console.log('Closet API dev server listening on http://localhost:' + PORT);
  console.log('Local auth: Authorization: Bearer test:<user-id> (CLOSET_TEST_MODE=1 or no Supabase variables).');
});
