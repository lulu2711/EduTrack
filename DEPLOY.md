# EduTrack 部署指南

## 项目概述

EduTrack 是一个智能成绩管理与分析系统，包含以下功能模块：
- 学生端：成绩查询、趋势分析、学习目标
- 教师端：班级分析、学生管理、进退步分析
- 管理员端：班级管理、教师管理、数据概览

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + ECharts
- **后端**: Express + TypeScript + JWT
- **数据**: 本地 JSON 文件（当前版本）

## 本地开发

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 启动开发服务器

```bash
# 启动后端（端口 3000）
cd server
npm run dev

# 启动前端（端口 5173）
cd client
npm run dev
```

### 3. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

## 生产部署

### 方式一：静态文件部署（推荐）

#### 1. 构建前端

```bash
cd client
npm run build
```

构建后的文件位于 `client/dist` 目录。

#### 2. 部署后端

```bash
cd server
npm run build
npm start
```

#### 3. 配置 Nginx（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 方式二：Docker 部署

#### 1. 创建 Dockerfile（后端）

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### 2. 创建 Dockerfile（前端）

```dockerfile
# client/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### 3. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=your-secret-key
    volumes:
      - ./data:/app/data  # 挂载数据目录

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
```

#### 4. 启动服务

```bash
docker-compose up -d
```

## 环境变量

### 后端 (.env)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 前端 (.env.production)

```env
VITE_API_URL=http://your-domain.com/api/v1
```

## 数据备份

当前版本使用本地 JSON 文件存储数据，建议定期备份以下目录：
- `grade_subject_reports/` - 成绩数据
- `school_data.json` - 学校班级数据
- `teachers.json` - 教师数据

## 测试账号

### 管理员
- 账号: admin
- 密码: admin123

### 教师
- 姓名: 梁浩然
- 密码: 123456

### 学生
- 学号: 10101
- 密码: 123456

## 常见问题

### 1. 端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### 2. 构建失败

```bash
# 清理缓存
rm -rf node_modules
rm package-lock.json
npm install
```

### 3. CORS 错误

确保后端 `index.ts` 中的 CORS 配置正确：

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## 后续优化建议

1. **数据库迁移**: 将本地 JSON 数据迁移到 MongoDB 或 MySQL
2. **用户管理**: 添加密码修改、找回密码功能
3. **数据导入**: 支持 Excel/CSV 批量导入成绩
4. **报表导出**: 支持 PDF/Excel 成绩报告导出
5. **通知系统**: 添加成绩发布通知、学习提醒
6. **移动端适配**: 优化移动端体验
7. **性能优化**: 添加数据缓存、分页加载

## 技术支持

如有问题，请联系技术支持团队。
