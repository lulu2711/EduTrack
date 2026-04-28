import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import dataRoutes from './routes/data.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
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
    }
  });
});

// 认证路由
app.use('/api/v1/auth', authRoutes);

// 数据路由（本地数据）
app.use('/api/v1/data', dataRoutes);

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduTrack Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/v1`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
});

export default app;
