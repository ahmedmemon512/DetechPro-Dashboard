"use client";

import { COLORS, LABELS, ON_COLOR } from "@/lib/constants";
import { Icon } from "./Icons";

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="head-actions">{children}</div>}
    </div>
  );
}

export function Range({ value, onChange, options = [7, 30, 90] }) {
  return (
    <div className="seg" role="group" aria-label="Date range">
      {options.map((d) => (
        <button key={d} className={value === d ? "on" : ""} aria-pressed={value === d} onClick={() => onChange(d)}>
          {d}D
        </button>
      ))}
    </div>
  );
}

export function RefreshButton({ onClick, loading }) {
  return (
    <button className="btn btn-ghost btn-sm" onClick={onClick} disabled={loading}>
      <Icon name="refresh" size={15} />
      {loading ? "Loading" : "Refresh"}
    </button>
  );
}

export function Badge({ outcome }) {
  return <span className="badge" style={{ background: COLORS[outcome], color: ON_COLOR[outcome] }}>{LABELS[outcome] || "Other"}</span>;
}

export function Alert({ kind = "error", title, children }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {title && <strong>{title}</strong>}
      {children && <p>{children}</p>}
    </div>
  );
}

export function Skeleton({ h = 20, w = "100%" }) {
  return <span className="skeleton" style={{ height: h, width: w }} />;
}

export function Kpi({ label, value, delta, hint, strong }) {
  const hasDelta = typeof delta === "number";
  return (
    <div className={`kpi ${strong ? "kpi-strong" : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {hasDelta ? (
          <span className={`delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}`}>{delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}%<em> vs previous</em></span>
        ) : (
          <span className="kpi-hint">{hint || "\u00A0"}</span>
        )}
      </div>
    </div>
  );
}

export function KpiSkeletons({ n = 6 }) {
  return (
    <div className="kpi-grid" aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="kpi"><Skeleton h={12} w="55%" /><div style={{ height: 14 }} /><Skeleton h={30} w="40%" /></div>
      ))}
    </div>
  );
}

// One stage of a multi-step flow (upload -> review -> launch). The numbers are a real sequence.
export function Step({ n, title, hint, done, locked, children }) {
  return (
    <li className={`step ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}`}>
      <span className="step-num" aria-hidden="true">{done ? <Icon name="check" size={14} /> : n}</span>
      <div className="step-body">
        <div className="step-head"><h3>{title}</h3>{hint && <p>{hint}</p>}</div>
        {!locked && <div className="step-content">{children}</div>}
      </div>
    </li>
  );
}
