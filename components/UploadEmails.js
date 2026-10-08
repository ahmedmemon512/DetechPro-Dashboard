"use client";

import { useState } from "react";
import { parseTable, findKey, readCsvFile } from "@/lib/csv";
import { cleanEmailLeads, renderTemplate, MAX_EMAIL_LEADS } from "@/lib/leads";
import CsvDropzone from "./CsvDropzone";
import { Alert, Step } from "./ui";
import { Icon } from "./Icons";

const SAMPLE = "restaurant_name,email\nThe Gage,info@thegagechicago.com\nSunrise Diner,hello@sunrisediner.com\n";
const DEFAULT_SUBJECT = "Packaging supplies for {{restaurant_name}}";
const DEFAULT_BODY = `Hi {{restaurant_name}} team,

We supply take-out containers, cups and lids, clamshells, cutlery and other foodservice packaging at competitive wholesale prices.

We'd be happy to send you a few samples so you can check the quality yourself. Just reply to this email and we'll set it up.

Best regards,
[Your name]
[Company name] · [Business address]

If you'd rather not hear from us, reply "unsubscribe" and we'll remove you right away.`;

export default function UploadEmails() {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function onFile(file) {
    setError(""); setParsed(null); setStatus("idle"); setConfirming(false);
    try {
      const { headers, records } = parseTable(await readCsvFile(file));
      const emailKey = findKey(headers, ["email", "email_address", "e_mail", "mail"]);
      const nameKey = findKey(headers, ["restaurant_name", "restaurant", "business_name", "business", "name"]);
      if (!emailKey) throw new Error("The CSV needs an email column (and optionally restaurant_name).");
      if (records.length > MAX_EMAIL_LEADS) throw new Error(`Too many rows (${records.length}). Maximum ${MAX_EMAIL_LEADS} per upload.`);
      const cleaned = cleanEmailLeads(records.map((r) => ({ email: r[emailKey], name: nameKey ? r[nameKey] : "" })));
      if (cleaned.leads.length === 0) throw new Error("No valid email addresses found.");
      setFileName(file.name);
      setParsed(cleaned);
    } catch (e) { setFileName(""); setError(e.message); }
  }

  async function start() {
    setStatus("loading");
    try {
      const res = await fetch("/api/upload/emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leads: parsed.leads, subject, body }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setResult(data); setStatus("success"); setConfirming(false); }
      else { setError(data.error || "The request was not accepted."); setStatus("error"); }
    } catch { setError("Could not reach the server."); setStatus("error"); }
  }

  const first = parsed?.leads[0];
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE)}`;
  const ready = parsed && subject.trim() && body.trim();
  const preview = first || { name: "Sample Restaurant" };

  return (
    <section className="card" id="emails">
      <div className="card-head">
        <div className="card-title"><h2>Email campaign</h2><p>Send your message to each address, one at a time.</p></div>
        <a className="btn btn-ghost btn-sm" href={sampleHref} download="email-leads-sample.csv"><Icon name="download" size={15} />Sample CSV</a>
      </div>
      <ol className="steps">
        <Step n={1} title="Upload your list" hint={<>CSV with an <code>email</code> column. <code>restaurant_name</code> is optional.</>} done={Boolean(parsed)}>
          <CsvDropzone onFile={onFile} fileName={fileName} label="Drop your email list here" hint="Up to 1,000 rows" />
          {error && <Alert title="Could not process">{error}</Alert>}
          {parsed && (
            <div className="stats-row">
              <div><b>{parsed.leads.length}</b><span>valid emails</span></div>
              <div><b>{parsed.invalid}</b><span>invalid skipped</span></div>
              <div><b>{parsed.duplicates}</b><span>duplicates skipped</span></div>
            </div>
          )}
        </Step>

        <Step n={2} title="Write your email" hint={<>Use <code>{"{{restaurant_name}}"}</code> to personalise each message.</>} done={Boolean(ready)}>
          <div className="template">
            <div className="template-edit stack">
              <label className="field"><span>Subject</span>
                <input className="input" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
              <label className="field"><span>Email body</span>
                <textarea className="input textarea" rows={12} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
              <span className="muted small">Add your business address and an opt-out line to follow email-marketing laws.</span>
            </div>
            <div className="template-preview">
              <span className="eyebrow">Preview{first ? ` for ${first.email}` : ""}</span>
              <div className="mail">
                <div className="mail-subject">{renderTemplate(subject, preview) || "–"}</div>
                <pre>{renderTemplate(body, preview)}</pre>
              </div>
            </div>
          </div>
        </Step>

        <Step n={3} title="Send" hint="Emails go out one by one." done={status === "success"} locked={!ready && status !== "success"}>
          {ready && status !== "success" && (!confirming ? (
            <div><button className="btn" onClick={() => setConfirming(true)}><Icon name="mail" size={16} />Start sending</button></div>
          ) : ready && status !== "success" ? (
            <div className="confirm">
              <p><strong>Send this email to {parsed.leads.length} address{parsed.leads.length === 1 ? "" : "es"}?</strong> Emails will be sent one by one.</p>
              <div className="row">
                <button className="btn" onClick={start} disabled={status === "loading"}>{status === "loading" ? "Sending…" : "Yes, start sending"}</button>
                <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={status === "loading"}>Cancel</button>
              </div>
            </div>
          ) : null)}
          {status === "success" && result && (
            <Alert kind="success" title="Successful. Emails are being sent.">{`${result.accepted} emails queued${result.skipped ? ` (${result.skipped} skipped)` : ""}. Estimated time: about ${result.estimatedMinutes} min.`}</Alert>
          )}
        </Step>
      </ol>
    </section>
  );
}
