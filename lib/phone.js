// Returns an E.164 number (+13125550100) or "" when the input is not a usable phone number.
export function normalizePhone(raw, countryCode = "+1") {
  const s = String(raw ?? "").trim();
  const digits = s.replace(/\D/g, "");
  if (s.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : "";
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}
