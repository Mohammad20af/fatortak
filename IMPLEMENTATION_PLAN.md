# Fatortak upgrade plan

## Discovery and checkpoints

The frontend is React 19/Vite 8 with React Router, a shared resource editor, fetch services, and an existing English/Arabic dictionary and RTL layout. Personal routes cover dashboard, expenses, budgets and account settings. Business routes cover dashboard, customers, suppliers, sales/purchase invoices, expenses, reports, profile and account settings. CSS already provides responsive layouts, modals, empty states and loading placeholders.

The Express 5/Mongoose backend has matching routes/controllers, bcrypt cost 12 password hashing, account-type middleware, ownership predicates and reference checks. Models: User, Expense, Budget, Invoice (embedded line items), BusinessExpense, BusinessProfile, Customer and Supplier. API base is configured by VITE_API_URL; the default frontend/backend ports are 5173/3000. Existing tests include five backend unit/HTTP tests and Playwright flows. No database connection is required for builds or unit tests.

Baseline risks: localStorage bearer JWTs valid for seven days; no logout revocation, CSRF, Helmet or rate limits; wildcard CORS fallback; incomplete scalar/query validation; exposed server errors; floating-point invoice totals; no transaction currency; business profile currency merely relabels historical amounts; unbounded lists; no dark theme. Existing records therefore have ambiguous currencies, even when an old profile says USD.

Checkpoints before application edits: frontend HEAD `aa7fbcf`, with existing local edits preserved in ignored `.implementation/upgrade-frontend-baseline.json`; backend initialized as a separate repository at `a138560`, with an additional ignored source snapshot in the frontend `.implementation` directory. Snapshots exclude environment files, credentials, generated output and dependency directories. Existing `.env` files are retained without printing their values.

## Implementation sequence

1. Harden configuration, headers, limits, scalar validation and safe errors; replace JWTs with Mongo-backed, 30-minute opaque HttpOnly cookie sessions and synchronizer CSRF tokens. Rotate sessions at login and password changes; revoke on logout. Tradeoff: every authenticated request needs a database lookup, in exchange for immediate revocation and no refresh-token machinery.
2. Coordinate credentialed fetch, CSRF initialization, session restoration, expiration and logout across both projects. Remove old browser tokens on startup. Preserve role-based routes and account types.
3. Introduce explicit ILS/USD record currencies with no legacy defaults, decimal-safe cents and authoritative invoice calculations. Add a backend-only Frankfurter reference-rate cache, provenance/freshness metadata and explicit failure behavior. Reports convert each original record into a chosen display currency; incomplete valuations must be flagged and never presented as complete totals.
4. Add profile-backed default/display currency, selectors in the header and editors, original/converted amounts, translated rate information and currency-aware budgets/reports/exports. Preserve the existing i18n architecture.
5. Extend the existing visual design with dark mode, consistent navigation icons, accessible controls, responsive tables, spending trends, and financial completeness notices.
6. Add safe, explicit, per-record migration tooling (dry-run by default; evidence required); never connect to or migrate existing data automatically.
7. Run backend security/financial tests, frontend lint/build, dependency audits and isolated browser flows against a disposable database when available. Document exact results and remaining limits.

No deployment, push, existing-data migration, or destructive operation is part of this work.
