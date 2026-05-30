import { err, ok, type Result } from './result';

declare const taskIdBrand: unique symbol;
declare const isoDateTimeBrand: unique symbol;
declare const taskWeightBrand: unique symbol;
declare const taskTagBrand: unique symbol;

export type TaskId = string & { readonly [taskIdBrand]: true };
export type IsoDateTime = string & { readonly [isoDateTimeBrand]: true };
export type TaskWeight = number & { readonly [taskWeightBrand]: true };
export type TaskTag = string & { readonly [taskTagBrand]: true };

export type TaskStatus = 'active' | 'done';
export type SortMode = 'created-desc' | 'created-asc' | 'priority-desc' | 'priority-asc';
export type StatusFilter = 'all' | 'active' | 'done';

interface TaskLogEntryBase {
  readonly id: TaskId;
  readonly title: string;
  readonly note: string;
  readonly tags: readonly TaskTag[];
  readonly weight: TaskWeight;
  readonly deadline: IsoDateTime;
  readonly deadlineAdjustCount: number;
  readonly overdueAdjustCount: number;
  readonly createdAt: IsoDateTime;
}

export interface ActiveTaskLogEntry extends TaskLogEntryBase {
  readonly status: 'active';
  readonly completedAt: null;
}

export interface DoneTaskLogEntry extends TaskLogEntryBase {
  readonly status: 'done';
  readonly completedAt: IsoDateTime;
}

export type TaskLogEntry = ActiveTaskLogEntry | DoneTaskLogEntry;

export interface TaskDraft {
  readonly title: string;
  readonly note: string;
  readonly tags: readonly TaskTag[];
  readonly weight: TaskWeight;
  readonly deadline: IsoDateTime;
}

export const createTaskId = (raw: string): Result<TaskId> => {
  const value = raw.trim();
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(value)) {
    return err('Task id must be 4-64 URL-safe characters.');
  }
  return ok(value as TaskId);
};

export const createIsoDateTime = (raw: string): Result<IsoDateTime> => {
  const time = Date.parse(raw);
  if (Number.isNaN(time)) {
    return err('Timestamp is invalid.');
  }
  return ok(new Date(time).toISOString() as IsoDateTime);
};

export const createTaskWeight = (raw: number): TaskWeight => {
  if (!Number.isFinite(raw)) {
    return 5 as TaskWeight;
  }
  return Math.min(10, Math.max(1, Math.round(raw))) as TaskWeight;
};

export const normalizeCount = (raw: unknown): number => {
  const count = Number(raw ?? 0);
  if (!Number.isFinite(count) || count < 0) {
    return 0;
  }
  return Math.min(99, Math.floor(count));
};

export const createTaskTag = (raw: string): Result<TaskTag> => {
  const value = raw.trim().slice(0, 18);
  if (!value) {
    return err('Tag is empty.');
  }
  return ok(value as TaskTag);
};

export const normalizeTags = (tags: readonly string[]): readonly TaskTag[] => {
  const seen = new Set<string>();
  const normalized: TaskTag[] = [];
  for (const tag of tags) {
    const result = createTaskTag(tag);
    if (!result.ok) {
      continue;
    }
    const key = result.value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(result.value);
    if (normalized.length >= 6) {
      break;
    }
  }
  return normalized;
};

export const parseTagsInput = (value: string): readonly TaskTag[] =>
  normalizeTags(value.split(/[,，、\s]+/));

export const buildDefaultDeadline = (createdAt: Date): IsoDateTime => {
  const deadline = new Date(createdAt);
  deadline.setHours(24, 0, 0, 0);
  if (deadline.getTime() <= createdAt.getTime()) {
    deadline.setDate(deadline.getDate() + 1);
  }
  return deadline.toISOString() as IsoDateTime;
};

export const parseDeadlineInput = (value: string, fallbackBase: Date): IsoDateTime => {
  if (!value) {
    return buildDefaultDeadline(fallbackBase);
  }
  const result = createIsoDateTime(value);
  return result.ok ? result.value : buildDefaultDeadline(fallbackBase);
};

export const formatDateTimeLocalValue = (iso: IsoDateTime): string => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const formatDateForFilename = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours(),
  )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
};

export const hasDeadlineChanged = (previousIso: IsoDateTime, nextIso: IsoDateTime): boolean => {
  const previous = Date.parse(previousIso);
  const next = Date.parse(nextIso);
  if (Number.isNaN(previous) || Number.isNaN(next)) {
    return previousIso !== nextIso;
  }
  return Math.floor(previous / 60000) !== Math.floor(next / 60000);
};

export const isDeadlineOverdue = (deadlineIso: IsoDateTime, at = new Date()): boolean =>
  Date.parse(deadlineIso) < at.getTime();

export const makeTaskDraft = (
  title: string,
  note: string,
  tagsText: string,
  weight: number,
  deadlineLocal: string,
  baseDate: Date,
): Result<TaskDraft> => {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return err('Title is required.');
  }
  return ok({
    title: normalizedTitle.slice(0, 120),
    note: note.trim().slice(0, 1200),
    tags: parseTagsInput(tagsText),
    weight: createTaskWeight(weight),
    deadline: parseDeadlineInput(deadlineLocal, baseDate),
  });
};
