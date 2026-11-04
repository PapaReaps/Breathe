# Stage 5: Friendly setup

## What changed, in plain English

- **Add your numbers** on the welcome screen now starts a gentle walk-through, one question per screen:
  1. What's in your everyday account right now?
  2. When is your next payday? (If it falls on a weekend or bank holiday, it asks when you usually get paid then.)
  3. Any bills before then?
  4. Any other money coming in before payday?
  5. What do you usually spend on food and travel each week?
  6. Would you like a rainy-day pot?
- **Every question can be skipped** ("Skip this one", or "Nothing to add" for bills and money coming in). There is a Back button, and pressing Enter moves on.
- **Nothing is lost by stopping.** Answers are saved as you go (Stage 4). Opening the setup again carries on from the next unanswered question.
- **The ending** is either "All set" with a button to see your number, or a kind list of what is still needed, with "Finish later".
- The Menu has a new **Step-by-step setup** item to run it again any time.

## What did not change

The calculation, the simple main screen, and the Menu pages. The setup reuses the same boxes as the Menu, so there is only one place each rule lives. The balance's date is set to today automatically (no date question), as in Stage 4.

## Tests

- `tests/setup.test.ts`: where the setup starts (new person, balance already given, everything answered, blank balance).
- Browser test (run by hand over http://localhost): first question, progress text, no Back on the first screen, Enter moves on, Back keeps answers, skipping, finish screen, correct number (£330.00 for the sample), survives reload, re-run from the Menu, resume at payday after only a balance, kind list when everything is skipped. The Stage 4 browser test still passes.

## Founding-promise check

No move away from "always about helping people". Every question can be skipped, nothing is required to be finished, no pressure wording (the wording scan covers the new text), and nothing new is collected.

## Not done yet

Home screen polish (Stage 6), everyday-use features (Stage 7).
