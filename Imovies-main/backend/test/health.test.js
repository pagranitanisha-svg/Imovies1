const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { app } = require('../server');

test('health endpoint responds when the application is imported without a database connection', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/health`, (result) => {
        let body = '';
        result.setEncoding('utf8');
        result.on('data', (chunk) => { body += chunk; });
        result.on('end', () => resolve({ status: result.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });

    assert.equal(response.status, 503);
    assert.equal(response.body.database, 'disconnected');
    assert.equal(response.body.success, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
