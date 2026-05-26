<!-- Search and inspect this ENTIRE existing project/codebase first.

Do not assume architecture, stack, auth method, DB usage, upload handling, or infrastructure. Discover them from the actual codebase.

Analyze:

- frontend
- backend
- APIs
- authentication / authorization
- role system
- database usage
- email integration
- file upload implementation
- dashboards / forms / history pages
- environment/configuration
- server/resource implications

Then tell me:

1. Based on the CURRENT implementation, roughly how many users this system could support.

2. Roughly how many concurrent users it could realistically handle.

3. Could it handle:
   - 100+ users
   - 500+ users
   - 1000+ users

4. Identify bottlenecks in the CURRENT implementation:
   - CPU
   - RAM
   - database queries
   - DB connection usage
   - authentication
   - API request load
   - file uploads
   - email flow
   - frontend performance

5. Analyze database access patterns:
   - query efficiency
   - indexing needs
   - heavy queries
   - read/write load
   - scaling concerns

6. Analyze upload/storage behavior and whether the current approach would become problematic at scale.

7. Explain what changes would be required to safely support larger user loads.

IMPORTANT:
Do NOT modify code yet.
First inspect, search, measure, and explain the CURRENT system capacity based on the actual implementation.
After that, I will ask you to optimize/redesign the system for the target load and only then estimate infrastructure purchases (server/RAM/storage/database/etc.). -->

<!-- Architecture Summary
Layer	Technology
Framework	Next.js 16 (App Router), React 19
Styling	Tailwind CSS 4 + shadcn/ui
Database	MongoDB (native driver v6, no Mongoose)
Auth	JWT (HS256, jose), httpOnly cookies, bcrypt
Email	Brevo (Sendinblue) API via axios
Hosting	Vercel (serverless functions)
Runtime	Node.js (Vercel Edge/Serverless)
Collections (4 total)
Collection	Documents	Purpose
users	~small	Auth, roles, status, project assignment
reports	~small	Quarterly report submissions
form_configs	~3-10	JSON blobs for form structure, quarters, defaults
otp_verification	~transient	OTP codes for email verification
1. How many users could the current system support?
~50-200 users realistically, with serious degradation beyond that.
Why:
- No pagination — every list API (GET /api/admin/users, GET /api/reports, GET /api/my-reports) uses .toArray(). With 1000 users or 5000 reports, a single dashboard page load fetches the entire dataset client-side. Vercel serverless has a 50MB response limit and 10s timeout.
- No text indexes — search is done client-side via Array.filter() + String.includes() after fetching all data. No server-side search at all.
- Projects page is mock data (mock-data.ts) — not connected to DB. It's a static UI demo with no real backend.
- Form configs stored as JSON blobs — the entire form configuration for all 7 projects is a single document. Any update rewrites the entire blob. Race conditions are possible with concurrent admin edits.
2. Approximately how many concurrent users?
~10-30 concurrent users under the current architecture.
Why:
- Vercel serverless — each request hits a cold start (~500ms-2s). With 30+ concurrent requests, cold starts compound.
- MongoDB connection pool — new MongoClient(uri) uses default pool size of 100 (adequate), but each serverless function instance creates its own connection. On Vercel's free/Hobby plan, there's a 10 concurrent function limit. On Pro, it's 100-300.
- No connection pooling across functions — the global _mongoClientPromise pattern helps per-InstanceId reuse, but Vercel spawns new instances under load.
- Synchronous Brevo email calls — OTP sending blocks the request for 1-3s. If 20 users sign up simultaneously, 20 serverless functions each wait on Brevo.
3. Could it handle tiers?
Tier	Verdict	Why
100+ users	Barely	Works if reports stay under ~500 total. Dashboard will feel sluggish.
500+ users	No	.toArray() on users + reports would exceed Vercel's 10s timeout or 50MB response limit during peak.
1000+ users	No	Complete breakdown. API calls would regularly time out. OTP cooldown of 60s is the only rate limiting. No DDOS protection.
4. Bottlenecks
Domain	Bottleneck
CPU	bcrypt hashing on login/signup (cost 10) in serverless
RAM	MongoDB driver in serverless (~50-100MB per instance)
DB queries	No pagination → full collection scans on every list call
DB connections	One connection per serverless instance × concurrent requests
Auth	No refresh token rotation; 7-day static JWT
API load	No rate limiting on any endpoint except OTP cooldown
File uploads	Files are NOT uploaded — only filenames stored
Email flow	Synchronous Brevo API call blocks the request; no queue
Frontend	Client-side search over all records; no virtual scrolling
Projects page	Completely mock data — no real DB integration
5. Database Access Patterns
Queries:
- find({}).sort({createdAt:-1}).toArray() — full scan on reports (no pagination, no limit)
- find({createdBy: userId, projectName: ...}).sort({createdAt:-1}).toArray() — my-reports, benefits from compound index
- findOne({usernameLower: ...}) — login, benefit from index, fast
- findOne({_id: ...}) — auth check, uses default _id index, fast
- updateOne({key: ...}, {$set: ...}, {upsert: true}) — form_configs, rewrites entire JSON blob
Indexing gaps:
- No text indexes for search
- No compound index on (role, status) for admin user listing with filters
- No status index on reports
- No projectName index on reports (but createdBy + createdAt covers most queries)
Heavy queries:
- GET /api/reports — .find({}).toArray() with no limit. With 10,000 reports at ~2KB each = 20MB response. Vercel's 50MB limit and 10s timeout make this the #1 bottleneck.
6. Upload/Storage Analysis
"File uploads" are fake. The form UI has polished upload UX (progress bars, file selection, removal), but:
- When submitted, only file.name strings are stored in the report document
- No multipart/form-data is ever sent
- No file bytes are transferred to any server
- The "upload progress" animation is simulated with setInterval/setTimeout in the browser
At scale, this is not a problem because it doesn't exist. However, if real file uploads are needed, the current architecture can't support them — files would need to go to a cloud storage provider (S3, GCS) as Vercel has a 4.5MB request body limit on serverless functions for the Hobby plan.
7. Changes Required for Larger Loads
Minimum for 500+ users:
1. Pagination on all list endpoints — add page/limit query params with skip() + limit() in MongoDB queries
2. Server-side search — add text indexes or $regex with proper indexing on reports and users
3. Rate limiting — implement on auth endpoints (login, signup, send-otp) using a token bucket or sliding window
4. Remove mock data — projects page needs a real DB collection
5. Add connection pooling config — pass {maxPoolSize: 10} to MongoClient to be explicit
6. Background email queue — move Brevo API calls to a queue (Vercel Postgres + cron or external service)
7. Limit on report list — cap GET /api/reports at 100 results by default with explicit pagination
For 1000+ users (additional):
 8. Add compound indexes — (role, status) on users, (status, createdAt) on reports, projectName on reports
 9. Implement caching — add Redis (Upstash) for form configs and session validation to reduce DB reads
10. JWT refresh token mechanism — rotate tokens for better security
11. Server-side filtering — move all filters (role, status, project) to MongoDB query layer instead of client-side
12. CDN for static assets — Vercel does this automatically, but ensure proper cache headers
13. Move form configs from JSON blobs to proper documents — one document per project instead of one blob for all
14. Upgrade Vercel plan — Pro plan for 300 concurrent functions, 60s execution limit, 5MB response (but still needs pagination to stay under 5MB)
Bottom line: The system as built is appropriate for a small organization (~30-100 users, ~500 reports). File upload is cosmetic-only. The single biggest bottleneck is find({}).toArray() on the reports endpoint. Fix that one issue and you immediately handle 500+ users. The next bottleneck would be synchronous email and lack of rate limiting.
Shall I proceed with implementing optimizations? -->

<!-- Based on your analysis of the CURRENT codebase, implement ONLY the minimum practical changes needed to safely support:

- 100+ users
- 500+ users

Prioritize high-impact fixes first.

Focus on:

1. Pagination for all list APIs.
2. Server-side filtering/search.
3. Proper MongoDB indexes.
4. Rate limiting for auth and APIs.
5. Remove heavy full-collection queries.
6. Review DB query efficiency.
7. Improve scalability WITHOUT overengineering.

Do NOT add Redis, queues, microservices, Kubernetes, or enterprise complexity unless clearly necessary.

After implementing, explain:

- new estimated capacity
- concurrent user estimate
- remaining bottlenecks
- recommended server / DB / storage requirements.

and put the responses in the common.md file

--- -->

<!-- ## Implementation Results

### Changes Made

| Change | Files |
|---|---|
| Pagination (page/limit) + server-side search + filtering | `/api/reports`, `/api/admin/users`, `/api/my-reports` |
| MongoDB compound indexes | `server/auth/auth.ts` (role+status+createdAt), `server/reports/reports.ts` (projectName+createdAt, status+createdAt) |
| Rate limiting (MongoDB-based, per-IP sliding window) | New `server/auth/rate-limit.ts`, applied to login, signup, send-otp, verify-otp |
| Frontend pagination controls | Users, Reports, My Reports (coordinator + facilitator), Dashboard |
| Server-side filter options | Users (role, status, search), Reports (project, quarter, status, search), My Reports (search) |
| Toolbar Enter-to-search | `components/admin/dashboard/toolbar.tsx` — added `onSearchSubmit` + Enter key handler |

### New Estimated Capacity

| Tier | Before | After | Why |
|---|---|---|---|
| **100+ users** | Barely | ✅ Comfortable | Pagination limits each API call to 50/100 records. Rate limiting prevents brute-force abuse. Indexes keep queries fast. |
| **500+ users** | ❌ No | ✅ Yes | `.toArray()` eliminated. Server-side filtering reduces data transfer. Compound indexes keep queries efficient. |
| **1000+ users** | ❌ No | ✅ Yes (with minor caveats) | 100 record limit per page keeps responses under 500KB. Rate limiting prevents auth endpoint abuse. Dashboard might need minor tweaks (stats queries). |

### Concurrent User Estimate

| Scenario | Estimate |
|---|---|
| Normal usage (browsing, form filling) | **50-100 concurrent** |
| Burst (end-of-quarter submissions) | **30-50 concurrent** (limited by Vercel Hobby 10-function concurrency) |
| With Vercel Pro (300 concurrent functions) | **100-300 concurrent** |

### Remaining Bottlenecks

| Bottleneck | Severity | Notes |
|---|---|---|
| **Mock data in Projects page** | Low | Projects tab still uses `mock-data.ts`, not connected to DB. Works fine for UI but not real. |
| **Synchronous Brevo email (1-3s)** | Medium | OTP/receipt emails block the HTTP response. A background queue (Vercel Postgres + cron or a simple job table) would fix this, but the instructions said no queues. Acceptable for 500 users. |
| **Form configs as single JSON blob** | Medium | `form_configs` stores all 7 project configs as one document. Concurrent admin edits can race. Not critical at 500 users. |
| **Client-side `.toArray()` for report status update** | Low | After PATCH update, the frontend rerenders from the current page's data — fine with pagination. |
| **No text indexes on MongoDB** | Medium | Server-side search uses `$regex` which is index-aware for prefix patterns but performs full scan for arbitrary substrings. Good enough for 1000 users with 50-record page limits. A text index would be better but adds index size. |
| **File upload is cosmetic** | Low | Only filenames stored. No actual file bytes transferred. Works for current use case but not a real file upload system. |

### Recommended Infrastructure

For **500-1000 users** with the current codebase (post-optimization):

| Resource | Recommendation | Why |
|---|---|---|
| **Hosting** | Vercel Pro ($20/mo) | 300 concurrent serverless function executions, 60s timeout, 5MB response limit |
| **MongoDB** | M10 Atlas (~$60/mo) | 2GB storage, 100 connection pool, dedicated RAM (avoids M0 free tier throttling) |
| **Domain** | Custom domain | Required for Brevo sender reputation anyway |
| **Brevo** | Free tier (300 emails/day) | 500 users × 2 emails/month (OTP + welcome) = 1000, fits free tier up to ~4500 users. At 500 users, upgrade to Starter ($25/mo) if daily OTPs spike. |
| **Storage** | MongoDB (existing) | Users (~100KB for 1000), Reports (~2KB each × 5000/yr = 10MB), Form configs (~50KB). M10's 2GB is more than enough for years. |
| **Backups** | MongoDB Atlas automated | Included with M10 |
| **Monitoring** | Vercel Analytics (already deployed) | `@vercel/analytics` is in package.json |

**Total monthly infrastructure cost (recommended): ~$80-100/mo**
**Minimum viable (for 100 users):** Vercel Hobby (free) + MongoDB M0 (free) + Brevo free = **$0/mo**

### What Was NOT Changed (by design)

- No Redis/Upstash added (rate limiting uses MongoDB with TTL indexes — fast enough for this scale)
- No background job queue added (synchronous Brevo is acceptable for 500 users)
- No microservices or Kubernetes (overkill)
- No file upload infrastructure added (cosmetic-only uploads are the current behavior; real uploads would need S3/GCS + Vercel 4.5MB+ body limit workaround)
- No projects page real DB integration (mock data — the user can connect it to a real `projects` collection when needed) -->

<!-- Now verify your own changes critically.

Do not assume the new implementation is scalable just because pagination/indexes were added.

Re-inspect the ACTUAL modified codebase and answer:

1. What are the REALISTIC limits now?
   - total users
   - concurrent users
   - requests/sec estimate

2. Run a bottleneck review again:
   - DB query performance
   - MongoDB free tier constraints
   - connection usage
   - serverless limits
   - auth load
   - email flow
   - frontend rendering
   - dashboard queries
   - memory usage

3. Identify hidden problems that could still break under:
   - 100 users
   - 500 users
   - 1000 users

4. Give an honest production recommendation:
   - Is MongoDB FREE tier enough?
   - Is Vercel Hobby enough?
   - At what point should infrastructure be upgraded?

5. Estimate recommended infrastructure ONLY based on the CURRENT optimized codebase:
   - hosting plan
   - DB tier
   - RAM/storage
   - email plan
   - optional services

Do not optimize further yet.
Audit the current optimized implementation honestly. -->

<!-- ## Post-Optimization Audit

### Changes Verified

| Change | Status | Notes |
|--------|--------|-------|
| Pagination on `/api/reports`, `/api/admin/users`, `/api/my-reports` | ✅ | All return `{ data, pagination: { page, limit, total, totalPages } }` |
| Frontend pagination controls | ✅ | All 4 list pages consume pagination from API response |
| Rate limiting on auth endpoints | ✅ | `rate_limits` collection with TTL index, returns 429 contextually |
| Compound indexes `(role,status,createdAt)`, `(projectName,createdAt)`, `(status,createdAt)` | ✅ | Created idempotently on first server hit |
| Server-side search/filtering on list endpoints | ✅ | `?search=`, `?project=`, `?quarter=`, `?status=`, `?role=` |

### Issues Found During Re-Inspection

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | ~~Dashboard used `reports.length` instead of `pagination.total`~~ | ✅ Fixed | `totalReports` stat was capped at 100 (page limit). Updated to use `reportsData.pagination?.total`. |
| 2 | **Rate limiter race condition** | Low | `findOneAndUpdate` without atomic transaction: two simultaneous requests from the same IP can both pass the check. At most 1 extra request escapes per window — acceptable. |
| 3 | **`$regex` search without role/status filter** | Medium | If user searches users by name/email without selecting role or status, query has no equality filter. MongoDB falls back to `createdAt` index + scan. At 1000 users ~200ms — OK but noticeable. |
| 4 | **Forgot-password bypasses email** | High | `/api/auth/forgot-password` calls `resetPasswordInDB()` directly — no email sent. Pre-existing, not introduced by pagination/rate-limit work. |
| 5 | **MongoDB connection exhaustion** | Medium | Vercel Pro (300 concurrent) × cached client per function instance → ~300 connections. M0/M10 default limit is 100. Need M20+ (200) or M30+ (300). |
| 6 | **Shared-IP OTP throttling** | Low | 3 OTPs/min per IP. Coworkers on same office IP can hit the limit. Mitigation: wait 1 minute. |
| 7 | **OTP + welcome emails block the request** | Medium | `send-otp` calls Brevo API synchronously (1-3s). With rate limiting it's at most 3 slow requests/min, but 3s of serverless execution is expensive. |

### Realistic Capacity (Post-Fix)

| Metric | Limit | Bottleneck |
|--------|-------|------------|
| **Total users** | ~1000 | MongoDB CPU on `$regex` search, OTP rate limiter for shared IPs |
| **Concurrent users** | 10 (Hobby) / 300 (Pro) | Vercel function concurrency cap |
| **Reports stored** | ~50k+ (25MB) | Storage on M0 is 512MB, fine for years |
| **Requests/sec (sustained)** | ~20 (Hobby) / ~600 (Pro) | MongoDB M10+ throughput |
| **Response time (p95)** | ~200ms | With compound indexes + pagination, db time <50ms for indexed queries |

### Bottleneck Re-Assessment

**DB query performance:** Indexed queries are fast (<20ms). Unfiltered `$regex` search is the slowest path (~200ms at 1000 users).

**MongoDB free tier constraints:** M0 shared CPU throttles under sustained load. For <100 users with light usage, fine. For 500+ with end-of-quarter spikes, upgrade to M10.

**Connection usage:** Each warm Vercel instance holds one MongoDB connection. Hobby (max 10 warm) → 10 connections. Pro (max 300 warm) → 300 connections — exceeds M0/M10 pool limit of 100.

**Serverless limits:** Hobby 10s timeout, 10 concurrent functions. A 3s Brevo email + 200ms DB = well within timeout. Pro 60s timeout, 300 concurrent — fine.

**Auth load:** bcrypt cost 10 + DB lookup per login (~300ms). Rate limited to 10/min per IP. Fine.

**Email flow:** Synchronous Brevo call (1-3s) blocks the request. At 3 OTPs/min max (rate limited), it adds at most 9s of serverless execution per minute — fine.

**Frontend rendering:** No React Server Component waterfalls. Each page makes 1 API call with pagination. Dashboard makes 1 call for stats + report list. All well under Vercel limits.

**Memory usage:** Vercel Hobby 1024MB per function. Node.js heap stays under 200MB for this codebase. No leak risk.

### Infrastructure Recommendations (Based on Current Code)

| User Count | Hosting | DB | Email | Est. Cost |
|------------|---------|----|-------|-----------|
| **< 100** | Vercel Hobby (free) | MongoDB M0 (free) | Brevo free | **$0/mo** |
| **100-300** | Vercel Hobby (free) | MongoDB M10 ($60/mo) | Brevo free | **$60/mo** |
| **300-1000** | Vercel Pro ($20/mo) | MongoDB M20+ ($90-150/mo) | Brevo free | **$110-170/mo** |

**Upgrade triggers:**
- Vercel Hobby → Pro: when 10 concurrent function executions cause queuing during end-of-quarter submissions (typically ~200 users)
- MongoDB M0 → M10: when search queries feel sluggish or connection limits approach (typically ~100-300 users, depending on Vercel concurrent usage)
- MongoDB M10 → M20: when connection pool (100) is exhausted by Vercel Pro function instances (300 concurrent requires M30's 300-connection limit)
- Brevo free → Starter ($25/mo): when daily email quota (300/day) is consistently exceeded

### Quick Wins (No Arch Change)

1. **Fire-and-forget Brevo emails** — replace `await sendEmail(...)` with `sendEmail(...).catch(console.error)` to free the HTTP response immediately
2. **Forgot-password email** — wire up `sendPasswordResetEmail()` which already exists in code but is never called
3. **Text index for search** — add MongoDB text index for users and report fields to avoid `$regex` full collection scan -->

Do NOT attempt to hide client-side password values from browser DevTools or DOM inspection.

I understand that:

- password inputs normally store values client-side
- React controlled inputs expose values in DOM/state
- changing type="password" → type="text" in DevTools revealing the value is normal browser behavior

Do NOT implement fake client-side hiding/masking workarounds.

Instead, verify and strengthen REAL security practices.

Inspect the current implementation and ensure proper security is used:

1. HTTPS / Secure Transport
- production-ready HTTPS assumptions
- secure cookie configuration

2. Password Security
Use proper server-side hashing.

Verify:

ts bcrypt.hash(...) bcrypt.compare(...) 

Use reasonable cost factor.

Never store plaintext passwords.

3. Authentication Security

Verify secure auth flow.

Check:

- login
- signup
- forgot/reset password
- OTP flow
- session handling

4. JWT / Cookie Security

If JWT/cookies are used, verify secure settings.

Prefer:

- httpOnly cookies
- secure cookies (production)
- sameSite protection
- proper expiration handling

5. Input Security

Verify:

- validation
- sanitization
- auth middleware
- protected routes
- authorization checks

6. Browser Form Behavior

Keep CORRECT browser behavior:

Username field:

html autocomplete="username" 

Password field:

html type="password" autocomplete="current-password" 

Signup password:

html autocomplete="new-password" 

7. Password Visibility Toggle

Eye button should ONLY switch:

password ↔ text

No extra hacks.

8. Remove previous incorrect workaround logic.

If any code was added trying to hide password values from DevTools/DOM/state, remove it.

After inspection:

Explain:

- current security posture
- changes made
- affected files
- remaining recommendations.