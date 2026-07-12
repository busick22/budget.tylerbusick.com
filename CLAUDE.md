# Budget

A personal budgeting PWA with five areas: **Dashboard, Spending, Bills,
Income, Debt** (savings goals live as a section on Income). One Firebase owner account. The core method is **category
limits**: the owner sets his own categories with a monthly limit each, and
the dashboard shows spend vs. limit. Transactions come in two ways: typed by
hand, or via **prepared JSON import** where the app loads a local file for
review before saving.

- **Stack:** React 18 + Vite, React Router, Firebase, `lucide-react` icons.
  Installable PWA (`vite-plugin-pwa`). Deliberately mirrors the Accomplish
  app's structure and conventions — when in doubt, look at how
  `../accomplish` does it.
- **Firebase project:** `busick-budget` (config pasted into
  `src/firebase.js` on 2026-07-10).
- **Firebase services:** Auth (sign-in) and Firestore (categories,
  transactions, bills, goals, debts, settings). There is no Functions backend
  in the current app.
- **Live URL (eventually):** budget.tylerbusick.com.

## Talking to the owner (read this first)

The owner (Tyler) is learning to code. Explain everything in plain, everyday
language:

- **No unexplained jargon.** Define any unavoidable technical term in one
  short phrase the first time.
- **Lead with the "so what"** — what a change means for him using the app.
- **Say which part each change touches:** the screen/UI, the database
  (Firestore), sign-in (Auth), or the backend (Functions).
- **Flag anything risky or hard to undo before doing it.**
- This app is built for one person. "Breaks at scale" concerns usually don't
  apply — say so instead of listing them as urgent.

## The build plan (agreed with the owner)

1. **Phase 1 — foundation** ✅: scaffold, design system, sign-in, app shell,
   placeholder pages.
2. **Phase 2 — categories & manual money** ✅: owner-defined categories with
   monthly limits, manual add/edit transactions, dashboard gauges.
3. **Phase 3 — statement import.** Prepared file only:
   `import/<YYYY-MM>.json` → app's "Load a prepared file" → review screen.
   No raw CSV upload, no Cloud Function, no Anthropic/API integration.
4. **Phase 4 — trackers** ✅: recurring bills with due dates, savings goals,
   debt payoff.

## Layout (where things live)

- `src/app/` — the frame: sidebar (desktop), floating dock (mobile),
  routing shell, brand mark, `nav.js` (the five areas + accent colors).
- `src/features/` — one folder per screen (dashboard, spending, bills,
  goals, debt, settings, auth). Pages own their CSS file; placeholder pages
  use the shared `ComingSoon` component until their phase lands.
- `src/state/` — one React context per data domain: `AuthContext` (who's
  signed in), `SettingsContext` (theme, in Firestore + localStorage mirror).
- `src/components/` — small shared pieces (`ComingSoon`).
- `src/styles/` — `tokens.css` (every color/size/speed, both themes; Budget
  is the **green** app) and `base.css` (buttons, inputs, cards, modals, and
  the `.amount` class every money figure should use).
- `src/firebase.js` — the only file that knows Firebase config; exports
  `isFirebaseConfigured` so the sign-in screen can show a friendly note
  until the real config is pasted in.
- `firestore.rules` — everything under `users/{uid}` is owner-only.
- `SETUP.md` — the owner's one-time Firebase checklist.

## Commands

- `npm install` then `npm run dev` → http://localhost:5174
  (port 5174 so it can run beside Accomplish's 5173)
- `npm run lint` → check code style
- `npm run build` → produce `dist/`
- `npm run icons` → regenerate PWA icons from `public/favicon.svg`
- Deploy (once Firebase exists): `npm run build`, then `firebase deploy`

## Working on it

- Keep page styles in their feature folder; shared styles go in
  `src/styles/base.css`; **new colors/sizes only via `tokens.css` variables**
  (that's what keeps light/dark themes working).
- Money figures use the `.amount` class (tabular digits, display face).
- Mobile can't see the sidebar — Settings is reached via the gear in the
  Dashboard header. Keep that link working.
- UI (React) vs. backend (Functions) vs. rules changes — call out which a
  task touches.

## Current focus

- **2026-07-11 — Income, income sources & accounts added; app is now a full
  monthly money picture (in/out/net/balance), not spending-only. Built +
  verified in-browser.** Owner-chosen shape: named accounts (manual
  balances), income grouped by SOURCE, goals RELOCATED under Income (Goals
  tab replaced by Income). Big multi-part change:
  - **Data model:** transactions gained `type: 'income' | 'expense'`
    (missing = expense, back-compat). `spentByCategory` now EXCLUDES income
    (so a paycheck never inflates a gauge); new `incomeBySource(month)`.
    Categories gained `kind: 'expense' | 'income'` (missing = expense) with
    derived `expenseCategories` / `incomeSources`; income sources reuse the
    categories collection (no limit). New **AccountsContext**
    (`users/{uid}/accounts`: name, balanceCents, color) — balances are
    MANUAL (a number you set from your bank), deliberately NOT computed from
    transactions (avoids bank-vs-app drift; see the file comment). Providers
    wired: Accounts→Categories→Transactions→Bills→Goals→Debts.
  - **Modals:** TransactionModal got an Expense/Income segmented toggle
    (switching clears the cross-list category; income shows a "Source"
    picker of incomeSources; `defaultType` prop). CategoryModal generalized
    with a `kind` prop (hides the limit for income sources). New
    AccountModal (name, balance, color; balance may be negative).
  - **UI:** nav Goals→**Income** (Wallet icon, /income route). New
    **IncomePage**: month income grouped by source (subtotals, +green
    amounts), "Add income", "Source" (manage income sources via
    CategoryModal kind=income), and the relocated **GoalsSection** (goals
    were extracted from GoalsPage into `goals/GoalsSection.jsx`;
    `GoalsPage.jsx` is now just a re-export). **Dashboard** grew a Balance
    strip (accounts + total, click to edit) and a cash-flow line
    (Income · Spent · **Net**), gauges now use expenseCategories.
    **Spending** is expenses-only (filters type=expense; filter dropdown
    uses expenseCategories). Import review uses expenseCategories.
    New tokens: `--accent-income`, `--money-in`, `--money-out`.
  - **Verified** (fixtures since removed; grep clean): Dashboard balance
    $9,740.75 (Checking+Savings ✓), cash-flow Income $6,460 / Spent $343.34
    / Net +$6,116.66 (all math ✓); Income page grouped Paycheck $6,400 (2×
    $3,200) + Side gig $60 with goals section below; Spending excludes
    income ($343.34, no Employer/Lawn rows); modal toggle swaps
    Category↔Source and expense↔income option lists. Lint + build clean,
    zero console errors, committed.
  - **DEFERRED (follow-up):** income via IMPORT. The import still brings in
    expenses only — money-in rows stay auto-unticked/excluded (ImportModal
    uses expenseCategories). Wiring detected money-in rows to save as
    income (with a source picker in the review screen) is the next natural
    step for "upload all statements, see in AND out." Also: the money-in
    row, if ticked today, saves as an expense (pre-existing) — fix when
    doing income-import.
- **2026-07-11 — Bulk select added to Spending (owner hit the "imported
  everything uncategorized, don't want to delete one-by-one" problem).
  Built + verified in-browser.** A "Select" button in the Spending toolbar
  enters select mode: rows show checkboxes (click toggles), a floating
  action bar shows "N selected" + Select all/Clear + a **Set category…**
  dropdown + **Delete** (two-click confirm: "Delete N?") + Done. After a
  bulk action the selection clears but stays in select mode, so cleaning a
  filtered Uncategorized list flows (fixed rows drop out live). Works in
  both by-day and by-category views and respects the category filter — so
  the intended fix is: filter Uncategorized → Select → Select all → Set
  category (or Delete to start over).
  - **Data:** `TransactionsContext` gained `deleteMany(ids)` +
    `setCategoryMany(ids, categoryId)` via Firestore `writeBatch`, chunked
    at 450 (< 500 cap; one person stays well under). Live listeners refresh
    the UI after commit.
  - **Note for future me:** I recommended (and the owner agreed) that the
    smarter fix for THEIR uncategorized batch is either bulk-assign in place
    OR delete + re-run `/categorize` (now that merchant-rules.md has real
    categories) + re-import — but the owner said they'd fix that batch
    manually; this tool is the general capability. Re-import always APPENDS
    (no dedup), so "start over" = delete then re-import.
  - **Verified** (fixtures since removed; grep clean): 4 uncategorized →
    Select all → Set Grocery (all dropped out of the Uncategorized filter);
    select 2 → two-click Delete ($437.03 → $307.59, correct); confirm guard;
    stays-in-select-mode; mobile action bar wraps above the dock. Lint +
    build clean, zero console errors, committed.
- **2026-07-11 — Category review tools added (see & fix categorizations).
  Built + verified in-browser.** Answers the owner's "will I see this
  categorization / fix miscategorizations in the app?" — the merchant-rules
  MEMORY stays Codex's repo file (kept out of the app to avoid two-source
  drift), but individual transactions are now easy to review by category:
  - **Spending page:** a sub-toolbar with a **By day / By category** view
    toggle + a **category filter** dropdown (All / Uncategorized / each
    category). By-category view sections transactions by their category
    with color dot + subtotal, Uncategorized sorted last so it stands out.
    Filter narrows the list; header shows the filtered count/total (and the
    category name when filtered). Everything still edits via row-click →
    TransactionModal (category change was already possible — this just makes
    finding mistakes easy).
  - **Dashboard drill-in:** gauge cards are now clickable (role=button +
    keyboard) → navigate to Spending pre-filtered to that category for the
    shown month, via router `location.state {categoryId, month}`. The edit
    pencil `stopPropagation`s so it still edits. The uncategorized nudge
    links straight to the Uncategorized filter.
  - **Deliberately NOT built:** an in-app editor for the merchant→category
    rules memory — that would fight Codex's `import/merchant-rules.md` and
    create a sync problem. If the owner later wants the app to be the single
    source for rules (Firestore) with an exported file the command reads,
    that's a bigger coordinated change — flagged, not started.
  - **Verified** (fixtures since removed; grep clean): Dashboard Grocery
    gauge → Spending filtered to Grocery ($301.24, 2 rows ✓); By-category
    view subtotals (Gas $81.09, Restaurants $71.55 ✓) with Uncategorized
    last; filter dropdown; mobile toolbar wraps cleanly. Lint + build clean,
    zero console errors, committed.
- **2026-07-11 — Prepared-file import added (the owner's chosen path).
  Built + verified in-browser.** Rationale: the app only loads a prepared
  JSON file from disk; there is no backend import service, no API key, and no
  Blaze requirement for this path.
  - **Repo-side (tool-neutral, works with Claude Code AND Codex):**
    `import/CATEGORIZE.md` is the canonical recipe (generic language, not
    Claude-specific; scoped to read ONLY the named CSV + merchant-rules,
    do the task, ask about unclear rows, write output, stop). Thin shims
    `.claude/commands/categorize.md` + `.codex/prompts/categorize.md` both
    point at it (so `/categorize <csv>` works in either tool).
    `import/merchant-rules.md` = the MEMORY (kept separate from the recipe
    so it can grow without churning the instructions): a Categories list
    (owner keeps in sync with the app) + a Merchant→Category rules list the
    command APPENDS to whenever the owner answers a question about an
    unclear purchase — so it asks less each month. Output is
    `import/<YYYY-MM>.json` (month-named). `import/README.md` = the human
    walkthrough.
  - **Key design choices:** command deals in category NAMES, not the app's
    ids (decouples it from app internals); the app resolves name→id on
    load, unmatched names → Uncategorized. Import JSON uses dollars
    (`amount`) for human-readability; importer also accepts `amountCents`.
    The app reaches the file via the FILE PICKER, not by reading the folder
    — a browser can't read local folders, and data→Firestore is live
    instantly so imports never need a redeploy (deploy = code only). This
    was the explicit answer to "should the app read the folder + redeploy?"
    → no, headache; picker is simpler.
  - **App changes:** `lib/importer.js` gained `parsePreparedFile(text,
    categories)` (JSON parse, array-or-{transactions}, dollars→cents via
    parseToCents, name→id resolve, money-in coerce; renamed the size const
    to `MAX_IMPORT_BYTES`). `ImportModal.jsx` offers "Load a prepared file
    (.json)" and goes straight to review. Review/save unchanged.
  - **Verified** (fixtures since removed; grep clean): loaded a canned
    `2026-07.json` with names+dollars+a money-in row+an unmatched category
    ("Pets") → names resolved to the right ids, "Pets"→Uncategorized,
    string/number/integer dollar amounts all parsed, Paycheck auto-unticked
    with MONEY IN badge, header math $239.96 ✓. Lint + build clean, zero
    console errors.
  - **Next:** owner does a real run — `/categorize` on an actual bank CSV
    in Claude Code/Codex (fill his real categories into merchant-rules.md
    first), load the JSON, confirm the round-trip. Still pending from
    before: real sign-in QA (phases 2+4 against live Firestore) and the
    first `firebase deploy`.
- **2026-07-11 — Removed the old API-backed import path.** The earlier
  Functions/Anthropic concept was removed from source and deploy config:
  `functions/` deleted, `firebase.json` no longer deploys Functions,
  `src/firebase.js` no longer exports Functions, and `ImportModal.jsx` no
  longer offers raw CSV upload. Prepared JSON import remains.
- **2026-07-10 — Phase 4 built and verified in-browser (built out of order:
  Phase 3 was still evolving at the time).**
  The three trackers, all under `users/{uid}/`:
  - **Bills** (`bills`: {name, amountCents, dueDay 1–31, note,
    paidMonths: ['2026-07',...]}): due-day-sorted list, per-month paid
    checkbox (arrayUnion/arrayRemove of the month key), paid rows dim +
    strike through, header sums paid vs monthly total, month switcher.
  - **Goals** (`goals`: {name, targetCents, savedCents, color}): progress
    cards, "Add money" quick modal (negative allowed to take money out,
    floor at zero client-side, Firestore `increment`), "Goal reached!"
    state at 100%.
  - **Debt** (`debts`: {name, startingCents, balanceCents, color}): payoff
    cards where the bar FILLS as debt shrinks, "Payment" quick modal
    (capped at remaining balance, `increment(-cents)`), "Paid off!" state.
  - Goals/Debt reuse the dashboard's gauge-bar CSS and each other's card
    styles (goal-* classes; debt.css only adds deltas) and the shared
    color palette. All money integer cents. Providers wired in main.jsx
    (Bills→Goals→Debts inside Transactions).
  - **Verified** with in-memory fixtures (since removed; `grep -rn
    "PREVIEW" src/` clean): bills paid-toggle recomputes header
    (+$69.99 ✓), goal add-money (+$100 ✓ card + page totals), debt payment
    ($320 → balance $5,800 ✓), done-states for goal and debt, due-day
    ordinals. Lint + build clean, zero console errors.
  - **Historical note:** at this point Phase 3 was not settled yet; the
    current app uses prepared JSON import only.
- **2026-07-10 — Phase 2 built and verified in-browser (UI + Firestore
  wiring; real-data QA pending owner sign-in).** Categories with monthly
  limits + manual transactions + dashboard gauges, all live-updating:
  - **Data:** `users/{uid}/categories` ({name, limitCents, color,
    createdAt}) and `users/{uid}/transactions` ({date 'YYYY-MM-DD',
    description, amountCents, categoryId|null, note, createdAt}). **All
    money is integer cents** (`lib/money.js` — format/parse/centsToInput);
    `.amount` class on every figure. `lib/dates.js` does month keys
    ('YYYY-MM'); `lib/palette.js` is the 10-color category palette (stored
    by key, not hex). Both contexts subscribe to the WHOLE collection and
    filter by month in memory — right call at one-person scale.
  - **Dashboard:** month switcher (label click = jump to today's month),
    Spent/Limits/Left summary, per-category gauge cards (bar goes amber at
    ≥85%, red + "$X over" past the limit; `limitCents: 0` = "no limit —
    tracking"), dashed New-category tile, edit via hover pencil (always
    visible on touch), uncategorized-money nudge linking to Spending.
    CategoryModal: name/limit/color swatches, two-click delete (transactions
    survive as Uncategorized).
  - **Spending:** day-grouped rows (dot in category color, note in meta
    line), header shows count + month total, Add button + row-click edit
    (TransactionModal: description/amount/date/category/note, two-click
    delete). Adding inside a non-current month defaults the date to that
    month's 1st.
  - **Auth polish:** `auth/popup-blocked` now falls back to
    `signInWithRedirect` automatically (embedded-browser popups are blocked
    — the owner hit exactly this).
  - **Verified** with temporary in-memory fixtures in the two contexts +
    App.jsx auth stub (all since removed — `grep -rn "PREVIEW" src/` is
    clean): gauges' math cross-checked by hand, add/edit/delete flows,
    month switching, over/near/tracking states, both viewports. Lint +
    build clean, zero console errors, sign-in gate confirmed back.
  - **Next:** owner signs in (real browser — the embedded pane blocks both
    popup AND the redirect hop) and creates his real categories; first
    real transactions QA the Firestore path end to end. Then `git init` +
    first commit, first deploy (`firebase deploy` — SETUP.md step 5), and
    prepared-file import when he's ready.
- **2026-07-10 — Phase 1 built and verified in-browser.** Full foundation
  from scratch, mirroring Accomplish's bones with Budget's own green
  identity: tokens/base design system (both themes), sign-in page (email +
  Google, friendly errors), five-area shell (desktop sidebar + mobile
  floating dock, per-area accent tinting), placeholder pages for
  Dashboard/Spending/Bills/Goals/Debt (shared `ComingSoon` card naming the
  phase that builds each), functional Settings (theme chips + sign out),
  PWA manifest + generated icons, Firestore rules, `firebase.json` with CSP
  headers, SETUP.md. Verified: lint + build clean; sign-in screen, page
  navigation with accents, light/dark toggle, and the 5-tab mobile dock all
  checked in the embedded browser (shell was previewed with a temporary
  auth stub in App.jsx, since removed — `grep PREVIEW_SHELL` finds
  nothing). Zero console errors. **Firebase config for `busick-budget` is
  pasted in** (real values in `src/firebase.js`, Analytics deliberately
  skipped) and verified: fresh dev-server boot shows the sign-in screen
  with no "Waiting on Firebase" note and a clean console. **Not yet
  verified by the owner:** an actual sign-in (needs the Google provider
  enabled in Firebase Auth — SETUP.md step 3 — and Firestore created —
  step 4; the sign-in screen shows a friendly "method isn't enabled"
  error if step 3 was skipped). **Next:** owner signs in on
  localhost:5174 → then Phase 2 (categories with monthly limits + manual
  transactions + dashboard gauges). No git repo initialized yet — worth
  doing (`git init` + first commit) before Phase 2 starts.
