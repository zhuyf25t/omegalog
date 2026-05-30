import { createTaskId, type TaskId } from './taskLog';
import {
  type TaskChangeEvent,
  type TaskChangeEventId,
  type TaskChangeType,
  type TaskEventSnapshot,
} from './taskHistory';
import { readSummaryDate } from './summaryDate';
import { err, isRecord, ok, type Result } from './result';

const eventTypes: readonly TaskChangeType[] = [
  'created',
  'updated',
  'completed',
  'reactivated',
  'archived',
];

export const encodeTaskChangeEvent = (event: TaskChangeEvent): unknown => event;

export const decodeTaskChangeEvent = (value: unknown): Result<TaskChangeEvent> => {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    return err('Event JSON is not a schema v1 object.');
  }
  const eventType = readEventType(value.eventType);
  const localDay = typeof value.localDay === 'string' ? readSummaryDate(value.localDay) : null;
  const taskIds = readTaskIds(value.taskIds);
  if (!eventType || !localDay || taskIds.length === 0) {
    return err('Event type, local day, or task ids are invalid.');
  }
  return ok({
    schemaVersion: 1,
    eventId: String(value.eventId ?? '') as TaskChangeEventId,
    eventType,
    sourceApi: readString(value, 'sourceApi'),
    occurredAt: readString(value, 'occurredAt'),
    localDay,
    timeZone: readString(value, 'timeZone'),
    taskIds,
    before: readSnapshots(value.before),
    after: readSnapshots(value.after),
    changedFields: readStringArray(value.changedFields),
  });
};

const readSnapshots = (value: unknown): readonly TaskEventSnapshot[] =>
  Array.isArray(value) ? value.filter(isRecord).map(readSnapshot) : [];

const readSnapshot = (value: Record<string, unknown>): TaskEventSnapshot => ({
  id: readTaskId(value.id),
  title: readString(value, 'title'),
  note: readString(value, 'note'),
  tags: readStringArray(value.tags),
  weight: readCount(value.weight),
  status: value.status === 'done' ? 'done' : 'active',
  deadline: readString(value, 'deadline'),
  completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
});

const readTaskIds = (value: unknown): readonly TaskId[] =>
  Array.isArray(value) ? value.map(readTaskId) : [];

const readTaskId = (value: unknown): TaskId => {
  const parsed = createTaskId(String(value ?? 'invalid'));
  if (parsed.ok) {
    return parsed.value;
  }
  const fallback = createTaskId('invalid0');
  if (fallback.ok) {
    return fallback.value;
  }
  return 'invalid0' as TaskId;
};

const readEventType = (value: unknown): TaskChangeType | null =>
  eventTypes.find((type) => type === value) ?? null;

const readString = (source: Record<string, unknown>, key: string): string =>
  typeof source[key] === 'string' ? source[key] : '';

const readStringArray = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const readCount = (value: unknown): number => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
};
