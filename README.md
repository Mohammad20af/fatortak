# Fatortak frontend

React + Vite finance dashboards connected to the existing Express/MongoDB backend. Personal accounts manage expenses, budgets and summaries. Business accounts manage contacts, invoices, operating expenses and reports.

## Run locally

Start MongoDB, then run in one PowerShell terminal:

```powershell
cd C:\Users\ASUS\Desktop\fatortak-frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Register a personal or business account. `npm run dev` starts the backend from the sibling `../fatortak` directory, waits for `/api/health`, then starts the frontend. It reuses an already healthy backend. Press Ctrl+C to stop the servers started by this command. Backend dependencies and its `.env` must already be configured; keep backend secrets in that directory.

If the backend is elsewhere, set `$env:FATORTAK_BACKEND_PATH = 'C:\path\to\fatortak'` before running the command. Use `npm run dev:frontend` if you prefer to manage the backend separately. Remote API URLs do not start a local backend.

Frontend `.env` contains only `VITE_API_URL=http://localhost:3000/api`; copy `.env.example` if recreating it. If the login page reports that it cannot reach port 3000, restart with `npm run dev` and check the terminal for backend or MongoDB startup errors.

## Checks

See [SECURITY_CURRENCY_UPGRADE.md](SECURITY_CURRENCY_UPGRADE.md) for the current authentication/currency contract, migrations, changed files and verification report.

```powershell
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

Browser tests use isolated ports 5177/3107 and require Google Chrome plus a separate MongoDB on port 27028. They never default to your application database. See the upgrade report for exact setup commands. Set `TEST_MONGODB_URI` to an isolated `fatortak_test_*` database before running the full suite; legacy test cleanup checks this connection and removes only accounts created by that run. `E2E_BASE_URL`, `E2E_API_URL` and `FATORTAK_BACKEND_PATH` can override their locations. Results are in `playwright-report/`; screenshots and invoice PDF samples are in `test-results/`.

`npm run format` formats code and docs. `npm run preview` serves the production build locally. A deployed static host must rewrite application URLs to `index.html`.

## Documentation

- [SECURITY_CURRENCY_UPGRADE.md](SECURITY_CURRENCY_UPGRADE.md): current implementation and operating instructions.
- [PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md): historical student guide.
- [CHANGELOG_IMPLEMENTATION.md](CHANGELOG_IMPLEMENTATION.md): earlier implementation history.

Both original repositories and account types are preserved. Authentication uses revocable HttpOnly cookies with CSRF protection; no access or refresh tokens are kept in browser storage. Header currency changes persist in the user profile and convert displays without relabeling original records. New records require ILS or USD; old records need evidence before assigning a currency. Tables paginate, exports preserve original currencies, and invoice details support Arabic/English printing and browser Save as PDF.
