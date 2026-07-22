# HOSCORE — Native Android App Full Rebuild Prompt (for Antigravity)

> **Paste everything below this line into Antigravity as the task prompt.**
> It is self-contained: it describes the goal, the exact backend contract, the
> screen list, the design system, the architecture, and the acceptance bar.

---

## 0. Role & Goal

You are a senior Android engineer. Rebuild the existing HOSCORE Android app
(`android/` module, package `com.example.hoscore`) into a **fully native,
modern, stunning hospital-operations app** written in **Kotlin + Jetpack
Compose (Material 3)**.

The current app is a throwaway prototype: it shows **hardcoded fake data**
("Atorvastatin", "$85.00", "84% Saturation") in one giant `MainScreen.kt`, and
everything real is punted to a `WebView` that loads `https://hoscore.in`.

**Replace this entirely.** Every screen must be a real native Compose screen
that reads and writes **live data from the HOSCORE REST API** — no WebView, no
mock data, no hardcoded strings standing in for server data. The app must feel
like a polished, production consumer health app (think Apple Health / modern
fintech dashboards), not a prototype.

**Do NOT touch** the `client/` (React web) or `server/` (Express) folders.
This is an Android-only rebuild that consumes the *same* backend the web app
uses. The backend is the source of truth and must not be modified.

---

## 1. Backend contract (source of truth — do not change the server)

### Base URLs
- **Production API:** `https://api.hoscore.in/api`
- **Production WebSocket:** `wss://api.hoscore.in/ws?token=<JWT>`
- **Local dev (emulator):** `http://10.0.2.2:5000/api` and `ws://10.0.2.2:5000/ws`
- Provide a build-time/toggle switch between prod and local dev (there is
  already a "Local Dev Environment" switch on the login screen — keep it).

### Auth model — MULTI-CONTEXT (critical)
One identity (email/phone + password) can hold **multiple contexts**. After
login the server returns a session object; the JWT is scoped to ONE active
context and you switch contexts by calling the server (which returns a *new*
token).

**Context types:** `"hospital"`, `"patient"`, `"superadmin"`.

```jsonc
// Session object (returned by POST /auth/login on success, and is the shape
// you persist locally):
{
  "token": "<JWT>",
  "user":  { "id": "...", "name": "...", "email": "...", "isSuperAdmin": false },
  "contexts": [
    { "type": "hospital", "hospitalId": "...", "hospitalName": "...",
      "role": "ADMIN", "department": "...", "permissions": ["dashboard","queue",...],
      "staffTypeId": "...", "staffTypeName": "..." },
    { "type": "patient", "role": "PATIENT" },
    { "type": "superadmin", "role": "SUPER_ADMIN" }
  ],
  "activeContext": { ...one of the above... }
}
```

### Auth endpoints
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | Body `{ "identifier": "<email or phone>", "password": "..." }`. **Success → session object.** If the account requires OTP, returns `200/403` with `{ "requiresOtp": true, "challenge": { "challengeId", "purpose", "channels", "required": {email,phone}, "verified": {email,phone}, "expiresAt", "warnings":[] } }`. |
| POST | `/auth/start-otp-login` | Body `{ "identifier": "..." }` → `{ challenge }`. Passwordless login start. |
| POST | `/auth/verify-otp` | Body `{ "challengeId", "channel": "email"\|"phone", "code": "123456" }`. On full completion returns the **session object** (token+user+contexts+activeContext). Errors: 401 expired/invalid, 429 too many attempts. |
| POST | `/auth/resend-otp` | Body `{ "challengeId", "channel" }` → `{ challenge }`. |
| POST | `/auth/register` | Body per register schema → 201 session object. |
| POST | `/auth/forgot-password` / `/auth/reset-password` | Standard flows. |
| GET  | `/auth/me` | Current identity. Requires `Authorization: Bearer <JWT>`. |
| GET  | `/auth/contexts` | List of contexts for the identity. |
| POST | `/auth/switch-context` | Body `{ "contextType", "hospitalId?" }` → `{ "token": "<new JWT>" }`. **Persist the new token and set active context.** |

**Every authenticated request** must send header `Authorization: Bearer <JWT>`.
On `401` from any endpoint: clear the token and route back to login.

### OTP behavior (MSG91)
The web app uses an MSG91 widget for phone OTP. For **native**, do NOT embed the
web widget. Use the backend-driven flow: `start-otp-login` / `verify-otp` /
`resend-otp` with a native 6-digit OTP entry screen (per-digit boxes, resend
timer, channel switch between email/phone when both are offered).

### Feature gating (critical for the hospital dashboard)
The hospital context carries `permissions: string[]`. **Only show a hospital
feature/screen if its key is in `permissions`** (ADMIN typically has all).
The keys map 1:1 to the API groups below. Feature keys observed:
`dashboard, queue, prescriptions, labs, vitals, discharges, shifts, claims,
expenses, rooms, patients, admissions, billing, doctors, inventory, staff,
staff_types, calendar, notices, leaves, groups, analytics, simulator,
audit_logs, feedback, settings`.

### API surface by context

**Public (no auth):**
- `GET /hospitals`, `GET /hospitals/:id` — public hospital directory/search.
- Payment order/verify endpoints (not needed for v1 native unless doing billing checkout).

**Patient context** (`Bearer` token whose activeContext.type == patient):
- `GET /patient/dashboard`
- `GET /patient/appointments` · `POST /patient/appointments` · `PATCH /patient/appointments/:id/{close|cancel|reschedule}`
- `GET /patient/prescriptions`
- `GET /patient/records`
- `GET /patient/bills`
- `GET /patient/vaccinations` · `POST /patient/vaccinations`
- `GET /patient/dependents` · `POST /patient/dependents`
- `GET /patient/access-grants` · `GET /patient/access-logs` · `POST /patient/access-grants/{revoke|restore}`

**Super-admin context:**
- `GET /super-admin/stats` · `GET /super-admin/usage` · `GET /super-admin/deployment-readiness`
- `GET /super-admin/hospitals` · `PATCH /super-admin/hospitals/:id/toggle`
- `GET /super-admin/users` · `PATCH /super-admin/users/:id/toggle`
- `GET /super-admin/subscriptions`
- `GET|POST|PUT|DELETE /super-admin/staff-types`

**Hospital context** (all `requireFeature`-gated):
- Stats: `GET /stats` → `{ totalPatients, totalRooms, totalBeds, occupiedBeds, occupancyRate, icuOccupancyRate, dischargesThisMonth, telemetry: { activeQueue, pendingLabs, pendingRx, todaysShifts, pendingClaims }, ... }`
- Analytics: `GET /analytics` → `{ occupancyData, admissionsMonthly, revenueData, stayDurationData, departmentRevenue, kpis }`
- Appointments/Calendar: `GET|POST /appointments`, `PATCH /appointments/:id/checkin`, `DELETE /appointments/:id`, schedule defaults/overrides under `/schedules/*`
- Rooms/Beds: `GET|POST /rooms`, `GET /rooms/:id`, `DELETE /rooms/:id`; `GET|POST /beds`, `PATCH /beds/:id/status`, `DELETE /beds/:id`
- Patients: `GET /patients`, `GET /patients/search/:sixDigitId`, `POST /patients`, `GET /patients/:id`, `PUT /patients/:id`, `PATCH /patients/:id/convert-hoscore`, `DELETE /patients/:id`
- Admissions: `GET|POST /admissions`, `PATCH /admissions/:id/discharge`
- Billing: `GET|POST /billing`, `PATCH /billing/:id/status`, `DELETE /billing/:id`
- Doctors: `GET|POST /doctors`, `DELETE /doctors/:id`
- Inventory: `GET|POST /inventory`, `PATCH /inventory/:id/stock`, `DELETE /inventory/:id`
- Staff: `GET|POST /staff`, `DELETE /staff/:id`; Hospital staff invites: `POST /hospitals/invite`, `GET /hospitals/staff`, `PATCH /hospitals/staff/:id`
- Staff Types: `GET|POST|PUT|DELETE /staff-types`, `GET /features` (feature catalog)
- Queue (OPD): `GET|POST /queue`, `PATCH /queue/:id/status`, `DELETE /queue/:id`
- Prescriptions: `GET|POST /prescriptions`, `PATCH /prescriptions/:id/status`, `DELETE /prescriptions/:id`
- Lab Orders: `GET|POST /lab-orders`, `PUT /lab-orders/:id`, `DELETE /lab-orders/:id`
- Vitals: `GET|POST /vitals`, `DELETE /vitals/:id`
- Discharges: `GET|POST /discharges`, `PUT /discharges/:id`, `DELETE /discharges/:id`
- Shifts: `GET|POST /shifts`, `PUT /shifts/:id`, `DELETE /shifts/:id`
- Notices: `GET|POST /notices`, `PUT /notices/:id`, `DELETE /notices/:id`
- Leaves: `GET|POST /leaves`, `PATCH /leaves/:id/status`, `DELETE /leaves/:id`
- Groups: `GET|POST /groups`, `PUT /groups/:id`, `DELETE /groups/:id`, `POST /groups/members`, `DELETE /groups/members/:id`
- Insurance Claims: `GET|POST /insurance`, `PATCH /insurance/:id/status`, `DELETE /insurance/:id`
- Expenses: `GET|POST /expenses`, `PUT /expenses/:id`, `DELETE /expenses/:id`
- Audit Logs: `GET|POST /audit-logs`
- Feedback: `GET|POST /feedback`, `DELETE /feedback/:id`
- Hospital profile: `GET /hospital/current`, `PATCH /hospital/update`, `GET /hospital/usage`
- Subscription/Payments: `GET /payments/plans`, `GET /payments/subscription`, `GET /payments/history`, order/verify/autopay endpoints
- Uploads: `POST /upload/image`, `POST /upload/documents` (multipart), `DELETE /upload/file`

> For any endpoint whose response shape isn't spelled out above, **inspect the
> matching web page** in `client/src/pages/**` (it already consumes the same
> endpoint) to learn the exact JSON fields, then model the Kotlin DTO from that.
> The web pages are your DTO reference. Do not guess field names.

### WebSocket (real-time)
Connect to `wss://api.hoscore.in/ws?token=<JWT>` after login. Messages trigger
refresh of live data (queue, stats, admissions). Reconnect with backoff on
drop. Disconnect on logout/context-switch and reconnect with the new token.

---

## 2. Screen inventory (native, per context)

Build a bottom-nav shell whose tabs **change based on the active context**. A
context switcher (bottom sheet) lets a multi-context identity jump between
hospital / patient / super-admin without re-login (calls `/auth/switch-context`).

### Shared / Auth
1. **Splash** — animated logo, checks stored token → routes to correct home or login.
2. **Login** — identifier + password; "Local Dev" toggle; links to OTP login, forgot password, register.
3. **OTP Verify** — 6-box code entry, channel switch (email/phone), resend timer.
4. **Register** — create identity.
5. **Context Switcher** — bottom sheet listing available contexts with role/hospital labels.

### Patient context (bottom tabs: Home · Appointments · Records · More)
6. **Patient Dashboard** — greeting, next appointment, active prescriptions count, outstanding bills, vaccination status. Real data from `/patient/dashboard`.
7. **My Appointments** — upcoming/past list; book new (`POST /patient/appointments`), cancel/reschedule/close.
8. **Find Hospitals** — search public directory (`GET /hospitals`), open hospital profile, book.
9. **My Prescriptions** — `/patient/prescriptions`.
10. **My Records** — `/patient/records` (documents, downloadable).
11. **My Vaccinations** — list + add (`/patient/vaccinations`).
12. **My Bills** — `/patient/bills`.
13. **Privacy / Access Control** — doctor access grants: view/revoke/restore + access logs.
14. **Dependents** — manage dependents.

### Hospital staff context (bottom tabs: Dashboard · Queue · Patients · More)
Gate each by `permissions`.
15. **Hospital Dashboard** — live KPIs from `/stats` (occupancy, ICU rate, beds, discharges, telemetry), real chart from `/analytics`, quick actions. This is the **flagship screen** — make it beautiful.
16. **OPD Queue** — live queue list, add/update status/remove; updates via WebSocket.
17. **Patients** — searchable list, detail view, create/edit, search by 6-digit ID.
18. **Patient Detail** — profile, admissions, vitals, prescriptions, records tabs.
19. **Admissions** — list, admit, discharge.
20. **Rooms & Beds** — rooms grid, bed status board (available/occupied/maintenance), toggle status.
21. **Prescriptions** — list, create, status.
22. **Lab Orders** — list, create, update.
23. **Vitals** — record & chart trends.
24. **Discharges** — summaries CRUD.
25. **Billing** — invoices list, create, status.
26. **Doctors / Staff / Staff Types** — directories + management.
27. **Inventory** — stock list, low-stock alerts, adjust stock.
28. **Calendar / Schedule** — appointments calendar + doctor schedules.
29. **Shifts** — roster.
30. **Notices** — board.
31. **Leaves** — requests + approve/reject.
32. **Groups** — group + member management.
33. **Insurance Claims** — CRUD + status.
34. **Expenses** — CRUD.
35. **Analytics** — charts (occupancy pie, admissions bar, revenue line, dept revenue, KPI cards).
36. **Audit Logs** — read-only log feed.
37. **Feedback** — list + respond.
38. **Hospital Profile / Settings** — profile edit, usage telemetry, subscription/billing.

### Super-admin context (bottom tabs: Overview · Hospitals · Users · More)
39. **Super Admin Dashboard** — global stats, deployment readiness, usage.
40. **Manage Hospitals** — list, toggle active/suspended.
41. **Manage Users** — list, toggle status.
42. **Manage Subscriptions** — list.
43. **Global Staff Types** — CRUD.
44. **Usage & Billing** — telemetry.

> **Priority order for delivery:** (1) Auth + Splash + context shell, (2) Patient
> flow end-to-end, (3) Hospital Dashboard flagship + Queue + Patients, (4) the
> rest of hospital screens, (5) super-admin. Ship each vertically (UI + real
> data wired) before moving on — never leave a screen with placeholder data.

---

## 3. Design system — make it STUNNING (this is the whole point)

The rebuild must look like a premium 2025 product. Mirror the web client's
visual language (defined in `client/src/index.css`) so web and native feel like
one product, but execute it natively.

### Typography
- Primary font: **Plus Jakarta Sans** (bundle as a downloadable/Compose font
  resource). Weights 300–800. Numbers/metrics may use **JetBrains Mono**.
- Type scale: large bold display for metrics (28–34sp, `FontWeight.Black`),
  16sp black section titles, 13–14sp body, 10–11sp uppercase labels with
  `letterSpacing`.

### Color tokens (light / dark) — port exactly from web
```
PRIMARY (brand blue):   #2563EB   (dark variant #3B82F6)
Accent cyan:            #0EA5E9 / #38BDF8
Accent teal:            #0D9488 / #14B8A6
Accent emerald:         #10B981
Clinical/emergency red: #E11D48 (use sparingly — emergencies/critical CTAs)

LIGHT: bg #FAFAFA · card #FFFFFF · card-border #EAEAEA · text #000000 ·
       text-secondary #666666 · text-muted #888888 · inner-bg #FAFAFA
DARK:  bg #000000 · card #0A0A0A · card-border #1F1F1F · text #FFFFFF ·
       text-secondary #888888 · text-muted #666666 · inner-bg #000000
```
Build a proper Material 3 `ColorScheme` + a custom `HoscoreTheme` extension
(`LocalHoscorePalette`) exposing these tokens. Support **light AND dark** with a
persisted user toggle (default follows system).

### Visual style rules
- **Cards:** rounded 14–20dp corners, 1dp hairline border in `card-border`,
  soft shadow (elevation 2–8dp), generous padding (16–20dp). Subtle glass/tint
  feel; hover/press → lift + border emphasis.
- **Hero/metric cards:** linear-gradient backgrounds (brand blue → darker),
  white text, an amber (`#FCD34D`) accent for the headline value.
- **Backgrounds:** off-black/off-white with faint radial gradient glows in the
  brand colors at the corners (mirror web `body:has(.dashboard-theme)`).
- **Charts:** use a real charting lib (Vico or compose charts, or hand-rolled
  Canvas) fed by live `/analytics` + `/stats` data — rounded bar charts, line
  charts, donut occupancy. No fake data.
- **Motion:** `fadeInUp` staggered entrances for lists/cards, animated Live
  indicator pulse dot, `Crossfade`/shared-element between tabs, skeleton
  shimmer loaders while fetching, smooth 300ms theme transition.
- **Bottom nav:** floating rounded pill bar (24dp radius) elevated off the
  bottom edge, center FAB for the primary context action, active tab tinted
  brand color. (The current app already sketches this — do it properly.)
- **Empty / error / loading states** for EVERY screen: shimmer skeletons on
  load, friendly empty illustrations, retry on error, offline banner.
- **Accessibility:** content descriptions, ≥48dp touch targets, dynamic type,
  sufficient contrast in both themes.
- App icon + splash: refine the existing `ic_launcher_foreground` into a clean
  modern medical mark; branded splash with the HOSCORE wordmark.

---

## 4. Architecture & tech

- **Language/UI:** Kotlin, Jetpack Compose, Material 3. minSdk 24, targetSdk 36,
  JDK 17 (matches current `build.gradle.kts`).
- **Pattern:** MVVM + a light Clean-ish layering:
  `ui/` (Compose screens + `ViewModel`s with `StateFlow<UiState>`),
  `domain/` (models + repository interfaces),
  `data/` (Retrofit services, DTOs, repositories, DataStore).
- **DI:** Hilt.
- **Networking:** Retrofit + OkHttp + `kotlinx.serialization` (converter). An
  OkHttp `Interceptor` injects `Authorization: Bearer` from the token store and
  centralizes 401 → logout. Keep the existing OkHttp dependency; add Retrofit.
- **Real-time:** OkHttp `WebSocket` (already present) wrapped in a repository
  exposing a `Flow` of events.
- **Token storage:** keep **EncryptedSharedPreferences** (already used) OR move
  to encrypted DataStore — store JWT, user, contexts, activeContext securely.
- **Async:** Coroutines + Flow. One `Resource<T>` (`Loading/Success/Error`)
  wrapper for all data.
- **Navigation:** Navigation-Compose (or keep Navigation3 already in the
  project) with a nested graph per context and a top-level auth graph.
- **Config:** enable `buildConfig`; put base URLs in build config + a runtime
  dev/prod switch. Add `INTERNET` permission (already in manifest — verify).
- **Testing:** ViewModel unit tests for the auth + dashboard flows; a couple of
  Compose UI tests for the login and dashboard.
- **Quality:** no God-files. `MainScreen.kt` (1790 lines of mock UI) must be
  **deleted** and replaced by the real feature packages. Organize by feature:
  `feature/auth`, `feature/patient/dashboard`, `feature/hospital/queue`, etc.

### Suggested package layout
```
com.example.hoscore/
  app/            (Application, Hilt module, Nav host, theme)
  core/
    network/      (Retrofit, OkHttp, interceptors, WebSocket)
    auth/         (TokenStore, SessionManager, context switching)
    ui/           (design system: theme, palette, reusable components:
                   HoscoreCard, MetricCard, GradientHeroCard, SectionTitle,
                   ShimmerBox, EmptyState, ErrorState, PillBottomBar, Charts)
    model/        (shared DTOs: Session, User, ContextItem)
  feature/
    auth/ patient/ hospital/ superadmin/  (each: ui + viewmodel + data)
```

---

## 5. Concrete first steps

1. Read `android/app/build.gradle.kts`, `gradle/libs.versions.toml`,
   `AndroidManifest.xml`, and the existing `NetworkManager.kt` to reuse what
   works (token encryption, endpoint switching, WS).
2. Read `client/src/pages/**` and `client/src/index.css` for exact API response
   shapes and the visual language you are matching.
3. Add deps: Retrofit, kotlinx-serialization-converter, Hilt, DataStore,
   coil (images), a charts lib (Vico), Compose fonts. Update `libs.versions.toml`.
4. Build the **design system package first** (theme, palette, reusable
   components, shimmer/empty/error). Everything else composes from it.
5. Build **auth end-to-end** against the live API (login → OTP → session →
   context routing) and verify a real login works.
6. Then build screens in the priority order in §2, each fully wired to live
   data before moving on.

---

## 6. Acceptance bar (definition of done)

- [ ] No `WebView` anywhere. No hardcoded/mock data. Every list and metric comes
      from the live API.
- [ ] Login (password + OTP), context switching, and 401-logout all work
      against `https://api.hoscore.in`.
- [ ] Hospital feature screens respect the `permissions` array (hidden when not
      permitted).
- [ ] All three contexts (patient, hospital, super-admin) are navigable with
      their real screens.
- [ ] Light + dark themes, both looking polished; smooth transitions.
- [ ] Every screen has loading (shimmer), empty, and error states.
- [ ] Real charts fed by `/stats` and `/analytics`.
- [ ] App builds release, no God-files, organized by feature, ViewModels tested
      for auth + dashboard.
- [ ] The result looks like a premium shipping product, not a prototype.

**Do not** modify `client/` or `server/`. **Do not** invent API fields — derive
them from the web pages that already call the same endpoints.
