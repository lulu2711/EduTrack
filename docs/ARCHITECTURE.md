# 考试成绩追踪分析系统 - 架构方案文档

> **版本**: v1.0  
> **日期**: 2026-04-20  
> **作者**: AI高级架构师  
> **状态**: 待确认  
> **关联文档**: [PRD.md](./PRD.md)

---

## 目录

1. [架构概述](#1-架构概述)
2. [技术选型](#2-技术选型)
3. [系统架构设计](#3-系统架构设计)
4. [前端架构](#4-前端架构)
5. [后端架构](#5-后端架构)
6. [数据库设计](#6-数据库设计)
7. [API接口设计](#7-api接口设计)
8. [部署方案](#8-部署方案)
9. [安全设计](#9-安全设计)
10. [开发计划](#10-开发计划)
11. [风险评估](#11-风险评估)

---

## 1. 架构概述

### 1.1 架构原则

| 原则 | 说明 |
|------|------|
| **前后端分离** | 前端SPA + 后端RESTful API，独立开发部署 |
| **模块化** | 前端按功能模块划分，后端按领域划分 |
| **渐进式开发** | 优先实现核心功能，逐步迭代增强 |
| **零成本部署** | 利用免费云服务，降低部署成本 |
| **类型安全** | 全链路TypeScript，减少运行时错误 |

### 1.2 架构风格

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│                    (React SPA 应用)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CDN / 静态托管                              │
│                   (GitHub Pages / Vercel)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ API 请求
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端 API 服务                               │
│                    (Vercel Serverless)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 认证模块  │ │ 用户模块  │ │ 成绩模块  │ │ 管理模块  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 数据库连接
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       数据库层                                   │
│                    (MongoDB Atlas)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  users   │ │  classes │ │  exams   │ │  scores  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 技术选型

### 2.1 前端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| **React** | 18+ | UI框架 | 生态成熟、组件化、社区活跃 |
| **TypeScript** | 5+ | 类型系统 | 类型安全、IDE支持好、减少bug |
| **Vite** | 5+ | 构建工具 | 极快的HMR、开箱即用 |
| **Tailwind CSS** | 3+ | 样式方案 | 原子化CSS、快速开发、一致性 |
| **Zustand** | 4+ | 状态管理 | 轻量、简洁、TypeScript友好 |
| **React Router** | 6+ | 路由管理 | 声明式路由、嵌套路由 |
| **ECharts** | 5+ | 数据可视化 | 功能强大、图表类型丰富、中文文档 |
| **Ant Design** | 5+ | UI组件库 | 企业级组件、中文友好 |
| **Axios** | 1+ | HTTP客户端 | 拦截器、取消请求、TypeScript支持 |
| **dayjs** | 1+ | 日期处理 | 轻量、链式调用、国际化 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| **Node.js** | 18+ | 运行时 | 前后端统一语言、生态丰富 |
| **Express** | 4+ | Web框架 | 轻量、灵活、中间件丰富 |
| **TypeScript** | 5+ | 类型系统 | 与前端共享类型定义 |
| **MongoDB** | 6+ | 数据库 | 文档型、灵活Schema、免费Atlas |
| **Mongoose** | 7+ | ODM | Schema验证、中间件、查询构建 |
| **JWT** | - | 认证 | 无状态、跨域友好 |
| **bcrypt** | - | 密码加密 | 安全哈希、加盐 |
| **Multer** | - | 文件上传 | Express中间件、支持多文件 |
| **SheetJS** | - | Excel解析 | 支持xlsx/csv读写 |
| **pdfkit** | - | PDF生成 | 纯Node.js生成PDF |

### 2.3 部署技术栈

| 服务 | 用途 | 费用 |
|------|------|------|
| **GitHub Pages** | 前端静态托管 | 免费 |
| **Vercel** | 后端Serverless部署 | 免费（Hobby计划） |
| **MongoDB Atlas** | 数据库托管 | 免费（M0集群512MB） |
| **Cloudflare** | CDN + DNS | 免费 |

---

## 3. 系统架构设计

### 3.1 整体架构图

```
                        ┌─────────────────────┐
                        │      用户浏览器       │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │  学生端    │ │  教师端    │ │  管理员端  │
              │  SPA      │ │  SPA      │ │  SPA      │
              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                            ┌──────▼──────┐
                            │  API Gateway │
                            │  (Vercel)   │
                            └──────┬──────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
        │  认证服务  │       │  业务服务  │       │  文件服务  │
        │  /api/auth │       │  /api/...  │       │  /api/file │
        └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                            ┌──────▼──────┐
                            │  MongoDB    │
                            │  Atlas      │
                            └─────────────┘
```

### 3.2 前端路由架构

```
/                           → 首页（角色选择，显示EduTrack Logo）
/login/student              → 学生登录
/login/teacher              → 教师登录（步骤1：选姓名+密码）
/teacher/select-class       → 教师选择班级（步骤2：登录后选择班级）
/login/admin                → 管理员登录

# ========== 学生端 ==========
/student                    → 学生端主页（学情报告，默认全科视图）
/student/scores             → 学情报告（Tab切换：全科 | 语文 | 数学 | ...）
/student/profile            → 个人信息
/student/goals              → 学习目标
/student/reports            → 成绩报告下载

# ========== 教师端 ==========
/teacher                    → 教师端主页（默认进入班级分析）
/teacher/class-analysis     → 班级分析（基础统计/分布/对比/年级对比）
/teacher/students           → 学生分析（核心模块）
/teacher/students/list      → 学生列表（原学生管理）
/teacher/students/:studentId → 单个学生详情（与学生端格式一致）
/teacher/settings           → 个人设置

# ========== 管理员端 ==========
/admin                      → 管理员主页
/admin/classes              → 班级管理
/admin/teachers             → 教师管理
/admin/students             → 学生管理（批量操作）
/admin/exams                → 考试管理
/admin/analysis             → 全校数据分析
/admin/announcements        → 公告管理
/admin/settings             → 系统设置
/admin/backup               → 数据备份恢复
```

> **教师端页面结构说明**：
> - 登录后先到 `/teacher/select-class` 选择班级
> - 选定班级后跳转到 `/teacher`（班级分析页）
> - 学生分析模块 `/teacher/students` 包含：
>   - 进退步明显学生（置顶区域）
>   - 学生列表 + 成绩修改（嵌入）
>   - 单个学生详情（点击进入）

---

## 4. 前端架构

### 4.1 目录结构

```
client/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── app/                          # 应用入口
│   │   ├── App.tsx                   # 根组件
│   │   ├── router.tsx                # 路由配置
│   │   └── providers.tsx             # 全局Provider
│   │
│   ├── pages/                        # 页面组件
│   │   ├── home/                     # 首页
│   │   │   ├── HomePage.tsx
│   │   │   └── components/
│   │   │       ├── RoleCard.tsx
│   │   │       └── AnnouncementBanner.tsx
│   │   │
│   │   ├── student/                  # 学生端（智学网风格）
│   │   │   ├── StudentLayout.tsx
│   │   │   ├── ScoreReport.tsx        # 学情报告（核心页面，Tab切换式）
│   │   │   │   ├── TotalScoreView.tsx  # 全科视图
│   │   │   │   ├── SubjectView.tsx     # 单科视图（通用）
│   │   │   │   └── CompareView.tsx     # 多次考试对比视图
│   │   │   ├── Profile.tsx             # 个人信息
│   │   │   ├── LearningGoals.tsx       # 学习目标
│   │   │   ├── ReportDownload.tsx      # 成绩报告下载
│   │   │   └── components/
│   │   │       ├── ScoreCard.tsx           # 总分卡片组件
│   │   │       ├── SubjectList.tsx         # 各科成绩列表
│   │   │       ├── TabSwitcher.tsx         # 全科/单科Tab切换器
│   │   │       ├── TrendChart.tsx          # 单科趋势图
│   │   │       ├── RankBadge.tsx           # 排名标签
│   │   │       └── GoalTracker.tsx          # 目标进度追踪
│   │   │
│   │   ├── teacher/                  # 教师端（重构后）
│   │   │   ├── TeacherLayout.tsx
│   │   │   ├── Login.tsx               # 登录页（选姓名+密码）
│   │   │   ├── SelectClass.tsx         # 选择班级页（登录后第一步）
│   │   │   ├── ClassAnalysis.tsx       # 班级分析（主页）
│   │   │   │   ├── StatsCards.tsx          # 基础统计卡片
│   │   │   │   ├── GradeDistribution.tsx  # 成绩等级分布
│   │   │   │   ├── SubjectComparison.tsx  # 科目对比图
│   │   │   │   └── ClassVsGrade.tsx        # 班级vs年级对比
│   │   │   ├── StudentAnalysis.tsx     # 学生分析（核心模块）
│   │   │   │   ├── ProgressAlert.tsx       # ⚠️ 进退步明显学生（置顶）
│   │   │   │   ├── StudentList.tsx         # 📋 学生列表
│   │   │   │   └── ScoreEditor.tsx         # 📝 成绩修改（嵌入）
│   │   │   ├── StudentDetail.tsx       # 单个学生详情（与学生端格式一致）
│   │   │   │   ├── StudentScoreReport.tsx  # 复用学生端学情报告组件
│   │   │   │   ├── SuggestionEditor.tsx    # 学习建议编辑区
│   │   │   │   └── HistoryTrend.tsx         # 历史趋势图
│   │   │   ├── Settings.tsx            # 个人设置
│   │   │   └── components/
│   │   │       ├── ClassSelector.tsx        # 班级选择器（顶部导航）
│   │   │       ├── ProgressTable.tsx        # 进退步表格
│   │   │       ├── StudentRow.tsx           # 学生列表行
│   │   │       └── EditableScoreCell.tsx    # 可编辑分数单元格
│   │   │
│   │   └── admin/                    # 管理员端
│   │       ├── AdminLayout.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ClassManagement.tsx
│   │       ├── TeacherManagement.tsx
│   │       ├── StudentManagement.tsx
│   │       ├── ExamManagement.tsx
│   │       ├── SchoolAnalysis.tsx
│   │       ├── AnnouncementManagement.tsx
│   │       ├── SystemSettings.tsx
│   │       ├── DataBackup.tsx
│   │       └── components/
│   │           ├── ClassForm.tsx
│   │           ├── TeacherForm.tsx
│   │           ├── ExamForm.tsx
│   │           ├── ImportWizard.tsx
│   │           └── CombinationSelector.tsx
│   │
│   ├── components/                   # 公共组件
│   │   ├── ui/                       # 基础UI组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── Breadcrumb.tsx
│   │   └── charts/                   # 图表组件
│   │       ├── LineChart.tsx
│   │       ├── BarChart.tsx
│   │       ├── RadarChart.tsx
│   │       ├── BubbleChart.tsx
│   │       ├── PieChart.tsx
│   │       └── GradeBar.tsx
│   │
│   ├── hooks/                        # 自定义Hooks
│   │   ├── useAuth.ts                # 认证Hook
│   │   ├── useScore.ts               # 成绩数据Hook
│   │   ├── useClass.ts               # 班级数据Hook
│   │   └── useChart.ts               # 图表Hook
│   │
│   ├── store/                        # 状态管理
│   │   ├── authStore.ts              # 认证状态
│   │   ├── classStore.ts             # 班级状态
│   │   ├── scoreStore.ts             # 成绩状态
│   │   └── uiStore.ts                # UI状态
│   │
│   ├── services/                     # API服务
│   │   ├── api.ts                    # Axios实例配置
│   │   ├── authService.ts            # 认证API
│   │   ├── studentService.ts         # 学生API
│   │   ├── teacherService.ts         # 教师API
│   │   ├── scoreService.ts           # 成绩API
│   │   ├── classService.ts           # 班级API
│   │   ├── examService.ts            # 考试API
│   │   └── adminService.ts           # 管理API
│   │
│   ├── utils/                        # 工具函数
│   │   ├── scoreCalculator.ts        # 成绩计算
│   │   ├── rankCalculator.ts         # 排名计算
│   │   ├── suggestionGenerator.ts    # 建议生成
│   │   ├── pdfGenerator.ts           # PDF生成
│   │   ├── fileParser.ts             # 文件解析
│   │   └── validators.ts             # 数据验证
│   │
│   ├── styles/                       # 全局样式
│   │   ├── globals.css               # 全局CSS
│   │   ├── variables.css             # CSS变量
│   │   └── animations.css            # 动画样式
│   │
│   └── types/                        # TypeScript类型
│       ├── auth.ts                   # 认证类型
│       ├── student.ts                # 学生类型
│       ├── teacher.ts                # 教师类型
│       ├── score.ts                  # 成绩类型
│       ├── class.ts                  # 班级类型
│       ├── exam.ts                   # 考试类型
│       └── api.ts                    # API响应类型
│
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── .env                              # 环境变量
├── .env.production
└── package.json
```

### 4.2 状态管理设计

```typescript
// authStore.ts - 认证状态
interface AuthState {
  user: Student | Teacher | Admin | null;
  role: 'student' | 'teacher' | 'admin' | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => void;
}

// classStore.ts - 班级状态
interface ClassState {
  currentClass: Class | null;
  classList: Class[];
  setCurrentClass: (classId: string) => void;
  fetchClassList: () => Promise<void>;
}

// scoreStore.ts - 成绩状态
interface ScoreState {
  scores: Score[];
  examScores: Map<string, Score[]>;
  loading: boolean;
  fetchScores: (classId: string, examId?: string) => Promise<void>;
  addScore: (score: ScorePayload) => Promise<void>;
  updateScore: (scoreId: string, data: Partial<Score>) => Promise<void>;
  deleteScore: (scoreId: string) => Promise<void>;
}
```

### 4.3 前端关键组件设计

#### 4.3.1 布局组件

```
┌─────────────────────────────────────────────────────────────┐
│  Header: [Logo] [页面标题]            [用户名] [退出登录]     │
├──────┬──────────────────────────────────────────────────────┤
│      │                                                      │
│  S   │                                                      │
│  i   │              主内容区域                                │
│  d   │              (PageContainer)                          │
│  e   │                                                      │
│  b   │                                                      │
│  a   │                                                      │
│  r   │                                                      │
│      │                                                      │
└──────┴──────────────────────────────────────────────────────┘
```

#### 4.3.2 成绩录入表格组件

```
┌─────────────────────────────────────────────────────────────────────┐
│  考试选择: [月考1 ▼]    班级: [高一(1)班 ▼]    [保存全部] [导出]    │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────────┤
│ 姓名 │ 语文 │ 数学 │ 英语 │ 物理 │ 政治 │ 地理 │ 总分 │   操作     │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────────┤
│ 吴轩 │[120] │[135] │[110] │[ 85] │[ 78] │[ 82] │ 610  │ [编辑][删]│
│ 梁洋 │[115] │[128] │[105] │[ 80] │[ 75] │[ 79] │ 582  │ [编辑][删]│
│ ...  │ ...  │ ...  │ ...  │ ...  │ ...  │ ...  │ ...  │   ...     │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴───────────┘
  [] = 可编辑单元格
```

---

## 5. 后端架构

### 5.1 目录结构

```
server/
├── src/
│   ├── index.ts                      # 应用入口
│   ├── app.ts                        # Express应用配置
│   │
│   ├── config/                       # 配置
│   │   ├── database.ts               # 数据库连接
│   │   ├── env.ts                    # 环境变量
│   │   └── cors.ts                   # CORS配置
│   │
│   ├── middleware/                    # 中间件
│   │   ├── auth.ts                   # JWT认证中间件
│   │   ├── roleGuard.ts              # 角色权限守卫
│   │   ├── errorHandler.ts           # 错误处理
│   │   ├── validator.ts              # 请求验证
│   │   └── upload.ts                 # 文件上传
│   │
│   ├── routes/                       # 路由定义
│   │   ├── auth.routes.ts
│   │   ├── student.routes.ts
│   │   ├── teacher.routes.ts
│   │   ├── class.routes.ts
│   │   ├── exam.routes.ts
│   │   ├── score.routes.ts
│   │   ├── announcement.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   │
│   ├── controllers/                  # 控制器
│   │   ├── auth.controller.ts
│   │   ├── student.controller.ts
│   │   ├── teacher.controller.ts
│   │   ├── class.controller.ts
│   │   ├── exam.controller.ts
│   │   ├── score.controller.ts
│   │   ├── announcement.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/                     # 业务逻辑
│   │   ├── auth.service.ts
│   │   ├── student.service.ts
│   │   ├── score.service.ts
│   │   ├── rank.service.ts
│   │   ├── suggestion.service.ts
│   │   ├── import.service.ts
│   │   ├── export.service.ts
│   │   └── backup.service.ts
│   │
│   ├── models/                       # 数据模型
│   │   ├── User.ts
│   │   ├── Student.ts
│   │   ├── Teacher.ts
│   │   ├── Class.ts
│   │   ├── Grade.ts
│   │   ├── Exam.ts
│   │   ├── Score.ts
│   │   ├── Announcement.ts
│   │   └── School.ts
│   │
│   └── utils/                        # 工具函数
│       ├── jwt.ts
│       ├── password.ts
│       ├── fileParser.ts
│       └── pdfGenerator.ts
│
├── tsconfig.json
├── package.json
└── .env
```

### 5.2 中间件架构

```
请求 → CORS → BodyParser → AuthMiddleware → RoleGuard → Validator → Controller → Service → Model
                                                                                    ↓
响应 ← ErrorHandler ← Controller ← Service ← Model
```

### 5.3 认证流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  客户端   │     │  服务端   │     │  数据库   │     │  返回    │
└─────┬────┘     └─────┬────┘     └─────┬────┘     └─────┬────┘
      │                │                │                │
      │ POST /login    │                │                │
      │ {username,pwd} │                │                │
      │───────────────>│                │                │
      │                │ 查询用户       │                │
      │                │───────────────>│                │
      │                │                │                │
      │                │ 用户数据       │                │
      │                │<───────────────│                │
      │                │                │                │
      │                │ 验证密码       │                │
      │                │ 生成JWT Token  │                │
      │                │                │                │
      │ {token, user}  │                │                │
      │<───────────────│                │                │
      │                │                │                │
      │ GET /api/xxx   │                │                │
      │ Authorization: │                │                │
      │ Bearer <token> │                │                │
      │───────────────>│                │                │
      │                │ 验证Token      │                │
      │                │ 检查权限       │                │
      │                │ 处理请求       │                │
      │                │───────────────>│                │
      │                │                │                │
      │ 响应数据       │                │                │
      │<───────────────│                │                │
```

---

## 6. 数据库设计

### 6.1 MongoDB集合设计

#### 6.1.1 users 集合

```typescript
interface IUser {
  _id: ObjectId;
  username: string;           // 登录账号
  password: string;           // bcrypt加密
  role: 'student' | 'teacher' | 'admin';
  refId: ObjectId;            // 关联Student/Teacher的ID
  isActive: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.2 students 集合

```typescript
interface IStudent {
  _id: ObjectId;
  studentId: string;          // 学号（业务ID）
  name: string;
  classId: ObjectId;
  gradeId: ObjectId;
  goals: Map<string, number>;           // 学习目标 { "语文": 130 }
  teacherSuggestions: Map<string, string>; // 教师建议 { "语文": "加强阅读" }
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.3 teachers 集合

```typescript
interface ITeacher {
  _id: ObjectId;
  name: string;
  classIds: ObjectId[];       // 管理的班级列表
  gradeIds: ObjectId[];       // 管理的年级列表
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.4 grades 集合

```typescript
interface IGrade {
  _id: ObjectId;
  name: string;               // "高一"、"高二"、"高三"
  order: number;              // 排序
  schoolId: ObjectId;
  createdAt: Date;
}
```

#### 6.1.5 classes 集合

```typescript
interface IClass {
  _id: ObjectId;
  name: string;               // "高一(1)班-物政地"
  gradeId: ObjectId;
  combination: {
    physicsHistory: '物理' | '历史';
    electives: string[];      // ['政治', '地理']
  };
  subjects: string[];         // 该班所有科目
  order: number;              // 班级排序
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.6 exams 集合

```typescript
interface IExam {
  _id: ObjectId;
  name: string;               // "月考1"
  type: 'monthly' | 'midterm' | 'final' | 'other';
  date: Date;
  gradeId: ObjectId;
  subjectScores: Map<string, number>;  // { "语文": 150, "物理": 100 }
  difficulty: '简单' | '一般' | '困难';
  createdAt: Date;
}
```

#### 6.1.7 scores 集合

```typescript
interface IScore {
  _id: ObjectId;
  studentId: ObjectId;
  examId: ObjectId;
  classId: ObjectId;
  subject: string;
  score: number;
  totalScore: number;
  rank: number;                // 班级排名
  gradeRank: number;           // 年级排名
  classSize: number;           // 班级人数
  createdAt: Date;
  updatedAt: Date;
}

// 复合索引
// db.scores.createIndex({ studentId: 1, examId: 1, subject: 1 }, { unique: true })
// db.scores.createIndex({ classId: 1, examId: 1 })
// db.scores.createIndex({ examId: 1, subject: 1 })
```

#### 6.1.8 announcements 集合

```typescript
interface IAnnouncement {
  _id: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId;
  isPublished: boolean;
  publishedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.9 schools 集合

```typescript
interface ISchool {
  _id: ObjectId;
  name: string;
  logo?: string;               // Logo URL
  gradeStandards: {             // 等级标准
    A: number;                  // ≥90
    B: number;                  // ≥80
    C: number;                  // ≥70
    D: number;                  // ≥60
  };
  defaultPassword: string;      // 默认密码
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 索引策略

| 集合 | 索引 | 类型 | 用途 |
|------|------|------|------|
| users | { username: 1 } | 唯一 | 登录查询 |
| users | { role: 1, refId: 1 } | 复合 | 角色关联 |
| students | { studentId: 1 } | 唯一 | 学号查询 |
| students | { classId: 1 } | 普通 | 按班级查询 |
| scores | { studentId: 1, examId: 1, subject: 1 } | 唯一 | 成绩唯一性 |
| scores | { classId: 1, examId: 1 } | 复合 | 班级成绩查询 |
| scores | { examId: 1, subject: 1 } | 复合 | 考试科目查询 |
| classes | { gradeId: 1 } | 普通 | 按年级查询 |
| exams | { gradeId: 1, date: -1 } | 复合 | 年级考试列表 |

---

## 7. API接口设计

### 7.1 接口规范

| 规范 | 说明 |
|------|------|
| **风格** | RESTful API |
| **版本** | /api/v1/ |
| **认证** | Bearer Token (JWT) |
| **格式** | JSON |
| **编码** | UTF-8 |
| **分页** | ?page=1&limit=20 |
| **排序** | ?sort=createdAt&order=desc |

### 7.2 统一响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 分页响应
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 7.3 API路由表

#### 7.3.1 认证模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/v1/auth/login/student | 学生登录 | 公开 |
| POST | /api/v1/auth/login/teacher | 教师登录 | 公开 |
| POST | /api/v1/auth/login/admin | 管理员登录 | 公开 |
| POST | /api/v1/auth/change-password | 修改密码 | 已登录 |
| GET | /api/v1/auth/me | 获取当前用户 | 已登录 |

#### 7.3.2 学生模块（学情报告）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/students/:id | 获取学生信息 | 学生本人/教师/管理员 |
| GET | /api/v1/students/:id/report | **学情报告**（全科视图） | 学生本人/教师/管理员 |
| GET | /api/v1/students/:id/report/:subject | **学情报告**（单科视图） | 学生本人/教师/管理员 |
| GET | /api/v1/students/:id/report/compare?exams=id1,id2 | **学情报告**（多次考试对比） | 学生本人/教师/管理员 |
| PUT | /api/v1/students/:id/goals | 更新学习目标 | 学生本人 |
| GET | /api/v1/students/:id/suggestions | 获取学习建议 | 学生本人/教师/管理员 |
| GET | /api/v1/students/:id/pdf-report | 下载成绩报告PDF | 学生本人/教师/管理员 |

> **学情报告API返回数据结构**：
> ```json
> {
>   "examId": "xxx",
>   "examName": "期中考试",
>   "total": { "score": 419, "fullScore": 450, "rate": 0.93, "grade": "A", "classRank": 5, "classSize": 45 },
>   "subjects": [
>     { "name": "语文", "score": 123, "fullScore": 150, "rate": 0.82, "rank": 12 },
>     { "name": "数学", "score": 150, "fullScore": 150, "rate": 1.0, "rank": 1 },
>     ...
>   ]
> }
> ```

#### 7.3.3 教师模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/v1/auth/login/teacher | 教师登录（步骤1：姓名+密码） | 公开 |
| GET | /api/v1/teachers/:id/classes | 获取管理班级列表 | 教师 |
| GET | /api/v1/teachers/:id/info | 获取教师个人信息 | 教师 |

#### 7.3.4 班级分析模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/classes/:id/stats | 基础统计（平均分/最高/最低/人数） | 教师/管理员 |
| GET | /api/v1/classes/:id/distribution | 成绩等级分布（A/B/C/D/E人数） | 教师/管理员 |
| GET | /api/v1/classes/:id/subject-comparison | 各科平均分对比 | 教师/管理员 |
| GET | /api/v1/classes/:id/class-vs-grade | 各科班级vs年级对比 | 教师/管理员 |

#### 7.3.5 学生分析模块（教师端核心）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/classes/:id/students/progress-alert | ⚠️ 进退步明显学生（置顶数据） | 教师/管理员 |
| GET | /api/v1/classes/:id/students | 📋 学生列表 | 教师/管理员 |
| POST | /api/v1/classes/:id/students | 添加学生 | 教师/管理员 |
| PUT | /api/v1/students/:studentId | 编辑学生信息 | 教师/管理员 |
| DELETE | /api/v1/students/:studentId | 删除学生 | 教师/管理员 |
| GET | /api/v1/students/:studentId/detail | 👤 单个学生详情（学情报告格式） | 教师/管理员 |
| PUT | /api/v1/scores/batch | 📝 批量修改成绩（表格编辑保存） | 教师/管理员 |
| PUT | /api/v1/scores/:scoreId | 修改单条成绩 | 教师/管理员 |
| GET | /api/v1/students/:studentId/suggestions | 获取学习建议 | 教师/管理员 |
| PUT | /api/v1/students/:studentId/suggestions | ✏️ 更新教师自定义建议 | 教师/管理员 |
| DELETE | /api/v1/students/:studentId/suggestions | 恢复为系统自动建议 | 教师/管理员 |

> **进退步明显学生API返回数据结构**：
> ```json
> {
>   "compareExams": ["月考1", "月考2"],
>   "improved": [
>     { "studentId": "xxx", "name": "李明", "change": +15, "subject": "数学", "from": 85, "to": 100 }
>   ],
>   "declined": [
>     { "studentId": "xxx", "name": "赵强", "change": -18, "subject": "物理", "from": 90, "to": 72 }
>   ]
> }
> ```

#### 7.3.5 考试模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/exams | 获取考试列表 | 教师/管理员 |
| GET | /api/v1/exams/:id | 获取考试详情 | 教师/管理员 |
| POST | /api/v1/exams | 创建考试 | 管理员 |
| PUT | /api/v1/exams/:id | 更新考试 | 管理员 |
| DELETE | /api/v1/exams/:id | 删除考试 | 管理员 |

#### 7.3.6 考试模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/exams | 获取考试列表 | 教师/管理员 |
| GET | /api/v1/exams/:id | 获取考试详情 | 教师/管理员 |
| POST | /api/v1/exams | 创建考试 | 管理员 |
| PUT | /api/v1/exams/:id | 更新考试 | 管理员 |
| DELETE | /api/v1/exams/:id | 删除考试 | 管理员 |

#### 7.3.7 成绩模块（管理员批量操作）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/v1/scores/import | 批量导入成绩文件（Excel/CSV） | 管理员 |
| GET | /api/v1/scores/export?classId=&examId= | 导出成绩数据 | 教师/管理员 |

> **注意**：教师端的成绩修改API已合并到 7.3.5 学生分析模块中

#### 7.3.8 公告模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/announcements | 获取公告列表 | 公开 |
| POST | /api/v1/announcements | 创建公告 | 管理员 |
| PUT | /api/v1/announcements/:id | 更新公告 | 管理员 |
| DELETE | /api/v1/announcements/:id | 删除公告 | 管理员 |

#### 7.3.9 管理模块（管理员端）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/v1/admin/overview | 管理员概览（学校统计） | 管理员 |
| POST | /api/v1/admin/students/import | 批量导入学生 | 管理员 |
| POST | /api/v1/admin/students/transfer | 学生调班 | 管理员 |
| GET | /api/v1/admin/analysis/school | 全校成绩分布分析 | 管理员 |
| GET | /api/v1/admin/analysis/combination | 选科组合对比（同年级同科目） | 管理员 |
| GET | /api/v1/admin/backup | 下载数据备份 | 管理员 |
| POST | /api/v1/admin/restore | 恢复数据 | 管理员 |
| GET | /api/v1/admin/settings | 获取系统设置 | 管理员 |
| PUT | /api/v1/admin/settings | 更新系统设置 | 管理员 |

> **管理员概览API返回示例**：
> ```json
> {
>   "totalStudents": 450,
>   "totalTeachers": 25,
>   "totalClasses": 12,
>   "totalExams": 6,
>   "recentActivity": [...]
> }
> ```

---

## 8. 部署方案

### 8.1 推荐方案：GitHub + Vercel + MongoDB Atlas（零成本）

```
┌─────────────────────────────────────────────────────────────┐
│                     部署架构图                                │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   GitHub    │    │   Vercel    │    │  MongoDB    │     │
│  │  代码仓库    │───>│  自动部署    │    │  Atlas      │     │
│  │             │    │             │    │  数据库      │     │
│  │  /client    │    │  前端SPA    │    │             │     │
│  │  /server    │    │  后端API    │    │  M0免费集群  │     │
│  │  /docs      │    │  Serverless │    │  512MB      │     │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘     │
│                            │                   │            │
│                            └───────────────────┘            │
│                                   │                         │
│                            ┌──────▼──────┐                  │
│                            │  Cloudflare │                  │
│                            │  CDN + DNS  │                  │
│                            └─────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 部署步骤

#### 步骤1：创建GitHub仓库

```bash
# 初始化项目
mkdir edu-tracker && cd edu-tracker
git init
git remote add origin https://github.com/<your-username>/edu-tracker.git
```

#### 步骤2：配置MongoDB Atlas

1. 注册 [MongoDB Atlas](https://www.mongodb.com/atlas)
2. 创建免费M0集群（512MB存储）
3. 设置数据库用户名和密码
4. 配置IP白名单（允许所有IP：0.0.0.0/0）
5. 获取连接字符串

#### 步骤3：配置Vercel

1. 注册 [Vercel](https://vercel.com)（使用GitHub账号登录）
2. 导入GitHub仓库
3. 配置环境变量：
   ```
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/edu-tracker
   JWT_SECRET=<your-secret-key>
   NODE_ENV=production
   ```
4. 部署设置：
   - 前端：Root Directory = `client`，Framework = `Vite`
   - 后端：Root Directory = `server`，Framework = `Node.js`

#### 步骤4：配置域名（可选）

1. 在Cloudflare添加自定义域名
2. 配置CNAME指向Vercel
3. 启用SSL

### 8.3 环境变量配置

```env
# .env.production (前端)
VITE_API_BASE_URL=https://edu-tracker-api.vercel.app/api/v1

# .env (后端)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/edu-tracker
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-username.github.io
PORT=3000
```

---

## 9. 安全设计

### 9.1 认证与授权

| 安全措施 | 实现方式 |
|---------|---------|
| 密码存储 | bcrypt + salt (10 rounds) |
| Token生成 | JWT (HS256算法) |
| Token有效期 | 7天（可配置） |
| Token刷新 | 滑动过期策略 |
| 权限控制 | 基于角色的中间件守卫 |

### 9.2 数据安全

| 安全措施 | 实现方式 |
|---------|---------|
| 输入验证 | Joi/Zod schema验证 |
| SQL/NoSQL注入 | Mongoose参数化查询 |
| XSS防护 | 输入转义 + CSP头 |
| CSRF防护 | SameSite Cookie + Token |
| 文件上传 | 类型白名单 + 大小限制 |
| 敏感数据 | 密码不返回前端 |

### 9.3 API安全

```typescript
// 速率限制
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,                   // 最多100次请求
}));

// 安全头
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
```

---

## 10. 开发计划

### 10.1 阶段划分（对齐PRD重构后）

```
Phase 1: 基础架构搭建 (2周)
├── 项目初始化（前后端脚手架：React + Express + MongoDB）
├── 数据库设计与连接（9个集合）
├── 认证系统（学生/教师两步登录/管理员登录 + JWT）
├── 首页开发（EduTrack Logo + 角色入口 + 公告）
└── 基础UI组件库（Tab切换器、卡片、表格等）

Phase 2: 管理员端 + 数据基础 (3周)
├── 管理员端：年级/班级/教师管理
├── 管理员端：考试创建与科目分值设置
├── 管理员端：批量导入学生/成绩数据
├── 管理员端：系统设置/公告管理
└── 数据库种子数据导入

Phase 3: 学生端核心功能 (2周)
├── 学情报告页面（Tab切换式：全科/单科）
├── 全科视图（总分卡片 + 各科列表 + 排名）
├── 单科视图（趋势图 + 对比分析）
├── 多次考试对比功能
├── 个人信息页 + 修改密码
└── 学习目标 + 成绩报告下载

Phase 4: 教师端核心功能 (3周)
├── 教师登录（两步式：姓名+密码 → 选班级）
├── 班级分析模块
│   ├── 基础统计卡片
│   ├── 成绩等级分布图
│   ├── 科目对比图
│   └── 班级 vs 年级对比
├── 学生分析模块（核心）
│   ├── ⚠️ 进退步明显学生（置顶区域）
│   ├── 📋 学生列表（增删改查）
│   ├── 📝 成绩修改（嵌入，单个+批量）
│   └── 👤 单个学生详情（复用学生端学情报告格式）
├── 学习建议编辑区（教师自定义建议）
└── 成绩报告导出

Phase 5: 分析增强 + 测试部署 (2周)
├── 管理员端：全校数据分析（选科组合对比等）
├── 学习建议自动生成算法优化
├── 气泡图优化设计实现
├── 功能测试 + 性能优化
├── 部署上线（Vercel + MongoDB Atlas）
└── 旧系统数据迁移
```

### 10.2 里程碑

| 里程碑 | 交付物 | 验收标准 |
|--------|--------|---------|
| M1: 基础架构 | 可运行的空项目 + 登录功能 | 三种角色可正常登录，首页显示EduTrack |
| M2: 管理员后台 | CRUD完整 | 可创建班级/教师/考试，可批量导入数据 |
| M3: 学生端 | 学情报告完整 | Tab切换正常，全科/单科视图正确展示 |
| M4: 教师端 | 核心功能完整 | 班级分析图表正常，进退步置顶显示，成绩修改可用 |
| M5: 上线部署 | 生产环境 | 线上可访问，数据已迁移，全部功能验收通过 |

---

## 11. 风险评估

### 11.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|---------|
| MongoDB Atlas免费额度不足 | 中 | 高 | 监控存储使用，必要时升级 |
| Vercel Serverless冷启动 | 低 | 中 | 优化函数大小，使用预热策略 |
| 大量数据查询性能 | 中 | 中 | 添加索引，分页查询，缓存 |
| 文件导入大数据量超时 | 中 | 中 | 分批处理，异步任务队列 |

### 11.2 业务风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|---------|
| 旧数据迁移失败 | 中 | 高 | 先备份，逐步迁移，验证数据 |
| 用户不适应新系统 | 低 | 中 | 提供操作指南，保留旧系统过渡期 |
| 成绩计算逻辑差异 | 中 | 高 | 详细对比旧系统逻辑，充分测试 |

---

## 附录

### A. 技术栈版本兼容性

| 技术 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.0 | 20.x LTS |
| npm | 9.0 | 10.x |
| MongoDB | 6.0 | 7.0 |
| React | 18.0 | 18.x |
| TypeScript | 5.0 | 5.x |

### B. 开发环境搭建

```bash
# 1. 克隆项目
git clone https://github.com/<your-username>/edu-tracker.git
cd edu-tracker

# 2. 安装前端依赖
cd client
npm install

# 3. 安装后端依赖
cd ../server
npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库连接字符串等

# 5. 启动开发服务器
# 前端
cd client && npm run dev

# 后端
cd server && npm run dev
```

### C. 变更日志

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-04-20 | 初稿完成 | AI高级架构师 |

---

> **文档结束**  
> 本架构方案基于PRD需求文档设计，请审阅后确认。
