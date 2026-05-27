# Implementation Plan (per flow.md)

## Philosophy
- Reuse existing pages aggressively (rule #4)
- Adapt Microsoft Forms features INTO current architecture (rule #5)
- No new sidebar nav items — enhance Forms Overview as the hub (rule #3)
- Ship practical features first, not perfect architecture (rule #6)

---

## 1. TOTP Authentication (Microsoft Authenticator)

**Files to create/modify:**
- `server/auth/totp.ts` (new) — TOTP generation + verification using `otplib`
- `server/auth/auth.ts` — add `totpSecret` field to user document type
- `app/api/auth/login/route.ts` — after password verification, require TOTP if user has `totpSecret`
- `app/api/auth/verify-totp/route.ts` (new) — verify TOTP code and issue session
- `app/(auth)/login/page.tsx` — add TOTP step after password (3-stage: username → password → TOTP)
- `app/(auth)/security/page.tsx` or settings — TOTP setup page (generate secret, QR code, verify)
- `package.json` — add `otplib` and `qrcode` dependencies

**Flow:**
1. User enters username → submits
2. Server responds `{ step: "password" }` if user exists
3. User enters password → submits
4. Server verifies password, responds `{ step: "totp" }` with `totpSession` (signed temp token)
5. User enters 6-digit TOTP code → submits to `/api/auth/verify-totp`
6. Server verifies code, issues final `qr_session` JWT cookie, redirects

**For users without TOTP configured:** skip step 4-5, issue session directly after password.

---

## 2. Form Settings (Microsoft-Forms-Style)

**Files to create/modify:**
- `lib/shared/form-settings.ts` (new) — type definitions + default settings for form toggles
- `app/api/form-settings/route.ts` (new) — CRUD for per-project form settings
- `app/(admin)/form-builder/page.tsx` — add Form Settings panel/accordion below field list
- `app/(admin)/dashboard/forms-overview/page.tsx` — show settings summary per project

**Settings toggles (per project):**
- `acceptResponses` (boolean, default true)
- `startDate` / `endDate` (ISO date string, optional)
- `shuffleQuestions` (boolean, default false)
- `disableQuestionNumbering` (boolean, default false)
- `showProgressBar` (boolean, default false)
- `emailNotificationForEachResponse` (boolean, default false)
- `hideSubmitAnotherResponse` (boolean, default false)
- `customThankYouMessage` (string, optional)
- `allowRespondentsToEditResponses` (boolean, default true)
- `allowRespondentsToSaveResponses` (boolean, default true)

**Storage:** New MongoDB collection `form_settings` keyed by `projectName`.

---

## 3. Forms Overview → Main Microsoft-Forms Hub

**Files to modify:**
- `app/(admin)/dashboard/forms-overview/page.tsx` — major rewrite

**New sections within Forms Overview:**

### Form Management (top row)
- Each project card gets action buttons: Create New | Edit | Duplicate | Delete | Settings gear
- "Create New Form" opens form builder for a new/blank project
- "Duplicate" copies a project's form config to a new project name

### Collect Responses (per project)
- "Anyone can respond" toggle
- Shorten URL
- Copy link button
- Invitation preview panel: "You are invited to take this: [Form title]" + custom invite message + "Start now" button

### View Responses (per project)
- Response overview cards row: Active, Responses count, Average completion time, Duration
- Question analytics panel: each question with option counts
- Export buttons: "Open in Excel Desktop", "Download copy"
- Admin can edit responses field-by-field

### Preview
- Desktop / Mobile toggle
- Renders form in preview iframe or simulated viewport

---

## 4. Form Builder Enhancements

**Files to modify:**
- `app/(admin)/form-builder/page.tsx`
- `lib/shared/form-storage.ts`

**Additions:**
- Form title field (separate from project name)
- "Saved" / "Unsaved" status indicator
- Last saved timestamp
- Visual indicators for unsaved changes (dirty state)

---

## 5. Post-Submission Experience

**Files to modify:**
- `app/(facilitator)/f/submit-report/page.tsx`
- `app/(coordinator)/submit-report/page.tsx`

**Changes:**
- After successful submission, show "Your response was submitted" screen instead of redirecting
- Buttons: "Save my response" (download local copy), "Submit another response"
- Behavior respects form settings (`hideSubmitAnotherResponse`, `allowRespondentsToEditResponses`, `customThankYouMessage`)

---

## 6. My Reports — Edit Submitted Responses

**Files to modify:**
- `app/api/reports/[id]/route.ts` — PATCH to allow field-by-field editing
- `app/(facilitator)/f/report/[id]/page.tsx` — add edit mode
- `app/(coordinator)/report/[id]/page.tsx` — add edit mode
- `app/(admin)/dashboard/forms-overview/page.tsx` — admin edit mode in View Responses

**Rules:**
- Editing enabled by default
- Admin can restrict via form setting `allowRespondentsToEditResponses`
- Admin can always edit any response (from View Responses)

---

## 7. Auto Form Link Sending

**Files to modify:**
- Reuse `email_campaigns` / `reporting_cycles` infrastructure (already exists)

**Lightweight addition:**
- The existing Email Campaigns + Reporting Cycles system already handles this
- No new pages — just ensure the existing cycle-based email sends include the correct form link

---

## Implementation Order

1. **TOTP Authentication** (security-critical, changes login flow)
2. **Form Settings** (needed by Forms Overview and submit forms)
3. **Forms Overview → Hub** (the main visible change)
4. **Form Builder enhancements** (title, save status)
5. **Post-submission experience** (affects all users)
6. **My Reports edit** (dependent on form settings)
7. **Auto form link sending** (already mostly built)
