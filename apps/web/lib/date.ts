import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Bangkok';

/** Get current i18n language from localStorage (avoids circular import with i18n.ts) */
const getLang = (): string => localStorage.getItem('language') || 'en';

/** Format a UTC timestamp to Bangkok time (e.g. "14:30") */
export const formatTimeTH = (dateString: string | null): string => {
  if (!dateString) return '-';
  return dayjs(dateString).tz(TZ).locale(getLang()).format('HH:mm');
};

/** Format a UTC timestamp to Bangkok date (e.g. "Mon, Feb 10") */
export const formatDateTH = (dateString: string): string => {
  return dayjs(dateString).tz(TZ).locale(getLang()).format('ddd, MMM D');
};

/** Format a date string to readable format (e.g. "Apr 1, 2025") */
export const formatDate = (dateString: string): string => {
  return dayjs(dateString).tz(TZ).locale(getLang()).format('MMM D, YYYY');
};

export { dayjs };
