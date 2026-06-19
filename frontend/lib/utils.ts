/* ─── SevaSetu Utility Functions ─────────────────────────── */

/** Format a need_type enum into a readable label */
export function formatNeedType(type: string | null | undefined): string {
  if (!type) return 'Unknown';
  const MAP: Record<string, string> = {
    HEALTHCARE: 'Healthcare',
    EDUCATION: 'Education',
    WATER_SANITATION: 'Water & Sanitation',
    SHELTER: 'Shelter',
    FOOD: 'Food',
    INFRASTRUCTURE: 'Infrastructure',
    LIVELIHOOD: 'Livelihood',
  };
  return MAP[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Format a 0–1 float as a percentage string */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

/** Extract initials from a name string */
export function initialsFromName(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

/** Urgency value to human-readable label */
export function urgencyLabel(urgency: number): string {
  if (urgency >= 0.95) return 'Critical';
  if (urgency >= 0.70) return 'High';
  if (urgency >= 0.50) return 'Moderate';
  return 'Low';
}

/** Urgency value to color */
export function urgencyColor(urgency: number): string {
  if (urgency >= 0.95) return '#DC2626';
  if (urgency >= 0.70) return '#EA580C';
  if (urgency >= 0.50) return '#CA8A04';
  return '#16A34A';
}

/** Format an ISO date string as relative time (e.g. "2h ago") */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
