# Fatortak security, currency and UI upgrade

Implemented locally on 18 October 2026 across the existing frontend and backend. Neither repository was pushed or deployed. Existing application `.env` files were retained; no existing application database was connected to or migrated. All database writes during verification used a separate MongoDB process on port 27028, under ignored backend `.test-data/` directories.

## Recovery and implementation

Frontend baseline: Git HEAD `aa7fbcf`; pre-existing `.gitignore` and ESLint edits plus the unrelated untracked filename were preserved. Source snapshots of both original working trees are in ignored `.implementation/upgrade-frontend-baseline.json` and `.implementation/upgrade-backend-baseline.json`; each `files` map stores relative paths and base64 content, excluding secrets, Git internals, dependencies and generated files. Backend had no Git repository: a separate repository and source checkpoint `a138560` were created before application edits. These snapshots supplement Git; never restore them over current work without reviewing differences.

The existing React/Vite pages, Express route/controller architecture, Mongoose relationships, personal/business separation and dictionary-based Arabic/English system remain in place. See `IMPLEMENTATION_PLAN.md` for discovery, risks and sequencing.

## Authentication and API security

- Thirty-minute, fixed-expiry opaque sessions replace seven-day bearer JWTs. The browser receives a random 256-bit HttpOnly cookie; MongoDB stores only its SHA-256 hash. JWT issuance/acceptance and the unused dependency/helper were removed after verifying the replacement. Existing JWT logins require one new sign-in.
- Development uses `fatortak.sid`, HttpOnly, SameSite=Lax, HTTP-compatible. Production uses `__Host-fatortak.sid`, Secure, HttpOnly, path `/`, no Domain. SameSite is configurable and production requires explicit HTTPS origins. Use the same hostname consistently locally: localhost and 127.0.0.1 have different cookies.
- GET `/api/auth/csrf` obtains a synchronizer token with an anonymous ten-minute session when needed. Every state-changing API request, including login/register/logout, requires `X-CSRF-Token` matching that cookie's server-side session. Anonymous tokens rotate on authentication; old sessions are deleted. Frontend CSRF tokens live only in memory. Rejected CSRF checks may retry once after initialization; application failures are never replayed automatically.
- POST `/api/auth/logout` deletes the current server session and clears its cookie. Email/password updates require the current password; password changes revoke all other sessions and issue a fresh one. GET `/api/users/me` restores a session without exposing hashes. Expired dates are checked on every request independently of MongoDB TTL cleanup.
- Bcrypt cost 12 is retained. New passwords require at least 12 characters and at most 72 UTF-8 bytes. Existing shorter passwords can still log in. Unknown-account logins perform a dummy bcrypt comparison and return the same invalid-credentials message. Registration retains immediate sign-in and returns a generic duplicate-details conflict; full registration-enumeration resistance would require a different email-verification flow.
- Credentialed CORS accepts an explicit origin list; untrusted browser origins are rejected. Helmet, disabled framework headers, no-store API responses, 64KB JSON limits, a 1,000-request/15-minute global limit and 50 login/register attempts/15 minutes per IP are added. Trusted proxy hops must be explicitly configured between 1 and 5.
- Zod validates allowed request fields, nested invoice items, bounded scalar queries, reference IDs, dates, amounts and currencies. Unknown fields and MongoDB operators are rejected. Server roles/ownership determine access; client user IDs, roles and amountMinor cannot be assigned. Existing owner-scoped writes and customer/supplier checks are retained and tested.
- Safe errors omit stack traces/internal server messages. Audit events record event name, user ID, status and timestamp; no passwords, tokens, cookies, bodies, emails or query strings. React renders record text without HTML injection. CSV cells protect against spreadsheet formula injection.

## Currency and financial rules

- New Expense, BusinessExpense, Invoice and Budget records require an explicit `USD` or `ILS` currency and retain the original major-unit `amount`. Integer `amountMinor` is added for known values. Currency has **no default on financial models**. The user preference defaults to USD only for new entry/display convenience, never to classify old records.
- Decimal arithmetic uses round-half-up. Amounts have at most two decimals; quantities support three. Each invoice line is rounded to cents before summing, and server totals override client-supplied totals when items exist. Existing invoice status behavior remains, with overdue status derived during reads instead of GET requests changing stored records.
- Original currencies cannot be changed through normal edits. Unknown-currency records remain readable/deletable and are explicitly marked; financial editing is disabled until evidence-based migration. No profile currency is used to infer a legacy transaction currency.
- The header saves `User.preferredCurrency`. Switching refreshes data without a full page reload. Original rows show their original amount and, where possible, an approximate conversion. Budgets, personal summaries/categories/trends, business dashboards and monthly reports value each record in a single display currency before summing.
- Unknown currencies or unavailable conversions produce explicit completeness metadata and withhold affected totals (`null`), rather than ignoring records or mixing unlike amounts. There is no fictional zero or fallback exchange rate.
- Only the backend contacts `https://api.frankfurter.dev/v2/rate/USD/ILS`. The service validates dates/currencies/positive rates, deduplicates concurrent fetches, caches for one hour, times out after six seconds and backs off for one minute on failure. Observations more than seven calendar days old are rejected. Both the provider observation date and retrieval timestamp are exposed. Expired cached observations are not reused after refresh failure.
- Reports include the exact rate observation used for their display valuation. CSV report exports include display currency, rate, rate date, fetched timestamp and completeness. Record exports preserve original amount/currency; invoice print-to-PDF uses original values. No converted amount is posted as a historical transaction, so no transaction-date rate is invented or persisted.

Reference: [Frankfurter documentation](https://frankfurter.dev/) describes its daily reference-rate feed and cache support. Session/CSRF design follows the [OWASP session](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) guidance.

## UI and accessibility

The existing green visual identity and responsive sidebar are retained. Added light/dark preferences, consistent SVG navigation icons, currency/rate controls, translated warnings, skeletons, pagination, daily spending inspection, invoice counts and original-record/report exports. All new labels extend the existing Arabic dictionary and follow RTL/LTR. Customer/supplier labels were made consistent. Existing native validation, modal focus behavior, confirmation dialogs, success/error feedback and mobile navigation are preserved. Local entry dates use the browser's calendar date; date-only financial values remain UTC-normalized for filtering.

Invoice details now provide **Print / Save PDF** using the browser print dialog. Arabic uses the browser's Arabic-capable fonts; print CSS isolates the invoice, retains original-currency totals, hides controls and supports A4. This is browser print-to-PDF rather than a server PDF endpoint or a statutory invoice template.

## Database migration and indexes

No production migration was executed. First take an operator-managed database backup and independently verify currency evidence. Do not infer old currencies from a user's current preference or an old business profile.

1. Set `MIGRATION_MONGODB_URI` explicitly in the backend shell. It does not fall back to `MONGODB_URI`.
2. Run `npm run migrate:currencies` to report unknown-currency counts only.
3. Prepare a reviewed JSON manifest of individual records:

```json
[
  {
    "model": "Expense",
    "id": "507f1f77bcf86cd799439011",
    "user": "507f191e810c19729de860ea",
    "amount": 12.34,
    "currency": "USD",
    "evidence": "Receipt 123 explicitly specifies USD; reviewed by the owner"
  }
]
```

`model` must be Expense, BusinessExpense, Invoice or Budget. IDs, stored owner, original amount, currency and evidence are checked. Duplicate manifest rows and conflicts are rejected before writes; writes recheck the original predicates against concurrent changes. Reruns skip matching annotations. The script adds currency, amountMinor and currencyEvidence without changing original amounts, account types or users. Historical values with more than two decimals require separate reconciliation; this migration will not round them silently.

```powershell
npm run migrate:currencies -- --manifest=C:\reviewed\currencies.json
# After reviewing the dry run and evidence:
npm run migrate:currencies -- --manifest=C:\reviewed\currencies.json --apply
```

The new Session model has a unique token-hash index, user index and TTL expiry index. Production automatic index creation is disabled. With the explicitly selected migration connection, run `npm run db:indexes` before rollout to add only these indexes; the script never drops or synchronizes existing indexes. Existing financial ownership/date and budget/invoice uniqueness indexes are preserved. No destructive migration or automatic startup migration was introduced.

## Environment and running the servers

| Project       | Variable                | Purpose                                                                                    |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| Backend       | `MONGODB_URI`           | Required application database connection; private                                          |
| Backend       | `PORT`                  | Defaults to 3000                                                                           |
| Backend       | `NODE_ENV`              | `development` locally; `production` enables secure cookies and requires HTTPS CORS origins |
| Backend       | `CORS_ORIGIN`           | Comma-separated exact frontend origins; localhost:5173 in the example                      |
| Backend       | `COOKIE_SAME_SITE`      | `lax` by default; `strict` or production-only `none` when topology requires it             |
| Backend       | `TRUST_PROXY_HOPS`      | Optional explicit count behind a known proxy; otherwise unset                              |
| Backend tools | `MIGRATION_MONGODB_URI` | Explicit operator-selected connection for currency/index scripts                           |
| Tests         | `TEST_MONGODB_URI`      | Isolated local `fatortak_test_*` database on port 27028; never an application DB           |
| Frontend      | `VITE_API_URL`          | Public API base, normally http://localhost:3000/api                                        |
| Frontend dev  | `FATORTAK_BACKEND_PATH` | Optional backend folder override                                                           |

`JWT_SECRET` and `JWT_EXPIRES_IN` are obsolete and unused. Existing `.env` contents were not overwritten. No exchange-rate API key is required. Do not place database credentials or private configuration under `VITE_*`.

Normal separate-terminal workflow, with MongoDB already running:

```powershell
cd C:\Users\ASUS\Desktop\fatortak
npm ci
npm run dev
```

```powershell
cd C:\Users\ASUS\Desktop\fatortak-frontend
npm ci
npm run dev:frontend
```

Open http://localhost:5173. Alternatively frontend `npm run dev` starts both projects. Restart any already-running old API so it serves the new cookie contract.

## Isolated browser verification setup

Use a new local database directory and separate ports. For this workstation:

```powershell
# Terminal 1, backend directory; directory is ignored by Git.
New-Item -ItemType Directory -Force .test-data\mongo-upgrade
& 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' --dbpath "$PWD\.test-data\mongo-upgrade" --bind_ip 127.0.0.1 --port 27028

# Terminal 2, backend directory
$env:TEST_MONGODB_URI='mongodb://127.0.0.1:27028/fatortak_test_browser'
$env:CORS_ORIGIN='http://localhost:5177'
node scripts/test-server.js

# Terminal 3, frontend directory
$env:VITE_API_URL='http://localhost:3107/api'
npm run dev:frontend -- --port 5177

# Terminal 4, frontend directory
$env:TEST_MONGODB_URI='mongodb://127.0.0.1:27028/fatortak_test_browser'
npm run test:e2e
```

The test server refuses any URI outside the fixed isolated local pattern and uses deterministic rates solely in that test module. The production entry point never imports it. Unit tests also use fixed rate fixtures; the live provider request was verified separately. Stop the owned test servers when finished. Test data remains in the ignored directory for review; no automatic database drop is used. The temporary verification servers were stopped after checks.

## Verification results

Recorded checks and final results are listed below. Earlier browser checks exposed optional-email validation, Arabic-label inconsistencies and an extra invoice print page; those were fixed. Background refresh now preserves invoice lookup options and budget/profile drafts. The network-retry test also waits for initial rate loading to avoid racing automatic recovery. A full-suite failure from shared rate-limiter test state was isolated and fixed before the successful rerun.

| Check                                                                          | Result                                                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Backend full unit/HTTP/integration/migration suite, explicit isolated test URI | 10 passed, 0 failed, 0 skipped                                                                               |
| Frontend money and CSV safety unit tests                                       | 2 passed                                                                                                     |
| English/Arabic existing workflows and new upgrade browser workflows            | 7 passed, 0 failed in the final combined run (including timed draft preservation and single-page PDF checks) |
| Frontend ESLint                                                                | Passed after final fixes and formatting                                                                      |
| Frontend production build                                                      | Passed after final fixes and formatting                                                                      |
| Backend syntax check                                                           | Passed                                                                                                       |
| Dependency audits                                                              | Both final audits: 0 vulnerabilities                                                                         |
| Additive session index migration on isolated test DB                           | Passed                                                                                                       |
| Live Frankfurter request through backend service                               | Passed; returned a validated current observation, not a test fixture                                         |

Backend coverage includes session rotation/logout/expiration, CSRF, rate limiting, role and cross-user/cross-business access, invalid input, hidden hashes, profile/password updates and session revocation, personal/business CRUD, budgets, authoritative invoice totals, precision, reciprocal conversion, mixed totals, unknown currencies, provider outage/cache/backoff, historical preservation (including metadata edits on legacy invoices with old rounding), and migration dry runs/reruns/conflicts. Browser coverage includes both account types, language persistence/RTL, filters, destructive confirmations, network/API errors, mobile overflow/drawers, currency preference persistence without a reload, dark mode, draft preservation during background rate polling, CSV and Arabic print/PDF generation.

## Files changed

Frontend, relative to `fatortak-frontend`:

- `.gitignore`, `package.json`, `package-lock.json`, `playwright.config.js`, `eslint.config.js` (retaining its earlier user edits).
- `src/api/api.js`, `authApi.js`; `src/context/AuthProvider.jsx`, new `CurrencyProvider.jsx` and `currency.js`.
- `src/components/FinancialStats.jsx`, `InvoiceForm.jsx`, `ResourcePage.jsx`, `UI.jsx`; new `CurrencyControls.jsx`, `ThemeToggle.jsx`, `NavIcon.jsx`, `SpendingTrend.jsx`.
- `src/layouts/DashboardLayout.jsx`; `src/i18n/translations.js`, `useFormat.js`; `src/index.css`.
- `src/pages/AccountPage.jsx`, `auth/AuthPage.jsx`, personal `DashboardPage.jsx`, `ExpensesPage.jsx`, `BudgetPage.jsx`; business `DashboardPage.jsx`, `BusinessExpensesPage.jsx`, `InvoicesPage.jsx`, `ProfilePage.jsx`, `ReportsPage.jsx`.
- `src/utils/useLoad.js`, `format.js`; new `money.js`, `export.js`; existing `tests/integration.spec.js`, `arabic.spec.js`; new `tests/upgrade.spec.js`, `test-unit/money.test.js`.
- `README.md`, historical notices in `PROJECT_EXPLANATION.md`/`CHANGELOG_IMPLEMENTATION.md`, `IMPLEMENTATION_PLAN.md`, this report.

Backend, relative to `fatortak`:

- `.gitignore`, `.env.example`, `package.json`, `package-lock.json`, `app.js`, `index.js`, new `README.md`.
- `config/database.js`, new `config/security.js`; `middleware/authMiddleware.js`, `validateRequest.js`, `errorMiddleware.js`, new `security.js`.
- Controllers: auth, user, budget, expense, businessExpense, invoice, report, party and business.
- Models: User, Expense, BusinessExpense, Invoice, Budget, BusinessProfile; new Session.
- Routes: auth, user, expense, business, invoice; new currency route. Existing customer/supplier/report authorization routes remain in place.
- New `services/sessions.js`, `money.js`, `valuation.js`, `exchangeRates.js`; `utils/audit.js`, `pagination.js`; removed obsolete `utils/generateToken.js`.
- New `scripts/migrate-currencies.js`, `ensure-indexes.js`, `test-server.js`; expanded `test/backend.test.js`, new `integration.test.js` and `migration.test.js`.

## Remaining operational work and limits

Legacy currency assignments require the owner's verified evidence; live counts are unknown because the application database was intentionally not queried. Deploy the frontend/backend cookie-contract changes together, over HTTPS, and create session indexes before production rollout. Cross-site deployments may require SameSite=None and remain subject to browser third-party-cookie restrictions; same-site hosting is simpler.

Rate limits and FX caches are process-local. Use a shared rate-limit/cache store before horizontal scaling. Monthly reports use indexed, projected queries but still value the month's records in memory; very large ledgers merit streaming/queued report generation. Daily reference rates are indicative and have no application-negotiated SLA. No email verification, MFA, password-reset flow, transaction-date FX accounting, tax-compliance invoice template or dedicated server PDF renderer was added. Browser printing supports Save as PDF, with pagination/font behavior controlled by the browser. Dependency audits are point-in-time checks, and these tests are not an independent penetration test.
