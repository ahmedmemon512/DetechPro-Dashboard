"use client";

import { useState } from "react";
import { parseTable, findKey, readCsvFile } from "@/lib/csv";
import { cleanCallLeads, MAX_CALL_LEADS } from "@/lib/leads";
import CsvDropzone from "./CsvDropzone";
import { Alert, Step } from "./ui";
import { Icon } from "./Icons";

const SAMPLE = "restaurant_name,phone\nThe Gage,(312) 372-4243\nSunrise Diner,+1 415 555 0132\n";

export default function UploadCalls() {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function onFile(file) {
    setError(""); setParsed(null); setStatus("idle"); setConfirming(false);
    try {
      const { headers, records } = parseTable(await readCsvFile(file));
      const nameKey = findKey(headers, ["restaurant_name", "restaurant", "business_name", "business", "name"]);
      const phoneKey = findKey(headers, ["phone", "phone_number", "phonenumber", "mobile", "telephone", "tel"]);
      if (!nameKey || !phoneKey) throw new Error("The CSV needs two columns: restaurant_name and phone.");
      if (records.length > MAX_CALL_LEADS) throw new Error(`Too many rows (${records.length}). Maximum ${MAX_CALL_LEADS} per upload.`);
      const cleaned = cleanCallLeads(records.map((r) => ({ name: r[nameKey], phone: r[phoneKey] })));
      if (cleaned.leads.length === 0) throw new Error("No valid rows found. Check the restaurant names and phone numbers.");
      setFileName(file.name);
      setParsed(cleaned);
    } catch (e) { setFileName(""); setError(e.message); }
  }

  async function start() {
    setStatus("loading");
    try {
      const res = await fetch("/api/upload/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leads: parsed.leads }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setResult(data); setStatus("success"); setConfirming(false); }
      else { setError(data.error || "The request was not accepted."); setStatus("error"); }
    } catch { setError("Could not reach the server."); setStatus("error"); }
  }

  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE)}`;
  const showReview = parsed && status !== "success";

  return (
    <section className="card" id="calls">
      <div className="card-head">
        <div className="card-title"><h2>Call campaign</h2><p>Your AI agent calls each number, one by one.</p></div>
        <a className="btn btn-ghost btn-sm" href={sampleHref} download="call-leads-sample.csv"><Icon name="download" size={15} />Sample CSV</a>
      </div>
      <ol className="steps">
        <Step n={1} title="Upload your list" hint={<>CSV with <code>restaurant_name</code> and <code>phone</code> columns.</>} done={Boolean(parsed)}>
          <CsvDropzone onFile={onFile} fileName={fileName} label="Drop your CSV here" hint="Up to 500 rows" />
          {error && <Alert title="Could not process">{error}</Alert>}
        </Step>

        <Step n={2} title="Review leads" hint="Check the numbers before you start." done={status === "success"} locked={!parsed}>
          {parsed && (
            <>
              <div className="stats-row">
                <div><b>{parsed.leads.length}</b><span>valid leads</span></div>
                <div><b>{parsed.invalid}</b><span>invalid skipped</span></div>
                <div><b>{parsed.duplicates}</b><span>duplicates skipped</span></div>
              </div>
              <div className="table-wrap preview">
                <table className="table"><thead><tr><th>Restaurant</th><th>Phone</th></tr></thead>
                  <tbody>{parsed.leads.slice(0, 6).map((l) => <tr key={l.phone}><td className="strong">{l.name}</td><td>{l.phone}</td></tr>)}</tbody></table>
                {parsed.leads.length > 6 && <p className="muted small preview-more">+ {parsed.leads.length - 6} more</p>}
              </div>
            </>
          )}
        </Step>

        <Step n={3} title="Start calling" hint="Real calls are placed and charged to your Retell account." done={status === "success"} locked={!parsed}>
          {showReview && (!confirming ? (
            <div><button className="btn" onClick={() => setConfirming(true)}><Icon name="phone" size={16} />Start calls</button></div>
          ) : (
            <div className="confirm">
              <p><strong>Call {parsed.leads.length} restaurant{parsed.leads.length === 1 ? "" : "s"} now?</strong> This cannot be undone once calls begin.</p>
              <div className="row">
                <button className="btn" onClick={start} disabled={status === "loading"}>{status === "loading" ? "Sending…" : "Yes, start calling"}</button>
                <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={status === "loading"}>Cancel</button>
              </div>
            </div>
          ))}
          {status === "success" && result && (
            <Alert kind="success" title="Successful. Calls are starting.">{`${result.accepted} restaurants queued${result.skipped ? ` (${result.skipped} skipped)` : ""}. Estimated time: about ${result.estimatedMinutes} min. Results will appear in Recent calls.`}</Alert>
          )}
        </Step>
      </ol>
    </section>
  );
}
