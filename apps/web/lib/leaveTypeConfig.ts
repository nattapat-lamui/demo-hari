import type { LeaveQuotaConfig } from '../types';
import i18n from './i18n';

// ============================================================================
// Color Palette — full Tailwind class literals so the scanner picks them up
// ============================================================================

export interface LeaveColorClasses {
  badge: string;      // AdminLeaveRequests badge
  cellBg: string;     // LeaveCalendar cell background
  cellText: string;   // LeaveCalendar cell text
  dot: string;        // LeaveCalendar team dot
  bar: string;        // LeaveGanttCalendar bar bg (light)
  barDark: string;    // LeaveGanttCalendar bar bg (dark)
  legend: string;     // Legend swatch
  ringColor: string;  // ProgressRing hex color
  borderLeft: string; // TimeOff balance card border
  iconBg: string;     // TimeOff history icon bg
  barFill: string;    // LeaveRequestForm balance bar
}

export const COLOR_PALETTE: Record<string, LeaveColorClasses> = {
  blue: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    cellBg: 'bg-blue-100 dark:bg-blue-900/30',
    cellText: 'text-blue-800 dark:text-blue-200',
    dot: 'bg-blue-400 dark:bg-blue-500',
    bar: 'bg-blue-400',
    barDark: 'dark:bg-blue-500',
    legend: 'bg-blue-400 dark:bg-blue-500',
    ringColor: '#3B82F6',
    borderLeft: 'border-l-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
    barFill: 'bg-blue-500',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    cellBg: 'bg-amber-100 dark:bg-amber-900/30',
    cellText: 'text-amber-800 dark:text-amber-200',
    dot: 'bg-amber-400 dark:bg-amber-500',
    bar: 'bg-amber-400',
    barDark: 'dark:bg-amber-500',
    legend: 'bg-amber-400 dark:bg-amber-500',
    ringColor: '#F59E0B',
    borderLeft: 'border-l-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600',
    barFill: 'bg-amber-500',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
    cellBg: 'bg-violet-100 dark:bg-violet-900/30',
    cellText: 'text-violet-800 dark:text-violet-200',
    dot: 'bg-violet-400 dark:bg-violet-500',
    bar: 'bg-violet-400',
    barDark: 'dark:bg-violet-500',
    legend: 'bg-violet-400 dark:bg-violet-500',
    ringColor: '#8B5CF6',
    borderLeft: 'border-l-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600',
    barFill: 'bg-violet-500',
  },
  pink: {
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
    cellBg: 'bg-pink-100 dark:bg-pink-900/30',
    cellText: 'text-pink-800 dark:text-pink-200',
    dot: 'bg-pink-400 dark:bg-pink-500',
    bar: 'bg-pink-400',
    barDark: 'dark:bg-pink-500',
    legend: 'bg-pink-400 dark:bg-pink-500',
    ringColor: '#EC4899',
    borderLeft: 'border-l-pink-500',
    iconBg: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600',
    barFill: 'bg-pink-500',
  },
  teal: {
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
    cellBg: 'bg-teal-100 dark:bg-teal-900/30',
    cellText: 'text-teal-800 dark:text-teal-200',
    dot: 'bg-teal-400 dark:bg-teal-500',
    bar: 'bg-teal-400',
    barDark: 'dark:bg-teal-500',
    legend: 'bg-teal-400 dark:bg-teal-500',
    ringColor: '#14B8A6',
    borderLeft: 'border-l-teal-500',
    iconBg: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600',
    barFill: 'bg-teal-500',
  },
  slate: {
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200',
    cellBg: 'bg-slate-100 dark:bg-slate-900/30',
    cellText: 'text-slate-800 dark:text-slate-200',
    dot: 'bg-slate-400 dark:bg-slate-500',
    bar: 'bg-slate-400',
    barDark: 'dark:bg-slate-500',
    legend: 'bg-slate-400 dark:bg-slate-500',
    ringColor: '#64748B',
    borderLeft: 'border-l-slate-500',
    iconBg: 'bg-slate-100 dark:bg-slate-900/20 text-slate-600',
    barFill: 'bg-slate-500',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    cellBg: 'bg-orange-100 dark:bg-orange-900/30',
    cellText: 'text-orange-800 dark:text-orange-200',
    dot: 'bg-orange-400 dark:bg-orange-500',
    bar: 'bg-orange-400',
    barDark: 'dark:bg-orange-500',
    legend: 'bg-orange-400 dark:bg-orange-500',
    ringColor: '#F97316',
    borderLeft: 'border-l-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
    barFill: 'bg-orange-500',
  },
  rose: {
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
    cellBg: 'bg-rose-100 dark:bg-rose-900/30',
    cellText: 'text-rose-800 dark:text-rose-200',
    dot: 'bg-rose-400 dark:bg-rose-500',
    bar: 'bg-rose-400',
    barDark: 'dark:bg-rose-500',
    legend: 'bg-rose-400 dark:bg-rose-500',
    ringColor: '#F43F5E',
    borderLeft: 'border-l-rose-500',
    iconBg: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600',
    barFill: 'bg-rose-500',
  },
  cyan: {
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
    cellBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    cellText: 'text-cyan-800 dark:text-cyan-200',
    dot: 'bg-cyan-400 dark:bg-cyan-500',
    bar: 'bg-cyan-400',
    barDark: 'dark:bg-cyan-500',
    legend: 'bg-cyan-400 dark:bg-cyan-500',
    ringColor: '#06B6D4',
    borderLeft: 'border-l-cyan-500',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600',
    barFill: 'bg-cyan-500',
  },
  lime: {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-200',
    cellBg: 'bg-lime-100 dark:bg-lime-900/30',
    cellText: 'text-lime-800 dark:text-lime-200',
    dot: 'bg-lime-400 dark:bg-lime-500',
    bar: 'bg-lime-400',
    barDark: 'dark:bg-lime-500',
    legend: 'bg-lime-400 dark:bg-lime-500',
    ringColor: '#84CC16',
    borderLeft: 'border-l-lime-500',
    iconBg: 'bg-lime-100 dark:bg-lime-900/20 text-lime-600',
    barFill: 'bg-lime-500',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    cellBg: 'bg-gray-100 dark:bg-gray-800',
    cellText: 'text-gray-800 dark:text-gray-200',
    dot: 'bg-gray-400 dark:bg-gray-500',
    bar: 'bg-gray-400',
    barDark: 'dark:bg-gray-500',
    legend: 'bg-gray-400 dark:bg-gray-500',
    ringColor: '#6B7280',
    borderLeft: 'border-l-gray-500',
    iconBg: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600',
    barFill: 'bg-gray-500',
  },
};

/** All available color keys for the admin color picker */
export const AVAILABLE_COLORS = Object.keys(COLOR_PALETTE);

/** Backward-compat mapping for old data that has no `color` field */
const LEGACY_COLOR_MAP: Record<string, string> = {
  'Vacation': 'blue',
  'Sick Leave': 'amber',
  'Personal Day': 'violet',
  'Maternity Leave': 'pink',
  'Compensatory Leave': 'teal',
  'Military Leave': 'slate',
  'Leave Without Pay': 'orange',
};

const DEFAULT_COLOR: LeaveColorClasses = COLOR_PALETTE.gray!;

// ============================================================================
// Helper Functions
// ============================================================================

/** Resolve color classes for a leave type name, using config color or legacy fallback */
export function getLeaveColor(typeName: string, configs?: LeaveQuotaConfig[]): LeaveColorClasses {
  // First check if configs provide a color for this type
  if (configs) {
    const cfg = configs.find((c) => c.type === typeName);
    if (cfg?.color) {
      const palette = COLOR_PALETTE[cfg.color];
      if (palette) return palette;
    }
  }
  // Legacy fallback
  const legacyKey = LEGACY_COLOR_MAP[typeName];
  if (legacyKey) {
    const palette = COLOR_PALETTE[legacyKey];
    if (palette) return palette;
  }
  return DEFAULT_COLOR;
}

/** Build a map of type → LeaveColorClasses from configs */
export function buildLeaveColorMap(configs: LeaveQuotaConfig[]): Record<string, LeaveColorClasses> {
  const map: Record<string, LeaveColorClasses> = {};
  for (const cfg of configs) {
    map[cfg.type] = getLeaveColor(cfg.type, configs);
  }
  return map;
}

/**
 * Translate a leave type name using i18n.
 * Normalizes the DB name to a camelCase key and looks up leave:types.<key>.
 * Falls back to the raw DB name if no translation is found.
 */
export function translateLeaveType(typeName: string): string {
  // Normalize "Sick Leave" → "sickLeave", "Vacation" → "vacation"
  const key = typeName
    .split(/\s+/)
    .map((word, idx) =>
      idx === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
  const translated = i18n.t(`leave:types.${key}`, { defaultValue: '' });
  return translated || typeName;
}

/** Translate a leave type to its short form for calendar/gantt labels */
export function translateLeaveTypeShort(typeName: string): string {
  const key = typeName
    .split(/\s+/)
    .map((word, idx) =>
      idx === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
  const translated = i18n.t(`leave:typesShort.${key}`, { defaultValue: '' });
  return translated || translateLeaveType(typeName);
}

/** Build dropdown options from configs: [{ value, label }] */
export function buildLeaveOptions(configs: LeaveQuotaConfig[]): { value: string; label: string }[] {
  return configs.map((c) => ({ value: c.type, label: translateLeaveType(c.type) }));
}

/** Build filter dropdown options (with "All" prepended) */
export function buildLeaveFilterOptions(configs: LeaveQuotaConfig[]): { value: string; label: string }[] {
  return [
    { value: 'All', label: i18n.t('leave:allLeaveTypes') },
    ...configs.map((c) => ({ value: c.type, label: translateLeaveType(c.type) })),
  ];
}

/** Short label for calendar/gantt bars */
export function getShortLabel(typeName: string): string {
  return translateLeaveTypeShort(typeName);
}

/** Check if a leave type requires medical certificate (mandatory) */
export function requiresMedicalCert(typeName: string, _dayCount: number): boolean {
  if (typeName === 'Maternity Leave') return true;
  return false;
}

/** Check if medical certificate upload should be shown (optional for Sick Leave) */
export function showMedicalCertUpload(typeName: string): boolean {
  if (typeName === 'Maternity Leave') return true;
  if (typeName === 'Sick Leave') return true;
  return false;
}
