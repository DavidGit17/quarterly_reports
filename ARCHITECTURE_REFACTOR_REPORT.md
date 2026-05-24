# Architecture Refactor Report

## Summary

The project has been reorganized into explicit ownership areas while preserving existing Next.js routes and runtime behavior.

The refactor uses Next.js route groups so public URLs remain unchanged:

- `/dashboard`
- `/form-builder`
- `/form/[project]`
- `/my-reports`
- `/report/[id]`
- `/login`
- `/signup`
- `/profile`
- all existing `/api/*` routes

## Old Structure

Before the refactor, ownership was mixed across root-level folders:

```txt
app/
  admin/
  dashboard/
  form/
  form-builder/
  login/
  signup/
  my-reports/
  report/
  profile/
components/
  dashboard/
  ui/
hooks/
lib/
```

This made it difficult to quickly identify whether a file belonged to admin, coordinator, shared UI, or backend/server logic.

## New Structure

```txt
app/
  (admin)/
    admin/
    dashboard/
    form-builder/
  (auth)/
    forgot-password/
    login/
    security/
    signup/
    verify-otp/
  (coordinator)/
    form/
    my-reports/
    report/
    select/
    submit-report/
  (shared)/
    page.tsx
    profile/
  api/
components/
  admin/
    dashboard/
  coordinator/
  shared/
  ui/
hooks/
  shared/
lib/
  shared/
server/
  auth/
  db/
  email/
  forms/
  reports/
  utils/
```

## What Moved

### Admin Ownership

Moved admin-facing routes into `app/(admin)/`:

- `app/dashboard/*` -> `app/(admin)/dashboard/*`
- `app/admin/*` -> `app/(admin)/admin/*`
- `app/form-builder/*` -> `app/(admin)/form-builder/*`

Moved admin dashboard components:

- `components/dashboard/*` -> `components/admin/dashboard/*`

Moved admin mock data:

- `lib/mock-data.ts` -> `components/admin/dashboard/mock-data.ts`

### Coordinator Ownership

Moved coordinator-facing routes into `app/(coordinator)/`:

- `app/form/*` -> `app/(coordinator)/form/*`
- `app/my-reports/*` -> `app/(coordinator)/my-reports/*`
- `app/report/*` -> `app/(coordinator)/report/*`
- `app/select/*` -> `app/(coordinator)/select/*`
- `app/submit-report/*` -> `app/(coordinator)/submit-report/*`

`components/coordinator/` has been created for future coordinator-specific component extraction.

### Auth Ownership

Moved auth/access routes into `app/(auth)/`:

- `app/login/*` -> `app/(auth)/login/*`
- `app/signup/*` -> `app/(auth)/signup/*`
- `app/forgot-password/*` -> `app/(auth)/forgot-password/*`
- `app/verify-otp/*` -> `app/(auth)/verify-otp/*`
- `app/security/*` -> `app/(auth)/security/*`

### Shared Ownership

Moved shared routes into `app/(shared)/`:

- `app/page.tsx` -> `app/(shared)/page.tsx`
- `app/profile/*` -> `app/(shared)/profile/*`

Moved shared utilities:

- `lib/form-storage.ts` -> `lib/shared/form-storage.ts`
- `lib/date-format.ts` -> `lib/shared/date-format.ts`
- `lib/utils.ts` -> `lib/shared/utils.ts`
- `lib/session.ts` -> `lib/shared/session.ts`

Moved shared hooks:

- `hooks/use-mobile.ts` -> `hooks/shared/use-mobile.ts`
- `hooks/use-toast.ts` -> `hooks/shared/use-toast.ts`

Moved shared provider:

- `components/theme-provider.tsx` -> `components/shared/theme-provider.tsx`

### Server Ownership

Moved backend/server modules into `server/`:

- `lib/auth.ts` -> `server/auth/auth.ts`
- `lib/jwt.ts` -> `server/auth/jwt.ts`
- `lib/mongodb.ts` -> `server/db/mongodb.ts`
- `lib/brevoEmail.ts` -> `server/email/brevo-email.ts`
- `lib/form-configs-db.ts` -> `server/forms/form-configs-db.ts`
- `lib/reports.ts` -> `server/reports/reports.ts`

API route handlers remain in `app/api/*` to respect Next.js conventions, but now import backend logic from `server/*`.

## Import Repairs

Updated imports across the codebase:

- `@/components/dashboard/*` -> `@/components/admin/dashboard/*`
- `@/hooks/use-toast` -> `@/hooks/shared/use-toast`
- `@/hooks/use-mobile` -> `@/hooks/shared/use-mobile`
- `@/lib/form-storage` -> `@/lib/shared/form-storage`
- `@/lib/date-format` -> `@/lib/shared/date-format`
- `@/lib/utils` -> `@/lib/shared/utils`
- `@/lib/mock-data` -> `@/components/admin/dashboard/mock-data`
- `@/lib/auth` -> `@/server/auth/auth`
- `@/lib/jwt` -> `@/server/auth/jwt`
- `@/lib/mongodb` -> `@/server/db/mongodb`
- `@/lib/brevoEmail` -> `@/server/email/brevo-email`
- `@/lib/form-configs-db` -> `@/server/forms/form-configs-db`
- `@/lib/reports` -> `@/server/reports/reports`

## Cleanup Decisions

- Kept Next.js framework filenames (`page.tsx`, `layout.tsx`, `route.ts`) intact.
- Used route groups instead of changing route URLs.
- Kept `app/api/*` in place because Next.js requires API route handlers there.
- Preserved duplicate public admin routes `/admin/form-builder`, `/admin/forms-overview`, `/form-builder`, and `/dashboard/forms-overview` because the files currently differ and removing either path could change behavior.
- Left `components/ui/*` as the shared primitive design-system layer.
- Left `components/coordinator/` empty for now; coordinator UI is currently page-local and can be extracted incrementally later.
- Left `server/utils/` empty for future server-only helpers.

## Validation

Completed successfully:

```txt
npm run lint
npx tsc --noEmit --pretty false
npm run build
```

Build note:

- The first non-escalated build failed because the sandbox blocked Google font fetches used by `next/font`.
- The escalated production build completed successfully.

## Outstanding Recommendations

- Compare the two form builder routes and decide whether `/admin/form-builder` and `/form-builder` should remain separate experiences or be consolidated.
- Compare `/admin/forms-overview` and `/dashboard/forms-overview` for the same reason.
- Consider extracting large coordinator page-local UI blocks into `components/coordinator/` after behavior stabilizes.
- Consider deleting unused legacy UI hook aliases in `components/ui/use-toast.ts` and `components/ui/use-mobile.ts` after confirming no external import path depends on them.
