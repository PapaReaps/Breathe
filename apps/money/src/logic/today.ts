/**
 * Today's date on this device, as "YYYY-MM-DD".
 * Kept in its own tiny file because it is the only place that looks at the clock.
 */
export function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
