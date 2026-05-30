declare const summaryDateBrand: unique symbol;

export type SummaryDate = string & { readonly [summaryDateBrand]: true };

export const readSummaryDate = (value: string): SummaryDate | null =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? (value as SummaryDate) : null;

export const formatLocalDay = (date: Date): SummaryDate => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as SummaryDate;
};

export const getLocalTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';

export const addDays = (day: SummaryDate, amount: number): SummaryDate => {
  const [year, month, date] = day.split('-').map(Number);
  const next = new Date(year, month - 1, date + amount);
  return formatLocalDay(next);
};

export const getYesterday = (now = new Date()): SummaryDate => {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return formatLocalDay(yesterday);
};

export const compareSummaryDate = (left: SummaryDate, right: SummaryDate): number =>
  left.localeCompare(right);
