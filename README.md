# Veritrex

Production-ready mentorship platform for **Veritrex** (`veritrex.com`) on **Cloudflare Workers** with **D1**, **KV** session revocation, and custom JWT auth.

**Contact:** info@veritra.com · +91 97400 01208 · 172, Pentagon Passiflora, Sarjapura, Bengaluru 562125

## Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS
- **Runtime:** Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare)
- **Database:** Cloudflare D1 (SQLite) with SQL migrations in `db/migrations/`
- **Auth:** Custom Workers-native JWT sessions (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
- **Sessions:** HttpOnly cookie + optional KV revocation list (`AUTH_KV`)
- **Storage:** Cloudflare R2 (mentor media uploads — optional)

## Roles

| Role | Dashboard | Description |
|------|-----------|-------------|
| `SUPER_ADMIN` | `/dashboard/admin` | Full platform oversight |
| `MENTOR` | `/dashboard/mentor` | Profile, mentee requests, mentorships |
| `MENTEE` | `/dashboard/mentee` | Find mentors, goals, mentorships |

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create Cloudflare resources (one-time):

```bash
npm run db:d1:create
```

Copy the returned `database_id` into `wrangler.toml` under `[[d1_databases]]`.

Create a KV namespace for auth revocation:

```bash
npx wrangler kv namespace create AUTH_KV
```

Set the returned `id` in `wrangler.toml` under `[[kv_namespaces]]`.

3. Apply migrations and seed demo users:

```bash
npm run db:d1:migrate
npm run db:d1:seed
```

4. Configure `.dev.vars`:

```bash
AUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:8787
```

(`NEXTAUTH_SECRET` is still accepted as a legacy alias.)

5. Preview on Workers runtime:

```bash
npm run cf:preview
```

> **Windows note:** If your project path contains `&`, build/deploy from a copy without `&` (e.g. `trusthire-build2`) or invoke OpenNext via `node node_modules/@opennextjs/cloudflare/dist/cli/index.js`.

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@veritra.com | Password123! |
| Mentor | mentor@veritra.com | Password123! |
| Mentee | mentee@veritra.com | Password123! |

## Deploy to Cloudflare Workers

### 1. Configure bindings

Ensure `wrangler.toml` has real IDs for:

- `[[d1_databases]]` → `DB` binding
- `[[kv_namespaces]]` → `AUTH_KV` binding

### 2. Apply remote migrations and seed

```bash
npm run db:d1:migrate:remote
npm run db:d1:seed:remote
```

### 3. Set secrets

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put NEXTAUTH_URL    # https://your-worker.workers.dev
```

Optional: `CRON_SECRET`, `R2_PUBLIC_URL` (when R2 is enabled).

### 4. Build and deploy

```bash
npm run cf:deploy
```

### 5. Smoke test

- `POST /api/auth/login` with demo credentials
- `GET /api/auth/me` returns role/status
- Role dashboards load for admin/mentor/mentee

## Project layout

| Path | Purpose |
|------|---------|
| `lib/brand.ts` | Veritrex brand + contact details |
| `lib/auth/` | JWT session issue/verify, client session provider |
| `lib/db/` | D1 client, Prisma-compatible ORM (`lib/prisma.ts` re-exports) |
| `db/migrations/` | D1 SQL migrations |
| `scripts/seed-d1.mjs` | Demo user seed for D1 |

## Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Email/password login, sets session cookie |
| `POST` | `/api/auth/logout` | Revokes session and clears cookie |
| `GET` | `/api/auth/me` | Current user claims |

## Cron (TrustScore, unilateral ratings, cheat detection)

Protected route: `GET /api/cron` with header `Authorization: Bearer $CRON_SECRET`.

Run all daily jobs (recommended at 03:00 UTC):

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://YOUR_WORKER_URL/api/cron"
```

Individual tasks:

| Query | Job |
|-------|-----|
| `?task=unilateral` | Mark one-sided ratings after 24h, recalculate TrustScores |
| `?task=trust-scores` | Batch recalculate all user TrustScores and tiers |
| `?task=cheating` | Flag suspicious mentor–mentee rating pairs for admin review |

**Cloudflare setup:** In the Workers dashboard, add a Cron Trigger that issues an HTTP `GET` to `/api/cron` with the `Authorization` header (or use an external scheduler). OpenNext does not expose a native `scheduled` handler; HTTP cron is the supported approach.

Set `CRON_SECRET` in Worker secrets alongside `AUTH_SECRET`.

**Admin UI:** Super admins can also run the same integrity jobs from **Dashboard → Ratings & Trust** via **Run integrity jobs** (server-side; does not expose `CRON_SECRET` to the browser). Use **Recalculate TrustScores** for a one-shot trust recalculation.
