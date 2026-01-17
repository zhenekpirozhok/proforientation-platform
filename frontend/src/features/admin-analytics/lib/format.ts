export function formatPercent01(x?: number | null) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  return `${Math.round(x * 100)}%`;
}

export function formatDurationSeconds(sec?: number | null) {
  if (sec === null || sec === undefined || Number.isNaN(sec)) return '—';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function formatNumber(x?: number | null) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  return `${x}`;
}
