<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# nextjs-temp — Dashboard Admin

## Quick Start

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build
pnpm lint         # ESLint flat config (eslint.config.mjs)
pnpm db:migrate   # local migrate dev
pnpm db:seed      # local db seed
pnpm db:deploy    # production migrate deploy
```

## Critical Environment

- **Node.js >= 20.9.0 required** (Next.js 16). Host has Node 18 via nvm — must run `nvm use 20` before any `pnpm` command.
- **Database**: MySQL — config via `DATABASE_URL` in env files.
- **Test users**: `admin@example.com` / `editor@example.com`, password `123456`. Created via `pnpm db:seed`.

## Environment Files

| File | Scope | Git | Usage |
|---|---|---|---|
| `.env` | Shared defaults | **Committed** | Fallback — safe placeholder values |
| `.env.local` | Local dev | Ignored | `APP_ENV=local` (default) |
| `.env.test` | Test | Ignored | `APP_ENV=test` |
| `.env.prod` | Production | Ignored | `APP_ENV=prod` |

`APP_ENV` controls which file `prisma.config.ts` and `prisma/seed.ts` load. Defaults to `local`.
Next.js runtime auto-loads `.env` + `.env.local` for dev — no `APP_ENV` needed.

## Framework Versions (all differ from defaults)

| Package | Version | Key Quirk |
|---|---|---|
| Next.js | 16.2.9 | `middleware.ts` → `proxy.ts` file convention |
| Prisma | 7.8.0 | Requires `@prisma/adapter-mariadb` + `prisma.config.ts` |
| Auth.js | 5.0.0-beta.31 | `next-auth@beta`, JWT strategy |
| Tailwind CSS | 4.x | `@import "tailwindcss"` (no `tailwind.config`), `@theme inline` |
| React | 19.2.4 | `use()` hook for promise consumption |
| ESLint | 9.x | Flat config `eslint.config.mjs` |

## Next.js 16 Breaking Changes

- **`proxy.ts` (NOT `middleware.ts`)**: The `middleware` file convention is deprecated. Use `src/proxy.ts` with `export const proxy = auth(callback)` instead. Config stays the same (`export const config = { matcher: [...] }`).
- **Route handler params are async**: `params` is a `Promise<{ id: string }>` — must `await` it before use.
- **Turbopack is the default dev server**.

## Prisma 7 — Non‑standard Setup

- Uses `@prisma/adapter-mariadb` adapter instead of the standard driver. **Not** using `@prisma/client`:
  ```ts
  // src/lib/prisma.ts
  import { PrismaMariaDb } from "@prisma/adapter-mariadb";
  import { PrismaClient } from "../generated/prisma/client";
  new PrismaClient({ adapter: new PrismaMariaDb(process.env["DATABASE_URL"]!) });
  ```
- Client output at `src/generated/prisma/` (custom `output` in schema). This directory is gitignored — regenerate after every schema change.
- `prisma.config.ts` at root uses `defineConfig()` from `prisma/config`. It loads `.env` via `dotenv/config`.
- Seed script at `prisma/seed.ts` uses PrismaMariaDb adapter directly (not the CLI auto‑injection).

## Auth.js v5

- Config in `src/auth.ts` — `NextAuth()` exports `{ handlers, auth, signIn, signOut }`.
- `auth()` wrapper protects routes in `src/proxy.ts`:
  ```ts
  export const proxy = auth((req) => { ... });
  ```
- JWT session strategy (no database sessions).
- Credentials (email/password via bcryptjs) + GitHub OAuth providers.
- API route handler at `src/app/api/auth/[...nextauth]/route.ts` (delegates to `handlers`).

## API Conventions

All API routes return unified response shape:
```ts
{ code: 0, message: "success", data: ... }
```

Error example:
```ts
{ code: 400, message: "name is required" }
```

## React 19 Data Fetching

Prefer `use()` hook + `<Suspense>` over `useEffect` + `setState`. This is the pattern that passes ESLint rules. See `src/app/blog/[id]/page.tsx` for server component example.

## Tailwind CSS v4

- Entry point: `src/app/globals.css` with `@import "tailwindcss"`.
- `@theme inline` directive for theme tokens. No `tailwind.config.js` file.
- Plugin: `@tailwindcss/postcss` in `postcss.config.mjs`.

## Route Protection

- `src/proxy.ts` protects `/dashboard/*`. Unauthenticated users are redirected to `/auth/login?callbackUrl=...`.
- API routes are **not** protected by proxy — add `auth()` per handler if needed.

## Directory Ownership

| Path | Purpose |
|---|---|
| `src/app/` | Next.js App Router pages |
| `src/app/api/` | REST API handlers |
| `src/app/dashboard/` | Protected admin pages (layout: sidebar + content) |
| `src/auth.ts` | Auth.js configuration |
| `src/proxy.ts` | Route guard |
| `src/lib/prisma.ts` | Prisma client singleton |
| `prisma/` | Schema, migrations, seed |
| `src/generated/prisma/` | Generated Prisma client (gitignored) |

## GitHub OAuth

To enable GitHub login, set these in `.env`:
```
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
```
Get credentials at https://github.com/settings/developers

## Production Checklist

1. Replace `AUTH_SECRET` in `.env` (currently `change-me-to-a-random-secret-in-production`)
2. Set `DATABASE_URL` to `nextjs_temp_prod`
3. Run `pnpm db:deploy` (equivalent to `prisma migrate deploy`)
4. Optionally seed: `pnpm db:seed`
5. Build: `pnpm build`
