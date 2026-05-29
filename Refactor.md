## 1. Admin Dashboard

### Header
- Branding logo on the left.
- Search bar beside the branding logo (currently non-functional). Either add functionality to search projects, or remove it since there is already a dedicated search bar below the stat cards where users can search using filters such as Project, Language, Quarter, and Date. I think the header search bar is not necessary.
- Notification icon beside the profile icon on the right. For now it is okay, but I have additional changes to mention later related to the status system. Remove approval logic because the admin will not approve/reject forms — they only edit submitted forms.
- Profile icon: currently okay, but add a skeleton loader when the profile page is loading because it currently shows "Loading Profile...". Also, inside the profile page there is a project assignment section below the role — remove this for admins because only coordinators/facilitators belong to projects.

### Dashboard Contents
- Currently starts with "Dashboard" and the greeting: "Welcome back! Here's your quarterly reports overview."
This is okay for now, but replace "Dashboard" with the username (admin1, admin2, etc.).

### Stat Cards
Currently there are 3 stat cards:

- Total Projects → make dynamic. When a new project is created, the count should update automatically.
- Total Reports → same as Total Projects; count should update dynamically.
- Active Coordinators → count of all coordinators.
- Also add a Facilitators stat card showing the total count of facilitators.

---

## 2. Reports Page

### Contents
- "Reports" title with a small description below it on the left.
- "Export All" button on the right.

### Stat Cards
- Remove Draft, Approved, and In Progress from the existing 5 cards.

### Active Submission Sessions
- Remove this section.

### Search/Table Section
- Remove the Status column from the table.
- Clicking the View icon currently navigates to another page. Instead, display report details using a modal within the Reports page itself. The background should blur and the modal should open with a smooth animation.
- Clicking the Edit icon currently says "Edit Report Status". Since the Status column is being removed, rename this to Edit Report Responses.
- Similar to View, use a modal instead of navigating to another page so admins can edit responses directly inside the modal.
- Download and Delete actions are okay for now.

---

## 3. Forms Overview

### Contents (Important Changes)

- Replace the text:
  Forms Overview
  "View all created forms for each project"
  with:
  Modify and Preview the Forms

- Rename Edit Forms → Modify Forms

### Form Builder Page

Inside Edit Forms, it currently opens the Form Builder page.

This page feels a bit complex for admins to understand.

Changes:

- Remove the saved status under the "Form Builder" heading on the left.
- Remove the Edit Mode concept:
  - Coordinator Default Fields
  - Custom Fields

Instead, simply show:

- Form Title
- Select Project
- Add New Project
- Set Quarter Range

After this section, directly start the form fields section.

- Move Copy Form Link and Share via WhatsApp outside the form title section because they feel irrelevant there. Place them on the right side or another suitable location.
- This page should be used only for creating forms, so rename the button:
  Edit Forms → Create Forms

---

## 4. Created Forms Preview List

There is currently a list of created forms in the Forms Overview page.

When clicking a project's form, it opens and displays the full form preview. Then users must scroll all the way down again to find Preview and Edit Form buttons.

This feels redundant.

Changes:

- Remove automatic form preview display when clicking a project.
- Inside Edit Form (rename to Modify Form), keep only field modification functionality — fields can be added, extended, or removed.

---

## 5. Projects

### Contents

The Create Project button opens a modal containing:

- Project Name
- Description → remove.
- Languages → languages represent languages spoken across different countries. During testing, use different country languages for different projects. Example: Hiba can contain multiple country languages.
- Status → remove.

### Stat Cards

Keep:

- Total Projects

Remove:

- Active
- Inactive
- Pending

### Projects List

The search bar currently contains an All Statuses dropdown.

Remove Active / Inactive / Pending filtering.

Instead, use:

- Project
- Language
- Quarter
- Date

---

## 6. Users Page

### Add User

The modal contains:

- Username
- Email
- Password
- Role dropdown
- Project dropdown

This is okay for now.

### Filtering

Filtering by:

- All
- Coordinators
- Facilitators
- Admins

is okay for now.

### Search Bar

It contains an All Statuses dropdown.

Remove it.

### Users List

- Add timestamp beside the Created date column.
- In the Edit User modal, the Project dropdown is not displaying correctly. Only the arrow is visible; the selected project text is not visible until clicked.

---

## 7. Settings

Currently has 4 sections:

### Account
Contains:

- Full Name
- Email Address
- Timezone (not sure what this is currently used for)
- Date Format

### Security
- Remove Session Timeout.
- Keep 2FA.

### Notifications
- Keep.

### Data
- Remove.

---

## 8. Reporting Cycles and Email Campaigns

### IMPORTANT CHANGE — Simplify the reporting/email workflow.

First, read and follow flow.md.

The current implementation created:

- Reporting Cycles
- Email Campaigns

This is becoming confusing for the client.

We want to simplify the UX and reduce page complexity.

Do not maintain separate large workflows for Reporting Cycles and Email Campaigns for now.

### New Approach

Replace the current client-facing workflow with a single consolidated page.

Suggested name:

Form Distribution

Acceptable alternatives:

- Reporting Automation
- Automated Form Delivery

Prefer simple terminology understandable by non-technical users.

(remaining structure is good overall — mainly needed grammar, punctuation, and consistency cleanup)


<!-- 1. admin dashboard:
* Header:
 - Branding logo to the left
 - Search Bar Beside Branding logo(which is currently non functional, so add functionality to search projects or remove it since there is a dedicated search bar below the
 stat cards, where they can search by filtering and it has a dropdown list to select Project, language, quarter, and Date, so i guess its not necessary to have a search bar in the header)
 - notification icon to the right beside the profile icon, for now its ok but i have some changes to tell so i will connect that change in status system(so remove the approval because admin wont be approving/rejecting any forms, he just edits the submitted forms thats it)
 - profile icon, currently its okay but add skeleton when profile page is loading, because currently it shows "Loading Profile...". also inside profile page there is a project assignemtn below role(remove this for admins, because only coordinators/facilitators has in which project they are in)

 * Dashboard contents:
 - starting with a message that has Dashboard(I guess it needs to display the username like admin1 or admin2 etc) and greetings "Welcome back! Here's your quarterly reports overview." this ok for now but the dashboard should be replaced with username

 * stat cards:
 - currently it has 3 stat cards they are:
  - Total Projects(make this dynamic, so when i create a new project it should be reflected here, the count should be updated)
  - Total Reports(same as total projects, count should be updated and reflected)
  - Active Coordinators(count of all coordinators)
  - Also add a facilitators stat card and count of all facilitators

2. Reports Page:
* Contents:
- Reports and below a small description to the left
- Has an Export All button on the right

* Stat Cards:
- Just remove Draft, Approved, In Progress from those 5 cards

* Active Submission Sessions: Remove this section

* Search Bar:
- Has Table, from it remove the status coloumn
- On clicking the view icon it takes to another page entirely, so instead use a modal to display the report details in the reports page itself, so background will be blurred and this report modal view will popup with smooth animation
- On clicking edit icon it says edit report status, but since we are removing the status column, instead edit report status it should be edit report responses, so same as the view icon, for this also use a modal instead of taking to another page, so the admin can be able to edit the responses in that modal
- Both Download and delete are okay for now

3. forms Overview:
* Contents(Important Page changes):
- Text to the left that says forms Overview and a small description "View all created forms for each project" replace this with Modify and Preview the Forms
- Edit forms should be named as Modify Forms
- So inside Edit Forms it takes to another page which is form builder:
 - In this page there is some complexity for the admins to understand how this builder works
 - Remove the saved status under the Form Builder text on the left side
 - Edit Mode has two options: Coordinator default Fields and Custom Fields, remove this edit mode concept and just show the form title, select project, add new project, set quarter range, and after this section the form fields section starts
 - also place the copy form link and sahre via whatsapp either out of the form title section because its irrelevant in that section, so place it rightside or in any other location
 - so the edit forms is to only for creating forms, also change the Button name from Edit Forms to Create Forms to make it clear that this is a form creation page
 
 4. Created forms preview list:
 - So there is a list of created forms in the forms overview page, so when we click on a specific project's form then it shows the preview like all the fields, and we need to scroll till bottom to find that there are two options sitting: Preview and Edit form, so its irrelevant to display the preview of the form and scroll down to see again a preview form button, so remove the displaying of form preview when clicked on the project and it opens and shows all the fields preivew, and inside Edit Form(Change to Modify Form) its for only to modify the fields, like the fields can be extended or removed


5. Projects:
* Contents:
- Create Project button which opens a modal and has project name, description(remove), languages(languages are bascially different languages spoken by each country in the world, so in testing use different country's languages for each project, like hiba can have multiple country's languages), status(just remove this)

* Stat Cards:
- total Projects, active, inactive(remove this for now), pending(remove)

* Projects List:
- search bar that has all statues and inside it active, inactive, pending(remove this for now) and only use project, language, quarter, and Date, just replace the all statuses dropdown list/filtering list with these

6. Users Page:
* Add user:
- Modal opens and inside it has username, email, password, role selection dropdown, project selection dropdown, for now okay

* filteration by choosing All/coordinators/facilitators/Admins okay for now

* Search bar: it has a all statues dropdown list so remove from the

* Users List:
- Add timestamp beside date in created coloumn
- in edit user modal the project dropdown isnt showing, only the arrow is visible and when clicked list is visible but the Project beside the arrow isnt showing

7. Settings:
* Has 4 sections:
- Account: which has full name, email address, timezone(dont know for what its used for), date format
- Security: remove the session timeout, keep 2fa
- Notify: keep
- data: remove this

8. Reporting cycles and Email campaigns:
IMPORTANT CHANGE — simplify the reporting/email workflow.

First read and follow flow.md.

The current implementation created:

- Reporting Cycles
- Email Campaigns

But this is becoming confusing for the client.

We want to SIMPLIFY the UX and reduce page complexity.

Do NOT maintain separate large "Reporting Cycles" and "Email Campaigns" workflows for now.

---

NEW APPROACH

Replace the current client-facing workflow with a SINGLE consolidated page.

Suggested page name:

Form Distribution

(acceptable alternatives: Reporting Automation / Automated Form Delivery)

Prefer simple terminology understandable to non-technical users.

---

SIDEBAR CHANGE

Replace:

- Reporting Cycles
- Email Campaigns

with:

- Form Distribution

Keep backend logic reusable if useful, but simplify the UI layer.

---

FORM DISTRIBUTION PAGE

Purpose:

Admin configures WHEN forms should be emailed, WHICH projects/forms they belong to, and WHO receives them.

This page becomes the central scheduling + email configuration area.

---

SECTION 1 — CREATE DISTRIBUTION RULE

Admin creates a rule.

Fields:

### Rule Name

Examples:

- January Reports
- Q1 Distribution
- Haksolok Jan Cycle
- May Reporting

---

### Select Projects

Multi-select.

Admin chooses one or many projects.

Example:

✓ Project A

✓ Project B

✓ Project C

Projects remain sourced from existing Projects page.

---

### Select Forms

Choose form(s) linked to selected projects.

Reuse existing forms architecture.

---

### Recipients

Options:

- Coordinators
- Facilitators
- Both
- Specific users (optional)

Recipients should respect:

project assignment

signup-selected projects

admin-assigned projects

---

### Send Schedule

This is the main requirement.

Support:

#### Monthly

Examples:

- every 1st day
- every 5th day
- every month on custom date

#### Quarterly

Examples:

- Jan
- May
- Sep

(or configurable quarter months)

#### Custom Date

Admin selects exact date.

Examples:

Jan 15

May 1

Sep 10

---

CLIENT EXAMPLE:

Admin selects:

Projects:

A, B, C, D

Send Date:

January

Recipients:

Coordinators + Facilitators

System automatically emails links.

Another rule:

Projects:

E, F, G, H

Send Date:

May

Recipients:

Facilitators

---

### Email Settings

Optional:

- email subject
- custom message
- invitation message

Reuse existing email infrastructure.

---

### Link Settings

Options:

- allow edits
- deadline
- expiration date

Reuse form settings where practical.

---

### Rule Status

- Active
- Paused
- Disabled

---

SECTION 2 — DISTRIBUTION RULES TABLE

Below the create/edit form.

Show existing rules.

Columns:

- Name
- Projects
- Forms
- Recipients
- Schedule
- Next Send
- Status

Actions:

- Edit
- Pause
- Run Now
- Delete

---

IMPLEMENTATION RULES

1. Reuse existing backend logic if possible.

You may internally reuse reporting cycle / email campaign logic.

BUT simplify the UI into one page.

2. Avoid overengineering.

3. Client-first UX.

4. Keep practical architecture.

5. Preserve current scheduling capabilities if already implemented.

6. Adapt instead of rebuilding everything.

---

Before coding:

Generate a short migration/change summary:

- what is being merged
- affected routes/pages/components
- reused logic
- UI simplification plan

Then implement incrementally.


 -->
