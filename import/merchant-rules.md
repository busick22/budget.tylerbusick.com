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

## Rules

Merchant → Category, learned over time. The command adds a line here whenever
you answer a question about an unclear purchase, so it won't ask again. Kept
alphabetical.

- DNCSS ST. LOUIS BB CON → Restaurants
- FW* TABNO → MISC
- KANSAS CITY ZOO → Gifts
- KC ZOO ONLINE → Gifts
- LIBERTY TRIANGLE 124 B → Restaurants
- LOWES #02459* → House Projects
- OPENAI *CHATGPT SUBSCR → MISC
- Purchased by "ASHLEN BUSICK" → Ashlen
- SEATGEEK TICKETS → Entertainment
- TABNO.PRINTIFY.ME → MISC
- TREX MART #16 → Gas
- USPS PO 2879320683 → MISC
