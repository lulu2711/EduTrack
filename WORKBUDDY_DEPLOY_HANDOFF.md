# EduTrack 部署交接文档

> 交接对象：WorkBuddy
> 项目目录：`C:\Users\mimo\Desktop\Edu`
> 当前状态：已完成部署前业务验收，尚未部署上线。
> 交接目标：按照本文档完成生产部署、部署后验收和回滚准备。

## 1. 项目概况

EduTrack 是一个高中成绩管理与分析系统，包含：

- 学生、教师、管理员三类账号登录
- 学生成绩查询与趋势分析
- 教师班级成绩分析、进退步分析、成绩分布
- 管理员查看全校班级、教师和考试数据
- 在线论坛：发帖、回复、点赞、举报、审核
- 在线考试：教师创建、学生答题、客观题自动评分、主观题批阅
- 知识点掌握度分析
- MongoDB 严格数据源模式

## 2. 当前验收结论

已验证通过：

- 三类角色登录
- 学生查看其他学生成绩返回 `403`
- 教师访问其他班级返回 `403`
- 管理员查看全部班级
- 班级人数、平均分、最高分、最低分分析
- 论坛写入与审核
- 在线考试创建、提交、评分、批阅
- MongoDB 严格模式下数据库不可用返回 `503`
- MongoDB 严格模式下论坛和考试数据写入
- 断开并重新连接 MongoDB 后论坛和考试数据仍存在
- 自动化回归测试不会污染正式 JSON 数据文件
- 前端生产构建成功

## 3. 重要安全要求

不要在聊天、日志、截图、提交记录或部署文档中填写真实密钥。

生产环境必须使用已经轮换后的新值：

- `MONGODB_URI`
- `JWT_SECRET`
- `LLM_API_KEY`
- `ADMIN_PASSWORD`

旧密钥必须在 MongoDB Atlas、LLM 服务平台等对应控制台撤销，而不是只修改本地文件。

当前仓库不应包含：

- `server/.env`
- `server/.env.production`
- `server/MongoDB.env`
- `auth_credentials.json`
- 任何真实 API Key、数据库密码或 JWT Secret

参考模板：

- `server/.env.example`
- `server/.env.production.example`
- `client/.env.production`

## 4. 生产环境变量

后端生产环境：

```env
NODE_ENV=production
PORT=3000
DATA_SOURCE_MODE=mongodb
MONGODB_URI=<new-rotated-mongodb-uri>
JWT_SECRET=<new-random-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<long-unique-password>
STUDENT_DEMO_PASSWORD=<separate-demo-password>
DATA_DIR=<persistent-data-directory-if-needed>
```

如启用智能助手，三个变量必须同时配置；不启用时全部留空：

```env
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

生产启动校验会拒绝以下情况：

- `DATA_SOURCE_MODE` 不是 `mongodb`
- 缺少 `MONGODB_URI`
- `JWT_SECRET` 少于 32 个字符
- `CORS_ORIGIN` 使用 localhost
- 管理员密码为空、过短或仍使用示例值
- LLM 变量只配置了一部分

## 5. 部署前检查

在部署机器或部署平台上确认：

- [ ] MongoDB Atlas 已配置网络访问白名单
- [ ] MongoDB 新密码已经生效，旧密码已撤销
- [ ] 新 JWT Secret 已配置
- [ ] 新 LLM API Key 已配置或三个 LLM 变量全部留空
- [ ] `CORS_ORIGIN` 是真实 HTTPS 前端域名
- [ ] 已准备管理员、教师、学生演示账号
- [ ] 不使用 `DATA_SOURCE_MODE=fallback`
- [ ] 不把 `.env` 文件提交到 Git
- [ ] 已决定后端持久化目录 `DATA_DIR`
- [ ] 已准备 MongoDB 备份或恢复方案

## 6. 构建与测试命令

### 本地数据回归

```bash
cd server
npm test
```

`npm test` 包含：

- 本地临时数据业务回归
- 严格模式数据库不可用时的 `503` 测试

### 真实 MongoDB 回归

```bash
cd server
npm run test:mongo
```

注意：

- 该命令会连接 `server/.env` 中的 MongoDB。
- 会写入带 `strict-regression-` 前缀的论坛帖子和在线考试。
- 测试结束后会自动清理。
- 不要对生产数据库执行，建议使用验收数据库或单独数据库。

### 后端构建

```bash
cd server
npm ci
npm run build
```

产物：

```text
server/dist/
```

### 前端构建

```bash
cd client
npm ci
npm run build
```

生产前端配置：

```env
VITE_API_URL=/api/v1
```

产物：

```text
client/dist/
```

## 7. 推荐部署结构

推荐使用：

- 前端：Nginx 或静态托管平台
- 后端：Node.js 进程、Docker 或进程管理器
- 数据库：MongoDB Atlas
- 统一 HTTPS 域名
- `/api/` 反向代理到后端 `3000` 端口

Nginx 必须满足：

```nginx
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
```

## 8. 后端启动

```bash
cd server
npm ci
npm run build
NODE_ENV=production npm start
```

启动后检查：

```text
GET /health
```

生产环境健康检查应显示：

```json
{
  "status": "ok",
  "mode": "mongodb",
  "database": "connected",
  "dataSource": "mongodb",
  "fallbackEnabled": false
}
```

如果显示 `json-fallback`、`disconnected` 或 `fallbackEnabled: true`，不要继续对外提供服务。

## 9. 部署后验收流程

按顺序执行：

1. 打开前端首页。
2. 使用管理员账号登录。
3. 查看全部班级和统计数据。
4. 使用教师账号登录。
5. 确认只能访问负责班级。
6. 创建一份临时在线考试。
7. 使用学生账号登录并提交答案。
8. 教师查看自动评分结果并批阅主观题。
9. 学生重新查看成绩和知识点分析。
10. 使用学生账号尝试访问其他学生成绩，必须返回 `403`。
11. 使用教师账号尝试访问其他班级，必须返回 `403`。
12. 发布论坛帖子、回复、点赞并完成审核。
13. 重启后端服务。
14. 再次检查论坛帖子和考试成绩仍然存在。
15. 删除部署验收产生的临时帖子和考试。

## 10. 回滚准备

部署前确认：

- 当前 Git 提交已经保存。
- MongoDB 有可恢复备份或明确的备份时间点。
- 已保留上一版前端 `dist` 产物。
- 已记录生产环境变量版本，但不要把密钥写入 Git。
- 回滚时先恢复后端版本，再确认数据库 schema 和数据兼容性。

## 11. 当前已知非阻塞项

- 前端生产 JavaScript bundle 较大，构建会给出 chunk size warning；不阻塞本次部署准备。
- `npm run lint` 需要补充 ESLint 9 配置，目前不作为部署阻塞项。
- 真实 MongoDB 回归必须使用验收数据库，不应在生产数据库执行。

## 12. WorkBuddy 执行边界

请先完成部署前检查和生产构建，不要直接修改业务功能。

未经用户明确确认，不要执行：

- 生产环境部署
- DNS 修改
- MongoDB 数据删除
- Git 历史重写
- 密钥打印或写入文档

完成部署准备后，需要向用户报告：

- 使用的部署平台
- 前端部署地址
- 后端健康检查地址
- MongoDB 连接状态
- `CORS_ORIGIN` 实际值
- 哪些验收步骤已完成
- 哪些步骤仍需要用户手动确认
