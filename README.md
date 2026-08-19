# EE CRS Planner

**Live app: https://muhac.github.io/ee-crs-planner/**

An unofficial **CRS (Comprehensive Ranking System) calculator & planner** for Canada Express Entry:

- Enter your profile (age, education, language CLB/NCLC, work experience, spouse, additional factors) and see your total score with a full per-factor breakdown, updated live
- Language scores accepted as CLB/NCLC levels directly, or as raw results from CELPIP-General, IELTS (General Training), PTE Core, TEF Canada, or TCF Canada — converted per the official IRCC equivalency charts with the resulting CLB shown inline
- **Future projection**: age advances automatically, work experience accrues month by month, and dated events (language retest, education upgrade, provincial nomination, …) take effect on schedule — plotted as monthly score curves
- **Pool eligibility**: checks CEC / FSW (including the 67-point selection grid) / FST criteria, explains what's missing, warns when PNP points can't count, and marks ineligible stretches of the projection as dashed with the earliest pool-entry month per scenario
- Multiple profiles and side-by-side what-if scenarios; all data stays in your browser (localStorage)
- JSON export/import for backup, plus share links that encode the profile into the URL hash — nothing ever touches a server
- Responsive: two-column workbench on desktop, single column with a floating score bar on mobile
- Six-language UI: English / Français / Español / 简体中文 / 繁體中文 / हिन्दी, auto-detected from the browser on first visit

Point tables are transcribed from the [official IRCC CRS criteria](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html) (June 2026 edition; job-offer points removed as of 2025-03-25). For reference only — always defer to IRCC.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # scoring engine + storage tests (vitest)
npm run build    # static output in dist/, deployable to any static host
```

## Stack & structure

Vite + React 19 + TypeScript · Tailwind CSS v4 + shadcn/ui · Recharts · react-i18next · Vitest

```
src/
├── engine/       # Pure TS scoring engine: official point tables (tables.ts),
│                 # scoring (crs.ts), month-by-month projection (simulate.ts)
├── storage/      # localStorage persistence, JSON/share-link codec (lz-string)
├── i18n/         # react-i18next setup + locale dictionaries (typed against zh-CN)
├── hooks/        # useAppData: profile CRUD with auto-persistence
├── components/   # forms, score panel, projection charts
└── lib/          # labels, defaults
```

The scoring engine is fully decoupled from the UI: when IRCC changes the rules, only `src/engine/tables.ts` needs updating, with the test suite guarding the rest.
