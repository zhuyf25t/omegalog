import {
  buildSummaryId,
  type DailySummary,
  type DailySummaryStats,
} from './dailySummary';
import { readSummaryDate } from './summaryDate';
import type { TaskChangeEventId } from './taskHistory';
import { err, isRecord, ok, type Result } from './result';

export const encodeDailySummary = (summary: DailySummary): unknown => summary;

export const decodeDailySummary = (value: unknown): Result<DailySummary> => {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    return err('Summary JSON is not a schema v1 object.');
  }
  const day = typeof value.day === 'string' ? readSummaryDate(value.day) : null;
  if (!day || !isRecord(value.source) || !isRecord(value.content)) {
    return err('Summary day, source, or content is invalid.');
  }
  return ok({
    schemaVersion: 1,
    summaryId: buildSummaryId(day),
    day,
    timeZone: readString(value, 'timeZone'),
    generatedAt: readString(value, 'generatedAt'),
    provider: readProvider(value.provider),
    source: {
      eventIds: readStringArray(value.source.eventIds) as TaskChangeEventId[],
      sourceHash: readString(value.source, 'sourceHash'),
      inputCompleteness:
        value.source.inputCompleteness === 'empty-day' ? 'empty-day' : 'event-log',
    },
    stats: readStats(value.stats),
    content: {
      headline: readString(value.content, 'headline'),
      markdown: readString(value.content, 'markdown'),
      risks: readStringArray(value.content.risks),
      nextActions: readStringArray(value.content.nextActions),
    },
  });
};

const readProvider = (value: unknown): DailySummary['provider'] => {
  if (!isRecord(value)) {
    return { kind: 'local-critical-v1', model: 'unknown', promptVersion: 'critical-daily-v1' };
  }
  return {
    kind: value.kind === 'ai-proxy' ? 'ai-proxy' : 'local-critical-v1',
    model: readString(value, 'model'),
    promptVersion: readString(value, 'promptVersion') || 'critical-daily-v1',
  };
};

const readStats = (value: unknown): DailySummaryStats => {
  const source = isRecord(value) ? value : {};
  return {
    created: readCount(source.created),
    updated: readCount(source.updated),
    completed: readCount(source.completed),
    reactivated: readCount(source.reactivated),
    archived: readCount(source.archived),
    touchedTasks: readCount(source.touchedTasks),
  };
};

const readString = (source: Record<string, unknown>, key: string): string =>
  typeof source[key] === 'string' ? source[key] : '';

const readStringArray = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const readCount = (value: unknown): number => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
};
