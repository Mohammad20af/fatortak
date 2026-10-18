# Fatortak implementation changelog

Implemented on September 7, 2026 in `C:\Users\ASUS\Desktop\fatortak-frontend`.

## Scope and backend status

Replaced the original login-only React screen with complete personal and business workspaces connected to the existing backend. All active backend routes, controllers, models, middleware, utilities, database configuration, startup and existing tests were inspected before frontend coding.

**Backend files changed: none.** No backend architecture or database schema changes were made. The existing server started with `MongoDB connected successfully` and `Fatortak server is running on port 3000`.

The frontend uses the supported common invoice endpoint with explicit type queries. This avoids the existing Express 5 shortcut GET routes' mutation of req.query, without modifying those routes.

## Files created

Each row records the FILE, what changed, why it was needed, and how it works.

| FILE                                          | What was changed                                                                              | Why                                           | How it works                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `.env`                                        | Added public API base URL                                                                     | Configure integration                         | Vite reads VITE_API_URL=http://localhost:3000/api; no server secrets                                      |
| `.env.example`                                | Added shareable config template                                                               | Reproducible setup                            | Copy to .env for a new checkout                                                                           |
| `src/api/api.js`                              | Added request, token storage, query and CRUD helpers                                          | Centralize authentication/error behavior      | fetch + Bearer header, JSON bodies, response checks, timeout, cancellation, unauthorized event            |
| `src/api/authApi.js`                          | Added login/register/me/update mappings                                                       | Match the auth contract                       | Calls /auth/login, /auth/register and /users/me; unwraps current user                                     |
| `src/api/personalApi.js`                      | Added expense/budget/summary mappings                                                         | Support personal features                     | Uses exact /expenses routes and response properties                                                       |
| `src/api/businessApi.js`                      | Added contact/invoice/expense/profile/report mappings                                         | Support business features                     | Maps existing paths and singular/plural response envelopes                                                |
| `src/context/auth.js`                         | Added Context and auth helpers                                                                | Share user/session access                     | useAuth reads Context; dashboardPath uses accountType                                                     |
| `src/context/AuthProvider.jsx`                | Added session state and actions                                                               | Persist login and react to expiry             | Stores JWT locally, checks /users/me, listens for 401 and cross-tab storage changes                       |
| `src/components/ProtectedRoute.jsx`           | Added authentication and role gates                                                           | Prevent inappropriate page access             | Waits for session restoration, redirects absent/wrong-role users, shows retry on network failure          |
| `src/components/UI.jsx`                       | Added reusable labels, feedback, states, cards, period inputs, badges, dialogs, category bars | Consistent usable screens                     | Controlled fields, semantic notices, native focus-managing dialog and CSS bars                            |
| `src/components/ResourcePage.jsx`             | Added shared contact/expense CRUD page                                                        | Avoid duplicating the same behavior           | Configured columns/fields/API, server filters, fresh detail/edit reads and delete confirmation            |
| `src/components/RecordForm.jsx`               | Added controlled record form                                                                  | Submit only supported fields                  | State per input, HTML validation, required trimmed text, number/null conversion, visible errors           |
| `src/components/InvoiceForm.jsx`              | Added dedicated invoice editor                                                                | Handle line items and payment fields          | Recalculates amount after item edits, normalizes optional dates/relationships, supports statuses          |
| `src/components/FinancialStats.jsx`           | Added financial cards and receivable/payable strip                                            | Explain actual report totals                  | Displays backend fields; derives total expenses from purchases + operating expenses                       |
| `src/layouts/DashboardLayout.jsx`             | Added shared navbar/sidebar/workspace/footer                                                  | Consistent desktop/mobile navigation          | Role-specific NavLinks, active routes, user chip, mobile drawer, profile currency through Outlet          |
| `src/utils/useLoad.js`                        | Added reusable async read hook                                                                | Handle race conditions and retry              | Memoized loader, state and reload; effect cleanup aborts obsolete reads                                   |
| `src/utils/format.js`                         | Added category/date/currency/month helpers                                                    | Match backend fields and UTC reporting        | Exact personal enum, UTC date display and Intl money formatting with fallback                             |
| `src/pages/auth/AuthPage.jsx`                 | Added registration and full login UI                                                          | Provide real authentication flow              | Controlled forms, personal/business choice, validation, feedback and role redirects                       |
| `src/pages/AccountPage.jsx`                   | Added account settings                                                                        | Expose existing user-update feature           | PATCH name/email and update Context; role stays read-only                                                 |
| `src/pages/NotFound.jsx`                      | Added 404 page                                                                                | Handle unknown URLs                           | Return link to login or the user's dashboard                                                              |
| `src/pages/personal/DashboardPage.jsx`        | Added overview                                                                                | Summarize monthly personal finances           | Fetches summary + expenses, renders cards/budget/category bars/recent activity                            |
| `src/pages/personal/ExpensesPage.jsx`         | Added personal expense configuration                                                          | Complete personal CRUD                        | Exact title/amount/category/date/note fields; search/category/month/year filtering                        |
| `src/pages/personal/BudgetPage.jsx`           | Added monthly budget management                                                               | Plan and compare spending                     | Handles missing budget, PUT create/update, DELETE, spent/remaining/over-budget values                     |
| `src/pages/business/DashboardPage.jsx`        | Added business overview                                                                       | Show backend statistics                       | Current-month financials and breakdown, contact counts and all-time overdue count                         |
| `src/pages/business/PartiesPage.jsx`          | Added customer and supplier pages                                                             | Manage business contacts                      | Shared configured CRUD with name/email/phone/taxNumber/address/notes                                      |
| `src/pages/business/InvoicesPage.jsx`         | Added sales and purchase invoice pages                                                        | Complete invoice workflows                    | Explicit type-filtered list, contact/status/date/search filters, view/create/edit/delete                  |
| `src/pages/business/BusinessExpensesPage.jsx` | Added operating expense page                                                                  | Track running costs                           | CRUD, free category, optional supplier, plural notes and filters                                          |
| `src/pages/business/ProfilePage.jsx`          | Added profile setup/update                                                                    | Expose existing business profile              | GET with setup on 404, PUT supported fields and refresh displayed currency                                |
| `src/pages/business/ReportsPage.jsx`          | Added monthly analytics page                                                                  | Explain historical totals                     | Select month/year; show actual financials, invoice status groups and expense categories                   |
| `public/favicon.svg`                          | Added branded SVG                                                                             | Replace starter browser identity              | Static local icon; no image-generation dependency                                                         |
| `playwright.config.js`                        | Added browser test configuration                                                              | Repeat real integration checks                | Chrome, localhost:5173, single worker, desktop viewport, failure reports/screenshots                      |
| `tests/integration.spec.js`                   | Added three comprehensive browser scenarios                                                   | Verify auth, CRUD, reports, mobile and errors | Real requests/database, temporary users, exact-account cleanup via existing backend models                |
| `PROJECT_EXPLANATION.md`                      | Added student guide                                                                           | Explain and present the project               | Architecture, complete file guide/API map, React/backend concepts, flows, run commands and study sequence |
| `CHANGELOG_IMPLEMENTATION.md`                 | Added this implementation record                                                              | Make changes reviewable                       | File-level changes, reasons, behavior and verification                                                    |

## Files modified

| FILE                | What was changed                                                           | Why                                             | How it works                                                                                         |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/App.jsx`       | Replaced login-only form with complete routing                             | Connect all supported features                  | BrowserRouter + AuthProvider + role guards + layouts and pages                                       |
| `src/main.jsx`      | Formatted existing entry point                                             | Keep code consistent                            | Retains StrictMode/createRoot and imports new App/CSS                                                |
| `src/index.css`     | Replaced starter stylesheet                                                | Create professional responsive dashboard        | Dark green sidebar, light workspace, cards, forms, tables, dialogs, mobile drawer and reduced motion |
| `index.html`        | Updated title, description and theme color                                 | Give app its own identity                       | Fatortak metadata and favicon reference                                                              |
| `package.json`      | Added React Router; Playwright and Prettier dev tools; test/format scripts | Routing, verification and readable code         | npm scripts run installed local tools                                                                |
| `package-lock.json` | Updated locked dependencies                                                | Reproducible installation                       | Generated by npm install; install reported zero vulnerabilities                                      |
| `vite.config.js`    | Set port 5173 and strictPort                                               | Keep expected URL and CORS origin stable        | Vite reports an occupied port instead of silently selecting another                                  |
| `eslint.config.js`  | Added Node globals for tests/config; ignored generated artifacts           | Check both browser and test code correctly      | Keeps recommended React rules and scopes environment globals                                         |
| `.gitignore`        | Ignored .env and browser artifacts                                         | Keep generated/local data out of source control | Adds .env, test-results and playwright-report                                                        |
| `README.md`         | Replaced starter text                                                      | Provide practical project entry point           | Startup, config, check commands, cleanup behavior and links to full docs                             |

## Files removed and preserved

- Removed `src/components/Navbar.jsx`: the original static login-only navbar was replaced by the functional navbar and sidebar in DashboardLayout.
- Removed unused `src/App.css`: all active application styles are in src/index.css.
- Preserved the original src/assets files and public/icons.svg. They are unused by the app and do not affect the build.
- Preserved all backend source/configuration and the earlier backend .frontend-work directory.
- This frontend directory was not a Git repository at inspection time, so no commit or Git diff was created.

## Pages and routes delivered

| URL                           | Page                                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| `/`                           | Redirect to sign-in or, for a signed-in user, the correct dashboard |
| `/login`                      | Login                                                               |
| `/register`                   | Registration and account type choice                                |
| `/personal/dashboard`         | Personal summary                                                    |
| `/personal/expenses`          | Personal expense CRUD/filter/detail                                 |
| `/personal/budget`            | Monthly budget management                                           |
| `/personal/account`           | Personal account settings                                           |
| `/business/dashboard`         | Business statistics                                                 |
| `/business/customers`         | Customer CRUD/search/detail                                         |
| `/business/suppliers`         | Supplier CRUD/search/detail                                         |
| `/business/sales-invoices`    | Sales invoice CRUD/filter/detail                                    |
| `/business/purchase-invoices` | Purchase invoice CRUD/filter/detail                                 |
| `/business/expenses`          | Business expense CRUD/filter/detail                                 |
| `/business/reports`           | Monthly financial report                                            |
| `/business/profile`           | Business profile setup/update                                       |
| `/business/account`           | Business user account settings                                      |
| `/personal`, `/business`      | Redirect to that workspace's dashboard after authorization          |
| Any unmatched URL             | 404 page                                                            |

## API endpoints actually used by the UI

Prefix for every path: `/api`.

- POST `/auth/register`, POST `/auth/login`.
- GET/PATCH `/users/me`.
- GET/POST `/expenses`; GET/PATCH/DELETE `/expenses/:id`.
- GET `/expenses/summary`; GET/PUT/DELETE `/expenses/budget`.
- GET/POST `/customers` and `/suppliers`; GET/PATCH/DELETE each `/:id`.
- GET/POST `/invoices`; GET/PATCH/DELETE `/invoices/:id`. List query supplies sales/purchase type.
- GET/PUT `/business/profile`.
- GET/POST `/business/expenses`; GET/PATCH/DELETE `/business/expenses/:id`.
- GET `/business/dashboard`; GET `/reports/monthly`.

The complete requests, allowed fields, query filters and response envelopes are in PROJECT_EXPLANATION.md. No endpoints or backend fields were invented.

## Verification performed

| Check                          | Result                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Existing backend `npm run dev` | Started; MongoDB connection and port 3000 confirmed                                              |
| Frontend `npm run dev`         | Started at http://localhost:5173                                                                 |
| Backend `npm test`             | 5/5 passed: health/404, auth validation, schema rules, UTC month helpers, JWT/password selection |
| Frontend `npm run lint`        | Passed                                                                                           |
| Frontend `npm run build`       | Passed; production bundle generated in dist                                                      |
| Frontend `npm run test:e2e`    | 3/3 comprehensive scenarios passed against the live backend/MongoDB                              |
| Desktop layout                 | Browser screenshots captured and visually inspected                                              |
| Mobile layout                  | 390px viewport, drawer navigation and horizontal page-overflow assertion checked                 |

### Browser coverage

1. **Personal:** protected redirect, registration, persisted session after refresh, wrong-role redirect and backend 403, expense create/view/edit/delete, search/category filters, budget create/update/delete, over-budget feedback, summary totals, account name update, logout, invalid login and valid login.
2. **Business:** registration, role redirect/backend 403, profile save and refresh persistence, customer/supplier CRUD and details, sales/purchase invoice CRUD and isolation, line-item amount recalculation on edit, paid/unpaid status changes, automatic overdue status, status filtering, expense CRUD, monthly report/dashboard arithmetic, mobile drawer/no page overflow, refresh and business logout/login.
3. **Failures:** simulated unreachable summary request with successful retry; controlled 400/403/404/500 responses displayed by UI; invalid JWT expiry redirect; actual unauthenticated API 401 and invalid registration 400; unknown-page route; mobile login screenshot/no page overflow.

Financial check: paid sales 200, paid purchases 40, operating expenses 15 -> total expenses 55 and profit 145. An additional overdue sale of 50 appears as receivable, without inflating paid revenue.

Network and 500 UI states were simulated at the browser network layer; the real backend was not deliberately crashed. Successful CRUD and financial responses used real MongoDB. Test accounts were unique to each run and cleanup targeted their exact IDs/emails and owned records. Existing user data was not edited.

### Issues resolved during implementation and verification

- Original authentication only logged the response; replaced with visible errors, token persistence, current user and navigation.
- Prevented sales/purchase mixing by using the common endpoint with an explicit type query.
- Respected personal note vs business notes and differing dashboard/report response shapes.
- Prevented stale reads replacing newer page/filter results through cancellation.
- Prevented line-item edits retaining an old amount by recalculating before save.
- Handled absent budgets/profiles, zero budgets, missing relationships and optional dates.
- Avoided duplicate empty invoice numbers by omitting the field on creation.
- Added mobile sidebar scrolling for shorter viewports.
- Corrected two lint findings: preserved the cause of a caught network error and removed unused field configuration bindings.
- Corrected browser test selectors for required labels, mixed invoice title/number cells and simultaneous loading/success notices; corrected an encoding-corrupted 404 assertion.
- Initial sandbox restrictions blocked npm network access and Vite/Node subprocess spawning. Approved escalated execution installed dependencies and ran servers/build/browser checks successfully. No remaining approval block.

## Remaining limitations

No known blocker remains in the requested local frontend workflows. Existing backend semantics are preserved:

- Shortcut GET invoice routes still have the Express 5 query-mutation issue; the UI does not use them.
- Reports select invoices by invoice date, not payment date, and recognize revenue/purchase cost only when paid.
- Personal currency is displayed as USD because the backend has no personal currency field. Business currency is formatting only, with no conversion.
- Logout clears the local session; there is no server token-revocation endpoint.
- Backend lists have no pagination, so lists load all matching records. Large-data pagination would need additional backend work.
- Hosting/deployment was not requested; a deployed frontend needs the deployed API URL, CORS origin and index.html route fallback.

## How to start

Backend:

```powershell
cd C:\Users\ASUS\Desktop\fatortak
npm run dev
```

Frontend:

```powershell
cd C:\Users\ASUS\Desktop\fatortak-frontend
npm run dev
```

Open http://localhost:5173. Both servers were left running after verification. If they stop, use the commands above; do not launch duplicate copies on occupied ports.
