import assert from 'node:assert/strict';
import fs from 'node:fs';
import 'dotenv/config';

process.env.DATA_SOURCE_MODE = process.env.DATA_SOURCE_TEST_MODE || 'fallback';
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-32';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';
delete process.env.MONGODB_URI; // force local JSON fallback for deterministic regression

const request = (await import('supertest')).default;
const mod = await import('../dist/index.js');
const app = mod.httpServer;


const login = async (path, body) => {
  const res = await request(app).post(`/api/v1/auth/login/${path}`).send(body);
  assert.equal(res.status, 200, `${path} login failed: ${JSON.stringify(res.body)}`);
  return res.body.data.token;
};

const auth = token => ({ Authorization: `Bearer ${token}` });
const tokenAdmin = await login('admin', { username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' });
const tokenTeacher = await login('teacher', { employeeId: 't001', password: '123456' });
const tokenTeacher2 = await login('teacher', { employeeId: 't002', password: '123456' });
const tokenStudent = await login('student', { studentId: '11953', password: '123456' });

// login validation
for (const path of ['student', 'teacher', 'admin']) {
  const res = await request(app).post(`/api/v1/auth/login/${path}`).send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_INPUT');
}
assert.equal((await request(app).get('/api/v1/data/classes')).status, 401);

// student permissions
{
  const res = await request(app).get('/api/v1/data/students/11953/scores').set(auth(tokenStudent));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.studentId, '11953');
  const blocked = await request(app).get('/api/v1/data/students/11927/scores').set(auth(tokenStudent));
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.error.code, 'FORBIDDEN');
}

// class permissions
{
  assert.equal((await request(app).get('/api/v1/data/classes/c1').set(auth(tokenTeacher))).status, 200);
  assert.equal((await request(app).get('/api/v1/data/classes/c2').set(auth(tokenTeacher))).status, 403);
  assert.equal((await request(app).get('/api/v1/data/classes/c2').set(auth(tokenTeacher2))).status, 200);
  const admin = await request(app).get('/api/v1/data/classes').set(auth(tokenAdmin));
  assert.equal(admin.status, 200);
  assert.ok(admin.body.data.length > 1);
}

// analysis aggregation
{
  const res = await request(app).get('/api/v1/data/classes/c1/analysis').set(auth(tokenTeacher));
  assert.equal(res.status, 200);
  for (const exam of Object.values(res.body.data.analysis)) {
    assert.ok(exam.studentCount > 0);
    assert.ok(exam.averageScore >= exam.lowestScore);
    assert.ok(exam.highestScore >= exam.averageScore);
    assert.ok(exam.lowestScore >= 0);
  }
}

// forum
{
  const created = await request(app).post('/api/v1/forum/posts').set(auth(tokenStudent)).send({ title: 'Regression post', content: 'Content', subject: '数学' });
  assert.equal(created.status, 201);
  const id = created.body.data.id;
  assert.equal(created.body.data.status, 'pending');
  const reply = await request(app).post(`/api/v1/forum/posts/${id}/replies`).set(auth(tokenTeacher)).send({ content: 'Teacher reply' });
            assert.equal(reply.status, 201);
  const liked = await request(app).post(`/api/v1/forum/posts/${id}/like`).set(auth(tokenTeacher));
  assert.equal(liked.status, 200);
  assert.equal(liked.body.data.likeCount, 1);
  assert.equal((await request(app).post(`/api/v1/forum/posts/${id}/report`).set(auth(tokenTeacher)).send({ reason: 'test' })).status, 200);
  const invalidModeration = await request(app).patch(`/api/v1/forum/posts/${id}/moderate`).set(auth(tokenAdmin)).send({ status: 'unknown' });
  assert.equal(invalidModeration.status, 400);
  assert.equal(invalidModeration.body.error.code, 'INVALID_INPUT');
  const moderated = await request(app).patch(`/api/v1/forum/posts/${id}/moderate`).set(auth(tokenAdmin)).send({ status: 'published' });
  assert.equal(moderated.status, 200);
  assert.equal(moderated.body.data.status, 'published');
}

// online exam
{
  const created = await request(app).post('/api/v1/online-exams').set(auth(tokenTeacher)).send({
    title: 'Regression exam', subject: '数学', classId: 'c1', durationMinutes: 30,
    questions: [
      { id: 'q1', type: 'single_choice', content: '1+1?', options: ['1', '2'], answer: '2', score: 5, knowledgePoints: ['加法'] },
      { id: 'q2', type: 'short_answer', content: 'Explain', answer: 'any', score: 5, knowledgePoints: ['表达'] },
    ],
  });
    assert.equal(created.status, 201);
  const examId = created.body.data.id;
  assert.equal((await request(app).get(`/api/v1/online-exams/${examId}`).set(auth(tokenTeacher2))).status, 403);
  const listed = await request(app).get('/api/v1/online-exams').set(auth(tokenStudent));
  assert.ok(listed.body.data.some(e => e.id === examId));
  const submitted = await request(app).post(`/api/v1/online-exams/${examId}/submit`).set(auth(tokenStudent)).send({ answers: { q1: '2', q2: 'student answer' } });
    assert.equal(submitted.status, 201);
  assert.equal(submitted.body.data.objectiveScore, 5);
  assert.equal((await request(app).post(`/api/v1/online-exams/${examId}/submit`).set(auth(tokenStudent)).send({ answers: {} })).status, 409);
  const graded = await request(app).post(`/api/v1/online-exams/${examId}/submissions/11953/grade`).set(auth(tokenTeacher)).send({ scores: { q2: 4 } });
  assert.equal(graded.status, 200);
  assert.equal(graded.body.data.totalScore, 9);
  const knowledge = await request(app).get(`/api/v1/online-exams/${examId}/knowledge-analysis/class`).set(auth(tokenTeacher));
  assert.equal(knowledge.status, 200);
  assert.equal(knowledge.body.data.submissionCount, 1);
}

console.log('✅ API regression passed');
process.exit(0);
