import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
Object.assign(process.env, dotenv.parse(fs.readFileSync(envPath)));
process.env.DATA_SOURCE_MODE = 'mongodb';
process.env.NODE_ENV = 'development';

const request = (await import('supertest')).default;
const mongoose = (await import('mongoose')).default;
const mod = await import('../dist/index.js');
const app = mod.httpServer;
if (mongoose.connection.readyState === 2) await mongoose.connection.asPromise();
else if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI, { dbName: 'edu-tracker', serverSelectionTimeoutMS: 10000, maxPoolSize: 5 });
const auth = token => ({ Authorization: `Bearer ${token}` });
const login = async (role, body) => {
  const response = await request(app).post(`/api/v1/auth/login/${role}`).send(body);
  assert.equal(response.status, 200, `${role} login failed: ${JSON.stringify(response.body)}`);
  return response.body.data.token;
};

const adminPassword = process.env.ADMIN_PASSWORD;
assert.ok(adminPassword, 'ADMIN_PASSWORD missing from server/.env');
const adminToken = await login('admin', { username: process.env.ADMIN_USERNAME || 'admin', password: adminPassword });
const teacherToken = await login('teacher', { employeeId: 't001', password: '123456' });
const teacher2Token = await login('teacher', { employeeId: 't002', password: '123456' });
const studentToken = await login('student', { studentId: '11953', password: '123456' });

assert.equal((await request(app).get('/api/v1/data/students/11953/scores').set(auth(studentToken))).status, 200);
assert.equal((await request(app).get('/api/v1/data/students/11927/scores').set(auth(studentToken))).status, 403);
assert.equal((await request(app).get('/api/v1/data/classes/c1').set(auth(teacherToken))).status, 200);
assert.equal((await request(app).get('/api/v1/data/classes/c2').set(auth(teacherToken))).status, 403);
assert.equal((await request(app).get('/api/v1/data/classes/c2').set(auth(teacher2Token))).status, 200);
const allClasses = await request(app).get('/api/v1/data/classes').set(auth(adminToken));
assert.equal(allClasses.status, 200);
assert.ok(allClasses.body.data.length >= 3);

const analysis = await request(app).get('/api/v1/data/classes/c1/analysis').set(auth(teacherToken));
assert.equal(analysis.status, 200);
for (const item of Object.values(analysis.body.data.analysis)) {
  assert.ok(item.studentCount > 0);
  assert.ok(item.lowestScore <= item.averageScore);
  assert.ok(item.averageScore <= item.highestScore);
}

const marker = `strict-regression-${Date.now()}`;
let forumId;
let examId;
let httpClosed = false;
try {
  const post = await request(app).post('/api/v1/forum/posts').set(auth(studentToken)).send({ title: marker, content: marker, subject: '数学' });
  assert.equal(post.status, 201);
  forumId = post.body.data.id;
  assert.equal((await request(app).post(`/api/v1/forum/posts/${forumId}/replies`).set(auth(teacherToken)).send({ content: marker })).status, 201);
  assert.equal((await request(app).post(`/api/v1/forum/posts/${forumId}/like`).set(auth(teacherToken))).status, 200);
  assert.equal((await request(app).patch(`/api/v1/forum/posts/${forumId}/moderate`).set(auth(adminToken)).send({ status: 'published' })).status, 200);

  const exam = await request(app).post('/api/v1/online-exams').set(auth(teacherToken)).send({
    title: marker, subject: '数学', classId: 'c1', durationMinutes: 30,
    questions: [
      { id: 'q1', type: 'single_choice', content: '1+1?', options: ['1', '2'], answer: '2', score: 5, knowledgePoints: ['加法'] },
      { id: 'q2', type: 'short_answer', content: 'Explain', answer: 'any', score: 5, knowledgePoints: ['表达'] },
    ],
  });
  assert.equal(exam.status, 201, JSON.stringify(exam.body));
  examId = exam.body.data.id;
  assert.equal((await request(app).post(`/api/v1/online-exams/${examId}/submit`).set(auth(studentToken)).send({ answers: { q1: '2', q2: marker } })).status, 201);
  const graded = await request(app).post(`/api/v1/online-exams/${examId}/submissions/11953/grade`).set(auth(teacherToken)).send({ scores: { q2: 4 } });
  assert.equal(graded.status, 200);
  assert.equal(graded.body.data.totalScore, 9);
  assert.equal((await request(app).get(`/api/v1/online-exams/${examId}/knowledge-analysis/class`).set(auth(teacherToken))).status, 200);

  await new Promise(resolve => app.close(resolve));
  httpClosed = true;
  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'edu-tracker', serverSelectionTimeoutMS: 10000, maxPoolSize: 5 });
  const persistedForum = await mongoose.connection.db.collection('forum_posts').findOne({ id: forumId });
  const persistedExam = await mongoose.connection.db.collection('online_exams').findOne({ id: examId });
  assert.equal(persistedForum?.title, marker);
  assert.equal(persistedForum?.replies?.length, 1);
  assert.equal(persistedExam?.title, marker);
  assert.equal(persistedExam?.submissions?.[0]?.totalScore, 9);
  console.log('✅ strict MongoDB business regression passed');
} finally {
  if (forumId) await mongoose.connection.db.collection('forum_posts').deleteOne({ id: forumId });
  if (examId) await mongoose.connection.db.collection('online_exams').deleteOne({ id: examId });
  await mongoose.disconnect();
  if (!httpClosed) await new Promise(resolve => app.close(resolve));
}
process.exit(0);
