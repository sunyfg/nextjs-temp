# nextjs-temp — Dashboard Admin & Blog

Full-stack admin dashboard with blog management, RBAC permissions, file management, and a rich text editor. Built on Next.js 16 App Router.

## Tech Stack

| Package | Version | Note |
|---|---|---|
| Next.js | 16.2.9 | Turbopack default dev server; `middleware.ts` → `proxy.ts` convention |
| React | 19.2.4 | `use()` hook available for promise consumption |
| Auth.js | 5.0.0-beta.31 | `next-auth@beta`, JWT session strategy |
| Prisma | 7.8.0 | Requires `@prisma/adapter-mariadb` + `prisma.config.ts` |
| Tailwind CSS | 4.x | `@import "tailwindcss"`, `@theme inline`, no `tailwind.config.js` |
| antd | 6.x | UI components (Upload, message, etc.) |
| Tiptap | 3.27.x | Rich text editor with image/link/placeholder extensions |
| ESLint | 9.x | Flat config `eslint.config.mjs` |

## Prerequisites

- **Node.js >= 20.9.0** (Next.js 16 requirement). Host may have Node 18 via nvm — switch before any command:
  ```bash
  source ~/.nvm/nvm.sh && nvm use 20
  ```
- **MySQL** — configured via `DATABASE_URL` in env files
- **pnpm** (recommended) or npm

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Create environment files (see below)
# .env is committed with defaults — copy for .env.local:
cp .env .env.local
# Edit if your local MySQL differs

# 3. Apply database migrations
pnpm db:migrate

# 4. Seed test data
pnpm db:seed

# 5. Start dev server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Navigate to `/dashboard` or `/admin/blogs/list`.

### Test Users

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `123456` | Admin (all permissions) |
| `editor@example.com` | `123456` | Editor |

Created via `pnpm db:seed`.

## Environment Configuration

### Environment Files

| File | Scope | Git | Usage |
|---|---|---|---|
| `.env` | Shared defaults | **Committed** | Fallback — safe placeholder values |
| `.env.local` | Local dev | Ignored | `APP_ENV=local` (default) |
| `.env.test` | Test | Ignored | `APP_ENV=test` |
| `.env.prod` | Production | Ignored | `APP_ENV=prod` |

`APP_ENV` controls which file `prisma.config.ts` loads. The dev server auto-loads `.env` + `.env.local` via the bootstrap script.

### Environment Variables

```env
# Database
DATABASE_URL="mysql://root:password@127.0.0.1:3306/nextjs_temp"

# Auth.js — replace with a real random string in production
AUTH_SECRET="change-me-to-a-random-secret-in-production"

# GitHub OAuth (optional)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

### Environment Selection

```bash
pnpm dev              # local (default, loads .env.local)
pnpm dev:test         # test (loads .env.test)
pnpm dev:prod         # prod (loads .env.prod)

# For Prisma commands, APP_ENV is set automatically by each script:
pnpm db:migrate       # local
pnpm db:migrate:test  # test
pnpm db:deploy        # production deployment
pnpm db:deploy:test   # test deployment
pnpm db:deploy:prod   # production deployment
```

## Database

### Prisma 7 (Non-standard Setup)

Uses `@prisma/adapter-mariadb` adapter instead of the standard driver:

```ts
// src/lib/prisma.ts
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
new PrismaClient({ adapter: new PrismaMariaDb(process.env["DATABASE_URL"]!) });
```

- Client output at `src/generated/prisma/` (custom `output` in schema) — gitignored, regenerate after schema changes
- `prisma.config.ts` at root uses `defineConfig()` from `prisma/config`
- Seed script at `prisma/seed.ts` loads its own env and uses the MariaDB adapter directly

### Commands

```bash
pnpm db:migrate          # Local: create + apply migration
pnpm db:deploy           # Production: apply pending migrations (no shadow DB)
pnpm db:deploy:test      # Test: apply pending migrations
pnpm db:deploy:prod      # Production: apply pending migrations
pnpm db:seed             # Local: seed database
pnpm db:studio           # Open Prisma Studio (local)
```

## Authentication

Auth.js v5 beta configured in `src/auth.ts`:

- **JWT session strategy** (no database sessions)
- **Credentials provider** — email/password via bcryptjs
- **GitHub OAuth provider** — optional, set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- **Role/permission injection** — on sign-in, fetches role codes and permission codes from RBAC tables and attaches them to the JWT token

### Route Protection

- `src/proxy.ts` (Next.js 16 `proxy` convention, replaces `middleware.ts`) protects `/dashboard/*` and `/admin/*`
- Unauthenticated users are redirected to `/auth/login?callbackUrl=...`
- Env mismatch detection: tokens issued by a different environment force re-login
- API routes are **not** protected by proxy — add `auth()` per handler if needed

## Project Structure

```
src/
├── app/
│   ├── about/                   # About page
│   ├── admin/                   # Admin blog management layout
│   │   ├── blogs/
│   │   │   ├── [id]/edit/       # Blog editor (Tiptap + draft management)
│   │   │   ├── categories/      # Category CRUD
│   │   │   ├── list/            # Blog post list
│   │   │   ├── tags/            # Tag CRUD
│   │   │   └── blogs-client.tsx # Blog list client component
│   │   ├── files/               # File management (CmsFile + CmsUploadDir)
│   │   ├── layout.tsx           # Admin layout (sidebar + content)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── blogs/           # Blog CRUD + drafts (POST/PUT/DELETE)
│   │   │   ├── categories/      # Category CRUD
│   │   │   └── tags/            # Tag CRUD
│   │   ├── auth/                # Auth.js handlers [...nextauth]
│   │   ├── blogs/               # Public blog API
│   │   ├── common/
│   │   │   ├── files/           # File upload/download
│   │   │   └── upload-dirs/     # Upload directory management
│   │   ├── permissions/         # Permission queries
│   │   ├── roles/               # Role CRUD + permission assignment
│   │   ├── user/me/             # Current user profile
│   │   └── users/               # User management
│   ├── auth/login/              # Login page
│   ├── blogs/                   # Public blog pages
│   ├── dashboard/               # Dashboard (RBAC management)
│   │   ├── permissions/         # Permission management
│   │   ├── roles/               # Role management
│   │   ├── settings/            # Settings page
│   │   └── users/               # User management
│   ├── globals.css              # Tailwind v4 + Tiptap styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── auth.ts                      # Auth.js configuration
├── proxy.ts                     # Next.js 16 route guard (replaces middleware)
├── components/                  # Shared React components
│   └── providers.tsx            # Client-side providers (SessionProvider)
├── hooks/
│   └── usePermission.ts         # Permission check hook
├── lib/
│   ├── auth-utils.ts            # Auth utility helpers
│   ├── file-upload.ts           # File upload logic
│   └── prisma.ts                # Prisma client singleton (MariaDB adapter)
├── types/
│   └── next-auth.d.ts           # Auth.js type extensions
prisma/
├── schema.prisma                # Database schema
├── migrations/                  # Migration history
├── seed.ts                      # Seed script (users, roles)
```

## API Conventions

All API routes return a unified response shape:

```ts
{ code: 0, message: "success", data: ... }
```

Error example:

```ts
{ code: 400, message: "name is required" }
```

## Blog Draft / Publish Flow

The editor supports two separate save paths:

- **保存草稿** → `POST/PUT /api/admin/blogs/drafts` — upserts draft by `author_id + slug`, independent of the `Post` table
- **发布文章** → `POST/PUT /api/admin/blogs` — writes to the `Post` table, then deletes the associated draft

When editing existing posts, drafts are auto-loaded on mount (fetched by `postId`).

## Scripts

```bash
pnpm dev              # Dev server (Turbopack, local env)
pnpm dev:test         # Dev server (test env)
pnpm dev:prod         # Dev server (prod env)
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # ESLint flat config

pnpm db:migrate       # Create migration + apply (local)
pnpm db:deploy        # Apply pending migrations (prod, no shadow DB)
pnpm db:seed          # Seed database (local)
pnpm db:studio        # Prisma Studio (local)
```

## Production Checklist

1. Replace `AUTH_SECRET` in the appropriate env file
2. Set `DATABASE_URL` to production database
3. Optionally configure `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
4. Run `pnpm db:deploy` (or `pnpm db:deploy:prod`)
5. Optionally seed: `pnpm db:seed`
6. Build and deploy: `pnpm build && pnpm start`
