import { TFunction } from 'i18next';

const stageKeys: Record<string, string> = {
  'Pre-boarding': 'flowGraph.preBoarding',
  'Week 1': 'flowGraph.week1',
  'Month 1': 'flowGraph.month1',
};

export function translateStage(t: TFunction, stage: string): string {
  const key = stageKeys[stage];
  return key ? t(key) : stage;
}

export function translateTaskTitle(t: TFunction, title: string): string {
  const key = `tasks.${title}`;
  const translated = t(key);
  return translated !== key ? translated : title;
}

export function translateTaskDescription(t: TFunction, description: string): string {
  const key = `tasks.${description}`;
  const translated = t(key);
  return translated !== key ? translated : description;
}

export function translateDocName(t: TFunction, name: string): string {
  const key = `documents.${name}`;
  const translated = t(key);
  return translated !== key ? translated : name;
}

export function translateDocDescription(t: TFunction, description: string): string {
  const key = `documents.${description}`;
  const translated = t(key);
  return translated !== key ? translated : description;
}
