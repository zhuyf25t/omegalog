import type { SummaryDate } from './summaryDate';
import type { TaskChangeEventId } from './taskHistory';

declare const dailySummaryIdBrand: unique symbol;

export type DailySummaryId = string & { readonly [dailySummaryIdBrand]: true };

export type SummaryProviderKind = 'local-critical-v1' | 'ai-proxy';
export type SummaryRunStatus = 'idle' | 'loading' | 'reconciling' | 'generating' | 'ready' | 'failed';

export interface DailySummaryStats {
  readonly created: number;
  readonly updated: number;
  readonly completed: number;
  readonly reactivated: number;
  readonly archived: number;
  readonly touchedTasks: number;
}

export interface SummaryProviderMetadata {
  readonly kind: SummaryProviderKind;
  readonly model: string;
  readonly promptVersion: string;
}

export interface DailySummarySource {
  readonly eventIds: readonly TaskChangeEventId[];
  readonly sourceHash: string;
  readonly inputCompleteness: 'event-log' | 'empty-day';
}

export interface DailySummaryContent {
  readonly headline: string;
  readonly markdown: string;
  readonly risks: readonly string[];
  readonly nextActions: readonly string[];
}

export interface DailySummary {
  readonly schemaVersion: 1;
  readonly summaryId: DailySummaryId;
  readonly day: SummaryDate;
  readonly timeZone: string;
  readonly generatedAt: string;
  readonly provider: SummaryProviderMetadata;
  readonly source: DailySummarySource;
  readonly stats: DailySummaryStats;
  readonly content: DailySummaryContent;
}

export interface DailySummaryReconcileResult {
  readonly generated: readonly SummaryDate[];
  readonly skipped: readonly SummaryDate[];
  readonly failed: readonly { readonly day: SummaryDate; readonly reason: string }[];
}

export const buildSummaryId = (day: SummaryDate): DailySummaryId =>
  `daily_${day}` as DailySummaryId;

export type { SummaryDate } from './summaryDate';
