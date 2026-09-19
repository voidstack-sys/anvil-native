/**
 * Pure calendar arithmetic for DatePicker. `month` is always 0-indexed
 * (0 = January), matching `Date`'s own convention.
 */

/** Number of days in `month` of `year`. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Clamps `day` down to the last valid day of `month`/`year` (e.g. 31 -> 28 for February). */
export function clampDay(day: number, year: number, month: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/** Clamps `date` into `[minimumDate, maximumDate]`, either bound optional. */
export function clampDateToRange(
  date: Date,
  minimumDate?: Date,
  maximumDate?: Date
): Date {
  let time = date.getTime();
  if (minimumDate && time < minimumDate.getTime()) time = minimumDate.getTime();
  if (maximumDate && time > maximumDate.getTime()) time = maximumDate.getTime();
  return new Date(time);
}
