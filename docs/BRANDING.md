# Branding

**Status: being explored. Two pieces are chosen: the opening "deep breath" and the app icon, "Breathing out" (below).**

## Why we are waiting

The brand has to work for Money, Medication, Travel and Daily, and for apps we have not thought of yet. A logo chosen too early would probably drift towards whichever app came first (Money). So we explore branding separately, and agree it before it goes anywhere near the code.

## What is agreed so far (from the project brief)

- Feeling: calm, modern, friendly, reassuring, minimal, accessible.
- Colour direction: soft sage green, warm cream, gentle grey.
- Generous spacing, rounded corners, readable text, large numbers.
- Nothing finance-specific in the main logo or name.
- Avoid clutter, bright aggressive colours, shame or guilt language, and pressure.

## Chosen so far: the opening "deep breath"

The word **breathe**, lowercase, in **Nunito** (soft and rounded, SIL Open Font Licence, bundled with the app), in the app's teal. On opening it takes one deep breath: light, then full and lifted, then settled, with a soft shadow beneath it. Sketches of the other ideas tried are kept outside the project, in the `branding-concepts` folder.

## Chosen so far: the app icon, "Breathing out"

Soft cream ripples around a calm centre, on the app's teal (a little lighter at the top left). It matches the GitHub profile picture (ocean-blue ripples) and works for any Breathe app, not just Money. Chosen November 2026 from four ideas (ripples, a rounded "b", a sunrise, a pebble). Used for the Android icon (with a one-colour version for themed icons), the browser tab and bookmarks, and "add to home screen".

## What is NOT decided

Logo (a full logo beyond the icon), exact colours, the font for the rest of the app, and how each app is distinguished within the family.

## What this means for development

- Stages 1 to 3 use plain, neutral, accessible styling. It will look simple on purpose.
- Visual choices go in one place so they can be swapped easily once agreed.
- `packages/design/` stays empty until branding is approved.
- Fonts must be bundled with the app (no loading from other companies), so font choice has a privacy side too.
- Colours must pass accessibility contrast checks. Soft palettes can easily fail this, so we will test them.

## Questions for the branding sessions

- What word or feeling should anyone, in any Breathe app, recognise instantly?
- What distinguishes one app in the family from another (colour, icon, name)?
- Does it work as a tiny phone icon, in black and white, and for someone with low vision?
