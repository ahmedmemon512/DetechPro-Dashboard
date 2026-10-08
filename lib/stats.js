import { OUTCOMES, TZ } from "./constants";

const DAY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const HOUR_FMT = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" });
const dayKey = (t) => DAY_FMT.format(new Date(t));
const hourOf = (t) => Number(HOUR_FMT.format(new Date(t))) % 24;

export const outcomeOf = (r) => (r.in_voicemail ? "voicemail" : OUTCOMES.includes(r.call_outcome) ? r.call_outcome : "other");

function summarize(rows) {
  const counts = Object.fromEntries(OUTCOMES.map((o) => [o, 0]));
  let talkSeconds = 0;
  let talkCalls = 0;
  for (const r of rows) {
    const o = outcomeOf(r);
    counts[o] += 1;
    if (o !== "voicemail" && r.duration_seconds > 0) { talkSeconds += r.duration_seconds; talkCalls += 1; }
  }
  const total = rows.length;
  const answered = total - counts.voicemail;
  const engaged = counts.sample_requested + counts.meeting_booked + counts.callback_requested;
  const wins = counts.sample_requested + counts.meeting_booked;
  return {
    total, answered, engaged, wins, counts,
    conversion: answered > 0 ? Math.round((wins / answered) * 1000) / 10 : 0,
    avgSeconds: talkCalls > 0 ? Math.round(talkSeconds / talkCalls) : 0,
  };
}

const delta = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

export const directionOf = (r) => (r.direction === "inbound" ? "inbound" : "outbound");

export function computeStats(allRowsIn, since, days, direction = null) {
  const allRows = direction ? allRowsIn.filter((r) => directionOf(r) === direction) : allRowsIn;
  const sinceMs = since.getTime();
  const rows = allRows.filter((r) => new Date(r.started_at).getTime() >= sinceMs);
  const prevRows = allRows.filter((r) => new Date(r.started_at).getTime() < sinceMs);
  const cur = summarize(rows);
  const prev = summarize(prevRows);

  // Daily series (last up-to-30 days) with outcome split.
  const chartDays = Math.min(days, 30);
  const series = {};
  for (let i = chartDays - 1; i >= 0; i--) {
    series[dayKey(Date.now() - i * 86400000)] = { total: 0, ...Object.fromEntries(OUTCOMES.map((o) => [o, 0])) };
  }
  const hourly = Array.from({ length: 24 }, () => 0);
  const buckets = [0, 0, 0, 0, 0]; // <30s, 30-60s, 1-2m, 2-5m, 5m+
  const products = new Map();

  for (const r of rows) {
    const o = outcomeOf(r);
    const k = dayKey(r.started_at);
    if (series[k]) { series[k].total += 1; series[k][o] += 1; }
    hourly[hourOf(r.started_at)] += 1;
    if (o !== "voicemail" && r.duration_seconds > 0) {
      const s = r.duration_seconds;
      buckets[s < 30 ? 0 : s < 60 ? 1 : s < 120 ? 2 : s < 300 ? 3 : 4] += 1;
    }
    for (const part of String(r.products_interested || "").split(/,|;|\/|&|\band\b/i)) {
      const p = part.trim().toLowerCase();
      if (p.length >= 2 && p.length <= 40) products.set(p, (products.get(p) || 0) + 1);
    }
  }

  return {
    days,
    total: cur.total, answered: cur.answered, engaged: cur.engaged, wins: cur.wins,
    counts: cur.counts, conversion: cur.conversion, avgSeconds: cur.avgSeconds,
    deltas: {
      total: delta(cur.total, prev.total),
      samples: delta(cur.counts.sample_requested, prev.counts.sample_requested),
      meetings: delta(cur.counts.meeting_booked, prev.counts.meeting_booked),
    },
    chartDays,
    daily: Object.entries(series).map(([date, v]) => ({ date, ...v })),
    hourly,
    durations: [
      { label: "< 30s", value: buckets[0] }, { label: "30–60s", value: buckets[1] }, { label: "1–2 min", value: buckets[2] },
      { label: "2–5 min", value: buckets[3] }, { label: "5+ min", value: buckets[4] },
    ],
    topProducts: [...products.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value })),
    latest: rows.slice(0, 6).map((r) => ({
      call_id: r.call_id, direction: directionOf(r), restaurant_name: r.restaurant_name, phone: r.phone, call_outcome: outcomeOf(r),
      duration_seconds: r.duration_seconds, started_at: r.started_at,
    })),
  };
}
