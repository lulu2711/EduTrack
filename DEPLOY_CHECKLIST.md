# EduTrack 部署前验收清单

## 当前状态

系统已完成本地 fallback 模式回归，以及真实 MongoDB 严格模式业务回归。当前阶段是部署准备，不是直接上线。

## 已完成验证

- 学生、教师、管理员登录
- 学生访问其他学生成绩返回 `403`
- 教师访问其他班级返回 `403`
- 管理员查看全部班级
- 班级人数、平均分、最高分、最低分分析
- 论坛发帖、回复、点赞、审核
- 在线考试创建、提交、自动评分、主观题批阅
- 知识点分析
- MongoDB 严格模式不可用时返回 `503`
- MongoDB 严格模式下论坛和在线考试数据写入
- 数据库断开重连后论坛和考试数据仍存在
- 测试数据使用临时目录，不污染正式 JSON 文件
- 前端生产构建成功，产物位于 `client/dist`

## 生产环境必须配置

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
DATA_DIR=<persistent-data-directory-if-local-files-are-needed>
```

LLM 如果启用，以下三个变量必须同时配置；不启用时全部留空：

```env
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

## 上线前人工确认

- [ ] MongoDB Atlas 已撤销旧密码，网络访问白名单已配置
- [ ] 旧 JWT Secret 已废弃，新 Secret 已写入部署平台
- [ ] 旧 LLM API Key 已撤销，新 Key 已写入部署平台
- [ ] 管理员密码已更换且长度至少 12 位
- [ ] `CORS_ORIGIN` 是真实前端域名，不是 localhost
- [ ] MongoDB 中无回归测试残留数据
- [ ] 生产环境未使用 `DATA_SOURCE_MODE=fallback`
- [ ] 前端使用 `VITE_API_URL=/api/v1` 或真实 API 地址
- [ ] 前端刷新非根路由时由 Nginx 或静态托管平台回退到 `index.html`
- [ ] 已准备管理员、教师、学生演示账号
- [ ] 已准备部署后的完整演示流程

## 验证命令

```bash
cd server
npm test
npm run test:mongo

cd ../client
npm run build
```

`npm run test:mongo` 会向真实 MongoDB 写入带有 `strict-regression-` 前缀的临时论坛和考试数据，测试结束后自动删除。不要在生产数据库上运行，建议使用验收数据库或独立数据库。

## 构建产物

```text
client/dist/
server/dist/
```

前端构建可能提示 bundle 较大，但不影响构建成功；后续可以做代码分包优化，不属于当前上线阻塞项。
