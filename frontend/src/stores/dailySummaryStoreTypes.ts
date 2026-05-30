import type { DailySummary, SummaryRunStatus } from '../domain/dailySummary';
import type { SummaryDate } from '../domain/summaryDate';
import type { TaskChangeEvent } from '../domain/taskHistory';

export interface DailySummaryStoreState {
  readonly events: readonly TaskChangeEvent[];
  readonly summaries: readonly DailySummary[];
  readonly runStatus: SummaryRunStatus;
  readonly lastError: string | null;
  readonly actions: DailySummaryActions;
}

export interface DailySummaryActions {
  readonly loadDailySummaryState: () => Promise<boolean>;
  readonly reconcileDailySummaries: () => Promise<boolean>;
  readonly generateDailySummary: (day: SummaryDate) => Promise<boolean>;
}
