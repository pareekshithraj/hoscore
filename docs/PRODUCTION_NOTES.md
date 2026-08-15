# Production Notes

Production is **Vercel only**. Public site: `https://hoscore.in`. API: `https://api.hoscore.in`.

## Vercel projects

| Project | Root directory | Production domain |
|---|---|---|
| Web app | `client` | `hoscore.in` / `www.hoscore.in` |
| API | `server` | `api.hoscore.in` |

The client rewrites `/api/*` to `https://api.hoscore.in/api/*`. Queue updates on Vercel use HTTP polling (serverless cannot keep a WebSocket open).

## Environment

- Do not commit local `.env`, SQLite dev databases, screenshots, or generated workbooks.
- **API project** (Production + Preview): `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (32+ chars), `CLIENT_URL=https://hoscore.in`, `PUBLIC_APP_URL=https://hoscore.in`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, R2 keys, MSG91/Resend. Optional: `FCM_SERVER_KEY`.
- **Web project:** `VITE_API_URL` is optional. Unset, the client already uses `https://api.hoscore.in/api`.
- After changing env vars, redeploy both projects. Run `npx prisma migrate deploy` via the API project's `vercel-build` (already in `server/package.json`).
- **Billing workflow:** hospitals register → 30-day trial → add staff → pay per user/year on `/dashboard/subscription` → optional Razorpay autopay. See `docs/RAZORPAY_SETUP.md`.
- Razorpay webhook URL: `https://api.hoscore.in/api/payments/webhook`.

## Database

- Prisma schema is in `server/prisma/schema.prisma`.
- Migration SQL is tracked under `server/prisma/migrations`.
- Use `npx prisma migrate deploy` for production migrations, not `prisma db push`.

## Usage And Pricing

- Super admin usage telemetry reads database storage estimates from Neon/Postgres and object usage from Cloudflare R2 when credentials are configured.
- If R2 credentials are absent, the dashboard should still render database usage and show object storage as unavailable or zero rather than failing the page.
- The pricing workbook remains a generated artifact under `outputs/` and is intentionally ignored by git.

## Runtime Checks

- Start local development with `npm run dev`.
- Build with `npm run build`.
- Production server entry is `server/dist/index.js` after building.
