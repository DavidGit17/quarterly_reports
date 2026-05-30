Perform a full mobile responsiveness + UI polish + layout refinement pass across the entire project. Focus on mobile-first responsiveness, visual consistency, alignment, spacing, modal polish, interaction polish, and admin/coordinator UX refinement.

Do not partially fix. Inspect the entire codebase and apply improvements consistently.

---

# 1. Global Responsiveness Requirement

Make the entire project fully responsive across:

- small mobile
- large mobile
- tablets
- laptops
- desktops

Inspect EVERYTHING:

- pages
- subpages
- headers
- navbars
- sidebars
- search bars
- cards
- tables
- forms
- dialogs
- modals
- dropdowns
- notifications
- profile menus
- popovers
- nested components
- action buttons
- filters
- pagination

Responsiveness must feel intentional and premium, not compressed desktop layouts.

No:

- overflow
- clipped UI
- horizontal scrolling
- broken alignment
- off-screen modals
- awkward spacing
- cut text

---

# 2. Coordinator Dashboard / Mobile Improvements

### Welcome Section

Inspect:

- welcome message
- quarterly reports dashboard description

Improve:

- responsiveness
- spacing
- wrapping
- typography hierarchy

### View Reports

Currently looks like plain text.

Make it visually behave like a proper button.

### Profile Icon Menu

On hover / interaction show:

- username
- profile button
- logout button

Add proper visual surface/background because currently the area feels empty.

### Search Bars

Dashboard search bar:

- focus ring currently too thick
- reduce thickness
- improve polish

View Reports page:

- replace blue focus ring
- use assigned green system button color

New Report button:

- remove blue
- use assigned green button system.

### Profile Page

Fix:

Edit Profile button/layout not responsive.

Currently partially outside the screen.

Must remain fully visible across mobile/tablet.

Below options:

- Go to Assigned Form
- View My Reports
- Logout

Currently create horizontal scrolling.

Remove scrolling.

Redesign layout if necessary.

---

# 3. Admin Dashboard / Mobile Improvements

### Navbar Cleanup

Current navbar feels cluttered.

Current order:

txt id="1" menu icon → brand → Reports text → notification → profile 

Required:

Remove:

txt id="2" Reports text 

Keep:

- menu icon
- brand logo
- notification
- profile

### Brand Logo Consistency

Issue:

Dashboard brand uses blue.

Sidebar brand uses grey.

Use ONLY the grey branding consistently.

Apply across:

- navbar
- dashboard
- sidebar
- mobile layouts

### Notification Popover

Current problem:

Notification popup aligns left.

Fix:

Align correctly to the right side.

### Profile Popover

Current issue:

Sharp corners.

Increase radius.

Smooth appearance.

Apply same styling to:

- admin profile popup
- coordinator profile popup

### Admin Profile Page

Replace blue styling with admin grey system colors.

Fix Edit Profile responsiveness.

Currently partially off-screen.

---

# 4. Notifications Page Refinement

Inside notifications page:

Problem:

"Recent Notifications" too close to:

- Mark All Read
- Clear All

Improve:

- spacing
- layout hierarchy
- alignment
- text alignment consistency

May reposition buttons below if needed.

Make layout cleaner.

---

# 5. Reports Page Refinement

### Filters

All Projects dropdown.

Quarter / Date dropdown.

Currently not centered properly inside their containers.

Fix alignment.

### Search Bar

Current placeholder:

txt id="3" Search by project, quarter, or coordinator 

Issues:

- coordinator text cut
- cluttered

Replace with:

txt id="4" Search 

### View Form Modal

Close button currently awkwardly placed over title.

Align visually with:

txt id="5" Back to Reports 

Apply same improvement to:

- Edit Form Modal

### Edit Response Modal

Current issue:

Responses require horizontal scrolling.

Increase modal width / layout so responses are readable without horizontal scrolling.

### Delete Modal

Increase border radius.

---

# 6. Forms Overview / Form Builder

### Forms Overview

Heading text:

txt id="6" Modify and preview the forms 

Typography inconsistent.

Match heading sizing with other pages.

### Create Form Page

Add Field button:

Currently not floating.

Improve UX.

Allow easy field adding without constantly scrolling to bottom.

Buttons:

- Save Form Structure
- Add Field

Change:

- border radius
- colors → use admin grey system
- improve polish

---

# 7. Projects Page

Table pagination area:

Current:

txt id="7" 10 of 105 

Problem:

User must scroll top for navigation.

Add:

pagination arrow controls / easier navigation behavior.

### Create Project Modal

Language placeholder currently shows bible names.

Fix.

Languages should represent actual country languages.

---

# 8. Users Page

### Role Tabs

Issue:

Clicking Coordinator.

Clicking again returns to All.

Fix behavior.

Second click should not unexpectedly reset.

### Status Dropdown

Improve alignment.

Center or align right appropriately.

### Deactivate Modal

Increase radius.

### Edit Modal

Use:

- grey focus rings
- thinner focus styling

Apply across ALL admin pages:

no thick focus rings

### Add User Modal

Place:

- coordinator selector
- select project

horizontally where responsive space allows.

---

# 9. Settings Page

Replace blue buttons with admin grey system colors.

---

# 10. Global Admin Styling Rules

Across ALL admin pages:

Use:

- grey admin system colors
- thinner focus rings
- smoother radii
- improved spacing
- better alignment
- premium mobile responsiveness

Inspect:

- inputs
- selects
- dropdowns
- modals
- calendars
- clocks
- popovers
- tables
- buttons
- forms

---

# 11. Deliverables

After implementation provide:

1. files changed
2. mobile responsiveness fixes applied
3. navbar cleanup changes
4. modal/dialog refinements
5. alignment fixes
6. focus ring changes
7. color system updates
8. before vs after behavior summary
9. remaining issues (if any)

Goal:

Make the application feel fully responsive, visually polished, modern, aligned, smooth, and premium across all devices, especially mobile admin/coordinator experiences.