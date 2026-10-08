"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { LABELS, OUTCOMES } from "@/lib/constants";
import { fmtDur, fmtWhen } from "@/lib/format";
import { csvCell } from "@/lib/csv";
import { PageHead, RefreshButton, Badge, Alert, Skeleton } from "@/components/ui";
import CallDrawer from "@/components/CallDrawer";
import { Icon } from "@/components/Icons";

const PAGE_SIZE = 20;

export default function RecentCallsPage() {
  const [days, setDays] = useState(30);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { data, error, loading, reload } = useApi(`/api/calls?days=${days}`, { refreshMs: 60000 });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.calls || []).filter((c) => {
      if (filter !== "all" && c.call_outcome !== filter) return false;
      if (!term) return true;
      return [c.restaurant_name, c.phone, c.contact_name, c.products_interested, c.email, c.note].some((v) => String(v || "").toLowerCase().includes(term));
    });
  }, [data, q, filter]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function exportCsv() {
    const head = ["restaurant", "phone", "outcome", "contact_name", "email", "products", "duration_seconds", "started_at", "summary", "note"];
    const lines = [head.join(",")].concat(
      rows.map((c) => [c.restaurant_name, c.phone, LABELS[c.call_outcome], c.contact_name, c.email, c.products_interested, c.duration_seconds, c.started_at, c.call_summary, c.note].map(csvCell).join(","))
    );
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "recent-calls.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <PageHead title="Recent calls" subtitle="Every call with its outcome, summary, recording and transcript. Click a row for details.">
        <RefreshButton onClick={reload} loading={loading} />
        <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}><Icon name="download" size={15} />Export CSV</button>
      </PageHead>

      <div className="filters">
        <input className="input" type="search" placeholder="Search restaurant, phone, contact, product…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search calls" />
        <select className="input" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Filter by outcome">
          <option value="all">All outcomes</option>
          {OUTCOMES.map((o) => <option key={o} value={o}>{LABELS[o]}</option>)}
        </select>
        <select className="input" value={days} onChange={(e) => { setDays(Number(e.target.value)); setPage(1); }} aria-label="Date range">
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 12 months</option>
        </select>
      </div>

      {error && <Alert title="Could not load calls">{error}</Alert>}
      {!data && loading && !error && <div className="card pad"><Skeleton h={18} /><div style={{ height: 14 }} /><Skeleton h={18} /><div style={{ height: 14 }} /><Skeleton h={18} /></div>}

      {data && (
        <section className={`card ${loading ? "fade" : ""}`}>
          <div className="table-wrap">
            <table className="table table-cards">
              <thead>
                <tr><th>Restaurant</th><th>Phone</th><th>Outcome</th><th>Contact</th><th>Products</th><th>Length</th><th>When</th></tr>
              </thead>
              <tbody>
                {visible.length === 0 && <tr><td colSpan={7} className="empty">No calls match your filters.</td></tr>}
                {visible.map((c) => (
                  <tr key={c.call_id} className="row-click" tabIndex={0} onClick={() => setSelected(c)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(c))}>
                    <td data-label="Restaurant" className="strong">{c.restaurant_name || "–"}</td>
                    <td data-label="Phone">{c.phone || "–"}</td>
                    <td data-label="Outcome"><Badge outcome={c.call_outcome} /></td>
                    <td data-label="Contact">{c.contact_name || "–"}</td>
                    <td data-label="Products" className="clip">{c.products_interested || "–"}</td>
                    <td data-label="Length">{fmtDur(c.duration_seconds)}</td>
                    <td data-label="When">{fmtWhen(c.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span className="muted small">{rows.length} call{rows.length === 1 ? "" : "s"}</span>
            <div>
              <button className="btn btn-ghost btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</button>
              <span className="small pager-page">{current} / {pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
            </div>
          </div>
        </section>
      )}

      {selected && <CallDrawer call={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
