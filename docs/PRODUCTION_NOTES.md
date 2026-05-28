# Production Notes

## Environment

- `server/.env` must define `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and any Cloudflare R2 variables used by the deployment.
- Do not commit local `.env`, SQLite dev databases, screenshots, or generated workbooks.
- The frontend expects `VITE_API_URL` when the API is not served at `http://localhost:5000/api`.

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
