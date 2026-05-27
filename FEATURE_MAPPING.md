# Feature Mapping: Microsoft Forms → Current System

## Guiding principle
Do NOT force a standalone Microsoft Forms builder interface. Adapt useful features into the CURRENT project-centric workflow and UI patterns. Reuse existing pages whenever practical.

---

## A. PROJECT SETTINGS PAGE

**Current state:** No project settings page exists. Projects have `{ name, description, languages, status, createdAt }` in the `projects` collection. Form configs (fields, quarters) are managed separately in the form builder.

| Feature | Proposed Location | DB Changes | API Changes | UI Changes |
|---------|-----------------|------------|-------------|------------|
| **Accept responses toggle** | New section on `/dashboard/projects` edit dialog | Add `acceptingResponses: boolean` to `projects` collection | Extend PATCH `/api/projects` to accept `acceptingResponses` | Toggle in edit dialog; form page checks before accepting submission |
| **Active/inactive forms** | ✅ Already exists as `project.status` | None | None | None needed |
| **Start/end availability** | Phase 4 — optional enhancement | Add `formOpensAt?: Date`, `formClosesAt?: Date` to projects | Extend PATCH `/api/projects`; validate in POST `/api/reports` | Date pickers |
| **Quarter scheduling** | ❌ REMOVED — use ONLY `reporting_cycles` collection instead | None | None | None |
| **Reminder settings** | Phase 2 — part of email campaign system | Part of `email_campaigns` collection | Part of campaign API | Campaign form |
| **Allow edits after submission** | Phase 4 — optional | Add `allowEditsAfterSubmission: boolean` to projects | Extend PATCH `/api/projects` | Toggle |
| **Save progress (drafts)** | Phase 4 — Phase 1: localStorage only; Phase 2: server sync | Phase 1: no DB changes | Phase 1: none | localStorage auto-save on field change |
| **Thank-you message** | Phase 4 — optional | Add `submissionMessage: string` to projects | Extend PATCH `/api/projects` | Text editor; rendered in success popup |
| **Notification settings** | Phase 4 — optional | Add `notifications` subdoc to projects | Extend PATCH `/api/projects` | Toggles |

---

## B. FORM EDITOR / CUSTOM FIELDS PAGE

**Current state:** Form builder at `/form-builder` with field reordering, type selection, required toggle. Preview via `/form/{projectSlug}`.

| Feature | Proposed Location | DB Changes | API Changes | UI Changes |
|---------|-----------------|------------|-------------|------------|
| **Field ordering** | ✅ Already exists | None | None | None |
| **Question numbering toggle** | Phase 4 — optional | Add `showNumbering: boolean` to project config | Extend form-configs API | Toggle |
| **Shuffle option** | ❌ LOW PRIORITY — structured reporting, not surveys | None | None | None |
| **Required fields** | ✅ Already exists | None | None | None |
| **Preview mode** | Phase 4 — optional | None | None | Preview overlay in form builder |
| **Duplicate form/project config** | Phase 4 — optional | None | No new API | Button in form builder |
| **Prefilled links** | Phase 4 — optional | None | Modify GET form rendering | URL params for prefill |

---

## C. RESPONSE DASHBOARD

**Current state:** Admin reports page (`/dashboard/reports`) shows a table of all reports with pagination, filtering, per-row actions. No analytics, no completion metrics, no per-field breakdowns.

| Feature | Proposed Location | DB Changes | API Changes | UI Changes |
|---------|-----------------|------------|-------------|------------|
| **Response overview** | ✅ Already exists via stat cards | None | None | Minor: project-by-project cards |
| **Analytics / completion metrics** | Phase 3 — computed dynamically from users + reports | **No `expectedSubmissions` field** — derive from user assignments per project + role | New `GET /api/reports/analytics` endpoint | Progress bars per project/cycle |
| **Per-field analytics** | Phase 3 — drill-down from reports | None | New `GET /api/reports/field-analytics` | Tabular breakdown |
| **Individual responses** | ✅ Already exists via `/report/{id}` | None | None | None |
| **Export** | Phase 3 — streaming all pages | None | New `GET /api/reports/export` endpoint | "Export All" button |
| **Print summary** | Phase 4 — CSS print styles | None | None | `@media print` styles |

---

## D. EMAIL / DISTRIBUTION MODULE

**Current state:** Only OTP emails and welcome emails. No bulk sending, no scheduling, no reminders.

**Scheduling mechanism:** **Vercel Cron Jobs** — serverless `POST /api/cron/*` endpoints with standard cron syntax. Native to the stack, no infrastructure. Phase 2.

| Feature | Proposed Location | DB Changes | API Changes | UI Changes |
|---------|-----------------|------------|-------------|------------|
| **Share links** | Phase 2 — button on project edit dialog / forms overview | None | None | "Copy Form Link" button |
| **Scheduled sends** (at cycle start) | Phase 2 — admin page `/dashboard/email-campaigns` | New `email_campaigns` collection | New CRUD API + Vercel Cron endpoint `POST /api/cron/process-campaigns` | Campaign creation form; campaign list |
| **Reminder emails** | Phase 2 — same campaign system | Same collection | Extend campaign API | "Add Reminder" option |
| **Recipient targeting** | Phase 2 — select by role + project | Already in user documents | `GET /api/users?role=X` already exists | Multi-select UI; show recipient count |
| **Email templates** | Phase 2 — new collection | New `email_templates` collection | New CRUD API | Template editor |

---

## E. QUARTER-BASED REPORTING AUTOMATION (Phase 1 — NOW)

**Current state:** Static quarter date ranges stored as `quarter-configs` JSON blob in `form_configs`. No automation. No cycle enforcement. No automatic submission tracking.

**Use ONLY `reporting_cycles` collection.** Do NOT duplicate quarter logic on projects.

| Feature | Proposed Location | DB Changes | API Changes | UI Changes |
|---------|-----------------|------------|-------------|------------|
| **Reporting cycles** (replace static quarters) | New `reporting_cycles` MongoDB collection | New collection: `{ name, startDate: Date, endDate: Date, linkedProjects: string[], targetRoles: string[], reminderSchedule: string, status: "upcoming"\|"active"\|"closed", createdAt: Date }` | CRUD: `GET/POST/PATCH/DELETE /api/reporting-cycles` | Admin page `/dashboard/reporting-cycles` — list, create, edit cycles; status badges |
| **Cycle-based form access** | Form page checks active cycle | None | `GET /api/reporting-cycles?status=active` | If no active cycle, show "No active reporting period" |
| **Submission tracking per cycle** | Link reports to cycle | Add `cycleId: ObjectId?` to report documents | Update `POST /api/reports` to accept `cycleId`; filter reports by cycle in GET | Cycle filter in reports page |
| **Completion tracking** | Phase 3 — computed from user assignments per project role | **No `expectedSubmissions` field** — derive counts from users collection | `GET /api/reporting-cycles/{id}/stats` compares submitted reports vs assigned users | Progress bars per cycle on dashboard |
| **Admin monitoring dashboard** | Phase 3 | None | Same stats endpoint | Table: project → user → submitted status for active cycle |

---

## Implementation Phases

### Phase 1 (NOW): Reporting Cycles
- `reporting_cycles` collection + indexes
- CRUD API + admin page
- Cycle-linked submissions (`cycleId` on reports)
- Cycle-based form access (form page checks for active cycle)
- Cycle filter in reports page

### Phase 2: Email Automation + Reminders
- Vercel Cron Jobs for scheduling
- `email_campaigns` collection + CRUD
- Share links, scheduled sends, reminders
- Recipient targeting by role/project

### Phase 3: Analytics + Dashboard
- Analytics API endpoint (computed from users + reports)
- Completion metrics (derive from assignments, not stored counts)
- Per-field analytics
- Export (all pages)

### Phase 4: Enhancements (Optional)
- localStorage drafts (no server sync in Phase 1)
- Preview overlay in form builder
- Form open/close dates on projects
- Allow edits after submission
- Thank-you message customization
- Question numbering toggle
- Duplicate form config
- Prefilled links
- Print summary CSS

---

## What NOT to implement

- Standalone Microsoft Forms-like builder (form builder already exists)
- Anonymous responses (all users authenticated with roles)
- Quiz mode / correct answers
- Mobile app (web app is responsive)
- Offline support
- Embedding forms externally
- Shuffle option (structured reporting, not surveys)
- `expectedSubmissions` stored field (compute from assignments)
- `quarterConfig` on projects (use `reporting_cycles` only)
- Collaborator/editor permission model (keep current role model)

---

## Scheduling Mechanism
**Vercel Cron Jobs** (`POST /api/cron/*`) — serverless, standard cron syntax, native to the Next.js/Vercel stack. Used for cycle activation/deactivation and email dispatch in Phase 2.

---

## Operational Policies

### 1. Overlapping Active Cycles
**Rule:** At most one active cycle may exist for any given (project × target role) combination with overlapping date ranges.

**Enforcement (API-level):**
- `POST` / `PATCH /api/reporting-cycles` checks: if the new/updated cycle has `status: "active"` and `linkedProjects.length > 0`, query for any existing active cycle whose `linkedProjects` intersects with the new set.
- If found AND date ranges overlap (`newStart < existingEnd AND newEnd > existingStart`), reject with 409 + message naming the conflicting cycle.
- Non-overlapping date ranges for the same project are allowed (e.g., Q1 Jan–Mar, Q2 Apr–Jun).
- Upcoming or closed cycles don't trigger this check.

### 2. Timezone Handling
All cycle dates (`startDate`, `endDate`) are **stored as UTC `Date` objects in MongoDB**. Comparisons use `new Date()` which is UTC-native.

- `<input type="date">` in the browser sends dates in the format `YYYY-MM-DD` which `new Date()` interprets as UTC midnight.
- The `hasOverlap()` helper compares `Date` objects directly (millisecond timestamps, UTC).
- No timezone conversion is performed or needed — all date boundaries are treated as UTC midnight.
- Future enhancement: if explicit timezone support is needed, add a `timezone: string` field to the cycle document (e.g., `"America/New_York"`).

### 3. Submission / History Behavior on Cycle End
When a cycle transitions to `"closed"` status:
- **Existing submissions remain fully viewable** in `/my-reports`, `/f/my-reports`, and `/dashboard/reports`.
- Reports are stored independently with their own `cycleId` reference — cycle closure does not cascade to reports.
- The form page (`/form/{projectSlug}`) will show "No Active Reporting Period" if no active cycle is linked to the project, preventing new submissions.
- History/filtering by cycle still works via the cycle filter dropdown.

### 4. Query / Index Strategy
For the coordinator/facilitator form page lookup:
1. Form page requests `GET /api/reporting-cycles?status=active&project={projectName}`.
2. The API builds `query = { status: "active", linkedProjects: projectName }` (MongoDB matches `linkedProjects` as an exact value in the array when queried with a string).
3. Index used: **`cycles_status_linked_projects_idx`** on `{ status: 1, linkedProjects: 1 }` — covers this query efficiently.
4. The index also covers the overlap check queries (`status: "active", linkedProjects: { $in: [...] }`).

Additional indexes:
- `cycles_created_at_desc_idx` on `{ createdAt: -1 }` — for the admin listing.

### 5. Report Lifecycle States
Current states (already in use):
| State | Description |
|-------|-------------|
| `draft` | Not yet submitted; auto-saved progress |
| `submitted` | Report submitted, awaiting review |
| `approval-pending` | Under review by approver |
| `approved` | Reviewed and accepted |
| `rejected` | Reviewed and sent back |

Planned states for Phase 3 (completion tracking):
| State | Description |
|-------|-------------|
| **Not Started** | Computed — user is assigned to a project in an active cycle but has not submitted any report for that cycle |
| **Overdue** | Computed — active cycle's `endDate` has passed and the user has not submitted |
| **In Progress** | Computed — draft exists for the user/cycle/project combination (Phase 4, localStorage draft) |

These computed states will NOT be stored in the database. They will be derived dynamically in the analytics/completion endpoint by comparing reports, users, and cycle data.
