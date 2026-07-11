# Budget

A personal budgeting PWA with five areas: **Dashboard, Spending, Bills,
Goals, Debt**. One Firebase owner account. The core method is **category
limits**: the owner sets his own categories with a monthly limit each, and
the dashboard shows spend vs. limit. Transactions come in two ways: typed by
hand, or via **CSV upload where Claude (the Anthropic API) normalizes and
categorizes a whole bank statement for review before saving**.

- **Stack:** React 18 + Vite, React Router, Firebase, `lucide-react` icons.
  Installable PWA (`vite-plugin-pwa`). Deliberately mirrors the Accomplish
  app's structure and conventions — when in doubt, look at how
  `../accomplish` does it.
- **Firebase project:** `busick-budget` (config pasted into
  `src/firebase.js` on 2026-07-10).
- **Firebase services (planned):** Auth (sign-in), Firestore (categories,
  transactions, bills, goals, debts, settings), Functions (phase 3 only: the
  AI categorizer that holds the Anthropic API key server-side).
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
3. **Phase 3 — CSV + AI import** (code-complete; deploy + live test blocked
   on owner): upload a bank CSV → a Cloud Function sends it to the Anthropic
   API → transactions come back normalized + categorized → review screen →
   save. The API key lives ONLY in the Function (never the browser).
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

- **2026-07-10 — Phase 3 CODE-COMPLETE (the only untested seam is the live
  Claude call — blocked on owner setup, SETUP.md §6).**
  - **Backend** (`functions/index.js`, the app's first backend): one
    callable `categorizeStatement` (v2 onCall, us-central1, 120s timeout,
    secret `ANTHROPIC_API_KEY` via defineSecret). Takes {csvText,
    categories:[{id,name}]}, requires auth, caps CSV at 300KB. Calls
    `claude-opus-4-8` with **structured outputs**
    (`output_config.format` json_schema, additionalProperties:false) so
    the reply always parses: rows of {date YYYY-MM-DD, description
    (cleaned merchant), amountCents (positive int), categoryId|null,
    isMoneyIn}. Prompt handles varied bank CSV layouts/sign conventions,
    skips headers/balance columns/pending dupes, never force-matches a
    category. Server re-validates every row (regex date, int cents,
    known categoryId) and handles refusal/max_tokens stop reasons.
    `firebase.json` got its functions block; `src/firebase.js` now exports
    `functions`.
  - **Client:** `lib/importer.js` is the seam (httpsCallable, 120s);
    `ImportModal.jsx` in spending = pick (file input, 300KB cap) →
    working (sparkle + spinner) → review (per-row include checkbox +
    category select + amount; money-in rows auto-unticked with green
    MONEY IN badge; live count/total in blurb; Save loops
    addTransaction). Import button (Sparkles icon) sits next to Add on
    Spending.
  - **Verified with fixtures (since removed; grep clean):** full
    pick→working→review flow via DataTransfer-injected file + canned
    categorizeCsv reply — untick recount ($143.46→$126.61 ✓), category
    reassignment sticks, money-in exclusion. Lint + build clean. **CSS
    gotcha recorded:** base.css loads AFTER feature css in dev, so
    `.field{width:100%}` beat `.import-row-cat` — fixed with the doubled
    selector `.import-row .import-row-cat` (same trick Accomplish's
    calendar needed).
  - **NOT verified:** the real Function call (needs Blaze + the secret +
    `firebase deploy --only functions`) and real-bank CSV quality. First
    live import should be QA'd against a real statement; tune the system
    prompt in functions/index.js if categorization disappoints.
- **2026-07-10 — Phase 4 built and verified in-browser (built out of order:
  Phase 3 is blocked on owner setup — Blaze plan + Anthropic API key).**
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
  - **Remaining work, in order:** (1) owner signs in (real Chrome —
    embedded pane blocks popups AND redirects) and QAs phases 2+4 against
    real Firestore; (2) `git init` + first commit; (3) first deploy
    (SETUP.md step 5); (4) **Phase 3 — CSV + AI import** (the only
    unbuilt phase): needs owner's Blaze upgrade + Anthropic API key, then
    build the Cloud Function (holds the key, calls Claude to
    normalize/categorize CSV rows) + upload/review UI in Spending.
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
    Phase 3 (CSV + AI import) when he's ready.
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
