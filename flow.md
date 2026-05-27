IMPORTANT:

First read and follow flow.md carefully.

Use it as the primary business flow reference.

Do NOT redesign the architecture from scratch.

Do NOT overcomplicate by heavily using separate Reports / Reporting Cycles / Email Campaigns pages right now.

The client currently wants a Microsoft-Forms-style reporting experience adapted into the EXISTING system.

Use the CURRENT dashboard/page structure and extend it.

---

CURRENT EXISTING ADMIN SIDEBAR:

- Dashboard
- Reports
- Forms Overview
- Reporting Cycles
- Email Campaigns
- Projects
- Users
- Settings

For NOW:

keep the existing structure but DO NOT force major usage of Reports / Reporting Cycles / Email Campaigns pages unless truly required.

The focus is Forms + Responses + Microsoft-Forms-style workflow.

---

AUTHENTICATION

LOGIN

Currently users login with username + password.

Implement Microsoft Authenticator compatible TOTP verification.

Flow:

1. username
2. password
3. verify TOTP code from Microsoft Authenticator app
4. successful verification
5. redirect to role dashboard

This applies to:

- admin
- coordinator
- facilitator

Microsoft Authenticator is requested because employees will use Outlook / Microsoft ecosystem.

Use proper TOTP implementation.

Do NOT build a custom OTP system for this.

---

SIGNUP

Current fields:

- username
- password
- email
- role
  - admin
  - coordinator
  - facilitator
- project selection dropdown

Project dropdown MUST remain dynamic.

Projects come from admin-created projects.

Current email OTP verification already exists.

Reuse it.

---

ROLE DASHBOARDS

After login:

redirect by role.

---

COORDINATOR / FACILITATOR FLOW

Forms should NOT be visible by default.

Instead:

system sends generated form link by email according to configured reporting cycle / admin configured send date.

Example:

Jan-Apr cycle starts.

Admin configured send date arrives.

Form link is sent automatically according to assigned project.

Project source:

- selected during signup
OR
- assigned by admin.

Submission behavior:

submitted responses:

- stored server side
- visible to admin
- reflected similar to Microsoft Forms response model.

---

MY REPORTS PAGE

Reuse existing "My Reports" page.

Features:

- view submitted responses
- view submission history
- edit submitted responses

Editing:

enabled by default.

Admin must have ability to restrict editing through form settings.

---

POST SUBMISSION EXPERIENCE

After submission:

show:

Your response was submitted.

Important thing you can do next:

- Save my response
- Submit another response

Behavior controlled by admin form settings.

---

ADMIN EXPERIENCE

DO NOT create many new pages.

Reuse existing structure.

---

DASHBOARD PAGE

KEEP existing dashboard.

Current dashboard already has:

cards:

- total projects
- total reports
- active coordinators

filters:

- project
- quarter
- date
- language

search bar + results

Keep this page.

---

FORMS OVERVIEW PAGE

This becomes the MAIN Microsoft-Forms-style page.

Do NOT create a separate large reporting system for now.

Inside Forms Overview implement:

FORM MANAGEMENT

- Create New Form
- Edit Form
- Delete Form
- Duplicate Form

FORM BUILDER

- form title
- saved / unsaved status
- saved timestamp
- custom fields builder

FORM SETTINGS

Microsoft-Forms-style options:

Options for responses

checkbox options:

- Accept responses
- Start date
- End date
- Set time duration
- Shuffle questions
- Disable question numbering
- Show progress bar
- Get email notification for each response
- Hide submit another response
- Customize thank you message
- Allow respondents to save responses
- Allow respondents to edit responses

Use toggles / checkboxes.

---

PREVIEW

Inside Forms Overview.

Preview options:

- Desktop view
- Mobile view

Allow admin to preview responsive rendering.

---

COLLECT RESPONSES

Inside Forms Overview.

Features:

Send and collect responses

- Anyone can respond
- Shorten URL
- Copy link

Invitation preview:

You are invited to take this:
[Form title]

custom invite message

Start now button

Outlook send option.

---

VIEW RESPONSES

Inside Forms Overview.

This is the Microsoft-Forms-style response area.

Features:

Response Overview

cards row:

- Active
- Responses count
- Average completion time
- Duration

Question analytics:

Question
More details

Option counts.

Example:

Option 1 → 2

Option 2 → 0

Export options:

- Open in Excel Desktop
- Download copy

Admin-only response editing:

Admin can edit submitted responses field-by-field.

---

AUTO FORM LINK SENDING

For NOW:

do NOT create a large dedicated automation system.

Keep it lightweight.

Inside Forms Overview OR minimal configuration area:

admin configures:

- project
- send date
- cycle / quarter
- recipients

System sends form links automatically.

Simple implementation first.

Do NOT overengineer.

---

PROJECTS PAGE

KEEP existing page.

Projects remain source of truth for:

- signup dropdown
- assignments
- form targeting

---

USERS PAGE

KEEP existing implementation.

Features already exist:

- add user
- remove user
- active / inactive
- edit user

Keep them.

Ensure:

- password edit/reset
- project assignment
- role management

---

SETTINGS PAGE

KEEP existing page.

Global configuration lives here.

---

IMPORTANT IMPLEMENTATION RULES

1. First inspect CURRENT implementation.

2. Read and follow flow.md.

3. Reuse existing pages aggressively.

4. Avoid unnecessary new navigation/pages.

5. Adapt Microsoft Forms FEATURES into CURRENT architecture.

6. Prioritize shipping practical features over perfect architecture.

7. Generate implementation plan first before large refactors.