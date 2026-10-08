"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { COLORS, LABELS, OUTCOMES } from "@/lib/constants";
import { fmtDur, fmtWhen } from "@/lib/format";
import { PageHead, Range, RefreshButton, Kpi, KpiSkeletons, Badge, Alert } from "@/components/ui";
import { DailyStacked, HBars, Legend } from "@/components/Charts";
import CallDrawer from "@/components/CallDrawer";

const PAGE_SIZE = 10;
const COPY = {
  inbound: { title: "Inbound calls", subtitle: "Calls that people made to you. Times are Pacific.", who: "Caller", empty: "No inbound calls yet." },
  outbound: { title: "Outbound calls", subtitle: "Calls your AI agent made to leads. Times are Pacific.", who: "Restaurant", empty: "No outbound calls yet." },
};

export default function DirectionCalls({ direction }) {
  const copy = COPY[direction];
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const stats = useApi(`/api/analytics?days=${days}&direction=${direction}`, { refreshMs: 60000 });
  const list = useApi(`/api/calls?days=${days}&direction=${direction}`, { refreshMs: 60000 });
  const data = stats.data;
  const calls = list.data?.calls || [];

  const pages = Math.max(1, Math.ceil(calls.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = useMemo(() => calls.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), [calls, current]);
  const error = stats.error || list.error;
  const loading = stats.loading || list.loading;
  const reload = () => { stats.reload(); list.reload(); };

  return (
    <div className="page">
      <PageHead title={copy.title} subtitle={copy.subtitle}>
        <Range value={days} onChange={(d) => { setDays(d); setPage(1); }} />
        <RefreshButton onClick={reload} loading={loading} />
      </PageHead>

      {error && <Alert title="Could not load data">{error}</Alert>}
      {!data && stats.loading && !error && <KpiSkeletons n={4} />}

      {data && (
        <div className={loading ? "fade" : ""}>
          <div className="kpi-grid kpi-4">
            <Kpi label="Total calls" value={data.total} delta={data.deltas.total} />
            <Kpi label="Samples requested" value={data.counts.sample_requested} />
            <Kpi label="Meetings booked" value={data.counts.meeting_booked} />
            <Kpi label="Avg call length" value={fmtDur(data.avgSeconds)} hint="answered calls" />
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-head"><h2>Outcomes</h2></div>
              <HBars rows={OUTCOMES.map((o) => ({ label: LABELS[o], value: data.counts[o], color: COLORS[o] }))} />
            </section>
            <section className="card">
              <div className="card-head"><h2>Calls per day</h2><span className="muted small">Last {data.chartDays} days</span></div>
              <div className="card-body"><DailyStacked days={data.daily} /><Legend /></div>
            </section>
          </div>

          <section className="card">
            <div className="card-head"><h2>All {direction} calls</h2><span className="muted small">Click a row for details</span></div>
            <div className="table-wrap">
              <table className="table table-cards">
                <thead>
                  <tr><th>{copy.who}</th><th>Phone</th><th>Outcome</th><th>Contact</th><th>Length</th><th>When</th></tr>
                </thead>
                <tbody>
                  {visible.length === 0 && <tr><td colSpan={6} className="empty">{copy.empty}</td></tr>}
                  {visible.map((c) => (
                    <tr key={c.call_id} className="row-click" tabIndex={0} onClick={() => setSelected(c)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(c))}>
                      <td data-label={copy.who} className="strong">{c.restaurant_name || "–"}</td>
                      <td data-label="Phone">{c.phone || "–"}</td>
                      <td data-label="Outcome"><Badge outcome={c.call_outcome} /></td>
                      <td data-label="Contact">{c.contact_name || "–"}</td>
                      <td data-label="Length">{fmtDur(c.duration_seconds)}</td>
                      <td data-label="When">{fmtWhen(c.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted small">{calls.length} call{calls.length === 1 ? "" : "s"}</span>
              <div>
                <button className="btn btn-ghost btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</button>
                <span className="small pager-page">{current} / {pages}</span>
                <button className="btn btn-ghost btn-sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {selected && <CallDrawer call={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
