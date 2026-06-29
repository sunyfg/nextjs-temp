# nextjs-temp — 仪表盘管理后台与博客

全栈管理后台，包含博客管理、RBAC 权限控制、文件管理和富文本编辑器。基于 Next.js 16 App Router 构建。

## 技术栈

| 包 | 版本 | 说明 |
|---|---|---|
| Next.js | 16.2.9 | Turbopack 默认开发服务器；`middleware.ts` → `proxy.ts` 规范 |
| React | 19.2.4 | 可用 `use()` hook 消费 Promise |
| Auth.js | 5.0.0-beta.31 | `next-auth@beta`，JWT 会话策略 |
| Prisma | 7.8.0 | 需配合 `@prisma/adapter-mariadb` + `prisma.config.ts` |
| Tailwind CSS | 4.x | `@import "tailwindcss"`，`@theme inline`，无 `tailwind.config.js` |
| antd | 6.x | UI 组件库（Upload、message 等） |
| Tiptap | 3.27.x | 富文本编辑器，支持图片/链接/占位符扩展 |
| ESLint | 9.x | Flat config `eslint.config.mjs` |

## 环境要求

- **Node.js >= 20.9.0**（Next.js 16 要求）。主机可能通过 nvm 安装了 Node 18 —— 执行命令前切换版本：
  ```bash
  source ~/.nvm/nvm.sh && nvm use 20
  ```
- **MySQL** —— 通过 env 文件中的 `DATABASE_URL` 配置
- **pnpm**（推荐）

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 创建环境变量文件（见下方说明）
# .env 已提交到仓库含默认值 —— 复制为 .env.local：
cp .env .env.local
# 如果本地 MySQL 配置不同，编辑该文件

# 3. 执行数据库迁移
pnpm db:migrate

# 4. 填充测试数据
pnpm db:seed

# 5. 启动开发服务器（Turbopack）
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。访问 `/dashboard` 或 `/admin/blogs/list`。

### 测试用户

| 邮箱 | 密码 | 角色 |
|---|---|---|
| `admin@example.com` | `123456` | 管理员（所有权限） |
| `editor@example.com` | `123456` | 编辑者 |

通过 `pnpm db:seed` 创建。

## 环境配置

### 环境变量文件

| 文件 | 作用域 | Git | 用途 |
|---|---|---|---|
| `.env` | 共享默认值 | **提交** | 兜底 —— 安全的占位值 |
| `.env.local` | 本地开发 | 忽略 | `APP_ENV=local`（默认） |
| `.env.test` | 测试环境 | 忽略 | `APP_ENV=test` |
| `.env.prod` | 生产环境 | 忽略 | `APP_ENV=prod` |

`APP_ENV` 控制 `prisma.config.ts` 加载哪个文件。开发服务器通过启动脚本自动加载 `.env` + `.env.local`。

### 环境变量

```env
# 数据库
DATABASE_URL="mysql://root:password@127.0.0.1:3306/nextjs_temp"

# Auth.js —— 生产环境替换为真实的随机字符串
AUTH_SECRET="change-me-to-a-random-secret-in-production"

# GitHub OAuth（可选）
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

### 环境切换

```bash
pnpm dev              # 本地（默认，加载 .env.local）
pnpm dev:test         # 测试（加载 .env.test）
pnpm dev:prod         # 生产（加载 .env.prod）

# Prisma 命令的 APP_ENV 由对应脚本自动设置：
pnpm db:migrate       # 本地
pnpm db:migrate:test  # 测试
pnpm db:deploy        # 生产部署
pnpm db:deploy:test   # 测试部署
pnpm db:deploy:prod   # 生产部署
```

## 数据库

### Prisma 7（非标准配置）

使用 `@prisma/adapter-mariadb` 适配器而非标准驱动：

```ts
// src/lib/prisma.ts
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
new PrismaClient({ adapter: new PrismaMariaDb(process.env["DATABASE_URL"]!) });
```

- 客户端输出至 `src/generated/prisma/`（schema 中自定义 `output`）—— 已 gitignore，schema 变更后需重新生成
- `prisma.config.ts` 使用 `prisma/config` 的 `defineConfig()`
- 种子脚本 `prisma/seed.ts` 自行加载环境变量并直接使用 MariaDB 适配器

### 命令

```bash
pnpm db:migrate          # 本地：创建 + 应用迁移
pnpm db:deploy           # 生产：应用待处理迁移（无 shadow database）
pnpm db:deploy:test      # 测试：应用待处理迁移
pnpm db:deploy:prod      # 生产：应用待处理迁移
pnpm db:seed             # 本地：填充数据库
pnpm db:studio           # 打开 Prisma Studio（本地）
```

## 认证

Auth.js v5 beta，配置在 `src/auth.ts`：

- **JWT 会话策略**（无数据库会话）
- **凭证提供者** —— 邮箱/密码，使用 bcryptjs 加密
- **GitHub OAuth 提供者** —— 可选，设置 `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- **角色/权限注入** —— 登录时从 RBAC 表获取角色编码和权限编码，写入 JWT token

### 路由保护

- `src/proxy.ts`（Next.js 16 `proxy` 规范，替代 `middleware.ts`）保护 `/dashboard/*` 和 `/admin/*`
- 未认证用户将被重定向至 `/auth/login?callbackUrl=...`
- 环境不匹配检测：由其他环境签发的 token 会强制重新登录
- API 路由**不受** proxy 保护 —— 如有需要，在每个 handler 中添加 `auth()`

## 项目结构

```
src/
├── app/
│   ├── about/                   # 关于页面
│   ├── admin/                   # 后台博客管理布局
│   │   ├── blogs/
│   │   │   ├── [id]/edit/       # 博客编辑器（Tiptap + 草稿管理）
│   │   │   ├── categories/      # 分类管理
│   │   │   ├── list/            # 博客文章列表
│   │   │   ├── tags/            # 标签管理
│   │   │   └── blogs-client.tsx # 文章列表客户端组件
│   │   ├── files/               # 文件管理（CmsFile + CmsUploadDir）
│   │   ├── layout.tsx           # 后台布局（侧边栏 + 内容区）
│   ├── api/
│   │   ├── admin/
│   │   │   ├── blogs/           # 文章 CRUD + 草稿（POST/PUT/DELETE）
│   │   │   ├── categories/      # 分类 CRUD
│   │   │   └── tags/            # 标签 CRUD
│   │   ├── auth/                # Auth.js 处理器 [...nextauth]
│   │   ├── blogs/               # 公开博客 API
│   │   ├── common/
│   │   │   ├── files/           # 文件上传/下载
│   │   │   └── upload-dirs/     # 上传目录管理
│   │   ├── permissions/         # 权限查询
│   │   ├── roles/               # 角色 CRUD + 权限分配
│   │   ├── user/me/             # 当前用户信息
│   │   └── users/               # 用户管理
│   ├── auth/login/              # 登录页面
│   ├── blogs/                   # 公开博客页面
│   ├── dashboard/               # 仪表盘（RBAC 管理）
│   │   ├── permissions/         # 权限管理
│   │   ├── roles/               # 角色管理
│   │   ├── settings/            # 设置页面
│   │   └── users/               # 用户管理
│   ├── globals.css              # Tailwind v4 + Tiptap 样式
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 首页
├── auth.ts                      # Auth.js 配置
├── proxy.ts                     # Next.js 16 路由守卫（替代 middleware）
├── components/                  # 共享 React 组件
│   └── providers.tsx            # 客户端 Provider（SessionProvider）
├── hooks/
│   └── usePermission.ts         # 权限检查 hook
├── lib/
│   ├── auth-utils.ts            # 认证工具函数
│   ├── file-upload.ts           # 文件上传逻辑
│   └── prisma.ts                # Prisma 客户端单例（MariaDB 适配器）
├── types/
│   └── next-auth.d.ts           # Auth.js 类型扩展
prisma/
├── schema.prisma                # 数据库模型
├── migrations/                  # 迁移历史
├── seed.ts                      # 种子脚本（用户、角色）
```

## API 规范

所有 API 路由返回统一响应格式：

```ts
{ code: 0, message: "success", data: ... }
```

错误示例：

```ts
{ code: 400, message: "name is required" }
```

## 博客草稿与发布流程

编辑器支持两个独立的保存路径：

- **保存草稿** → `POST/PUT /api/admin/blogs/drafts` —— 按 `author_id + slug` 合并写入草稿，独立于 `Post` 表
- **发布文章** → `POST/PUT /api/admin/blogs` —— 写入 `Post` 表，然后删除关联草稿

编辑已有文章时，页面挂载后自动加载草稿（按 `postId` 查询）。

## 脚本命令

```bash
pnpm dev              # 开发服务器（Turbopack，本地环境）
pnpm dev:test         # 开发服务器（测试环境）
pnpm dev:prod         # 开发服务器（生产环境）
pnpm build            # 生产构建
pnpm start            # 生产服务器
pnpm lint             # ESLint flat config

pnpm db:migrate       # 创建迁移 + 应用（本地）
pnpm db:deploy        # 应用待处理迁移（生产，无 shadow DB）
pnpm db:seed          # 填充数据库（本地）
pnpm db:studio        # Prisma Studio（本地）
```

## 生产部署清单

1. 在对应环境变量文件中替换 `AUTH_SECRET` 为随机字符串
2. 设置 `DATABASE_URL` 指向生产数据库
3. 可选：配置 `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
4. 执行 `pnpm db:deploy`（或 `pnpm db:deploy:prod`）
5. 可选：执行 `pnpm db:seed`
6. 构建并部署：`pnpm build && pnpm start`
