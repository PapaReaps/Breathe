# Updating the built-in bank holidays

Breathe Money has the UK bank holidays built in, so people don't have to type them. The list only covers certain years, so it needs refreshing about once a year. It takes a few minutes and needs no special skills.

The app never looks anything up online. The dates live in one file: `apps/money/src/data/bankHolidays.ts`.

## Steps

1. Open **https://www.gov.uk/bank-holidays.json** in your browser. This is the official list. It covers England and Wales, Scotland and Northern Ireland, and usually runs about two years ahead.
2. For each region in `bankHolidays.ts`, add the new dates at the end of its list, in date order, written like `"2029-01-01"`. Use the dates exactly as GOV.UK gives them. A holiday that falls on a weekend already appears there on the weekday it is taken (the "Substitute day" entries).
3. Change `BUILT_IN_LAST_DAY` to the last day the list now covers. Use the last day of the last year that is complete for all three regions, for example `"2029-12-31"`.
4. In `apps/money`, run `npm test`. The tests check that every date is real, in order, never on a weekend, and that every year has a full set for every region. If something is missing or mistyped, a test will say so.
5. Update the "Copied in on…" date in the comment at the top of the file.

## Good to know

- Only dates are stored, not names, to keep the file small and simple.
- Dates before 2024 are left out. A balance is never that old.
- When the list runs out, the app says so kindly on the home screen and points people to Bank holidays in the Menu, where they can type extra days.
- Occasionally the government adds a one-off bank holiday (for example a coronation or a jubilee). Check the GOV.UK file each time, because it will include it.
