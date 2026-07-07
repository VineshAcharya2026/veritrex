# TrustHire

Production-ready mentorship platform built with Next.js 14, PostgreSQL, Prisma, and NextAuth.

## Stack

- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes on Cloudflare Workers (OpenNext)
- **Database:** PostgreSQL + Prisma ORM (via Hyperdrive on Cloudflare)
- **Storage:** Cloudflare R2 (mentor media uploads)
- **Auth:** NextAuth.js (credentials, JWT, role-based access)

## Roles

| Role | Dashboard | Description |
|------|-----------|-------------|
| `SUPER_ADMIN` | `/dashboard/admin` | Full platform oversight — users, mentorships, logins, blacklist, config, audit |
| `MENTOR` | `/dashboard/mentor` | Profile, mentee requests, active mentorships |
| `MENTEE` | `/dashboard/mentee` | Find mentors, set goals, track mentorships |

Public registration is open for **Mentor** and **Mentee** only.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` (PostgreSQL) and `NEXTAUTH_SECRET` in `.env`.

4. Generate Prisma client and push schema:

```bash
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js db push
node node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

> **Windows note:** If your project folder path contains `&`, use the `node ...` commands above instead of `npm run` scripts.

Or on Unix / paths without special characters:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@trusthire.com | Password123! |
| Mentor | mentor@trusthire.com | Password123! |
| Mentee | mentee@trusthire.com | Password123! |

## Deploy to Cloudflare Workers

Login **requires PostgreSQL** — SQLite does not work on Workers.

### 1. Create a PostgreSQL database

Use [Neon](https://neon.tech) (free) or [Supabase](https://supabase.com). Use a **pooled** connection string (`?pgbouncer=true`).

### 2. Create Cloudflare resources

In the [Cloudflare dashboard](https://dash.cloudflare.com):

1. **R2** — Create bucket `trust-hire-mentor-content` (or update `wrangler.toml`). Enable public access or attach a custom domain; set `R2_PUBLIC_URL`.
2. **Hyperdrive** — Create a config pointing to your Postgres database. Uncomment the `[[hyperdrive]]` block in `wrangler.toml` and set the config `id`.
3. **Workers** — Log in via `npx wrangler login`.

### 3. Set secrets and environment variables

```bash
npx wrangler secret put DATABASE_URL      # fallback if Hyperdrive not bound
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put NEXTAUTH_URL      # https://your-app.workers.dev
npx wrangler secret put R2_PUBLIC_URL
npx wrangler secret put CRON_SECRET
```

For local Workers preview, copy values into `.dev.vars` (never commit secrets).

### 4. Initialize the production database (one-time)

From your machine (not from Workers):

```bash
DATABASE_URL="your-postgres-url" npm run db:setup-production
```

### 5. Build and deploy

```bash
npm run cf:deploy
```

Or connect your GitHub repo in **Cloudflare Workers → Settings → Builds**:

| Setting | Value |
|---------|-------|
| Build command | `npm run cf:build` |
| Deploy command | `npm run deploy` |

Do **not** use `npm run build` + `npx wrangler deploy` — that skips the OpenNext adapter step.

### 6. Schedule cron jobs

Call `GET /api/cron` with `Authorization: Bearer <CRON_SECRET>` on a schedule. Options:

- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) (via a small companion worker or HTTP cron)
- External scheduler (e.g. cron-job.org) hitting your production URL

Split heavy tasks with query params: `?task=unilateral`, `?task=trust-scores`, `?task=cheating`.

### 7. Preview locally in the Workers runtime

```bash
npm run cf:preview
```

### Troubleshooting

- **Database errors on Workers** — Ensure Hyperdrive is configured and `compatibility_date` in `wrangler.toml` is `2025-04-01` or later.
- **Upload failures** — Verify `MENTOR_CONTENT` R2 binding and `R2_PUBLIC_URL` secret.
- **Auth redirect issues** — `NEXTAUTH_URL` must match your production domain exactly (no trailing slash).
