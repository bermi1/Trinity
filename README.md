# Trinity Mark 360

One system for Trinity Mark Solutions: projects, money, materials, people and operations, with a portal for each role and a phone app for each portal.

Built with React 19 and Vite from the Claude Design mockup in [`design/`](design/). Every page renders pixel-for-pixel like the design on desktop and phone.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm test           # unit and integration tests (logic, sync, database flow)
npm run test:e2e   # end-to-end: clicks through every flow in a real browser
npm run lint
```

Sign in with a Supabase account (see [Database](#database-supabase)). In demo mode (no database configured) any email and a password of 4+ characters works.

The end-to-end suite (`e2e/`) builds the app on demo data and drives Chromium through every module on desktop, phone and tablet: sign-in, the full money-request chain from staff to paid float, procurement to stock, proposals to projects, documents, reports, the field app and more. First run on a new machine: `npx playwright install chromium`.

## What's inside

| Portal | Person | Lands on |
| --- | --- | --- |
| Management | Daniel K., Managing Director | Command Center |
| Staff | Grace Mrema, Field Officer | My Day |
| Finance | Rose Temba, Finance Officer | My queue |
| Reception | Aisha Mbwana, Front Office | Front desk |
| Store | Fatma Hassan, Storekeeper | My store |
| Printing | Juma Ally, Print Production Lead | Print floor |

Modules: Command Center dashboard, Monday Briefing (decisions become tasks, staff post updates and presentations), Calendar, Notifications, CRM, Sales & Proposals, Finance & Invoices, Projects (15-stage workflow), Tasks board, Production, Procurement, Store & Inventory, Logistics, Requests & Floats (PM → Operations → Finance → Management → Payment), Staff & Reports, Meeting rooms, Documents, Reports (CSV export), Settings, the Field capture app and the Mobile apps preview.

Also: Ctrl K command palette, the Trinity Intelligence assistant (rule-based answers from the live data), and a bottom tab bar with a "More" sheet below 700px.

### Store, printing and purchasing

Every production job carries its **material list** (e.g. the Serengeti truck wrap: 3 rolls of cast vinyl, 1 roll of gloss laminate). The flow, as it runs in the app:

1. **Printing requests materials** — *Print floor* or the job page → *Request materials from store*. A store requisition (`SRQ-…`) goes to the storekeeper's queue and notifications.
2. **The store issues what's on the shelf** — *Store requisitions* → *Issue from store*. Stock goes down, each line is written to the **stock ledger**, and the cost is charged to the job and to the client's **project budget**. Anything not in stock stays outstanding (*Part issued*).
3. **Shortfalls go to purchasing** — *Raise purchase request* creates a `PR-…` per short item, sized to cover the shortfall and bring stock back to its minimum, linked to the requisition. Management is notified.
4. **Purchasing** — Request → Quotation → Approved → PO issued → Delivered. A delivered order waits at the store.
5. **Receiving** — *Receive into store* posts a goods-received note (`GRN-…`) to the ledger, raises stock, and tells the storekeeper and the requester that the requisition can now be completed.
6. **Printing starts** — a job cannot move from *Client approval* to *Production* until its requisition is fully issued.
7. **After the job** — unused material is returned from the job page (stock and costs are credited back, never more than was issued); wastage is recorded per job.
8. **Stock counts** — *Stock ledger* → *Stock count*: enter what is on the shelf and a reason; only the difference is posted.

The ledger can be filtered, searched and exported, and *Reports* adds *Stock movements* and *Materials by project*. The end-to-end test `e2e/store-printing.spec.js` plays this whole scenario through the screens.

### The phone app

Below 700px wide (any phone) Trinity Mark 360 runs as an app, not a shrunken website:

- **Install it:** Android shows *Install app*; on iPhone, Share → *Add to Home Screen* (the app explains the steps). It then opens full screen with its own icon, and long-pressing the icon offers shortcuts: Approvals, Request money, My tasks, Notifications.
- **Sign-in screen** built for thumbs: show/hide password, portal picker, Remember me switch, loading state.
- **Navigation** like a native app: bottom tab bar for each role, a back button on inner screens, the phone's back button/gesture moves back through screens and closes sheets, and screens slide in and out.
- **Bottom sheets** for forms, the account menu and *More*, closed by swiping down, tapping outside or going back.
- **Pull down to refresh**, an offline notice, a light vibration on actions (Android), no zooming when typing, notch and home-indicator aware.
- **Field app** runs full screen with Home, Money and Report sections.

Tablets and computers keep the full desktop layout.

### How the main flows connect

- **Money requests** go Requested → Project Manager → Operations → Finance → Management → Payment. Whoever is the approver at a step sees Approve/Reject (staff have an *Approvals* page; Management can approve any step). Each approval notifies the next person. Finance pays, which opens the person's float; reconciling closes it.
- **Procurement → store:** a purchase marked *Delivered* waits at the store; *Receive into store* adds it to stock and the ledger. *Reorder* on a low item creates the purchase request with the right item and quantity. See *Store, printing and purchasing* above.
- **Sales:** a won lead or an accepted proposal opens a pre-filled new project.
- **Field app and staff portal** show the signed-in person's own tasks from the Tasks board; completing work there updates the board. Daily reports are per person. *Photo* uses the phone camera and files the picture under Documents.
- **Reminders** (staff reports, approvals, questions) go to that person's notifications only.
- **PDF** buttons (proposals, reports) open a branded document ready to print or save as PDF. **CSV** exports download the live data.
- **Service worker** (`public/sw.js`) keeps the app loading without a connection; database calls always go to the network.
- **Documents** stores real files: Supabase Storage on the live database, the browser in demo mode (up to 2 MB).
- Rejections and resets ask for confirmation first.

## Database (Supabase)

The app is connected to the Supabase project `mvjodqspewbjyroygsre` through [`.env`](.env). That file holds only the project URL and the publishable key, which are public by design. **Never add the secret key (`sb_secret_…`) to this repo or to Vercel's `VITE_` variables.**

### One-time setup

**Quickest: one command from your computer** (Node.js 18+ installed). In the project folder:

```bash
npm install
# macOS / Linux
export DATABASE_URL='postgresql://postgres:<db-password>@db.mvjodqspewbjyroygsre.supabase.co:5432/postgres'
export SUPABASE_URL='https://mvjodqspewbjyroygsre.supabase.co'
export SUPABASE_SECRET_KEY='sb_secret_…'
npm run setup-db
```

On Windows PowerShell use `$env:DATABASE_URL='…'` (and the same for the other two) instead of `export`.

- Write any `@` inside the database password as `%40`.
- If it can't reach the database, open Supabase → *Connect* → **Session pooler** and use that connection string instead (some networks can't reach the direct address).
- It creates the tables and rules, the six staff accounts with their portals, and prints each account's starting password. Running it again is safe: existing accounts are left as they are.

Then sign in to the app as Daniel to load the starting data, and continue from step 5 below.

**Or by hand in the Supabase dashboard:**

1. **Create the tables.** In the Supabase dashboard open *SQL Editor → New query*, paste [`supabase/migrations/20261021000000_trinity_mark_360.sql`](supabase/migrations/20261021000000_trinity_mark_360.sql) and click *Run*. It creates `profiles` and `app_records`, the access rules, live updates and the private `documents` storage bucket. Running it again is safe.
2. **Add people.** *Authentication → Users → Add user* (email and password, tick *Auto confirm*). Each new user gets a profile in the Staff portal.
3. **Give each person their portal.** In *Table Editor → profiles* set `role` (`ceo` for Management, `staff`, `finance`, `reception`, `store` or `production` for the printing department), plus `full_name`, `title` and `person_key` (initials used in the records, e.g. `DK`, `GM`, `RT`, `AM`, `FH`). Or in SQL:
   ```sql
   update public.profiles p set role = 'ceo', full_name = 'Daniel K.', title = 'Managing Director', person_key = 'DK'
   from auth.users u where u.id = p.user_id and u.email = 'daniel.k@trinitymark.co.tz';
   ```
4. **Sign in.** The first sign-in fills the empty database with the starting data, so every screen has content. Everyone then works on the same data.
5. **Password reset links:** in *Authentication → URL Configuration* set *Site URL* to the live address (e.g. your Vercel URL).
6. **Optional — Google / Microsoft sign-in:** enable the provider under *Authentication → Providers*. Until then those buttons explain that they are not switched on.

### Accounts, administrator and PIN

**The database is set up** (project TRINITY, `mvjodqspewbjyroygsre`): tables, access rules, live updates, document storage and the account functions in `supabase/migrations/`.

| Account | Portal | Notes |
|---|---|---|
| `admin@trinitymark.co.tz` | Management + **administrator** | Creates and removes accounts |
| `daniel.k@`, `grace.m@`, `rose.t@`, `reception@`, `store@`, `print@trinitymark.co.tz` | Management, Staff, Finance, Reception, Store, Printing | **Demo** accounts (one shared demo password) |

- **Users & access** (administrators only, under *System*): create accounts with a starting password and portal, change a person's portal, make or remove administrators, reset passwords, delete accounts. Every action is checked in the database, not just in the app.
- **Remove demo accounts and data** — one tap (with a confirmation) deletes the six demo accounts and every demo record (projects, stock, requests…), leaving an empty workspace for real data. Accounts you created stay. Add stock items from *Stock ledger → New stock item*.
- **PIN unlock** — after signing in with a password, people can set a 4–6 digit PIN on that device. Reopening the app (or coming back after 5 minutes away) asks for the PIN; five wrong PINs sign them out. Only a salted hash is kept, in that browser. Turn it off from the account menu.

### How it works

- Sign-in uses Supabase Auth. Management can open any portal; everyone else stays in their own.
- Every project, task, request, invoice, stock item and so on is one row in `app_records` (`collection`, `id`, `position`, `data`). Only the items that change are written, so people editing different things never overwrite each other.
- Changes appear on every open screen straight away (Supabase Realtime).
- Drafts (report text, unfinished forms) stay on the device.
- Only signed-in users can read or change data (row level security).
- "Reset demo data" is switched off on the live database.

Without the two `VITE_SUPABASE_*` values the app runs as a demo, with data saved in the browser only.

## Project layout

```
src/
  App.jsx               hosts the logic and renders login or the app shell
  lib/supabase.js       Supabase client (from the VITE_SUPABASE_* values)
  logic/
    TrinityApp.js       state, sign-in, actions (approve, pay, create, move…) and the assistant
    sync.js             saves changes to Supabase and applies live updates
    store.js            requisitions, issuing, shortfalls, receiving, returns, stock counts
    constants.js        icons, people, roles, mobile tabs, chart data
    seed.js             demo data
    view/*.js           turn state into the values each screen renders
  components/           desktop shell: sidebar, top bar, modal, command palette, assistant, toasts
  mobile/               phone app: sign-in, header, tab bar, bottom sheets, pull to refresh, install
  pages/                one component per page (generated from the design)
  pages/custom/         hand-written pages: store requisitions, stock ledger, job page, print floor
  ui/kit.jsx            building blocks for the hand-written pages
  styles/
scripts/
  dc-to-jsx.mjs         regenerates components/pages from the design file
  make-icons.mjs        renders the PNG app icons from the logo
supabase/migrations/    database setup SQL
design/                 the original Claude Design handoff (mockups and chat)
```

`src/components` and `src/pages` are generated from `design/project/Trinity Mark 360 App.dc.html`. After updating the design, run `npm run sync-design` and review the diff. Edits made by hand to generated files are overwritten by a re-sync.

## Deploy

The repo is ready for Vercel: import it at vercel.com/new and keep the defaults (Vite, `npm run build`, output `dist`). The Supabase URL and publishable key come from `.env`, so no extra settings are needed. `vercel.json` sends every route to the app.
