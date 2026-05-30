import { err, isRecord, ok, type Result } from './result';
import {
  buildDefaultDeadline,
  createIsoDateTime,
  createTaskId,
  createTaskWeight,
  normalizeCount,
  normalizeTags,
  type IsoDateTime,
  type TaskLogEntry,
  type TaskStatus,
} from './taskLog';

interface CanonicalTaskLogJson {
  readonly id: string;
  readonly title: string;
  readonly note: string;
  readonly tags: readonly string[];
  readonly weight: number;
  readonly status: TaskStatus;
  readonly deadline: string;
  readonly deadlineAdjustCount: number;
  readonly overdueAdjustCount: number;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

const readString = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === 'string' ? value : null;
};

const readStatus = (source: Record<string, unknown>): TaskStatus | null => {
  const value = source.status;
  return value === 'active' || value === 'done' ? value : null;
};

export const decodeTaskLogEntry = (value: unknown): Result<TaskLogEntry> => {
  if (!isRecord(value)) {
    return err('JSON root is not an object.');
  }

  const id = createTaskId(readString(value, 'id') ?? '');
  if (!id.ok) {
    return err('Task id is missing or invalid.');
  }

  const title = (readString(value, 'title') ?? '').trim();
  if (!title) {
    return err('Title is missing.');
  }

  const createdAt = createIsoDateTime(readString(value, 'createdAt') ?? '');
  if (!createdAt.ok) {
    return err('createdAt is missing or invalid.');
  }

  const status = readStatus(value);
  if (!status) {
    return err('Status must be active or done.');
  }

  const rawDeadline = createIsoDateTime(readString(value, 'deadline') ?? '');
  const deadline = rawDeadline.ok ? rawDeadline.value : buildDefaultDeadline(new Date(createdAt.value));

  const completedAt = decodeCompletedAt(value, status, createdAt.value);
  if (!completedAt.ok) {
    return err(completedAt.reason);
  }

  const rawTags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  const base = {
    id: id.value,
    title: title.slice(0, 120),
    note: (readString(value, 'note') ?? '').trim().slice(0, 1200),
    tags: normalizeTags(rawTags),
    weight: createTaskWeight(Number(value.weight ?? 5)),
    deadline,
    deadlineAdjustCount: normalizeCount(value.deadlineAdjustCount),
    overdueAdjustCount: normalizeCount(value.overdueAdjustCount),
    createdAt: createdAt.value,
  };

  if (status === 'active') {
    return ok({
      ...base,
      status: 'active',
      completedAt: null,
    });
  }

  if (!completedAt.value) {
    return err('Done task must have completedAt.');
  }

  return ok({
    ...base,
    status: 'done',
    completedAt: completedAt.value,
  });
};

const decodeCompletedAt = (
  source: Record<string, unknown>,
  status: TaskStatus,
  createdAt: IsoDateTime,
): Result<IsoDateTime | null> => {
  const raw = source.completedAt;
  if (status === 'active') {
    return ok(null);
  }
  if (typeof raw !== 'string') {
    return ok(createdAt);
  }
  const parsed = createIsoDateTime(raw);
  return parsed.ok ? ok(parsed.value) : err('completedAt is invalid.');
};

export const encodeTaskLogEntry = (entry: TaskLogEntry): CanonicalTaskLogJson => ({
  id: entry.id,
  title: entry.title,
  note: entry.note,
  tags: entry.tags,
  weight: entry.weight,
  status: entry.status,
  deadline: entry.deadline,
  deadlineAdjustCount: entry.deadlineAdjustCount,
  overdueAdjustCount: entry.overdueAdjustCount,
  createdAt: entry.createdAt,
  completedAt: entry.completedAt,
});
