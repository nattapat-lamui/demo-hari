import { TFunction } from 'i18next';
import { translateLeaveType } from '../lib/leaveTypeConfig';

const messagePatterns: { regex: RegExp; key: string; extract: (m: RegExpMatchArray) => Record<string, string> }[] = [
  { regex: /^(.+?) has submitted a (.+?) leave request/, key: 'notifications.messages.hasSubmitted', extract: (m) => ({ name: m[1] || '', type: m[2] || '' }) },
  { regex: /^(.+?) has edited their (.+?) leave request/, key: 'notifications.messages.hasEdited', extract: (m) => ({ name: m[1] || '', type: m[2] || '' }) },
  { regex: /^Your (.+?) leave request has been approved/, key: 'notifications.messages.yourLeaveApproved', extract: (m) => ({ type: m[1] || '' }) },
  { regex: /^Your (.+?) leave request has been rejected/, key: 'notifications.messages.yourLeaveRejected', extract: (m) => ({ type: m[1] || '' }) },
  { regex: /^(.+?) has requested to cancel their approved (.+?) leave/, key: 'notifications.messages.hasCancelRequested', extract: (m) => ({ name: m[1] || '', type: m[2] || '' }) },
  { regex: /^Your (.+?) leave cancellation has been approved/, key: 'notifications.messages.yourCancelApproved', extract: (m) => ({ type: m[1] || '' }) },
  { regex: /^Your (.+?) leave cancellation has been rejected/, key: 'notifications.messages.yourCancelRejected', extract: (m) => ({ type: m[1] || '' }) },
];

export function translateNotifTitle(t: TFunction, title: string): string {
  const key = `notifications.titles.${title}`;
  const translated = t(key);
  return translated !== key ? translated : title;
}

export function translateNotifMessage(t: TFunction, message: string): string {
  for (const { regex, key, extract } of messagePatterns) {
    const match = message.match(regex);
    if (match) {
      const params = extract(match);
      // Translate leave type from English DB name to localized name
      if (params.type) {
        params.type = translateLeaveType(params.type);
      }
      return t(key, params);
    }
  }
  return message;
}

/**
 * Format notification time from created_at using i18n instead of backend English string.
 */
export function formatNotifTimeAgo(createdAt: string | Date, t: TFunction): string {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t('time.justNow');
  if (diffMins < 60) return t('time.minsAgo', { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
  return date.toLocaleDateString();
}
