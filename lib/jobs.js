export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ""));

export const JOB_STATUS = {
  scheduled: "Scheduled",
  scraping: "Scraping",
  ready: "Waiting for approval",
  calling: "Starting calls",
  called: "Calls started",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const MAX_APPROVE_LEADS = 5000;

// Retell settings are sent server-to-server to the n8n calls workflow (never to the browser).
export function callSettings() {
  const delay = Math.min(Math.max(Number(process.env.CALL_DELAY_SECONDS) || 15, 5), 600);
  const s = { callDelaySeconds: delay };
  if (process.env.RETELL_API_KEY) s.retellApiKey = process.env.RETELL_API_KEY;
  if (process.env.RETELL_FROM_NUMBER) s.retellFromNumber = process.env.RETELL_FROM_NUMBER;
  if (process.env.RETELL_AGENT_ID) s.retellAgentId = process.env.RETELL_AGENT_ID;
  return s;
}
