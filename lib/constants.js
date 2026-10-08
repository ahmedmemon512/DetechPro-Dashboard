export const TZ = "America/Los_Angeles";
export const OUTCOMES = ["sample_requested", "meeting_booked", "callback_requested", "not_interested", "voicemail", "other"];
export const LABELS = {
  sample_requested: "Sample requested",
  meeting_booked: "Meeting booked",
  callback_requested: "Callback",
  not_interested: "Not interested",
  voicemail: "Voicemail",
  other: "Other",
};
// Black & white palette (dark to light)
export const COLORS = {
  sample_requested: "#0a0a0a",
  meeting_booked: "#404040",
  callback_requested: "#737373",
  not_interested: "#a6a6a6",
  voicemail: "#d2d2d2",
  other: "#ececec",
};
export const ON_COLOR = {
  sample_requested: "#fff",
  meeting_booked: "#fff",
  callback_requested: "#fff",
  not_interested: "#0a0a0a",
  voicemail: "#0a0a0a",
  other: "#0a0a0a",
};

// Schedule times are typed in Houston, Texas time (US Central, handles daylight saving automatically).
export const SCHEDULE_TZ = "America/Chicago";
export const SCHEDULE_TZ_LABEL = "Houston, TX time";
