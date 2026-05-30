import type { DailySummary } from '../domain/dailySummary';
import type { TaskChangeEvent } from '../domain/taskHistory';

export const replaceDailySummaryState = (
  events: readonly TaskChangeEvent[],
  summaries: readonly DailySummary[],
) => ({
  events,
  summaries,
  runStatus: 'ready' as const,
  lastError: null,
});

export const upsertDailySummary = (
  summaries: readonly DailySummary[],
  summary: DailySummary,
): readonly DailySummary[] =>
  [summary, ...summaries.filter((item) => item.day !== summary.day)].sort((left, right) =>
    right.day.localeCompare(left.day),
  );
