# EduTrack 部署前准备指南

## 当前状态

EduTrack 已完成本地 fallback 模式回归和真实 MongoDB 严格模式业务回归。当前建议先完成部署候选版本验收，再执行实际上线。

## 技术架构

- 前端：React + TypeScript + Vite，构建产物为 `client/dist`
- 后端：Express + TypeScript，构建产物为 `server/dist`
- 数据库：MongoDB Atlas
- 生产数据源：`DATA_SOURCE_MODE=mongodb`
- 认证：JWT

## 本地验证

```bash
cd server
npm test
npm run test:mongo

cd ../client
npm run build
```

说明：

- `npm test` 只运行本地临时数据回归和严格模式不可用测试，不连接真实 MongoDB。
- `npm run test:mongo` 会连接 `server/.env` 中的 MongoDB，写入带 `strict-regression-` 前缀的临时论坛和考试记录，完成后自动清理。不要对生产数据库执行，建议使用验收数据库。
- `client/npm run build` 生成 `client/dist`。

## 生产环境变量

不要把真实值提交到 Git。参考模板：`server/.env.production.example`。

```env
NODE_ENV=production
PORT=3000
DATA_SOURCE_MODE=mongodb
MONGODB_URI=<rotated-mongodb-uri>
JWT_SECRET=<new-random-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<long-unique-password>
STUDENT_DEMO_PASSWORD=<separate-demo-password>
DATA_DIR=<persistent-data-directory-if-needed>
```

如启用智能助手，以下变量必须全部配置；不启用时全部留空：

```env
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

生产启动时会自动校验配置。缺少必需变量、使用 localhost CORS、使用 fallback 数据源、JWT Secret 过短或管理员密码过弱，服务会拒绝启动。

## 静态前端部署

```bash
cd client
npm run build
```

将 `client/dist` 部署到静态托管平台或 Nginx。前端当前使用：

```env
VITE_API_URL=/api/v1
```

Nginx 需要：

- `/api/` 代理到后端服务
- 非根前端路由回退到 `/index.html`
- 启用 HTTPS
- 设置正确的域名和 CORS_ORIGIN

示例：

```nginx
server {
    listen 443 ssl;
    server_name your-frontend-domain.example.com;

    root /srv/edutrack/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 后端启动

```bash
cd server
npm ci
npm run build
NODE_ENV=production npm start
```

建议使用进程管理器或容器运行后端，并配置健康检查：

```text
GET /health
```

生产健康检查必须显示 MongoDB connected，不能是 `json-fallback`。

## 上线前人工确认

- MongoDB Atlas 已撤销旧密码并配置网络访问白名单
- 旧 JWT Secret 已废弃
- 旧 LLM API Key 已撤销
- `CORS_ORIGIN` 是真实 HTTPS 域名
- `DATA_SOURCE_MODE=mongodb`
- 管理员、教师、学生演示账号已准备
- MongoDB 中没有 `strict-regression-` 测试残留
- 已完成 `npm run test:mongo`
- 已完成前端生产构建
- 已验证部署后的登录、权限、论坛和在线考试流程
