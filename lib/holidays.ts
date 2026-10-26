export type Region = "uae" | "egypt";

export type Holiday = {
  /** ISO date, YYYY-MM-DD. One entry per day off. */
  date: string;
  name: string;
  region: Region;
  /** Lunar holidays move with the moon sighting; the official date is announced shortly before. */
  expected?: boolean;
};

export const REGIONS: { id: Region; label: string; office: string }[] = [
  { id: "uae", label: "UAE", office: "Dubai office" },
  { id: "egypt", label: "Egypt", office: "Cairo office" },
];

function range(region: Region, name: string, start: string, days: number, expected = false): Holiday[] {
  const first = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(first);
    day.setUTCDate(first.getUTCDate() + index);
    return { date: day.toISOString().slice(0, 10), name, region, expected: expected || undefined };
  });
}

const both = (name: string, start: string, days: number, expected = false) => [
  ...range("uae", name, start, days, expected),
  ...range("egypt", name, start, days, expected),
];

export const HOLIDAYS: Holiday[] = [
  // 2026
  ...range("uae", "New Year's Day", "2026-01-01", 1),
  ...range("egypt", "Coptic Christmas", "2026-01-07", 1),
  ...range("egypt", "Revolution Day (25 January)", "2026-01-25", 1),
  ...both("Eid al-Fitr", "2026-03-20", 3, true),
  ...range("egypt", "Sham el-Nessim", "2026-04-13", 1),
  ...range("egypt", "Sinai Liberation Day", "2026-04-25", 1),
  ...range("egypt", "Labour Day", "2026-05-01", 1),
  ...both("Arafat Day", "2026-05-26", 1, true),
  ...both("Eid al-Adha", "2026-05-27", 3, true),
  ...both("Islamic New Year", "2026-06-16", 1, true),
  ...range("egypt", "30 June Revolution", "2026-06-30", 1),
  ...range("egypt", "Revolution Day (23 July)", "2026-07-23", 1),
  ...both("Prophet's Birthday", "2026-08-25", 1, true),
  ...range("egypt", "Armed Forces Day", "2026-10-06", 1),
  ...range("uae", "Commemoration Day", "2026-12-01", 1),
  ...range("uae", "National Day", "2026-12-02", 2),
  // 2027
  ...range("uae", "New Year's Day", "2027-01-01", 1),
  ...range("egypt", "Coptic Christmas", "2027-01-07", 1),
  ...range("egypt", "Revolution Day (25 January)", "2027-01-25", 1),
  ...both("Eid al-Fitr", "2027-03-10", 3, true),
  ...range("egypt", "Sinai Liberation Day", "2027-04-25", 1),
  ...range("egypt", "Labour Day", "2027-05-01", 1),
  ...range("egypt", "Sham el-Nessim", "2027-05-03", 1),
  ...both("Arafat Day", "2027-05-16", 1, true),
  ...both("Eid al-Adha", "2027-05-17", 3, true),
  ...both("Islamic New Year", "2027-06-06", 1, true),
  ...range("egypt", "30 June Revolution", "2027-06-30", 1),
  ...range("egypt", "Revolution Day (23 July)", "2027-07-23", 1),
  ...both("Prophet's Birthday", "2027-08-15", 1, true),
  ...range("egypt", "Armed Forces Day", "2027-10-06", 1),
  ...range("uae", "Commemoration Day", "2027-12-01", 1),
  ...range("uae", "National Day", "2027-12-02", 2),
];

/** Local calendar date as YYYY-MM-DD, without the UTC shift that toISOString applies. */
export function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export type HolidayGroup = { name: string; region: Region; start: string; end: string; days: number; expected: boolean };

/** Collapses consecutive days of the same holiday into one entry, for lists. */
export function groupHolidays(holidays: Holiday[]): HolidayGroup[] {
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date) || a.region.localeCompare(b.region));
  const groups: HolidayGroup[] = [];
  for (const holiday of sorted) {
    const open = groups.find((group) => group.name === holiday.name && group.region === holiday.region && nextDay(group.end) === holiday.date);
    if (open) {
      open.end = holiday.date;
      open.days += 1;
    } else {
      groups.push({ name: holiday.name, region: holiday.region, start: holiday.date, end: holiday.date, days: 1, expected: Boolean(holiday.expected) });
    }
  }
  return groups.sort((a, b) => a.start.localeCompare(b.start));
}

function nextDay(iso: string) {
  const day = new Date(`${iso}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
}
