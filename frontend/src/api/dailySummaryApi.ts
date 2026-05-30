import type {
  DailySummary,
  DailySummaryReconcileResult,
} from '../domain/dailySummary';
import type { SummaryDate } from '../domain/summaryDate';
import type { TaskChangeEvent } from '../domain/taskHistory';

export interface DailySummaryStateSnapshot {
  readonly events: readonly TaskChangeEvent[];
  readonly summaries: readonly DailySummary[];
}

export interface DailySummaryApi {
  readonly isSupported: () => boolean;
  readonly loadState: () => Promise<DailySummaryStateSnapshot>;
  readonly generateForDate: (day: SummaryDate) => Promise<DailySummary>;
  readonly reconcileMissing: (throughDay?: SummaryDate) => Promise<DailySummaryReconcileResult>;
}

export class DailySummaryApiError extends Error {
  readonly code:
    | 'unsupported'
    | 'workspace-not-open'
    | 'invalid-input'
    | 'file-io'
    | 'ai-unavailable'
    | 'ai-timeout'
    | 'ai-rate-limited'
    | 'provider-response-invalid';

  constructor(code: DailySummaryApiError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'DailySummaryApiError';
  }
}

export const toDailySummaryUserMessage = (error: unknown): string => {
  if (error instanceof DailySummaryApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '每日总结操作失败，请检查文件夹权限后重试。';
};
