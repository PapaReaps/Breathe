# Stage 6: A calm look for the home screen

## The decision

The original brief listed more for the home screen (savings total, upcoming bills, a goal, a reassurance line). In Stage 3 you asked for it to be **just the number and a Menu button**. When asked in Stage 6 which extras to add back, the answer was **nothing extra**, and a **calm and neutral** look. So this stage changes how the app looks, not what is on it.

## What changed

- **Calm colours:** a soft off-white background, deep teal for the big number and buttons. No logo and no brand colours (branding is still undecided; see `BRANDING.md`).
- **Automatic dark mode:** follows the phone or computer setting.
- **Easier on the eyes:** rounded Menu button, softer boxes, a clearer heading for each setup question, balanced line breaks.
- **Phone-friendly details:** the top bar keeps clear of notches and rounded corners; buttons are at least 44px tall; animations are switched off for people who ask their device for reduced motion.
- **One place for colours:** every colour is a named variable at the top of `src/styles.css`, so changing the look later (once branding is agreed) means editing one block.

## Checked

- Contrast: every text and button colour pair was measured in light and dark mode. All pass the accessibility target for normal text (4.5:1); box outlines pass 3:1. Lowest text pair: 6.2:1.
- A tight month ("£40.00 short") uses the same calm colour. No red or alarm colours anywhere (checked against the founding promise: no pressure).
- Looked at on a 390px-wide phone screen in light and dark (welcome, setup, home number, menu).
- The Stage 4 and Stage 5 browser tests still pass, and all automatic tests pass.

## Founding-promise check

No move away from "always about helping people". Nothing was added to the screen, and nothing was taken from the person's control.

## Not done yet

Everyday use (Stage 7): updating the balance quickly, editing bills, payday rolling over to the next month.
