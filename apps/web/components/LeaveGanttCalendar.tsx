import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LeaveRequest } from '../types';
import { useLeaveTypeConfig } from '../hooks/queries';
import { buildLeaveColorMap, getShortLabel, translateLeaveType } from '../lib/leaveTypeConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LeaveCalendarProps {
  userLeaves: LeaveRequest[];
  teamLeaves: LeaveRequest[];
  isManager?: boolean;
  onLeaveClick?: (request: LeaveRequest) => void;
}

type ViewMode = 'week' | '2weeks' | 'month';

interface BarData {
  request: LeaveRequest;
  colStart: number;
  colEnd: number;
  isUser: boolean;
}

interface PersonRow {
  employeeId: string;
  name: string;
  bars: BarData[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
// MONTH_NAMES and SHORT_DAY_NAMES are defined inside the component to access translations

const DEFAULT_TYPE_COLOR = { bar: 'bg-gray-400', barDark: 'dark:bg-gray-500', text: 'text-white', legend: 'bg-gray-400 dark:bg-gray-500' };

const TEAM_GRAY_COLOR = { bar: 'bg-gray-300', barDark: 'dark:bg-gray-600', text: 'text-gray-700 dark:text-gray-200', legend: 'bg-gray-300 dark:bg-gray-600' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toLocalDateStr(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const d = new Date(raw);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Get Monday of the week containing `date` */
function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Generate array of dates for visible range */
function generateDateRange(start: Date, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(addDays(start, i));
  }
  return dates;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const LeaveGanttCalendar: React.FC<LeaveCalendarProps> = ({
  userLeaves,
  teamLeaves,
  isManager = false,
  onLeaveClick,
}) => {
  const { t } = useTranslation(['leave', 'common']);
  const { data: leaveConfigs = [] } = useLeaveTypeConfig();

  const MONTH_NAMES = useMemo(() => [
    t('common:months.january'), t('common:months.february'), t('common:months.march'),
    t('common:months.april'), t('common:months.may'), t('common:months.june'),
    t('common:months.july'), t('common:months.august'), t('common:months.september'),
    t('common:months.october'), t('common:months.november'), t('common:months.december'),
  ], [t]);

  const SHORT_DAY_NAMES = useMemo(() => [
    t('common:weekdaysShort.sun'), t('common:weekdaysShort.mon'), t('common:weekdaysShort.tue'),
    t('common:weekdaysShort.wed'), t('common:weekdaysShort.thu'), t('common:weekdaysShort.fri'),
    t('common:weekdaysShort.sat'),
  ], [t]);
  const TYPE_COLORS = useMemo(() => {
    const colorMap = buildLeaveColorMap(leaveConfigs);
    const result: Record<string, { bar: string; barDark: string; text: string; legend: string }> = {};
    for (const [type, colors] of Object.entries(colorMap)) {
      result[type] = { bar: colors.bar, barDark: colors.barDark, text: 'text-white', legend: colors.legend };
    }
    return result;
  }, [leaveConfigs]);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState(() => new Date());

  // Compute visible date range
  const { visibleDates, rangeLabel } = useMemo(() => {
    const today = new Date(anchor);
    let start: Date;
    let count: number;

    if (viewMode === 'month') {
      const y = today.getFullYear();
      const m = today.getMonth();
      start = new Date(y, m, 1);
      count = new Date(y, m + 1, 0).getDate();
    } else if (viewMode === '2weeks') {
      start = getMonday(today);
      count = 14;
    } else {
      start = getMonday(today);
      count = 7;
    }

    const dates = generateDateRange(start, count);
    const first = dates[0];
    const last = dates[dates.length - 1];

    let label: string;
    if (viewMode === 'month') {
      label = `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    } else {
      const fm = MONTH_NAMES[first.getMonth()].slice(0, 3);
      const lm = MONTH_NAMES[last.getMonth()].slice(0, 3);
      if (first.getMonth() === last.getMonth()) {
        label = `${fm} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
      } else {
        label = `${fm} ${first.getDate()} – ${lm} ${last.getDate()}, ${last.getFullYear()}`;
      }
    }

    return { visibleDates: dates, rangeLabel: label };
  }, [anchor, viewMode]);

  const todayKey = toDateKey(new Date());
  const firstDateKey = toDateKey(visibleDates[0]);
  const lastDateKey = toDateKey(visibleDates[visibleDates.length - 1]);

  // Navigation handlers
  const handlePrev = () => {
    setAnchor((prev) => {
      if (viewMode === 'month') return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (viewMode === '2weeks') return addDays(prev, -14);
      return addDays(prev, -7);
    });
  };

  const handleNext = () => {
    setAnchor((prev) => {
      if (viewMode === 'month') return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      if (viewMode === '2weeks') return addDays(prev, 14);
      return addDays(prev, 7);
    });
  };

  const handleToday = () => setAnchor(new Date());

  // Build person rows from leaves
  const personRows: PersonRow[] = useMemo(() => {
    const allLeaves: { leave: LeaveRequest; isUser: boolean }[] = [];

    for (const leave of userLeaves) {
      if (isManager) {
        if (leave.status !== 'Approved' && leave.status !== 'Pending') continue;
      } else {
        if (leave.status !== 'Approved' && leave.status !== 'Pending') continue;
      }
      if (!leave.startDate || !leave.endDate) continue;
      allLeaves.push({ leave, isUser: true });
    }

    for (const leave of teamLeaves) {
      if (isManager) {
        if (leave.status !== 'Approved' && leave.status !== 'Pending') continue;
      } else {
        if (leave.status !== 'Approved') continue;
      }
      if (!leave.startDate || !leave.endDate) continue;
      allLeaves.push({ leave, isUser: false });
    }

    // Group by employeeId
    const groupMap = new Map<string, PersonRow>();

    for (const { leave, isUser } of allLeaves) {
      const leaveStart = toLocalDateStr(leave.startDate);
      const leaveEnd = toLocalDateStr(leave.endDate);

      // Check if leave overlaps with visible range
      if (leaveEnd < firstDateKey || leaveStart > lastDateKey) continue;

      // Clamp to visible range
      const clampedStart = leaveStart < firstDateKey ? firstDateKey : leaveStart;
      const clampedEnd = leaveEnd > lastDateKey ? lastDateKey : leaveEnd;

      // Find column indices
      const startIdx = visibleDates.findIndex((d) => toDateKey(d) === clampedStart);
      const endIdx = visibleDates.findIndex((d) => toDateKey(d) === clampedEnd);
      if (startIdx === -1 || endIdx === -1) continue;

      // CSS Grid: col 1 = name, col 2+ = dates (1-based)
      const colStart = startIdx + 2;
      const colEnd = endIdx + 3; // grid-column-end is exclusive

      const empId = leave.employeeId;
      if (!groupMap.has(empId)) {
        groupMap.set(empId, {
          employeeId: empId,
          name: leave.employeeName || 'Unknown',
          bars: [],
        });
      }
      groupMap.get(empId)!.bars.push({ request: leave, colStart, colEnd, isUser });
    }

    // Sort: user first, then alphabetical
    const rows = Array.from(groupMap.values());
    rows.sort((a, b) => {
      const aIsUser = a.bars.some((bar) => bar.isUser);
      const bIsUser = b.bars.some((bar) => bar.isUser);
      if (aIsUser && !bIsUser) return -1;
      if (!aIsUser && bIsUser) return 1;
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [userLeaves, teamLeaves, isManager, visibleDates, firstDateKey, lastDateKey]);

  const dayCount = visibleDates.length;
  const ROW_HEIGHT = 44;

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-4 md:p-6 flex flex-col">
      {/* Header: title + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">{t('leave:calendar.teamCalendar')}</h2>
        <div className="flex items-center gap-1 bg-background-light dark:bg-background-dark rounded-lg p-0.5">
          {(['week', '2weeks', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark shadow-sm'
                  : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
              }`}
            >
              {mode === 'week' ? t('leave:calendar.week') : mode === '2weeks' ? t('leave:calendar.twoWeeks') : t('leave:calendar.month')}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="p-1.5 hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors"
        >
          <ChevronLeft size={18} className="text-text-light dark:text-text-dark" />
        </button>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-text-light dark:text-text-dark">
            {rangeLabel}
          </span>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors"
          >
            {t('leave:calendar.today')}
          </button>
        </div>
        <button
          onClick={handleNext}
          className="p-1.5 hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors"
        >
          <ChevronRight size={18} className="text-text-light dark:text-text-dark" />
        </button>
      </div>

      {/* Gantt chart */}
      <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
        <div
          className="min-w-[600px]"
          style={{
            display: 'grid',
            gridTemplateColumns: `120px repeat(${dayCount}, minmax(28px, 1fr))`,
            gridTemplateRows: `auto ${personRows.length > 0 ? `repeat(${personRows.length}, ${ROW_HEIGHT}px)` : 'auto'}`,
          }}
        >
          {/* ---- Header row (gridRow 1): empty name cell + day columns ---- */}
          <div
            className="sticky left-0 z-10 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark"
            style={{ gridRow: 1, gridColumn: 1 }}
          />
          {visibleDates.map((date, i) => {
            const key = toDateKey(date);
            const isToday = key === todayKey;
            const weekend = isWeekend(date);
            return (
              <div
                key={key}
                className={`text-center py-1.5 text-[10px] leading-tight border-b border-border-light dark:border-border-dark select-none ${
                  weekend ? 'bg-gray-50 dark:bg-gray-800/40' : ''
                } ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                style={{ gridRow: 1, gridColumn: i + 2 }}
              >
                <div className={`font-medium ${isToday ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                  {date.getDate()}
                </div>
                <div className={`${isToday ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark'} opacity-70`}>
                  {SHORT_DAY_NAMES[date.getDay()]}
                </div>
              </div>
            );
          })}

          {/* ---- Empty state ---- */}
          {personRows.length === 0 && (
            <div
              className="text-center py-10 text-sm text-text-muted-light dark:text-text-muted-dark"
              style={{ gridRow: 2, gridColumn: `1 / ${dayCount + 2}` }}
            >
              {t('leave:calendar.noRequests')}
            </div>
          )}

          {/* ---- Person rows ---- */}
          {personRows.map((person, pIdx) => {
            const gridRow = pIdx + 2; // row 1 = header
            const rowIsUser = person.bars.some((b) => b.isUser);

            return (
              <React.Fragment key={person.employeeId}>
                {/* Name cell */}
                <div
                  className="sticky left-0 z-10 bg-card-light dark:bg-card-dark flex items-center pr-2 border-b border-border-light dark:border-border-dark"
                  style={{ gridRow, gridColumn: 1 }}
                >
                  <span
                    className={`text-xs font-medium truncate ${
                      rowIsUser
                        ? 'text-text-light dark:text-text-dark'
                        : 'text-text-muted-light dark:text-text-muted-dark'
                    }`}
                    title={person.name}
                  >
                    {rowIsUser ? t('leave:calendar.you') : person.name}
                  </span>
                </div>

                {/* Day background cells — same gridRow as bars */}
                {visibleDates.map((date, i) => {
                  const dateKey = toDateKey(date);
                  const weekend = isWeekend(date);
                  const isToday = dateKey === todayKey;
                  return (
                    <div
                      key={`${person.employeeId}-${dateKey}`}
                      className={`border-b border-border-light dark:border-border-dark ${
                        weekend ? 'bg-gray-50 dark:bg-gray-800/40' : ''
                      } ${isToday ? 'border-l-2 border-l-primary/40' : ''}`}
                      style={{ gridRow, gridColumn: i + 2 }}
                    />
                  );
                })}

                {/* Leave bars — same gridRow, higher z-index → overlaps bg cells */}
                {person.bars.map((bar) => {
                  const isPending = bar.request.status === 'Pending';
                  const isBarUser = bar.isUser;
                  const canClick = isBarUser
                    ? !!onLeaveClick
                    : isManager && !!onLeaveClick;

                  // Colors & label
                  let colors: typeof DEFAULT_TYPE_COLOR;
                  let label: string;
                  if (!isManager && !isBarUser) {
                    colors = TEAM_GRAY_COLOR;
                    label = `${person.name} - ${t('leave:calendar.onLeave')}`;
                  } else {
                    colors = TYPE_COLORS[bar.request.type] || DEFAULT_TYPE_COLOR;
                    const shortType = getShortLabel(bar.request.type);
                    label = isManager
                      ? `${person.name} - ${shortType}`
                      : shortType;
                  }

                  return (
                    <div
                      key={bar.request.id}
                      className={`
                        flex items-center px-1.5 mx-0.5 rounded-md text-[10px] font-medium leading-none
                        whitespace-nowrap overflow-hidden
                        ${colors.bar} ${colors.barDark} ${colors.text}
                        ${isPending ? 'opacity-60 border border-dashed border-white/50' : ''}
                        ${canClick ? 'cursor-pointer hover:brightness-110 hover:shadow-md transition-all' : ''}
                      `}
                      style={{
                        gridRow,
                        gridColumn: `${bar.colStart} / ${bar.colEnd}`,
                        zIndex: 5,
                        height: 26,
                        alignSelf: 'center',
                      }}
                      title={`${bar.request.employeeName} — ${translateLeaveType(bar.request.type)} (${bar.request.status})`}
                      onClick={canClick ? () => onLeaveClick!(bar.request) : undefined}
                    >
                      <span className="truncate">{label}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-border-light dark:border-border-dark">
        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-3 h-2 rounded-sm ${colors.legend}`} />
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
              {getShortLabel(type)}
            </span>
          </div>
        ))}

        {/* Pending indicator */}
        {isManager && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-gray-300 dark:bg-gray-500 opacity-60 border border-dashed border-gray-500 dark:border-gray-300" />
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{t('common:status.pending')}</span>
          </div>
        )}

        {/* Team on Leave (employee view) */}
        {!isManager && (
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-2 rounded-sm ${TEAM_GRAY_COLOR.legend}`} />
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{t('leave:calendar.teamOnLeave')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
