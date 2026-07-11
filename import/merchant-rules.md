# Import memory

Read and updated by the `/categorize` command (in Claude Code or Codex). It
has two parts. The Budget app never touches this file — it's only for the
categorizing step.

## Categories

The category names you use in the Budget app. The command may ONLY sort
purchases into these. If you add or rename a category in the app, update it
here too so the spelling matches.

<!-- Replace this sample list with your real categories. -->
- Groceries
- Dining
- Gas
- Bills
- Fun

## Rules

Merchant → Category, learned over time. The command adds a line here whenever
you answer a question about an unclear purchase, so it won't ask again. Kept
alphabetical.

- (none yet — this fills in as you confirm merchants)
