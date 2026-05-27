Important clarification:

Do NOT implement Microsoft Forms UI/UX literally.

This project has a DIFFERENT architecture and workflow.

Understand the CURRENT system first.

Current workflow is roughly:

1. Admin creates a PROJECT.
2. Admin goes into form editing/configuration.
3. Admin selects a project from dropdown.
4. Admin defines custom fields / labels / form structure for that project.
5. Coordinators / facilitators later receive and submit project-linked forms.

This is a PROJECT-CENTRIC form system.

Do NOT force a standalone Microsoft Forms builder interface.

Instead:

Adapt useful Microsoft Forms FEATURES into the CURRENT architecture and UI patterns.

Reuse existing workflows and existing pages whenever practical.

---

FIRST:

Audit the current implementation.

Generate:

CURRENT_WORKFLOW_AUDIT.md

Document:

- project creation flow
- form editing flow
- custom fields architecture
- field builder implementation
- assignment logic
- response collection
- analytics/reporting
- email system
- scheduling capabilities

Explain how the current architecture differs from Microsoft Forms.

---

SECOND:

Map Microsoft-style features into THIS system.

Do NOT clone UI.

Implement equivalent capabilities where they naturally belong.

Example mapping:

PROJECT SETTINGS PAGE:

- accept responses
- active/inactive forms
- start/end availability
- quarter scheduling
- reminder settings
- allow edits
- save progress
- thank-you message
- notification settings

FORM EDITOR / CUSTOM FIELDS PAGE:

- field ordering
- question numbering toggle
- shuffle option (if practical)
- required fields
- preview mode
- desktop/mobile preview
- duplicate form/project config
- prefilled links

RESPONSE DASHBOARD:

- response overview
- analytics
- completion metrics
- per-field analytics
- individual responses
- export
- print summary

EMAIL / DISTRIBUTION MODULE:

- share links
- scheduled sends
- reminder emails
- recipient targeting

---

MOST IMPORTANT FEATURE:

Quarter-based reporting automation.

This MUST integrate into the CURRENT project workflow.

Admins define custom reporting cycles.

NOT fixed quarters.

Example:

Cycle Name:
Q1 2026
School Term 1
May-Aug Reporting
Regional Review Cycle

Configurable:

- cycle name
- start date
- end date
- linked projects
- linked forms
- target roles/groups
- reminder schedule
- active/inactive

Behavior:

At cycle start:

Automatically send project/form links by email.

Recipients:

- coordinators
- facilitators
- selected groups/projects

Support:

- reminder emails
- overdue reminders
- submission tracking
- completion tracking
- admin monitoring dashboard

Integrate with CURRENT role system and existing project structure.

---

THIRD:

Before coding:

Generate:

FEATURE_MAPPING.md

Show:

CURRENT SYSTEM FEATURE
→ PROPOSED IMPLEMENTATION LOCATION
→ DB changes
→ API changes
→ UI changes

Only after approval proceed with implementation.

Do NOT massively refactor the architecture unless necessary.