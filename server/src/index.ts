import 'dotenv/config';
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
import { getDataSourceStatus } from './utils/dataSource';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is required and must be at least 32 characters long');
}

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
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: '请求体不是有效的 JSON', details: [] },
    });
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

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  if (typeof err?.statusCode === 'number') { res.status(err.statusCode).json({ success: false, error: { code: err.code || 'REQUEST_FAILED', message: err.message } }); return; }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: '请求体不是有效的 JSON', details: [] },
    });
    return;
  }
  res.status(500).json({ 
    success: false, 
    error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } 
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 EduTrack Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/v1`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
});

export { server as httpServer };

export default app;



