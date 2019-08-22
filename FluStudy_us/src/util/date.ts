export function monthAsDate(year: number, monthJanuaryIs0: number) {
  // To represent a month as a date, we standardize on UTC so these come out
  // the same everywhere, and we use a day in the middle of the month so all
  // timezones would interpret the date as belonging to the month in question.
  return new Date(Date.UTC(year, monthJanuaryIs0, 15));
}
