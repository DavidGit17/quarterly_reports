# Quarterly Reports - Project Architecture & Page Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Authentication Pages (Auth Group)](#authentication-pages-auth-group)
3. [Admin Dashboard Pages (Admin Group)](#admin-dashboard-pages-admin-group)
4. [Coordinator/Facilitator Pages (Coordinator Group)](#coordinatorfacilitator-pages-coordinator-group)
5. [Shared Pages (Shared Group)](#shared-pages-shared-group)
6. [API Routes](#api-routes)
7. [Component Architecture & Dependencies](#component-architecture--dependencies)

---

## Project Overview
**Quarterly Reports** is a Next.js 14+ application built with TypeScript, utilizing App Router with route groups for role-based access control. The system manages quarterly reporting for multiple projects, with distinct interfaces for Administrators and Coordinators.

**Technology Stack:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS + shadcn/ui components
- Lucide React icons
- Server Components + Client Components architecture

---

## Authentication Pages (Auth Group)
Location: `app/(auth)/`

### 1. Login Page (`/login`)
**File:** `app/(auth)/login/page.tsx`

**Mechanism:**
- Client component ("use client") that handles user authentication
- Collects username and password from the user
- Submits credentials to `/api/auth/login` endpoint
- Performs role-based routing:
  - Admins → redirected to `/dashboard`
  - Coordinators → redirected to their project's form page using `toProjectSlug()` utility
- Includes error handling for invalid credentials and network issues
- Provides links to signup and forgot-password pages

**Connections:**
- API: `/api/auth/login`
- Utilities: `@/lib/shared/form-storage` (toProjectSlug)
- Navigation: `/signup`, `/forgot-password`, `/dashboard`, `/form/[project]`
- UI Components: Native input/button elements (shadcn/ui compatible styling)

---

### 2. Signup Page (`/signup`)
**File:** `app/(auth)/signup/page.tsx`

**Mechanism:**
- Handles new user registration
- Collects user information including role selection (admin/coordinator)
- Submits to `/api/auth/signup` endpoint
- Typically restricted or requires admin approval in production

**Connections:**
- API: `/api/auth/signup`
- Navigation: `/login`

---

### 3. Forgot Password Page (`/forgot-password`)
**File:** `app/(auth)/forgot-password/page.tsx`

**Mechanism:**
- Initiates password reset process
- Sends OTP (One-Time Password) to user's registered contact
- Submits to `/api/auth/send-otp` endpoint
- Redirects to OTP verification page

**Connections:**
- API: `/api/auth/send-otp`
- Navigation: `/verify-otp`, `/login`

---

### 4. Verify OTP Page (`/verify-otp`)
**File:** `app/(auth)/verify-otp/page.tsx`

**Mechanism:**
- Verifies the OTP sent during password reset
- Submits code to `/api/auth/verify-otp` endpoint
- Upon successful verification, allows password reset
- Uses input-otp UI component for code entry

**Connections:**
- API: `/api/auth/verify-otp`
- UI Components: `@/components/ui/input-otp`
- Navigation: `/login`, `/forgot-password`

---

### 5. Security Page (`/security`)
**File:** `app/(auth)/security/page.tsx`

**Mechanism:**
- Additional security settings page
- Likely handles 2FA, session management, or security logs

---

## Admin Dashboard Pages (Admin Group)
Location: `app/(admin)/`

All admin pages share the dashboard layout defined in `app/(admin)/dashboard/layout.tsx` which wraps content in the `DashboardLayout` component.

### Admin Dashboard Layout Components
**Shared Layout File:** `components/admin/dashboard/layout.tsx`
**Core Layout Components:**
- `Sidebar` (`components/admin/dashboard/sidebar.tsx`) - Main navigation
- `Header` (`components/admin/dashboard/header.tsx`) - Top bar with user menu
- `PageHeader` (`components/admin/dashboard/page-header.tsx`) - Page title section
- `Toolbar` (`components/admin/dashboard/toolbar.tsx`) - Action bar for each page
- `StatusBadge` (`components/admin/dashboard/status-badge.tsx`) - Status indicators
- `FormBuilderFAB` (`components/admin/dashboard/form-builder-fab.tsx`) - Floating action button

**Sidebar Navigation Items:**
- Dashboard (`/dashboard`)
- Reports (`/dashboard/reports`)
- Forms Overview (`/dashboard/forms-overview`)
- Projects (`/dashboard/projects`)
- Coordinators (`/dashboard/coordinators`)
- Settings (`/dashboard/settings`)

---

### 1. Main Dashboard (`/dashboard`)
**File:** `app/(admin)/dashboard/page.tsx`

**Mechanism:**
- Admin's landing page after login
- Displays overview metrics and statistics
- Shows summary cards for key metrics
- Integrates with multiple summary components

**Connected Components:**
- `reports-summary.tsx` - Reports statistics
- `live-activity.tsx` - Recent submissions feed
- **Connections:** API `/api/reports` for aggregated data

---

### 2. Reports Page (`/dashboard/reports`)
**File:** `app/(admin)/dashboard/reports/page.tsx`

**Mechanism:**
- Lists all submitted quarterly reports from all coordinators
- Provides filtering, sorting, and search capabilities
- Allows admins to view, export, or delete reports
- Shows report status (submitted, reviewed, overdue)

**Connected Components:**
- `reports-table.tsx` (`components/admin/dashboard/reports/reports-table.tsx`) - Data table
- `reports-summary.tsx` - Summary statistics above table
- **API Connections:** `/api/reports` (GET all reports), `/api/reports/[id]` (GET single)

---

### 3. Forms Overview Page (`/dashboard/forms-overview`)
**File:** `app/(admin)/admin/forms-overview/page.tsx` AND `app/(admin)/dashboard/forms-overview/page.tsx`

**Mechanism:**
- Central hub for managing all form templates
- Displays all created forms with their status
- Shows which projects are using which forms
- Provides access to form builder for creating/editing forms
- Tracks form usage and submission counts

**Connected Components:**
- Data tables for form listings
- Status indicators for active/draft forms
- **API Connections:** `/api/form-configs` (manages form templates)

---

### 4. Form Builder Page (`/admin/form-builder` & `/form-builder`)
**Files:** 
- `app/(admin)/admin/form-builder/page.tsx`
- `app/(admin)/form-builder/page.tsx`

**Mechanism:**
- Drag-and-drop form builder for creating custom quarterly report forms
- Allows admins to define form fields, sections, and validation rules
- Saves form configurations to the database
- Forms can be assigned to specific projects
- Supports dynamic field types (text, number, date, file upload, etc.)

**Connected Utilities:**
- `@/lib/shared/form-storage.ts` - Form schema storage and serialization
- **API Connections:** `/api/form-configs` (CRUD operations for forms)

---

### 5. Projects Page (`/dashboard/projects`)
**File:** `app/(admin)/dashboard/projects/page.tsx`

**Mechanism:**
- Manages all projects in the system
- Displays projects in a table with key information
- Allows creation, editing, archiving of projects
- Assigns coordinators to projects
- Associates form templates with projects
- Tracks submission status per project

**Connected Components:**
- `projects-table.tsx` (`components/admin/dashboard/projects/projects-table.tsx`)
- `projects-summary.tsx` - Project statistics
- **API Connections:** Backend APIs for project CRUD operations

---

### 6. Coordinators Page (`/dashboard/coordinators`)
**File:** `app/(admin)/dashboard/coordinators/page.tsx`

**Mechanism:**
- Manages all coordinator accounts
- Lists coordinators with their assigned projects
- Allows admin to create, edit, deactivate coordinator accounts
- Resets passwords or sends login credentials
- Tracks coordinator activity and submission rates

**Connected Components:**
- `coordinators-table.tsx` (`components/admin/dashboard/coordinators/coordinators-table.tsx`)
- **API Connections:** Auth APIs for user management

---

### 7. Settings Page (`/dashboard/settings`)
**File:** `app/(admin)/dashboard/settings/page.tsx`

**Mechanism:**
- System-wide settings configuration
- Manages global application settings
- Quarter deadlines configuration
- Email notification settings
- System preferences and configurations
- Backup and export options

---

### 8. Notifications Page (`/dashboard/notifications`)
**File:** `app/(admin)/dashboard/notifications/page.tsx`

**Mechanism:**
- Displays system notifications for admins
- Alerts for upcoming deadlines
- Notifications for new report submissions
- System announcements and updates
- Mark notifications as read/unread

---

## Coordinator/Facilitator Pages (Coordinator Group)
Location: `app/(coordinator)/`

### 1. Project Form Page (`/form/[project]`)
**File:** `app/(coordinator)/form/[project]/page.tsx`

**Mechanism:**
- Coordinator's main landing page after login
- Dynamic route that loads the specific project's form
- Renders the form template assigned to that project
- Allows coordinator to fill out the quarterly report
- Saves drafts automatically
- Submits completed forms

**Parameters:**
- `[project]` - URL slug generated from project name via `toProjectSlug()`

**Connections:**
- Utilities: `@/lib/shared/form-storage.ts` - Loads form configuration
- **API Connections:** `/api/form-configs` (fetches project's form), `/api/reports` (submits report)

---

### 2. My Reports Page (`/my-reports`)
**File:** `app/(coordinator)/my-reports/page.tsx`

**Mechanism:**
- Shows all reports submitted by the logged-in coordinator
- Lists submissions with project name, quarter, submission date
- Allows viewing past submissions
- Tracks submission history
- Filters reports by quarter or status

**Authentication Flow:**
- Checks `/api/auth/me` to verify coordinator role
- Redirects to login if not authenticated
- Redirects to admin dashboard if user is admin
- Fetches coordinator's reports from `/api/my-reports`

**API Connections:**
- `/api/auth/me` - Session verification
- `/api/my-reports` - Fetches user's submission history

---

### 3. Report Detail Page (`/report/[id]`)
**File:** `app/(coordinator)/report/[id]/page.tsx`

**Mechanism:**
- Displays a detailed view of a specific submitted report
- Read-only view of past submissions
- Shows all form fields and submitted values
- Includes submission metadata (timestamps, status)
- Allows exporting or printing the report

**Parameters:**
- `[id]` - Report unique identifier

---

### 4. Project Selection Page (`/select`)
**File:** `app/(coordinator)/select/page.tsx`

**Mechanism:**
- For coordinators assigned to multiple projects
- Displays all projects the coordinator can access
- Allows switching between different project dashboards
- Each project links to its respective form page

---

### 5. Submit Report Page (`/submit-report`)
**File:** `app/(coordinator)/submit-report/page.tsx`

**Mechanism:**
- Final submission confirmation page
- Validates all required fields before submission
- Shows review summary of the filled form
- Handles final API submission to `/api/reports`
- Shows success message and redirects to `/my-reports`

---

## Shared Pages (Shared Group)
Location: `app/(shared)/`

### 1. Profile Page (`/profile`)
**File:** `app/(shared)/profile/page.tsx`

**Mechanism:**
- Accessible by both admins and coordinators
- Allows users to update their profile information
- Change password functionality
- Update contact information
- View account details and role

---

### 2. Shared Landing Page (`/`)
**File:** `app/(shared)/page.tsx`

**Mechanism:**
- Root path handler
- Performs auth check and role detection
- Automatically redirects users to appropriate dashboard:
  - Unauthenticated → `/login`
  - Admin → `/dashboard`
  - Coordinator → `/form/[project]`

---

## API Routes
Location: `app/api/`

### Authentication APIs (`/api/auth/`)
- `login/route.ts` - User login authentication
- `signup/route.ts` - New user registration
- `logout/route.ts` - Session termination
- `me/route.ts` - Get current user session
- `send-otp/route.ts` - Send verification code
- `verify-otp/route.ts` - Verify OTP code
- `forgot-password/route.ts` - Password reset

### Reports APIs (`/api/reports/`)
- `route.ts` - GET all reports, POST new report
- `[id]/route.ts` - GET/PUT/DELETE specific report

### Form Configs API (`/api/form-configs/route.ts`)
- Manages form templates
- CRUD operations for form builders
- Assigns forms to projects

### My Reports API (`/api/my-reports/route.ts`)
- Returns only reports belonging to the authenticated coordinator
- Filtered access based on user's project assignments

---

## Component Architecture & Dependencies

### Shared UI Components (shadcn/ui based)
Location: `components/ui/` - 50+ reusable UI components
- Form components: `form.tsx`, `field.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`
- Layout components: `card.tsx`, `sheet.tsx`, `separator.tsx`
- Data display: `table.tsx`, `badge.tsx`, `avatar.tsx`, `progress.tsx`
- Overlays: `dialog.tsx`, `popover.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`
- Feedback: `toast.tsx`, `toaster.tsx`, `sonner.tsx`, `skeleton.tsx`
- Utilities: `button.tsx`, `checkbox.tsx`, `switch.tsx`, `tabs.tsx`

### Shared Libraries & Utilities
Location: `lib/shared/`
- `utils.ts` - General utility functions, `cn()` for class merging
- `session.ts` - Session management and auth helpers
- `form-storage.ts` - Form serialization, `toProjectSlug()`, date formatting
- `date-format.ts` - Date manipulation and formatting

### Custom Hooks
Location: `hooks/shared/`
- `use-mobile.ts` - Detect mobile viewport
- `use-toast.ts` - Toast notification hook

### Total Component Connections by Role:

**Admin Pages Connections:**
- Each admin page connects to: Dashboard Layout (7 components) + 2-3 page-specific components + 5-10 UI components + 1-2 API endpoints
- Total average dependencies per admin page: ~20 components/modules

**Coordinator Pages Connections:**
- Each coordinator page connects to: Auth wrappers + form rendering components + 3-5 UI components + 1-2 API endpoints
- Total average dependencies per coordinator page: ~15 components/modules

**Auth Pages Connections:**
- Each auth page connects to: Basic form components + 1 API endpoint
- Total average dependencies per auth page: ~8 components/modules

---

## Role-Based Access Summary

| Role | Accessible Pages |
|------|------------------|
| Guest | Login, Signup, Forgot Password, Verify OTP |
| Coordinator | /form/[project], /my-reports, /report/[id], /select, /submit-report, /profile |
| Admin | All admin dashboard pages, all coordinator pages, all shared pages |

---

## Route Grouping Strategy
The project uses Next.js App Router route groups to organize pages by role:
- `(auth)` - Unauthenticated authentication pages
- `(admin)` - Admin-only dashboard and management pages
- `(coordinator)` - Coordinator-specific reporting pages
- `(shared)` - Pages accessible by all authenticated users

This grouping enables middleware to enforce role-based access control at the route group level, ensuring users can only access pages appropriate for their permissions.