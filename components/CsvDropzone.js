"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icons";

export default function CsvDropzone({ onFile, fileName, label, hint }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const pick = (file) => file && onFile(file);

  return (
    <div
      className={`dropzone ${over ? "over" : ""} ${fileName ? "has-file" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
    >
      <span className="dropzone-icon"><Icon name={fileName ? "check" : "upload"} size={20} /></span>
      <div className="dropzone-text">
        <strong>{fileName || label}</strong>
        <span>{fileName ? "File ready. Choose another to replace it." : hint}</span>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>{fileName ? "Replace file" : "Choose CSV"}</button>
      <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
