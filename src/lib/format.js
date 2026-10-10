export const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(new Date(iso).getMilliseconds()).padStart(3, '0') : '—';

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

export function fmtElapsed(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const a = Math.abs(ms);
  const sign = ms < 0 ? '-' : '';
  if (a < 1000) return `${sign}${Math.round(a)}ms`;
  if (a < 60000) return `${sign}${(a / 1000).toFixed(1)}s`;
  if (a < 3600000) return `${sign}${Math.floor(a / 60000)}m ${Math.round((a % 60000) / 1000)}s`;
  return `${sign}${Math.floor(a / 3600000)}h ${Math.round((a % 3600000) / 60000)}m`;
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
