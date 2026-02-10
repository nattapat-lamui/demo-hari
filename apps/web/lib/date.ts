import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Bangkok';

/** Format a UTC timestamp to Thailand time (e.g. "12:19 PM") */
export const formatTimeTH = (dateString: string | null): string => {
  if (!dateString) return '-';
  return dayjs.utc(dateString).tz(TZ).format('hh:mm A');
};

/** Format a UTC timestamp to Thailand date (e.g. "Mon, Feb 10") */
export const formatDateTH = (dateString: string): string => {
  return dayjs.utc(dateString).tz(TZ).format('ddd, MMM D');
};

export { dayjs, TZ };
