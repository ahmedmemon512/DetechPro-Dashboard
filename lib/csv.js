// Small, dependency-free CSV parser (handles quotes, commas in quotes, CRLF and BOM).
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = String(text).replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const normHeader = (h) => String(h).trim().toLowerCase().replace(/[\s\-]+/g, "_");

export function parseTable(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map(normHeader);
  const records = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
  return { headers, records };
}

export const findKey = (headers, candidates) => candidates.find((c) => headers.includes(c)) || null;

export async function readCsvFile(file, maxBytes = 1_000_000) {
  if (!file) throw new Error("No file selected.");
  if (!/\.csv$/i.test(file.name)) throw new Error("Please upload a .csv file.");
  if (file.size > maxBytes) throw new Error("File is too large (max 1 MB).");
  return file.text();
}

// Neutralise spreadsheet formula injection when exporting.
export function csvCell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
