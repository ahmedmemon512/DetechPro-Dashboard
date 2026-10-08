"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { JOB_STATUS } from "@/lib/jobs";
import { fmtWhen, fmtHouston } from "@/lib/format";
import { Alert } from "@/components/ui";

export default function LeadJobsList({ activeId, onOpen, refreshKey }) {
  const { data, error, reload } = useApi(`/api/jobs?k=${refreshKey}`, { refreshMs: 20000 });
  const [busy, setBusy] = useState("");
  const jobs = data?.jobs || [];

  async function cancel(id) {
    setBusy(id);
    await fetch(`/api/jobs/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    setBusy(""); reload();
  }

  return (
    <section className="card">
      <div className="card-head">
        <div className="card-title"><h2>Scheduled &amp; recent jobs</h2><p>Scheduled times are shown in Houston, TX time.</p></div>
      </div>
      {error && <div className="result"><Alert title="Could not load jobs">{error}</Alert></div>}
      <div className="table-wrap">
        <table className="table table-cards">
          <thead><tr><th>Search</th><th>Status</th><th>When</th><th>Leads</th><th></th></tr></thead>
          <tbody>
            {jobs.length === 0 && <tr><td colSpan={5} className="empty">No jobs yet.</td></tr>}
            {jobs.map((j) => (
              <tr key={j.id}>
                <td data-label="Search" className="clip"><span className="strong">{j.query}</span><br /><span className="muted small">{j.location} · max {j.max_results}</span></td>
                <td data-label="Status">{JOB_STATUS[j.status] || j.status}{j.auto_call && j.status !== "cancelled" ? <><br /><span className="muted small">auto-call</span></> : null}</td>
                <td data-label="When">{j.status === "scheduled" ? fmtHouston(j.run_at) : fmtWhen(j.created_at)}</td>
                <td data-label="Leads">{["scheduled", "scraping"].includes(j.status) ? "–" : j.lead_count ?? 0}</td>
                <td data-label="">
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    {j.status === "scheduled" && <button className="btn btn-ghost btn-sm" disabled={busy === j.id} onClick={() => cancel(j.id)}>Cancel</button>}
                    {!["scheduled", "cancelled", "failed"].includes(j.status) && (
                      <button className="btn btn-ghost btn-sm" disabled={activeId === j.id} onClick={() => onOpen(j.id)}>{activeId === j.id ? "Showing" : "View"}</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
