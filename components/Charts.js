"use client";

import { COLORS, LABELS, OUTCOMES } from "@/lib/constants";
import { fmtDay } from "@/lib/format";

export function Legend({ keys = OUTCOMES }) {
  return (
    <ul className="legend">
      {keys.map((k) => (
        <li key={k}><i style={{ background: COLORS[k] }} />{LABELS[k]}</li>
      ))}
    </ul>
  );
}

export function DailyStacked({ days }) {
  const max = Math.max(1, ...days.map((d) => d.total));
  return (
    <>
      <div className="daily" role="img" aria-label="Calls per day by outcome">
        {days.map((d) => (
          <div key={d.date} className="daily-col" title={`${fmtDay(d.date)}: ${d.total} calls`}>
            <div className="daily-stack" style={{ height: `${(d.total / max) * 100}%` }}>
              {OUTCOMES.map((o) => d[o] > 0 && <span key={o} style={{ height: `${(d[o] / d.total) * 100}%`, background: COLORS[o] }} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="axis"><span>{days[0] ? fmtDay(days[0].date) : ""}</span><span>{days.length ? fmtDay(days[days.length - 1].date) : ""}</span></div>
    </>
  );
}

export function Bars({ values, labels, height = 160, color = "#0a0a0a", tick = (l) => l }) {
  const max = Math.max(1, ...values);
  return (
    <>
      <div className="daily" style={{ height }} role="img" aria-label="Bar chart">
        {values.map((v, i) => (
          <div key={i} className="daily-col" title={`${labels[i]}: ${v}`}>
            <span className="bar1" style={{ height: `${(v / max) * 100}%`, background: color }} />
          </div>
        ))}
      </div>
      <div className="axis"><span>{tick(labels[0])}</span><span>{tick(labels[Math.floor(labels.length / 2)])}</span><span>{tick(labels[labels.length - 1])}</span></div>
    </>
  );
}

export function Donut({ counts, total }) {
  let acc = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 42 42" className="donut" role="img" aria-label="Outcome share">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#f0f0f0" strokeWidth="6" />
        {total > 0 && OUTCOMES.map((o) => {
          const pct = (counts[o] / total) * 100;
          if (pct <= 0) return null;
          const el = <circle key={o} cx="21" cy="21" r="15.915" fill="none" stroke={COLORS[o]} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={25 - acc} />;
          acc += pct;
          return el;
        })}
        <text x="21" y="22.5" textAnchor="middle" className="donut-num">{total}</text>
        <text x="21" y="27.5" textAnchor="middle" className="donut-sub">calls</text>
      </svg>
      <Legend />
    </div>
  );
}

export function HBars({ rows, empty = "No data yet" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="muted pad">{empty}</p>;
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color || "#0a0a0a", ...(r.value > 0 ? {} : { minWidth: 0, boxShadow: "none" }) }} /></span>
          <span className="hbar-num">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
