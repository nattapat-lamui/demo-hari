import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Bangkok';

/** Format a UTC timestamp to Bangkok time (e.g. "14:30") */
export const formatTimeTH = (dateString: string | null): string => {
  if (!dateString) return '-';
  return dayjs(dateString).tz(TZ).format('HH:mm');
};

/** Format a UTC timestamp to Bangkok date (e.g. "Mon, Feb 10") */
export const formatDateTH = (dateString: string): string => {
  return dayjs(dateString).tz(TZ).format('ddd, MMM D');
};

/** Format a date string to readable format (e.g. "Apr 1, 2025") */
export const formatDate = (dateString: string): string => {
  return dayjs(dateString).tz(TZ).format('MMM D, YYYY');
};

export { dayjs };
