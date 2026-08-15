# HOSCORE Production Readiness

## Required Environment

- `DATABASE_URL` and `DIRECT_URL` for Neon Postgres.
- `JWT_SECRET` set to a long random secret.
- `CLIENT_URL=https://hoscore.in`
- `PUBLIC_APP_URL=https://hoscore.in`
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_URL` for Cloudflare R2 uploads.
- Optional pricing overrides: `NEON_STORAGE_USD_PER_GB_MONTH`, `R2_STORAGE_USD_PER_GB_MONTH`, `R2_CLASS_A_USD_PER_MILLION`, `R2_CLASS_B_USD_PER_MILLION`.

## Build And Release

Production is two Vercel projects: web (`client` → hoscore.in) and API (`server` → api.hoscore.in).

1. Run `npm run lint --prefix client`.
2. Run `npm run build`.
3. Prisma migrations run on API deploy via `server` `vercel-build` (`prisma migrate deploy`). Do not use `prisma db push` in production.
4. Do not run the seed script against production unless intentionally resetting demo data.
5. Verify `https://api.hoscore.in/health`, `https://hoscore.in/robots.txt`, and `https://api.hoscore.in/sitemap.xml` after deployment.

## Security Checklist

- Keep CORS locked to `CLIENT_URL`.
- Rotate R2 credentials if they were ever used locally in shared logs.
- Confirm staff permissions by logging in with each staff preset and opening restricted dashboard URLs directly.
- Use HTTPS-only cookies/proxy headers at the hosting layer.
- Keep provider invoices authoritative; in-app usage estimates are operational telemetry.

## SEO Checklist

- Public hospital profiles should use stable slugs.
- Sitemap should include `/hospitals`, every active hospital profile, and location pages.
- Validate Open Graph previews with the production URL after deploy.
- Set the production frontend to serve the same routes handled by the React router.
