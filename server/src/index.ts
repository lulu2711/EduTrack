// MUST stay the first import: it loads .env / .env.production before anything
// else touches process.env.
import './config/loadEnv';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import dataRoutes from './routes/data.routes';
import onlineExamRoutes from './routes/onlineExam.routes';
import assistantRoutes from './routes/assistant.routes';
import forumRoutes from './routes/forum.routes';
import { fail, getDataSourceStatus } from './utils/dataSource';
import { validateEnvironment } from './config/environment';

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 安全中间件
app.use(helmet());
const allowedOrigins = new Set([
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

// When the API serves the frontend from the same process (single-origin
// deployment), the browser still sends an Origin header on same-origin POSTs,
// so this origin has to be allowed too. Render injects it automatically.
if (process.env.RENDER_EXTERNAL_URL) {
  allowedOrigins.add(process.env.RENDER_EXTERNAL_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100次请求
});
app.use(limiter);

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    fail(res, 400, 'INVALID_JSON', '请求体不是有效的 JSON');
    return;
  }
  next(err);
});

// 健康检查
app.get('/health', (req, res) => {
  const source = getDataSourceStatus();
  res.status(source.database === 'connected' || source.mode === 'fallback' ? 200 : 503).json({ status: source.database === 'connected' ? 'ok' : (source.mode === 'mongodb' ? 'degraded' : 'ok'), timestamp: new Date().toISOString(), ...source });
});

// API路由
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'EduTrack API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      data: '/api/v1/data',
      students: '/api/v1/data/students',
      teachers: '/api/v1/data/teachers',
      classes: '/api/v1/data/classes',
      exams: '/api/v1/data/exams',
      forum: '/api/v1/forum',
    }
  });
});

// 认证路由
app.use('/api/v1/auth', authRoutes);

// 数据路由（本地数据）
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/online-exams', onlineExamRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/forum', forumRoutes);

// Serve the built frontend from the API process in production.
// This turns the deployment into a single origin (one URL), which removes the
// need for a separate static host, a reverse proxy and cross-origin config.
// Injected as / from client/dist; any non-API GET falls back to index.html so
// client-side routes keep working after a page refresh.
// Look for the frontend build next to the compiled output rather than relative
// to the working directory: the service may be started from the repo root
// (Render runs `node server/dist/index.js`) or from the server directory.
const clientDist = [
  path.resolve(__dirname, '..', '..', 'client', 'dist'),
  path.resolve(process.cwd(), 'client', 'dist'),
  path.resolve(process.cwd(), '..', 'client', 'dist'),
].find(candidate => fs.existsSync(candidate));

if (process.env.NODE_ENV === 'production' && clientDist) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  if (typeof err?.statusCode === 'number') { fail(res, err.statusCode, err.code || 'REQUEST_FAILED', err.message || '请求失败'); return; }
  if (err instanceof SyntaxError && 'body' in err) {
    fail(res, 400, 'INVALID_JSON', '请求体不是有效的 JSON');
    return;
  }
  fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
});

const server = app.listen(PORT, () => {
  console.log(`🚀 EduTrack Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/v1`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
});

export { server as httpServer };

export default app;



