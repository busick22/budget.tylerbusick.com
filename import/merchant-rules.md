# Import memory

Read and updated by the `/categorize` command (in Claude Code or Codex). It
has two parts. The Budget app never touches this file — it's only for the
categorizing step.

## Categories

The category names you use in the Budget app. The command may ONLY sort
purchases into these. If you add or rename a category in the app, update it
here too so the spelling matches.

Tithe
Hospitality
Extra Giving
Save
Retirement
House Payment
Car Payment
Window Payment
Electric, Sewer, Water, Trash
Gas (house)
Car Insurance
Car Repair
Internet
Grocery
Gas
Entertainment
Kids Misc
Restaurants
Health Insurance
Medical Appointments
Medication
House Projects
House Maintenance
Clothing
Gifts
MISC
Childcare
Pets
Ashlen

## Income sources

Income source names from the Budget app, such as Paycheck or Side gig. Income
still imports when this list is empty; it appears as Unassigned on the Income
tab instead of being counted as spending.

## Rules

Merchant → Category or income source, learned over time. The command adds a
line here whenever you answer a question about an unclear transaction, so it
won't ask again. Kept alphabetical.

- BARCLAYCARD US CREDITCARD → IGNORE (credit card payment; already handled in card statement)
- Check #851 → Electric, Sewer, Water, Trash
- DEPT EDUCATION STUDENT LN → MISC
- DNCSS ST. LOUIS BB CON → Restaurants
- FW* TABNO → MISC
- IBMC WEB PMTS → House Payment
- KANSAS CITY ZOO → Gifts
- KC ZOO ONLINE → Gifts
- LIBERTY MO ONLINE PMT → Gas (house)
- LIBERTY TRIANGLE 124 B → Restaurants
- LOWES #02459* → House Projects
- OPENAI *CHATGPT SUBSCR → MISC
- Purchased by "ASHLEN BUSICK" → Ashlen
- SEATGEEK TICKETS → Entertainment
- TABNO.PRINTIFY.ME → MISC
- TREX MART #16 → Gas
- USPS PO 2879320683 → MISC
