/*
 * The bank holidays built into the app.
 *
 * SOURCE: the official GOV.UK list, https://www.gov.uk/bank-holidays.json
 * (England and Wales, Scotland and Northern Ireland). Copied in on 4 November 2026.
 * Substitute days are the ones GOV.UK gives, so a holiday that falls on a weekend
 * appears on the Monday (or Tuesday) it is actually taken.
 *
 * Only the dates are kept. Nothing is ever looked up online: the app works offline
 * and nothing leaves the device.
 *
 * HOW TO UPDATE (about once a year, when GOV.UK publishes more dates):
 * see docs/UPDATING-BANK-HOLIDAYS.md. Add the new dates below, then change
 * BUILT_IN_LAST_DAY to the last day the list now covers. The tests check the rest.
 */

export const HOLIDAY_REGIONS = ["own", "england-and-wales", "scotland", "northern-ireland"] as const;
export type HolidayRegion = (typeof HOLIDAY_REGIONS)[number];

export function isHolidayRegion(value: unknown): value is HolidayRegion {
  return typeof value === "string" && (HOLIDAY_REGIONS as readonly string[]).includes(value);
}

/** The first year the list covers. Earlier days are not needed: a balance is never that old. */
export const BUILT_IN_FIRST_YEAR = 2024;

/** The last day the list covers. After this, the app says so instead of guessing. */
export const BUILT_IN_LAST_DAY = "2028-12-31";

export const BUILT_IN_HOLIDAYS: Record<Exclude<HolidayRegion, "own">, readonly string[]> = {
  "england-and-wales": [
    "2024-01-01", "2024-03-29", "2024-04-01", "2024-05-06",
    "2024-05-27", "2024-08-26", "2024-12-25", "2024-12-26",
    "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-05",
    "2025-05-26", "2025-08-25", "2025-12-25", "2025-12-26",
    "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04",
    "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03",
    "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28",
    "2028-01-03", "2028-04-14", "2028-04-17", "2028-05-01",
    "2028-05-29", "2028-08-28", "2028-12-25", "2028-12-26",
  ],
  "scotland": [
    "2024-01-01", "2024-01-02", "2024-03-29", "2024-05-06",
    "2024-05-27", "2024-08-05", "2024-12-02", "2024-12-25",
    "2024-12-26", "2025-01-01", "2025-01-02", "2025-04-18",
    "2025-05-05", "2025-05-26", "2025-08-04", "2025-12-01",
    "2025-12-25", "2025-12-26", "2026-01-01", "2026-01-02",
    "2026-04-03", "2026-05-04", "2026-05-25", "2026-06-15",
    "2026-08-03", "2026-11-30", "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-01-04", "2027-03-26", "2027-05-03",
    "2027-05-31", "2027-08-02", "2027-11-30", "2027-12-27",
    "2027-12-28", "2028-01-03", "2028-01-04", "2028-04-14",
    "2028-05-01", "2028-05-29", "2028-08-07", "2028-11-30",
    "2028-12-25", "2028-12-26",
  ],
  "northern-ireland": [
    "2024-01-01", "2024-03-18", "2024-03-29", "2024-04-01",
    "2024-05-06", "2024-05-27", "2024-07-12", "2024-08-26",
    "2024-12-25", "2024-12-26", "2025-01-01", "2025-03-17",
    "2025-04-18", "2025-04-21", "2025-05-05", "2025-05-26",
    "2025-07-14", "2025-08-25", "2025-12-25", "2025-12-26",
    "2026-01-01", "2026-03-17", "2026-04-03", "2026-04-06",
    "2026-05-04", "2026-05-25", "2026-07-13", "2026-08-31",
    "2026-12-25", "2026-12-28", "2027-01-01", "2027-03-17",
    "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31",
    "2027-07-12", "2027-08-30", "2027-12-27", "2027-12-28",
    "2028-01-03", "2028-03-17", "2028-04-14", "2028-04-17",
    "2028-05-01", "2028-05-29", "2028-07-12", "2028-08-28",
    "2028-12-25", "2028-12-26",
  ],
};
