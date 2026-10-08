import { TZ, SCHEDULE_TZ } from "./constants";

export const fmtDur = (s) => (!s ? "–" : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);

export const fmtWhen = (d) =>
  d ? new Date(d).toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "–";

export const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Only allow http(s) URLs to be rendered as links / media sources.
export const safeUrl = (u) => (typeof u === "string" && /^https:\/\//i.test(u) ? u : "");

export const fmtHouston = (d) =>
  d ? new Date(d).toLocaleString("en-US", { timeZone: SCHEDULE_TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }) : "–";
