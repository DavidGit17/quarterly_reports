# Current System Workflow Audit

## 1. Project Creation Flow

### Overview
Projects are created via the admin dashboard at `/dashboard/projects`. The flow was recently migrated from mock client-side state to MongoDB-backed persistence via a new `/api/projects` REST API.

### Step-by-step

1. **Admin navigates to `/dashboard/projects`**
   - Page loads with `loading=true`, fetches `GET /api/projects`
   - Server-side: `requireAdmin()` → reads `qr_session` JWT cookie, verifies HS256 signature, looks up user by `_id` in MongoDB `users` collection, checks `role === "admin"` and `status === "active"`
   - Returns 401 (no cookie), 403 (inactive/not admin), or the `SessionUser`
   - Then `collection.find({}).sort({ nameLower: 1 }).toArray()` returns all projects

2. **Admin clicks "Create Project"**
   - `openCreateProject()` resets the form draft and opens `ProjectFormDialog`
   - Form fields: **Project Name** (text), **Description** (textarea), **Languages** (comma-separated text), **Status** (select: active/inactive/pending)

3. **Admin fills form and clicks "Create Project"**
   - Client-side validation: name must be non-empty, at least one language required (silent return on failure — no error shown)
   - `POST /api/projects` with `{ name, description, languages: string[], status }`
   - Server-side: validates name required, checks `nameLower` uniqueness (case-insensitive), inserts document with `createdAt: Date()`
   - Returns 201 with `{ project: { id, name, description, languages, status, createdDate } }`

4. **Page re-fetches project list** and re-renders the table + summary cards

### Storage
- MongoDB collection: `projects`
- Document shape: `{ name, nameLower, description, languages: string[], status, createdAt: Date }`
- Project `id` is the MongoDB ObjectId string

### Architectural gap
Projects created via this admin UI exist ONLY in the `projects` collection. They are NOT connected to the quarterly-report form system, which maintains its own hardcoded list of 7 project names (`COORDINATOR_PROJECT_OPTIONS` in `lib/shared/form-storage.ts`). The form-configs system actively prunes unknown projects from localStorage.

### Key files
| File | Role |
|------|------|
| `app/api/projects/route.ts` | REST API (GET, POST, PATCH, DELETE) |
| `app/(admin)/dashboard/projects/page.tsx` | Client page with state, fetch, dialogs |
| `components/admin/dashboard/projects/project-form-dialog.tsx` | Create/Edit dialog |
| `components/admin/dashboard/projects/projects-table.tsx` | Table listing with actions |
| `components/admin/dashboard/mock-data.ts` | `Project` interface definition |
| `lib/shared/form-storage.ts` | Hardcoded `COORDINATOR_PROJECT_OPTIONS` (7 projects) |

---

## 2. Form Editing Flow

### Overview
Forms are configured at `/form-builder` (admin only). This is the "form builder" — a full-page editor where admins define fields that coordinators/facilitators fill out when submitting quarterly reports.

### How it works
1. Admin navigates to `/form-builder`
2. Page loads form configs via `getHydratedFormState()`:
   - Reads from `localStorage` (keys: `project-default-form-fields`, `project-form-configs`, `project-form-quarters`)
   - Fetches `GET /api/form-configs` (MongoDB `form_configs` collection) — if available, overwrites localStorage
   - Builds merged config via `buildFormConfigs(defaultFields, customConfigs)`
3. Admin selects a project from dropdown (deduplicated union of 7 hardcoded projects + any projects in custom configs)
4. Admin edits fields:
   - **Default fields** (27 shared fields): Can reorder, edit labels, change type, toggle required, delete
   - **Custom fields** (per project): Same operations, stored separately
5. Admin clicks "Save" → writes to localStorage + pushes to MongoDB API via 3 parallel `PUT /api/form-configs` calls

### Key concepts
- **Default fields**: 27 fields defined in `sharedDefaultFields` array — shared across ALL projects
- **Custom fields**: Per-project fields stored in `project-form-configs`; only fields with IDs NOT matching any default field ID are considered custom
- **Field ordering**: Defaults come first (ordered by array index), then custom fields appended
- **Field types**: `text`, `textarea`, `number`, `file`, `choice` (with options), `rating` (with levels/symbol), `date`

### Storage (dual)
1. **localStorage** (client-side, synchronous reads):
   - `project-default-form-fields` — default field definitions
   - `project-form-configs` — custom fields per project
   - `project-form-quarters` — quarter date ranges per project
2. **MongoDB** (server-side, via API):
   - Collection: `form_configs`
   - Documents: `{ key: string, value: string (JSON), updatedAt: Date }`
   - Three keys: `default-fields`, `project-form-configs`, `quarter-configs`

### Architectural issue
`getValidProjectKeys()` returns only the 7 hardcoded projects from `defaultFormConfigs`. Dynamically created projects (via the admin projects page) are NOT included. A recent fix to `buildFormConfigs` adds a second pass that also includes projects from `customConfigs`, but newly created projects with no form configs still don't appear.

### Key files
| File | Role |
|------|------|
| `app/(admin)/form-builder/page.tsx` | Full form builder page (1655 lines) |
| `lib/shared/form-storage.ts` | Types, defaults, save/load, API push/pull (819 lines) |
| `server/forms/form-configs-db.ts` | Server-side DB access |
| `app/api/form-configs/route.ts` | GET + PUT API |

---

## 3. Custom Fields Architecture

### Type system
```
DynamicFieldType = "text" | "textarea" | "number" | "file" | "choice" | "rating" | "date"

FormFieldConfig = {
  id: string
  label: string
  type: DynamicFieldType
  required?: boolean
  choices?: string[]           // For choice fields
  ratingLevels?: number        // For rating fields
  ratingSymbol?: string        // For rating fields
}
```

### Default fields (27)
All 27 fields are Bible translation quarterly-reporting specific:
- **1-6**: Language name, reporting person, date, quarter outcomes, newly added books, goals
- **7-10**: Outputs (vision sharing, local church, Bible translation, engagement)
- **11-16**: Project impact, non-translation activities, task/gospel understanding, developments, prayer requests, answered prayer
- **17-18**: Two file upload slots (≥10 photos/videos each)
- **19-24**: External environment, team functioning, challenges, partners/church list, progress chart upload, documents upload
- **25-27**: Grammar check (Yes/No/Maybe), TR manager check (Yes/No/Maybe), improvement suggestions

All 27 have `required: true`.

### Custom vs default separation
`getCustomFieldsFromConfigs()` filters out any field whose `id` matches a default field ID. So custom configs only contain fields with IDs not in the default set. When merged (via `buildFormConfigs`), defaults come first, then custom fields appended.

### Per-project customization
Each project in `ProjectFormConfigs` (`Record<string, FormFieldConfig[]>`) can have its own set of custom fields. The form builder's project dropdown controls which project's custom fields are being edited. In "project-scoped" edit mode (activated by `?project=NAME` URL param), only that project's custom fields are editable and the project is locked.

---

## 4. Field Builder Implementation

### Location
`app/(admin)/form-builder/page.tsx` — 1655 lines, the largest page in the application.

### Field editor UI per field
Each field renders as a white card with:

**Header**: Numbered badge, default vs custom badge, copy/move up/move down/delete buttons

**Body**:
1. **Label input** — editable text field with separate draft state to prevent input lag
2. **Field type options** (conditional):
   - `choice`: Editable list of option text inputs + add/delete + "Other" (disabled, read-only)
   - `rating`: Levels dropdown (3/4/5/6/7/10) + Symbol dropdown (Star/Heart/Circle)
   - `date`: Static info text "Date input with calendar picker"
   - Others: no additional options
3. **Field type selector** — grid of radio-button cards (all 7 types with icons)
4. **Required toggle** — switch button, label reads "Long answer" for textarea, "Required" for others

### Reordering
- `moveFieldUp` / `moveFieldDown` — swap with adjacent field in the array
- Disabled at array boundaries (index 0 or last)

### Adding fields
- Sticky "Add Field" button in bottom-right corner
- New field gets a generated unique ID (`field_${Date.now()}`)
- Scrolls into view and focuses the label input

### Preview mode
The form builder does not have a built-in preview mode. Admins can navigate to `/form/{projectSlug}` to see the form as a coordinator would, or use the "Preview" button on the admin sidebar.

---

## 5. Assignment Logic

### Role-based access

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access to dashboard, user management, project CRUD, form builder, all reports |
| **Coordinator** | Submit quarterly reports for their assigned project, view/edit their own reports |
| **Facilitator** | Same as coordinator but under `/f/` route prefix; can also update report statuses |

### Project assignment
- Each non-admin user has a `project` field on their `UserDocument`
- Project is assigned during user creation (via admin or signup) and can be changed via admin edit
- The project selection dropdown draws from `COORDINATOR_PROJECT_OPTIONS` (7 hardcoded project names)
- A user's assigned project determines:
  - Which form they see (`/form/{projectSlug}`)
  - Which reports appear in "My Reports" (filtered to their project)
  - Access validation when viewing individual reports

### Report status lifecycle
1. Created as `"submitted"` (no draft save flow exists)
2. Can be changed to: `"draft"`, `"submitted"`, `"approval-pending"`, `"approved"`, `"rejected"`
3. Only `admin` or `facilitator` roles can update status via `PATCH /api/reports/[id]`
4. Status changes are done through a dialog in the admin reports page

---

## 6. Response Collection

### Submission flow
1. User navigates to `/form/{project}` (coordinator) or `/f/form/{project}` (facilitator)
2. Page loads form configs via `getHydratedFormState()` — same function used by form builder
3. Fields are rendered based on type:
   - `text` → `<input>`
   - `textarea` → `<textarea>`
   - `number` → `<input type="number">`
   - `date` → masked text input + hidden native date picker
   - `choice` → `<Select>` dropdown
   - `rating` → star buttons (1..N)
   - `file` → file picker with simulated progress (client-side only, no actual upload)
4. On submit: `POST /api/reports` with `{ projectName, quarter, fields: Record<fieldId, value>, dynamicFields: Array<{ fieldId, label, type, value }> }`
5. Report is stored with dual representation:
   - `fields`: flat `Record<fieldId, value>` for quick lookup
   - `dynamicFields`: full metadata array preserving labels and types even if form config changes later

### Report document (MongoDB)
```
{
  projectName: string,
  quarter: string,
  createdBy: ObjectId,
  createdByUsername: string,
  createdAt: Date,
  status?: "draft" | "submitted" | "approval-pending" | "approved" | "rejected",
  fields: Record<string, string | string[]>,
  dynamicFields: Array<{ fieldId, label, type, value }>
}
```

### Critical limitation
**File uploads are NOT persisted.** Files are selected client-side, progress is simulated with `setInterval`, and only filenames are stored in the report. The actual file data is never uploaded to any server.

---

## 7. Analytics / Reporting

### Admin dashboard reports page (`/dashboard/reports`)
- Fetches `GET /api/reports?page=N&limit=50` with optional filters (search, project, quarter, status)
- Displays summary stat cards (total, draft, submitted, approved counts)
- Shows a table of reports with: display code (auto-generated like `HAK-2026-JAN-MAR-001`), project, quarter, submitter, status, date
- Row actions: View, Edit status, Export (single XLSX), Delete

### Export functionality
- **Entirely client-side** — generates genuine `.xlsx` files in the browser using raw ZIP/CRC32 construction and Office Open XML (no external libraries)
- "Export All" exports currently loaded page (not all pages)
- Individual export downloads a single report
- Dynamic columns: adds a column for each unique `dynamicField.label` across exported reports

### Main dashboard (`/dashboard`)
- Fetches `GET /api/reports?page=1&limit=100` (100 most recent)
- Stat cards: Total Projects, Total Reports, Active Coordinators
- Reports grouped by Project → Quarter
- Client-side search/filter (project name, quarter, date, language)

### My Reports (coordinator: `/my-reports`, facilitator: `/f/my-reports`)
- Paginated list of user's own reports for their assigned project
- Search by quarter
- View individual report detail (read-only, dynamic fields rendered by type)

### No analytics features exist
- No completion metrics
- No per-field analytics
- No submission rate tracking
- No overdue report tracking
- No cycle-based tracking

---

## 8. Email System

### Brevo integration (`server/email/brevo-email.ts`)
- Sends emails via Brevo REST API (`https://api.brevo.com/v3/smtp/email`)
- API key: `BREVO_API_KEY` environment variable
- Sender: `BREVO_SENDER_EMAIL` (defaults to `noreply@example.com`)

### Three email functions
| Function | Purpose | Status |
|----------|---------|--------|
| `sendOTPEmail(email, otp)` | Send 6-digit OTP for signup verification | ✅ Active |
| `sendWelcomeEmail(email, username)` | Post-signup welcome with "Go to Dashboard" button | ✅ Active (fire-and-forget) |
| `sendPasswordResetEmail(email, resetToken)` | Password reset link | ❌ Dead code — never called |

### Current password reset flow
- Direct reset on `/forgot-password` — user provides username + email + new password
- No email verification, no reset token
- `sendPasswordResetEmail()` exists but is never called
- Rate-limited to 3 attempts per 60s per IP

### Limitations
- No email scheduling
- No reminder emails
- No bulk distribution
- No email templates beyond the three hardcoded HTML templates
- All email is synchronous (blocking the API response)

---

## 9. Scheduling Capabilities

### Quarters (current state)
- Quarter configs are per-project in `quarter-configs` key of `form_configs`
- Default: `{ startMonth: "January", endMonth: "March" }` for all 7 projects
- Admins can configure custom start/end months per project in the form builder
- The quarter label (e.g., "January - March") appears on reports and in the coordinator form
- No automated scheduling — quarters are static date ranges with no start/end enforcement

### What's missing
- No reporting cycle automation
- No auto-open / auto-close dates for forms
- No scheduled email reminders
- No overdue tracking
- No cycle-based submission windows
- No multi-quarter or custom cycle support
- The quarter is stored as a free-text string on each report, not linked to any cycle definition

---

## 10. How Architecture Differs from Microsoft Forms

| Aspect | Current System | Microsoft Forms |
|--------|---------------|-----------------|
| **Core paradigm** | Project-centric — forms are tied to projects; projects have assigned coordinators/facilitators | Form-centric — each form is standalone; respondents receive a link |
| **Form creation** | Fields are defined per-project via a form builder; 27 default fields shared across all projects | Create a new blank form or from template; completely standalone |
| **Project linkage** | Mandatory — every form belongs to a project; every user belongs to a project | No project concept — forms are independent |
| **Roles** | Three-tier (admin, coordinator, facilitator) with different permissions | Single creator role + anonymous respondents |
| **Response collection** | Reports are stored per-user per-project per-quarter; mapped to quarterly reporting cycles | Anonymous or named responses; no project/quarter structure |
| **Distribution** | No built-in distribution; users access forms via role-based navigation | Share link, QR code, email, embed in webpage |
| **Email integration** | Only OTP, welcome, and (unused) password reset emails | Automatic email notifications, scheduled sends, response receipts |
| **Scheduling** | Static quarter date ranges per project | Form open/close dates, recurring forms |
| **Branching** | Not supported | Supports branching logic based on responses |
| **Data export** | Client-side XLSX generation | Built-in Excel export, real-time response dashboard |
| **Collaboration** | Single admin edits forms | Multiple co-owners can edit a form |
| **Templates** | Default 27 shared fields as base | Create from existing forms or templates |
| **Theming** | No theming | Custom header images, colors, fonts |
| **Quizzes** | Not applicable | Quiz mode with correct answers and point values |
| **File uploads** | Simulated — no actual storage | Real file uploads to OneDrive/SharePoint |
| **Mobile app** | No mobile app | iOS and Android apps available |
| **Offline** | No offline support | Mobile app supports offline responses |
| **API** | Custom Next.js API routes | Microsoft Graph API for Forms |
