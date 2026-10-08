"use client";

import { useEffect, useState } from "react";
import { PageHead, Alert } from "@/components/ui";
import { Icon } from "@/components/Icons";
import LeadJob from "@/components/LeadJob";
import LeadJobsList from "@/components/LeadJobsList";
import { SCHEDULE_TZ, SCHEDULE_TZ_LABEL } from "@/lib/constants";
import { todayIn } from "@/lib/time";

const houstonNow = () => new Date().toLocaleString("en-US", { timeZone: SCHEDULE_TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

export default function GenerateLeadsPage() {
  const [form, setForm] = useState({ query: "", location: "", maxResults: 50 });
  const [scheduling, setScheduling] = useState(false);
  const [sched, setSched] = useState({ date: "", time: "10:00" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [scheduledNote, setScheduledNote] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState("");

  useEffect(() => {
    setSched((s) => ({ ...s, date: todayIn(SCHEDULE_TZ) }));
    setNow(houstonNow());
    const t = setInterval(() => setNow(houstonNow()), 30000);
    return () => clearInterval(t);
  }, []);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); if (status !== "loading") setStatus("idle"); };
  const setS = (k) => (e) => { setSched((s) => ({ ...s, [k]: e.target.value })); if (status !== "loading") setStatus("idle"); };

  async function send(schedule) {
    setStatus("loading"); setScheduledNote(null);
    const payload = { query: form.query.trim(), location: form.location.trim(), maxResults: Number(form.maxResults), ...(schedule ? { schedule } : {}) };
    try {
      const res = await fetch("/api/generate-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("success"); setRefreshKey((k) => k + 1);
        if (data.scheduled) { setScheduledNote({ ...payload, runAt: data.runAt }); setScheduling(false); }
        else setJobId(data.jobId);
      } else { setStatus("error"); setMessage(data.error || "The request was not accepted."); }
    } catch {
      setStatus("error"); setMessage("Could not reach the server. Check your connection and try again.");
    }
  }

  function submit(e) {
    e.preventDefault();
    if (scheduling) {
      if (!sched.date || !sched.time) { setStatus("error"); setMessage("Pick a date and a time."); return; }
      send({ date: sched.date, time: sched.time });
    } else send(null);
  }

  const loading = status === "loading";

  return (
    <div className="page page-mid">
      <PageHead title="Generate leads" subtitle="Tell the scraper what to find and where. Start now and approve the calls, or schedule it and calls start automatically." />
      <section className="card">
        <div className="card-head">
          <div className="card-title"><h2>New scraping job</h2><p>Fill in the three fields below.</p></div>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field f-wide"><span>Search query</span>
              <input className="input" required maxLength={120} placeholder="Business Type (B2B Businesses)" value={form.query} onChange={set("query")} />
              <small className="hint">What kind of business to look for.</small></label>
            <label className="field"><span>Location</span>
              <input className="input" required maxLength={120} placeholder="California, US" value={form.location} onChange={set("location")} />
              <small className="hint">City, state or country.</small></label>
            <label className="field"><span>Max results</span>
              <input className="input" type="number" required min="1" max="5000" inputMode="numeric" value={form.maxResults} onChange={set("maxResults")} />
              <small className="hint">Between 1 and 5,000.</small></label>

            {scheduling && (
              <>
                <label className="field"><span>Date</span>
                  <input className="input" type="date" required min={todayIn(SCHEDULE_TZ)} value={sched.date} onChange={setS("date")} />
                  <small className="hint">Houston date.</small></label>
                <label className="field"><span>Time</span>
                  <input className="input" type="time" required value={sched.time} onChange={setS("time")} />
                  <small className="hint">{SCHEDULE_TZ_LABEL}{now ? ` · now ${now}` : ""}</small></label>
              </>
            )}
          </div>
          <div className="form-foot">
            <div className="row" style={{ justifyContent: "flex-end" }}>
              {scheduling ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => setScheduling(false)} disabled={loading}>Back</button>
                  <button className="btn" disabled={loading}><Icon name="check" size={16} />{loading ? "Saving…" : "Confirm schedule"}</button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => { if (!form.query.trim() || !form.location.trim()) { setStatus("error"); setMessage("Enter a search query and a location first."); return; } setStatus("idle"); setScheduling(true); }} disabled={loading}><Icon name="refresh" size={16} />Schedule</button>
                  <button className="btn" disabled={loading}><Icon name="search" size={16} />{loading ? "Starting…" : "Start scraping"}</button>
                </>
              )}
            </div>
          </div>
        </form>
        {scheduling && <div className="result"><p className="muted small">At the scheduled time the leads are generated and the calls start automatically, with no approval step.</p></div>}
        {status === "success" && scheduledNote && (
          <div className="result"><Alert kind="success" title="Scheduled.">{`${scheduledNote.query} in ${scheduledNote.location} · up to ${scheduledNote.maxResults} results. Runs ${new Date(scheduledNote.runAt).toLocaleString("en-US", { timeZone: SCHEDULE_TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}, and calls start automatically.`}</Alert></div>
        )}
        {status === "error" && <div className="result"><Alert title="Could not continue">{message}</Alert></div>}
      </section>

      {jobId && <LeadJob jobId={jobId} onChanged={() => setRefreshKey((k) => k + 1)} />}
      <LeadJobsList activeId={jobId} onOpen={setJobId} refreshKey={refreshKey} />
    </div>
  );
}
