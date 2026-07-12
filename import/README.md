# The `import/` folder — your monthly statement import

This folder is the no-backend way to get a bank statement into Budget. The app
does not upload raw bank files anywhere; it only loads a prepared `.json` file
from your computer, lets you review the rows, then saves the rows you approve.

## What's in here

| File | What it is |
|------|------------|
| `CATEGORIZE.md` | Optional helper recipe for turning a bank CSV into the prepared JSON shape. You rarely touch this. |
| `merchant-rules.md` | The **memory**: your category names + every merchant→category decision, growing over time. Keep the Categories list matching your app. |
| `<YYYY-MM>.json` | The monthly output the assistant writes (e.g. `2026-07.json`). This is what you load into the app. |

The optional helper command lives at `.claude/commands/categorize.md` and
`.codex/prompts/categorize.md`. Both point at `CATEGORIZE.md`, so
`/categorize` can create the prepared file if you use one of those tools.

## Your monthly routine

1. **Download** the CSV statement from your bank/card site into this folder.
2. Create a prepared JSON file. If you use the helper command, run:
   `/categorize import/statement.csv` (use the real filename).
3. Answer any categorization questions. Those answers get remembered in
   `merchant-rules.md`, so next month's file is easier.
4. It writes `import/<month>.json` and updates `merchant-rules.md`.
5. **In the Budget app** → Spending → **Import** → *Load a prepared file* →
   pick that `.json` → review the rows → **Save**. Purchases go to Spending;
   rows marked `isMoneyIn: true` go to Income.

That's it. Saving writes straight to your live data (Firestore) — **no
redeploy needed**; deploys are only for changes to the app's code.

## The output format (for reference)

```json
{
  "month": "2026-07",
  "transactions": [
    { "date": "2026-07-06", "description": "Hy-Vee", "amount": 64.12, "category": "Groceries", "isMoneyIn": false }
  ]
}
```

`amount` is in dollars, `category` is one of your expense category or income
source names (or `null`), and `isMoneyIn: true` marks deposits/refunds. Those
rows are included by default, saved as income, and never inflate spending.
Without a matching income source they appear as Unassigned. You can hand-edit
this file before loading it if you ever want to.
