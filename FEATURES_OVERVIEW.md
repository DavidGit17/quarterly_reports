Features Overview

⸻

🔐 Authentication Features

- Login page with username and password input
- Role-based login routing (admin goes to dashboard, coordinator goes to report flow)
- Signup page with username, email, and password form
- Forgot password click action with “coming in next development update” message
- Basic logout action from profile page

⸻

👤 Coordinator Features

- Enter project name (free text input)
- Quarter selection (Q1–Q4)
- Access coordinator profile page
- Report submission form with 27 structured questions
- Required-field validation across form inputs
- Date field with calendar picker icon and manual date typing support
- Automatic date formatting with slash insertion while typing
- File upload for report fields (documents, images, video, audio)
- View selected file names after upload
- Remove uploaded files before submit
- Add custom fields dynamically at the end of the form
- Remove dynamically added fields
- Submit confirmation popup before redirect
- Redirect to report history after submit popup
- View own submitted reports list
- Search submitted reports by project or quarter
- Open report details from report history

⸻

🧑‍💼 Admin Features

- Admin dashboard page
- Access admin profile page
- Dashboard stats cards (projects, reports, active coordinators)
- View reports grouped by project and quarter
- Open detailed report view from dashboard
- Search projects from dashboard
- Access-denied UI path exists for non-admin dashboard access

⸻

📄 Report Features

- Detailed report view page with:
  - Project, quarter, coordinator, date/time summary
  - Full structured field content display
  - Uploaded files section with file type labels
- Download action links/buttons shown in report details UI
- Report history table with project, quarter, date, time, and view action

⸻

🔍 Search & Filtering

- Search in coordinator report history (project/quarter match)
- Search in admin dashboard (project name match)

⸻

🧾 UI & Experience Features

- Microsoft Forms-style report form layout
- Required markers shown on fields
- Bottom-border input style for form answers
- Resizable paragraph answer areas
- File upload action shown as single “Upload file” trigger
- Per-file remove action in upload lists
- Modal-style success popup on submit
- Back navigation and page-to-page links across flows

⸻

⚙️ System Behavior (UI-Based)

- Home route auto-redirects to login
- Session-like user data stored on login (username, email, role) for profile display
- Profile page supports both admin and coordinator views
- Mock data used for reports, dashboard, and detail pages
- No backend-connected authentication or data persistence layer

⸻
