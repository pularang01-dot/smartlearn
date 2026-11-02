const P = {
  play: 'M8 5v14l11-7z', plus: 'M12 5v14M5 12h14', folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6', chart: 'M5 20V10M12 20V4M19 20v-8',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  camera: 'M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z', check: 'M5 12.5l4.5 4.5L19 7', x: 'M6 6l12 12M18 6L6 18',
  pause: 'M8 5v14M16 5v14', expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', skip: 'M5 5l9 7-9 7zM18 5v14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', copy: 'M9 9h10v11H9zM5 15V4h10', edit: 'M4 20h4L19 9l-4-4L4 16z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01', code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3', home: 'M4 11l8-7 8 7M6 10v10h12V10', spark: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6', ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6', user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20a8 8 0 0 1 16 0',
} as const;
export type IconName = keyof typeof P;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--pri)" />
      <circle cx="20" cy="12.5" r="4" fill="#fff" />
      <path d="M12 30l4-10h8l4 10M14 22l-4-3M26 22l4-3" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="31" cy="9" r="3" fill="var(--amber)" />
    </svg>
  );
}
