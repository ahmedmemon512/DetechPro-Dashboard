"use client";

import { useEffect, useRef } from "react";
import { useApi } from "@/lib/useApi";
import { fmtDur, fmtWhen, safeUrl } from "@/lib/format";
import { Badge } from "./ui";
import { Icon } from "./Icons";

const Field = ({ label, children }) => (
  <div className="field-row"><dt>{label}</dt><dd>{children || "–"}</dd></div>
);

export default function CallDrawer({ call, onClose }) {
  const closeRef = useRef(null);
  const { data, loading } = useApi(`/api/calls/${encodeURIComponent(call.call_id)}`);
  const full = data?.call || call;
  const recording = safeUrl(full.recording_url);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="drawer-root">
      <div className="scrim show" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Call details">
        <header className="drawer-head">
          <div>
            <h2>{full.restaurant_name || "Unknown restaurant"}</h2>
            <p className="muted">{full.phone || "–"}</p>
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close details"><Icon name="close" /></button>
        </header>
        <div className="drawer-body">
          <div className="drawer-badge"><Badge outcome={full.call_outcome} /></div>
          <dl className="fields">
            <Field label="Date">{fmtWhen(full.started_at)}</Field>
            <Field label="Duration">{fmtDur(full.duration_seconds)}</Field>
            <Field label="Contact name">{full.contact_name}</Field>
            <Field label="Email">{full.email}</Field>
            <Field label="Products">{full.products_interested}</Field>
            <Field label="Ended because">{full.disconnection_reason}</Field>
          </dl>

          <h3>Summary</h3>
          <p className="prose">{full.call_summary || "No summary available."}</p>

          {full.note && (<><h3>Note</h3><p className="prose">{full.note}</p></>)}

          {recording && (
            <>
              <h3>Recording</h3>
              <audio controls preload="none" src={recording} className="audio" />
              <p className="small"><a href={recording} target="_blank" rel="noopener noreferrer">Open in new tab</a></p>
            </>
          )}

          <h3>Transcript</h3>
          {loading && !data ? <p className="muted">Loading transcript…</p> : <pre className="transcript">{full.transcript || "No transcript available."}</pre>}
        </div>
      </aside>
    </div>
  );
}
