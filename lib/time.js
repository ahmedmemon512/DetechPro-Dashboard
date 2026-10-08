// Convert a wall-clock date + time typed in a given IANA time zone into a UTC Date (no libraries needed).
function offsetMs(utcMs, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v = Object.fromEntries(parts.map((p) => [p.type, Number(p.value)]));
  return Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second) - Math.floor(utcMs / 1000) * 1000;
}

export function zonedToUtc(date, time, tz) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const t = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!d || !t) return null;
  const guess = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  let ms = guess - offsetMs(guess, tz);
  ms = guess - offsetMs(ms, tz);
  const out = new Date(ms);
  return Number.isNaN(out.getTime()) ? null : out;
}

// Today's date (YYYY-MM-DD) in a time zone.
export const todayIn = (tz) => new Date().toLocaleDateString("en-CA", { timeZone: tz });
