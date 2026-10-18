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

```powershell
npm run lint
npm run build
npm run test:e2e
```

Browser tests require both servers running, the configured backend database, and Google Chrome. They create unique `@example.test` accounts and remove only those exact accounts and related records afterward. Cleanup imports existing backend models; set `FATORTAK_BACKEND_PATH` if your backend moved. Run the full suite because tests share temporary accounts. Results are in `playwright-report/`; screenshots are in `test-results/`.

`npm run format` formats code and docs. `npm run preview` serves the production build locally. A deployed static host must rewrite application URLs to `index.html`.

## Documentation

- [PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md): student guide, architecture, file explanations, full endpoint map and presentation notes.
- [CHANGELOG_IMPLEMENTATION.md](CHANGELOG_IMPLEMENTATION.md): file changes, reasons and verification.

Backend source was preserved. Invoice lists use `/api/invoices?type=sales` or `?type=purchase`, avoiding the existing Express 5 shortcut-route filtering issue.
