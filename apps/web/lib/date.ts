import dayjs from 'dayjs';

/** Format a UTC timestamp to browser local time (e.g. "10:45 AM") */
export const formatTimeTH = (dateString: string | null): string => {
  if (!dateString) return '-';
  return dayjs(dateString).format('hh:mm A');
};

/** Format a UTC timestamp to browser local date (e.g. "Mon, Feb 10") */
export const formatDateTH = (dateString: string): string => {
  return dayjs(dateString).format('ddd, MMM D');
};

export { dayjs };
