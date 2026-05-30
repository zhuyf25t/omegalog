import type { TaskId, TaskLogEntry } from './taskLog';
import {
  formatLocalDay,
  getLocalTimeZone,
  type SummaryDate,
} from './summaryDate';

declare const taskChangeEventIdBrand: unique symbol;

export type TaskChangeEventId = string & { readonly [taskChangeEventIdBrand]: true };
export type TaskChangeType = 'created' | 'updated' | 'completed' | 'reactivated' | 'archived';

export interface TaskEventSnapshot {
  readonly id: TaskId;
  readonly title: string;
  readonly note: string;
  readonly tags: readonly string[];
  readonly weight: number;
  readonly status: TaskLogEntry['status'];
  readonly deadline: string;
  readonly completedAt: string | null;
}

export interface TaskChangeEvent {
  readonly schemaVersion: 1;
  readonly eventId: TaskChangeEventId;
  readonly eventType: TaskChangeType;
  readonly sourceApi: string;
  readonly occurredAt: string;
  readonly localDay: SummaryDate;
  readonly timeZone: string;
  readonly taskIds: readonly TaskId[];
  readonly before: readonly TaskEventSnapshot[];
  readonly after: readonly TaskEventSnapshot[];
  readonly changedFields: readonly string[];
}

export const taskEventSnapshotFromEntry = (entry: TaskLogEntry): TaskEventSnapshot => ({
  id: entry.id,
  title: entry.title,
  note: entry.note,
  tags: entry.tags.map(String),
  weight: entry.weight,
  status: entry.status,
  deadline: entry.deadline,
  completedAt: entry.completedAt,
});

export const createTaskChangeEventId = (now = new Date()): TaskChangeEventId => {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17);
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `evt_${stamp}_${random}` as TaskChangeEventId;
};

export const buildTaskChangeEventDay = (now: Date): SummaryDate => formatLocalDay(now);
export const buildTaskChangeEventTimeZone = (): string => getLocalTimeZone();
