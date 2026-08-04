# Disposable MySQL migration verification — 2026-07-30

## Scope and isolation

- Repository: `gogamdo-homepage-release`
- Branch: `feature/homepage-office-positioning`
- Database server: local Homebrew MySQL 9.7.1
- Isolated data directory: `/tmp/gogamdo-mysql.OxbzhB` (deleted after verification)
- Bind: `127.0.0.1:43306` (closed after verification)
- Railway production DB, Railway Volume, DNS, and GCP were not accessed or modified.
- No production credentials or production data were used.

## Fresh database verification

On an empty `gogamdo_fresh` database:

1. First `pnpm db:migrate`: exit 0.
2. Required baseline verification: passed.
3. Migration history row count: 1.
4. Second `pnpm db:migrate`: exit 0.
5. History row count after reapply: still 1.
6. Total tables including `app_schema_migrations`: 122.

The first real run initially failed closed because the verifier found missing ORM-critical columns in `draft_images` and `insight_articles`. The fresh DDL was corrected and the database was recreated before the successful evidence above.

## Legacy fixture and failure recovery

A reduced legacy schema fixture contained representative rows for:

- `inquiries.status = quoted`
- `announcements.content` and `isActive = 0`
- `subscribers.isActive = 0`
- `estimates.minCost/maxCost`
- `draft_images.portfolioId`
- legacy `insight_articles.summary`, `coverImage`, and `readingTime`

The first legacy migration executed partial idempotent DDL, then failed schema verification before writing migration history. After implementing data-aware backfills, the same partially migrated database was retried successfully.

Verified preserved/mapped values:

```text
announcement=preserve announcement | no
subscriber_active=no
estimate=123456 | 234567
draft_image=1 | /uploads/portfolio/legacy.jpg
inquiry_status=in_progress
insight=preserve excerpt | /uploads/generated/legacy.jpg | 7 | preserve content
history_rows=1
```

A subsequent reapply returned exit 0 and the representative values were unchanged.

## Concurrent execution

Two real migration processes were started against a new empty `gogamdo_concurrent` database.

```text
process 1 exit=0
process 2 exit=0
migration history rows=1
orphan advisory lock release=NULL
```

This demonstrates advisory-lock serialization and no duplicate history row for this fixture.

## Production-bundle HTTP integration

The production bundle was run locally with:

- explicit persistent-style `STORAGE_DIR`
- the disposable fresh MySQL database
- local test-only JWT material
- no Forge remote-storage configuration

Observed:

```text
/healthz: 200
/readyz: 200, database=true, storage=true
published DB-referenced file: 200
private generated file: 404
public Cache-Control: public, max-age=0, must-revalidate
private Cache-Control: private, no-store
```

QA ports `43129` and `43306` were confirmed closed after cleanup.

## Automated verification

```text
Focused changed-area tests: 48/48 passed
Full Vitest: 1,167/1,167 passed
Suites: 465/465 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Full Vitest artifact: `/tmp/gogamdo-post-mysql-full.json`.

## Remaining release boundary

This verifies the migration machinery and representative legacy mappings, not the actual production schema or every production row shape. Before production migration:

1. Obtain an encrypted, checksummed independent backup.
2. Restore it into an isolated database and filesystem.
3. Run migration and verification against that restored copy.
4. Compare table/row counts and representative data checksums.
5. Resolve any production-only drift without modifying production.
6. Complete independent fail-closed review.

Production migration remains blocked until those gates pass.

## 2026-08-03 full-schema re-audit remediation

After independent review `deleg_a8d235ce` returned BLOCK, the candidate was strengthened and re-exercised on a new local disposable MySQL 9.7.1 server at `127.0.0.1:43308`.

### Authorization remediation

- Client notification read/delete now requires a verified active client and updates by both notification ID and client ID.
- Client profile mutations re-read the active client after JWT verification.
- Staff avatar persistence requires the authenticated staff namespace.
- Avatar removal persists SQL `NULL`.

### Migration contract remediation

- The checksum includes actual extended DDL, column patch data, indirect backfill helpers, the full verifier contract, and preflight helpers.
- The verifier derives the canonical contract from Drizzle: 121 application tables and 1,668 columns.
- Before history insertion it checks every canonical table/column for type, nullability, and primary-key status, plus data invariants.
- Unknown inquiry statuses and out-of-range estimate amounts abort without coercion or history insertion.
- Legacy narrowing and nullability changes use preflight queries before the canonical ALTER.

### Latest disposable MySQL evidence

```text
fresh apply: 0
fresh second apply: 0
fresh history rows: 1
fresh tables including migration history: 122

legacy apply: 0
legacy second apply: 0
legacy history rows: 1
legacy data unchanged after second apply: yes
representative values: in_progress | preserve announcement | no | 123456 | 1 | preserve excerpt

unknown status apply: failed as intended
unknown value after failure: mystery
unknown fixture history rows: 0

overflow apply: failed as intended
legacy amount after failure: preserved
canonical totals after failure: NULL | NULL
overflow fixture history rows: 0

concurrent process A: 0
concurrent process B: 0
concurrent history rows: 1
orphan advisory lock: none
concurrent tables including migration history: 122
```

### Latest automated verification

```text
Vitest suites: 467/467 passed
Vitest tests: 1,175/1,175 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Latest full-test artifact: `/tmp/gogamdo-final-fullschema-full-2.json`.

A new independent fail-closed review was dispatched as `deleg_be18d14f`. It returned BLOCK and its findings were remediated as documented below. Production release remains blocked until a subsequent review returns PASS and the production backup/isolated-restore gates are separately authorized and completed.

## 2026-08-03 `deleg_be18d14f` remediation

### Storage and public AI result

- Forge API credentials are now image-generation-only; storage always writes to the persistent local Volume and reads through application authorization.
- An AI style result is anonymously readable only when the exact URL is persisted in `style_recommendations.imageUrl`.
- An arbitrary file under the same `generated/` prefix remains private.

Production-bundle HTTP evidence:

```text
/healthz: 200
DB-referenced public style result: 200
public Cache-Control: public, max-age=0, must-revalidate
unreferenced generated object: 404
private Cache-Control: private, no-store
```

### Complete known previous-runtime fixture

A fixture copied from base commit `5886702` for `newsletter_subscribers`, `newsletter_campaigns`, and `site_settings` was migrated. The migration now adds every missing canonical column, preserves old campaign content as `customContent`, generates a random 64-character unsubscribe token when missing, and safely converges enum/type/nullability drift.

```text
previous-runtime apply: 0
second apply: 0
history rows: 1
data unchanged after second apply: yes
preserved values: Legacy Name | 64 | website | preserve campaign content | sent | 12 | {"enabled": true}
```

### Preflight and repair/retry evidence

```text
fractional estimate under permissive SQL mode: rejected
source values after failure: 0.50 | -1.50
history after failure: 0
application tables created before rejection: 0
repair to INT min/max and strict-mode retry: passed

70,000-byte LONGTEXT under permissive SQL mode: rejected
source bytes after failure: 70,000
history after failure: 0
application tables created before rejection: 0
repair to 65,535 bytes and strict-mode retry: passed
```

The only table added before those read-only preflights was `app_schema_migrations`; no application DDL or backfill ran.

### Immutable candidate failure injection

Test-only failpoints require both `NODE_ENV=test` and `ALLOW_MIGRATION_TEST_FAILPOINTS=true`; production cannot activate them accidentally. The unchanged candidate was forced to fail and then retried at four phases:

```text
after CREATE: history 0 -> retry passed -> history 1
after ADD COLUMN: history 0 -> retry passed -> history 1
after backfill: history 0 -> retry passed -> history 1
after canonical ALTER: history 0 -> retry passed -> history 1
all four: advisory lock released; final tables 122
```

### Ledger and checksum hardening

- Migration history must be an ordered prefix of the declared chain.
- Unknown future IDs, gaps/reordering, a longer ledger, duplicate declarations, and checksum mismatch fail closed.
- The executable `verifyLegacyBaselineSchema` implementation is included in the migration checksum payload and covered by regression tests.

### Latest verification

```text
Vitest suites: 467/467 passed
Vitest tests: 1,179/1,179 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
QA ports 43130 and 43309: closed
```

Artifacts:

- `/tmp/gogamdo-final-be18-remediation.json`
- `/tmp/gogamdo-final-be18-build.log`

## 2026-08-03 `deleg_1f3b4288` remediation

The review returned BLOCK for three runtime/auth concerns and one migration constraint concern. All four were remediated locally; release remains blocked pending a new independent PASS.

### Runtime and authentication

- `/readyz` now always probes `STORAGE_DIR`; Forge image-generation variables no longer affect storage readiness.
- Production-bundle verification with both Forge variables configured returned:

```text
HTTP 200
{"status":"ready","checks":{"database":true,"storage":true}}
```

- Registration, public resend-verification, password reset, admin resend, and admin bulk resend links now use only the trusted `PUBLIC_BASE_URL` origin.
- HTTP request `Origin`, `Referer`, and `Host` cannot influence emailed authentication links.
- A behavior test passed with all three headers set to `attacker.example`; the password-reset email received `https://kokamdo.co.kr`.
- Four unused duplicate `clientPipeline` notification procedures that accepted caller-supplied `clientId` were removed. The ownership-bound client notification API remains.

### ORM unique-constraint verification

- `ORM_SCHEMA_CONTRACT` now includes Drizzle column-level uniqueness in addition to table, column, SQL type, nullability, and primary-key state.
- Verification reads single-column unique indexes from `information_schema.STATISTICS`; composite uniqueness cannot falsely satisfy a column-level unique contract.
- Fresh `newsletter_subscribers.unsubscribeToken` DDL includes `UNIQUE`.
- Legacy preflight rejects duplicate non-null unsubscribe tokens before application DDL.
- A supported legacy table missing the constraint receives a unique index after token normalization.
- The expanded contract, query, and executable verifier remain in the migration checksum payload.

Disposable MySQL evidence:

```text
fresh unique-aware migration: passed
legacy missing unique constraint: passed; unique index count 1
duplicate legacy tokens: rejected
source after rejection: duplicate | duplicate
history after rejection: 0
application tables created before rejection: 0
repair and retry: passed
history after retry: 1
unique index count after retry: 1
```

### Latest full verification

```text
Vitest suites: 469/469 passed
Vitest tests: 1,185/1,185 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
QA ports 43131 and 43310: closed
```

Artifacts:

- `/tmp/gogamdo-final-1f3-remediation-2.json`
- `/tmp/gogamdo-final-1f3-build-2.log`

## 2026-08-03 `deleg_93b04c6e` remediation

The review returned BLOCK for two narrowly scoped defects; both were corrected locally and remain blocked pending a fresh independent PASS.

### Inactive client sensor access

- `clientDashboard.sensorTimeSeries` and `clientDashboard.zoneStats` now call the shared `requireActiveClient(ctx)` boundary before project assignment checks.
- Valid JWTs belonging to both `suspended` and `pending` clients with `assignedProjectIds=[7]` were exercised against both procedures; all four calls were rejected.
- The existing assigned-project authorization check remains after active-account verification.

### Prefix unique index mismatch

- Both the full ORM verifier and legacy unique-index helper now require `information_schema.STATISTICS.SUB_PART IS NULL`.
- A single-part prefix UNIQUE index is no longer accepted as a full-column ORM unique constraint.
- A disposable MySQL legacy fixture containing `UNIQUE(unsubscribeToken(10))` migrated successfully and retained the prefix index while adding the required full-column unique index.

```text
prefix legacy migration: passed
migration history: 1
prefix unique index count: 1
full-column unique index count: 1
```

### Latest full verification

```text
Vitest suites: 469/469 passed
Vitest tests: 1,189/1,189 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
Disposable MySQL port 43311: closed
```

Artifacts:

- `/tmp/gogamdo-final-93-remediation.json`
- `/tmp/gogamdo-final-93-build.log`

## 2026-08-03 `deleg_58b867a3` remediation

The review returned BLOCK for account-state reactivation and composite-index grouping. Both were corrected locally; release remains blocked pending a fresh independent PASS.

### Suspended client reactivation

- Email verification is centralized in `activatePendingClientByVerificationToken` and permits only the expected `pending` → `active` transition.
- Suspended and already-active accounts cannot use retained verification tokens to trigger an activation update.
- Public verification resend only rotates tokens for accounts that remain `pending` and unverified.
- The HTML GET verification endpoint and tRPC endpoint use the same state-transition helper.
- Client OAuth rejects any existing account not in `active` or `pending` state before provider linkage, state update, cookie issuance, or redirect to `/my`.
- Behavior tests prove suspended OAuth receives `account_suspended`, no cookie, and no DB update; suspended email verification/resend does not change status or token.

### Composite UNIQUE grouping

- Uniqueness queries now group every index part before evaluating prefix metadata.
- Canonical recognition requires `COUNT(*) = 1 AND MAX(SUB_PART) IS NULL`.
- A disposable MySQL fixture with `UNIQUE(unsubscribeToken, source(10))` was not recognized before migration; migration added a separate full-column unique index while retaining the two-part composite index.

```text
composite recognized before migration: 0
migration exit: 0
full-column unique after migration: 1
composite index parts retained: 2
history: 1
```

### Latest full verification

```text
Vitest suites: 471/471 passed
Vitest tests: 1,194/1,194 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
Disposable MySQL port 43312: closed
```

Artifacts:

- `/tmp/gogamdo-final-58-remediation.json`
- `/tmp/gogamdo-final-58-build.log`

## 2026-08-03 `deleg_b40dfbc6` result and remediation

- Migration/schema/data-integrity independent verdict: **PASS**.
- Runtime/auth independent verdict: **BLOCK** for public verification-token disclosure and non-atomic pending activation.
- Public registration and resend responses no longer include `emailVerifyToken`; verification capability is delivered only through the trusted email channel.
- Verification activation is one conditional database UPDATE requiring matching token, `status = pending`, `emailVerified = no`, and unexpired token. Success requires exactly one affected row.
- This removes the read/update race in which a concurrent administrator suspension could be overwritten.

Disposable MySQL behavior:

```text
pending token activation: true
already-suspended token activation: false
concurrent verification + suspension: final status suspended
QA exit: 0
port 43313 after cleanup: closed
```

Latest verification:

```text
Vitest suites: 473/473 passed
Vitest tests: 1,196/1,196 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Artifacts:

- `/tmp/gogamdo-final-b40-remediation.json`
- `/tmp/gogamdo-final-b40-build.log`

## 2026-08-03 `deleg_e0ff91d2` result and remediation

- Migration/schema/data-integrity independent verdict remained **PASS**.
- Runtime/storage verdict was **BLOCK** for cross-table numeric-ID collision on client floor plans and the email/password login redirecting into a staff-authenticated legacy portal.
- `client_projects.userId` is a `users`-table principal, not a `clients_auth.id`. Because no explicit relation exists, DB-backed `clients_auth` reads of `client-plans/*` now fail closed rather than compare unrelated IDs. Staff private reads remain available.
- Email/password client login now redirects to `/client/dashboard`, which uses `clientAuth.me` and `clientDashboard`; it no longer redirects to `/portal`, whose legacy `clientPipeline` surface requires a staff session.

Latest verification:

```text
Focused storage/client auth: 6 files, 99 tests passed
Vitest suites: 473/473 passed
Vitest tests: 1,198/1,198 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Artifacts:

- `/tmp/gogamdo-final-e0-remediation.json`
- `/tmp/gogamdo-final-e0-build.log`

## 2026-08-03 `deleg_9e20148c` result and remediation

- Migration/schema/data-integrity independent verdict remained **PASS**.
- Runtime verdict was **BLOCK** because `/client/dashboard` was absent from the production private-SPA allowlist and client OAuth still redirected to the staff-authenticated legacy `/my` portal.
- `/client/dashboard` is now an explicit non-indexable production SPA route.
- Password and Google/Naver/Kakao client OAuth success flows all converge on `/client/dashboard`, which consumes `client_token` through `clientAuth.me` and `clientDashboard`.
- Actual production Express probe after build:

```text
GET /client/dashboard: 200
GET /not-a-real-route: 404
GET /healthz: 200
QA port 43132 after cleanup: closed
```

Latest verification:

```text
Vitest suites: 473/473 passed
Vitest tests: 1,199/1,199 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Artifacts:

- `/tmp/gogamdo-final-9e-remediation.json`
- `/tmp/gogamdo-final-9e-build.log`

## 2026-08-03 `deleg_63e060db` result and remediation

- Migration/schema/data-integrity independent verdict remained **PASS**.
- Runtime/auth verdict was **BLOCK** for public staff registration and predictable, browser-unbound OAuth state.
- Removed unauthenticated `POST /api/auth/register`; existing staff email/password login remains available only for provisioned users.
- OAuth is now server-initiated through `/api/auth/:provider/start?accountKind=...` with a cryptographically random 256-bit state, short-lived HttpOnly SameSite=Lax browser cookie, exact provider/account-kind binding, validation and cookie consumption before token exchange.
- Google authorization now uses PKCE S256 and sends its verifier during token exchange.
- Client code no longer constructs provider authorization URLs or sends predictable `staff`/`client` values as OAuth state.
- OAuth fallback callback URLs use trusted `PUBLIC_BASE_URL`, not the request Host.

Actual production Express probe:

```text
GET /healthz: 200
POST /api/auth/register: 404
GET /api/auth/google/start?accountKind=client: 302
OAuth state cookie: present
Google PKCE S256: present
GET callback with code/state but without browser-bound cookie: 400
QA port 43134 after cleanup: closed
```

Latest verification:

```text
Focused OAuth/auth tests: 11/11 passed
Vitest suites: 475/475 passed
Vitest tests: 1,202/1,202 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Artifacts:

- `/tmp/gogamdo-final-63-remediation.json`
- `/tmp/gogamdo-final-63-build.log`

## 2026-08-03 `deleg_63ed436a` result and remediation

- Migration/schema/data-integrity independent verdict remained **PASS**.
- Runtime/auth verdict was **BLOCK** because Kakao email-based account linking did not require both provider email validity and verification flags.
- `OAuthProfile` now carries an explicit `emailVerified` boolean.
- Email-based existing-account lookup, staff invitation/master matching, and new client/staff creation occur only when the provider positively asserts a verified email.
- Kakao requires both `is_email_valid === true` and `is_email_verified === true`.
- Google requires `verified_email === true`.
- Naver does not provide a relied-upon positive verification assertion in the current profile contract, so new email-based linking/creation fails closed; already provider-ID-linked Naver accounts remain able to authenticate.
- False or missing Kakao verification flags cannot perform client lookup/linking, staff invitation matching, account creation, or session issuance.

Latest verification:

```text
Focused OAuth email-verification tests: 12/12 passed
Vitest suites: 477/477 passed
Vitest tests: 1,206/1,206 passed
Failed: 0
Pending: 0
TypeScript: passed
Production build: passed
git diff --check: passed
```

Disk recovery performed before final verification:

```text
Removed only regenerable cache: models--tencent--Hunyuan3D-2mv
Freed space: approximately 9.2 GiB
Available after cleanup: 9.3 GiB
Project/customer/production data removed: none
```

Artifacts:

- `/tmp/gogamdo-final-63ed-remediation.json`
- `/tmp/gogamdo-final-63ed-build.log`

## 2026-08-03 `deleg_f82140e1` final independent gate

Both independent release boundaries passed on a stable candidate:

```text
storage/auth/runtime: PASS
migration/schema/data-integrity: PASS
release blockers: 0
candidate SHA-256: 09bc14d410be8ae676b9c7dadb127325ce053d5f93e1b48c6aacfda572ca0b67
head: 5886702dd2d68019076a55280bbf071c4ac9dd2c
production accessed by reviewers: no
```

The stabilization code gate is complete. Production backup/export, isolated restore, GCP billed resources, deployment, and DNS remain separate approval boundaries.
