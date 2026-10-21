# Trinity Mark 360

One system for Trinity Mark Solutions: projects, money, materials, people and operations, with a portal for each role and a phone app for each portal.

Built with React 19 and Vite from the Claude Design mockup in [`design/`](design/). Every page renders pixel-for-pixel like the design on desktop and phone.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm test           # workflow and page tests
npm run lint
```

Sign in with any email and a password of 4+ characters. Choose a portal on the sign-in screen, or switch later from the profile menu.

## What's inside

| Portal | Person | Lands on |
| --- | --- | --- |
| Management | Daniel K., Managing Director | Command Center |
| Staff | Grace Mrema, Field Officer | My Day |
| Finance | Rose Temba, Finance Officer | My queue |
| Reception | Aisha Mbwana, Front Office | Front desk |
| Store | Fatma Hassan, Storekeeper | My store |

Modules: Command Center dashboard, Monday Briefing (decisions become tasks, staff post updates and presentations), Calendar, Notifications, CRM, Sales & Proposals, Finance & Invoices, Projects (15-stage workflow), Tasks board, Production, Procurement, Store & Inventory, Logistics, Requests & Floats (PM → Operations → Finance → Management → Payment), Staff & Reports, Meeting rooms, Documents, Reports (CSV export), Settings, the Field capture app and the Mobile apps preview.

Also: Ctrl K command palette, the Trinity Intelligence assistant (rule-based answers from the live data), and a bottom tab bar with a "More" sheet below 700px.

## How data works

- All figures are demo data in TZS ([`src/logic/seed.js`](src/logic/seed.js)).
- Changes are saved in the browser (`localStorage`) and shared live between open tabs, including the phone preview on the Mobile apps page.
- Each browser keeps its own copy; there is no server yet. "Reset demo data" in the profile menu restores the starting data.

## Project layout

```
src/
  App.jsx               hosts the logic and renders login or the app shell
  logic/
    TrinityApp.js       state, actions (approve, pay, create, move…) and the assistant
    constants.js        icons, people, roles, mobile tabs, chart data
    seed.js             demo data
    view/*.js           turn state into the values each screen renders
  components/           shell: sidebar, top bar, modal, command palette, assistant, mobile nav, toasts
  pages/                one component per page
  styles/
scripts/
  dc-to-jsx.mjs         regenerates components/pages from the design file
  make-icons.mjs        renders the PNG app icons from the logo
design/                 the original Claude Design handoff (mockups and chat)
```

`src/components` and `src/pages` are generated from `design/project/Trinity Mark 360 App.dc.html`. After updating the design, run `npm run sync-design` and review the diff. Edits made by hand to generated files are overwritten by a re-sync.

## Deploy

The repo is ready for Vercel: import it at vercel.com/new and keep the defaults (Vite, `npm run build`, output `dist`). `vercel.json` sends every route to the app.
