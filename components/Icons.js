const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  logout: <path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  file: <><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />,
  inbound: <path d="M19 5L5 19M5 9v10h10" />,
  outbound: <path d="M5 19L19 5M9 5h10v10" />,
  download: <><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
