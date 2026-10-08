import { normalizePhone } from "./phone";

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MAX_CALL_LEADS = 500;
export const MAX_EMAIL_LEADS = 1000;

export function cleanCallLeads(input) {
  const list = Array.isArray(input) ? input : [];
  const seen = new Set();
  const leads = [];
  let invalid = 0;
  let duplicates = 0;
  for (const item of list) {
    const name = clean(item?.name, 120);
    const phone = normalizePhone(item?.phone);
    if (!name || !phone) { invalid++; continue; }
    if (seen.has(phone)) { duplicates++; continue; }
    seen.add(phone);
    leads.push({ name, phone });
  }
  return { leads, invalid, duplicates };
}

export function cleanEmailLeads(input) {
  const list = Array.isArray(input) ? input : [];
  const seen = new Set();
  const leads = [];
  let invalid = 0;
  let duplicates = 0;
  for (const item of list) {
    const email = clean(item?.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) { invalid++; continue; }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    leads.push({ name: clean(item?.name, 120), email });
  }
  return { leads, invalid, duplicates };
}

export function renderTemplate(template, lead) {
  const values = { restaurant_name: lead.name || "your team", email: lead.email || "" };
  return String(template).replace(/\{\{\s*(restaurant_name|email)\s*\}\}/g, (_, k) => values[k]);
}
