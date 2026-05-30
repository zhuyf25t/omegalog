import {
  type DailySummary,
} from './dailySummary';
import {
  addDays,
  compareSummaryDate,
  getYesterday,
  type SummaryDate,
} from './summaryDate';
import type { TaskChangeEvent } from './taskHistory';

export const selectEventsForDay = (
  events: readonly TaskChangeEvent[],
  day: SummaryDate,
): readonly TaskChangeEvent[] =>
  events
    .filter((event) => event.localDay === day)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

export const selectLatestSummary = (
  summaries: readonly DailySummary[],
): DailySummary | null =>
  [...summaries].sort((left, right) => right.day.localeCompare(left.day))[0] ?? null;

export const selectMissingSummaryDates = (
  events: readonly TaskChangeEvent[],
  summaries: readonly DailySummary[],
  throughDay: SummaryDate = getYesterday(),
): readonly SummaryDate[] => {
  const firstEventDay = [...events].sort((left, right) =>
    left.localDay.localeCompare(right.localDay),
  )[0]?.localDay;
  if (!firstEventDay || compareSummaryDate(firstEventDay, throughDay) > 0) {
    return [];
  }

  const dates: SummaryDate[] = [];
  for (
    let currentDay = firstEventDay;
    compareSummaryDate(currentDay, throughDay) <= 0;
    currentDay = addDays(currentDay, 1)
  ) {
    if (!summaries.some((summary) => summary.day === currentDay)) {
      dates.push(currentDay);
    }
  }
  return dates;
};

export const getNextLocalMidnightDelayMs = (now = new Date()): number => {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 2, 0);
  return Math.max(1000, next.getTime() - now.getTime());
};

export const getSummaryExcerpt = (summary: DailySummary | null): string =>
  summary?.content.headline ?? '等待生成每日复盘。';
