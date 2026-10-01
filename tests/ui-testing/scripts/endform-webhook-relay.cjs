const http = require('http');
const { randomUUID } = require('crypto');

const captures = new Map();
const reply = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const control = http.createServer(async (req, res) => {
  const parts = req.url.split('/').filter(Boolean);
  if (req.method === 'GET' && req.url === '/health') return reply(res, 200, { ready: true });
  if (req.method === 'POST' && req.url === '/captures') {
    const id = randomUUID();
    const capture = { payloads: [], server: null };
    capture.server = http.createServer((incoming, response) => {
      let rawBody = '';
      incoming.on('data', chunk => { rawBody += chunk; });
      incoming.on('end', () => {
        let body;
        try { body = JSON.parse(rawBody || '{}'); } catch {}
        capture.payloads.push({ method: incoming.method, url: incoming.url, headers: incoming.headers, body, rawBody, timestamp: Date.now() });
        reply(response, 200, { received: true });
      });
    });
    capture.server.on('error', () => reply(res, 500, { error: 'Receiver failed to start' }));
    capture.server.listen(0, '127.0.0.1', () => {
      captures.set(id, capture);
      reply(res, 201, { id, port: capture.server.address().port });
    });
    return;
  }
  const capture = captures.get(parts[1]);
  if (!capture) return reply(res, 404, { error: 'Unknown capture' });
  if (req.method === 'GET') return reply(res, 200, capture.payloads);
  if (req.method === 'DELETE' && parts[2] === 'payloads') {
    capture.payloads = [];
    return reply(res, 200, { cleared: true });
  }
  if (req.method === 'DELETE') {
    await new Promise(resolve => capture.server.close(resolve));
    captures.delete(parts[1]);
    return reply(res, 200, { stopped: true });
  }
  reply(res, 405, { error: 'Unsupported method' });
});

control.listen(9000, '127.0.0.1');
