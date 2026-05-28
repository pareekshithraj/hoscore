# HOSCORE QA Checklist

Use this checklist before promoting a build to staging or production.

## Super Admin Portal

- Sign in as `admin@hoscore.com`.
- Open `/super-admin/usage` and confirm Neon storage, R2 storage, estimated costs, hospital count, and active user count render.
- Open `/super-admin/staff-types` and confirm global presets load.
- Edit a global preset, save it, and confirm the updated feature count persists after refresh.
- Deactivate a test preset and confirm it is not assignable by hospital admins.

## Hospital Admin Portal

- Sign in as `sarah@hoscore.com`.
- Open `/dashboard/staff-types` and confirm global presets are read-only.
- Create a custom hospital staff type with a limited feature set.
- Open `/dashboard/staff`, create a portal login using the custom staff type, and confirm it appears in Portal Access Accounts.
- Edit that staff account and override individual feature permissions.
- Confirm sidebar visibility changes after signing in as that staff user.

## Non-HOSCORE Manual Patient Flow

- Open `/dashboard/patients`.
- Register a patient with `Register as non-HOSCORE walk-in patient` enabled.
- Confirm the patient row shows a manual walk-in identity instead of a HOSCORE ID.
- Open the patient detail page and confirm the manual-care warning appears.
- Convert the patient to a HOSCORE user and confirm a six-digit HOSCORE ID is generated.

## OPD And Doctor Workflow

- Open `/dashboard/queue`.
- Add a queue token with non-HOSCORE/manual patient enabled.
- Select the token and confirm the manual-care warning is visible.
- Sign in as a doctor and confirm the doctor can see the manual-care indicator when the token is called.
- Complete the token and confirm the status changes without requiring patient app usage.

## Patient Portal Regression

- Sign in as `patient@hoscore.com`.
- Confirm dashboard, appointments, prescriptions, records, bills, and hospital search still load.
- Confirm patient routes do not show hospital staff controls.

## Security And Access Control

- Confirm a nurse cannot access Settings, Staff Types, Billing, Analytics, or Super Admin routes through the sidebar.
- Manually visit restricted URLs and confirm API responses return forbidden instead of data.
- Confirm audit logs record staff type, staff access, manual patient, queue, schedule, notice, leave, and group changes.

## Build Verification

- Run `npm run build`.
- Run `npm run lint --prefix client`.
- Run `npm audit --prefix client --audit-level=high`.
- Run `npm audit --prefix server --audit-level=high`.
- Run `npx prisma validate --schema prisma\schema.prisma` from the `server` directory.
