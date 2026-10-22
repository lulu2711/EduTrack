import assert from 'node:assert/strict';
import 'dotenv/config';

// Simulate strict MongoDB mode with no reachable database.
process.env.DATA_SOURCE_MODE = 'mongodb';
delete process.env.MONGODB_URI;
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-32';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';

const request = (await import('supertest')).default;
const mod = await import('../dist/index.js');
const app = mod.httpServer;

const res = await request(app).post('/api/v1/auth/login/student').send({ studentId: '11953', password: '123456' });
console.error('strict login status', res.status, JSON.stringify(res.body));
assert.equal(res.status, 503);
assert.equal(res.body.error.code, 'DATA_SOURCE_UNAVAILABLE');

const tokenRes = await request(app).post('/api/v1/auth/login/admin').send({ username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' });
const token = tokenRes.body.data?.token;
assert.ok(token, 'admin should be able to login without Mongo in strict mode');
const dataRes = await request(app).get('/api/v1/data/classes').set({ Authorization: `Bearer ${token}` });
console.error('strict data status', dataRes.status, JSON.stringify(dataRes.body));
assert.equal(dataRes.status, 503);
assert.equal(dataRes.body.error.code, 'DATA_SOURCE_UNAVAILABLE');
assert.equal(dataRes.body.success, false);

console.log('✅ strict mode passed (503, no JSON fallback)');
process.exit(0);
