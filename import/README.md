# The `import/` folder — your monthly statement import

This folder is the free, no-API way to get a bank statement into Budget. An
AI coding assistant (Claude Code or Codex — whichever you're already paying
for) does the categorizing here; the app just loads the result. No Anthropic
API credits, no Blaze plan needed for this path.

## What's in here

| File | What it is |
|------|------------|
| `CATEGORIZE.md` | The recipe the assistant follows. Written in plain language so **either** Claude Code or Codex can use it. You rarely touch this. |
| `merchant-rules.md` | The **memory**: your category names + every merchant→category decision, growing over time. Keep the Categories list matching your app. |
| `<YYYY-MM>.json` | The monthly output the assistant writes (e.g. `2026-07.json`). This is what you load into the app. |

The matching command lives at `.claude/commands/categorize.md` (Claude Code)
and `.codex/prompts/categorize.md` (Codex) — both just point at
`CATEGORIZE.md`, so `/categorize` works in whichever tool you open.

## Your monthly routine

1. **Download** the CSV statement from your bank/card site into this folder.
2. **Open Claude Code (or Codex)** in the `budget` project and run:
   `/categorize import/statement.csv` (use the real filename).
3. The assistant reads it, auto-sorts known merchants, and **asks you about
   anything unclear**. Answer its questions — your answers get remembered, so
   it asks less each month.
4. It writes `import/<month>.json` and updates `merchant-rules.md`.
5. **In the Budget app** → Spending → **Import** → *Load a prepared file* →
   pick that `.json` → review the rows → **Save**.

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

`amount` is in dollars, `category` is one of your category names (or `null`),
and `isMoneyIn: true` marks deposits/refunds (those come in unticked so they
don't count as spending). You can hand-edit this file before loading it if you
ever want to.
