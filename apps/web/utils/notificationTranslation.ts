import { TFunction } from 'i18next';

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
      return t(key, extract(match));
    }
  }
  return message;
}
