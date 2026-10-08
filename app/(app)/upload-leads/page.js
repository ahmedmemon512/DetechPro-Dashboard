"use client";

import { useState } from "react";
import { PageHead } from "@/components/ui";
import { Icon } from "@/components/Icons";
import UploadCalls from "@/components/UploadCalls";
import UploadEmails from "@/components/UploadEmails";

const MODES = [
  { id: "calls", icon: "phone", title: "Call campaign", text: "AI agent phones each number" },
  { id: "emails", icon: "mail", title: "Email campaign", text: "Send a template to each address" },
];

export default function UploadLeadsPage() {
  const [mode, setMode] = useState("calls");

  return (
    <div className="page page-mid">
      <PageHead title="Upload leads" subtitle="Start a calling or email campaign from a CSV file." />

      <div className="tabs" role="tablist" aria-label="Campaign type">
        {MODES.map((m) => (
          <button key={m.id} role="tab" id={`tab-${m.id}`} aria-selected={mode === m.id} aria-controls={`panel-${m.id}`}
            className={`tab ${mode === m.id ? "on" : ""}`} onClick={() => setMode(m.id)}>
            <span className="tab-icon"><Icon name={m.icon} size={18} /></span>
            <span className="tab-text"><strong>{m.title}</strong><span>{m.text}</span></span>
          </button>
        ))}
      </div>

      {/* Both stay mounted so a half-finished upload is not lost when you switch tabs. */}
      <div role="tabpanel" id="panel-calls" aria-labelledby="tab-calls" hidden={mode !== "calls"}><UploadCalls /></div>
      <div role="tabpanel" id="panel-emails" aria-labelledby="tab-emails" hidden={mode !== "emails"}><UploadEmails /></div>
    </div>
  );
}
