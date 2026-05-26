Use a CONTROLLED JSON-DRIVEN mock data approach instead of fully random Faker-only generation.

Goal:

I want editable predictable test users.

Create:

mock-data-config.json

and a generator/seed script that reads from this file.

Do NOT hardcode everything directly inside Faker logic.

--------------------------------------------------
USER FORMAT RULES
--------------------------------------------------

Roles:

Admins:
username format:

admin1
admin2
admin3
admin4

email format:

mailtesterinfinity+a1@gmail.com
mailtesterinfinity+a2@gmail.com
mailtesterinfinity+a3@gmail.com
mailtesterinfinity+a4@gmail.com

Coordinators:

username format:

coordinator1
coordinator2
...
coordinator50

email format:

mailtesterinfinity+c1@gmail.com
mailtesterinfinity+c2@gmail.com
...
mailtesterinfinity+c50@gmail.com

Facilitators:

username format:

facilitator1
facilitator2
...
facilitator50

email format:

mailtesterinfinity+f1@gmail.com
mailtesterinfinity+f2@gmail.com
...
mailtesterinfinity+f50@gmail.com

--------------------------------------------------
JSON CONFIG FILE
--------------------------------------------------

Create:

mock-data-config.json

Put ALL editable testing configuration inside it.

Example structure:

{
  "admins": 4,
  "coordinators": 50,
  "facilitators": 50,
  "projects": 8,
  "reports": 2000,
  "emailPrefix": "mailtesterinfinity",
  "usernamePatterns": {
    "admin": "admin",
    "coordinator": "coordinator",
    "facilitator": "facilitator"
  }
}

or improve structure if needed.

I want to be able to modify counts later without editing generator logic.

--------------------------------------------------
SEED SCRIPT
--------------------------------------------------

Create a proper seed script.

Example:

npm run seed:mock

Requirements:

- read config from mock-data-config.json
- generate predictable usernames/emails
- use Faker ONLY for realistic text fields
  (names, report titles, descriptions, timestamps, etc.)

NOT for usernames/emails.

Use deterministic role naming rules above.

--------------------------------------------------
PROJECT ASSIGNMENTS
--------------------------------------------------

Current system has ~8 projects/teams.

Mix and distribute projects realistically across coordinators/facilitators.

Prefer config-driven approach.

--------------------------------------------------
OTP HANDLING
--------------------------------------------------

Current signup uses Brevo verification.

For LOCAL TESTING:

DO NOT use real emails.

Seed users directly into DB with verified state enabled.

Do not break production auth.

--------------------------------------------------
OUTPUT
--------------------------------------------------

Generate:

1. mock-data-config.json
2. seed script(s)
3. instructions to run:
   npm run seed:mock
4. example generated dataset preview

Optional:
allow reseeding/resetting DB.

--------------------------------------------------
TESTING INTEGRATION
--------------------------------------------------

After seeding, use generated users for:

- load testing
- login testing
- dashboard testing
- report testing
- pagination/search testing

Create/update:

TEST_REPORT.md

with:
- generated counts
- tools used
- commands
- observations
- bottlenecks
- results

Use LOCAL TESTING only.