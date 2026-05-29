Final small production hardening pass.

Current implementation looks good.

Before production testing, please verify / improve these 2 remaining items:

1. Recipient Token Security Hardening

Current:
rid = base64url(ruleId:userId)

Improve slightly.

Use a signed token instead of plain encoded IDs.

Example:
HMAC/JWT style token using server secret.

Reason:
- prevents predictable decoding
- prevents token tampering
- safer for exposed email links

Keep lightweight.
No DB token system needed.

2. Real End-to-End Production Test

Run an actual deployed test.

Create:

- 2 projects
- multiple coordinators
- multiple facilitators
- mixed project assignments

Then verify:

✓ Send Now works  
✓ cron works  
✓ emails arrive  
✓ correct project link per user  
✓ coordinator/facilitator routing correct  
✓ ?rid= present  
✓ deadline enforcement works  
✓ expiration works  
✓ allowEdits works  
✓ send history logs correctly  
✓ no duplicate sends

After testing, provide:

- test results
- screenshots / logs summary
- remaining bugs (if any)
- final production readiness verdict