"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import { Alert } from "@/components/ui";
import { Icon } from "@/components/Icons";

const STUCK_MS = 45 * 60 * 1000;

// Shows one lead job: scraping progress -> the generated leads -> Approve button.
export default function LeadJob({ jobId, onChanged }) {
  const [poll, setPoll] = useState(4000);
  const { data, error, reload } = useApi(`/api/jobs/${jobId}`, { refreshMs: poll });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { kind, text }

  const job = data?.job;
  const leads = data?.leads || [];
  const status = job?.status;

  // Poll quickly while the job is still moving, stop when it has settled.
  useEffect(() => { setPoll(status === "scraping" || status === "calling" || !status ? 4000 : 0); }, [status]);
  useEffect(() => { setConfirming(false); setMsg(null); }, [jobId]);
  useEffect(() => { if (status) onChanged?.(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const withPhone = leads.filter((l) => l.phone).length;
  const withEmail = leads.filter((l) => l.email).length;

  async function post(path) {
    const res = await fetch(`/api/jobs/${jobId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    return { res, d: await res.json().catch(() => ({})) };
  }
  async function approve() {
    setBusy(true); setMsg(null);
    try {
      const { res, d } = await post("approve");
      if (res.ok && d.ok) setMsg({ kind: "success", title: "Successful. Calls are starting.", text: `${d.accepted} leads queued. Estimated time: about ${d.estimatedMinutes} min. Results will appear in Recent calls.` });
      else setMsg({ kind: "error", title: "Could not start calls", text: d.error || "The request was not accepted." });
    } catch { setMsg({ kind: "error", title: "Could not start calls", text: "Could not reach the server." }); }
    setConfirming(false); setBusy(false); reload(); onChanged?.();
  }
  async function dismiss() {
    setBusy(true);
    await post("cancel").catch(() => {});
    setBusy(false); reload(); onChanged?.();
  }

  if (error && !job) return <section className="card"><div className="result"><Alert title="Could not load this job">{error}</Alert></div></section>;
  if (!job) return <section className="card"><div className="result muted">Loading…</div></section>;

  const stuck = status === "scraping" && Date.now() - new Date(job.created_at).getTime() > STUCK_MS;

  return (
    <section className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Generated leads</h2>
          <p>{job.query} in {job.location} · up to {job.max_results} results</p>
        </div>
        {status === "ready" && <span className="muted small">{leads.length} leads</span>}
      </div>

      {status === "scheduled" && <div className="result"><Alert kind="success" title="Scheduled">This job is waiting for its scheduled time. Leads will be generated and called automatically.</Alert></div>}

      {status === "scraping" && (
        <div className="result">
          <Alert kind="success" title={stuck ? "Taking longer than usual" : "Scraping in progress…"}>
            {stuck ? "This job has been running for over 45 minutes. It may have failed in n8n." : "Leads will appear here as soon as the scraper finishes. You can leave this page open."}
          </Alert>
          {stuck && <div style={{ marginTop: 12 }}><button className="btn btn-ghost btn-sm" onClick={dismiss} disabled={busy}>Dismiss this job</button></div>}
        </div>
      )}

      {(status === "failed" || status === "cancelled") && (
        <div className="result"><Alert title={status === "failed" ? "This job failed" : "This job was cancelled"}>{job.error || "No calls were made."}</Alert></div>
      )}

      {["ready", "calling", "called"].includes(status) && (
        <>
          <div className="result" style={{ paddingBottom: 0 }}>
            {leads.length === 0 ? (
              <Alert title="No leads found">The scraper finished but returned no results. Try a different query or location.</Alert>
            ) : (
              <div className="stats-row">
                <div><b>{leads.length}</b><span>leads generated</span></div>
                <div><b>{withPhone}</b><span>with phone number</span></div>
                <div><b>{withEmail}</b><span>with email</span></div>
              </div>
            )}
          </div>

          {leads.length > 0 && (
            <div className="result">
              <div className="table-wrap preview" style={{ maxHeight: 420, overflowY: "auto" }}>
                <table className="table table-cards">
                  <thead><tr><th>Business</th><th>Category</th><th>City</th><th>Phone</th><th>Email</th></tr></thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id}>
                        <td data-label="Business" className="strong">{l.name || "–"}</td>
                        <td data-label="Category" className="clip">{l.category || "–"}</td>
                        <td data-label="City">{l.city || "–"}</td>
                        <td data-label="Phone">{l.phone || <span className="muted">no phone</span>}</td>
                        <td data-label="Email" className="clip">{l.email || "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {status === "ready" && withPhone > 0 && (
            <div className="result" style={{ paddingTop: 0 }}>
              {!confirming ? (
                <button className="btn" onClick={() => setConfirming(true)}><Icon name="check" size={16} />Approve &amp; start calls</button>
              ) : (
                <div className="confirm">
                  <p><strong>Call {withPhone} lead{withPhone === 1 ? "" : "s"} now?</strong> Real calls are placed and charged to your Retell account. This cannot be undone once calls begin.</p>
                  <div className="row">
                    <button className="btn" onClick={approve} disabled={busy}>{busy ? "Sending…" : "Yes, start calling"}</button>
                    <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {status === "ready" && leads.length > 0 && withPhone === 0 && (
            <div className="result" style={{ paddingTop: 0 }}><Alert title="Nothing to call">None of these leads has a phone number.</Alert></div>
          )}
          {status === "calling" && <div className="result" style={{ paddingTop: 0 }}><Alert kind="success" title="Starting calls…">Sending the leads to the calling workflow.</Alert></div>}
          {status === "called" && !msg && (
            <div className="result" style={{ paddingTop: 0 }}><Alert kind="success" title="Calls started">{`${job.call_count} lead${job.call_count === 1 ? "" : "s"} sent to the AI agent. Results will appear in Recent calls.`}</Alert></div>
          )}
          {msg && <div className="result" style={{ paddingTop: 0 }}><Alert kind={msg.kind} title={msg.title}>{msg.text}</Alert></div>}
        </>
      )}
    </section>
  );
}
