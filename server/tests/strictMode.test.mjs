import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import 'dotenv/config';

// Simulate strict MongoDB mode with no reachable database.
process.env.DATA_SOURCE_MODE = 'mongodb';
delete process.env.MONGODB_URI;
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-32';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edutrack-strict-'));
for (const file of ['school_data.json', 'teachers.json', 'auth_credentials.json', 'forum_data.json', 'online_exams.json']) {
  fs.copyFileSync(path.join(process.cwd(), '..', file), path.join(tempDir, file));
}
fs.cpSync(path.join(process.cwd(), '..', 'grade_subject_reports'), path.join(tempDir, 'grade_subject_reports'), { recursive: true });
process.env.DATA_DIR = tempDir;

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
await new Promise(resolve => mod.httpServer.close(resolve));
fs.rmSync(tempDir, { recursive: true, force: true });
process.exit(0);
