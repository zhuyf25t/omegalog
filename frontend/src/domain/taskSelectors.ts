import {
  isDeadlineOverdue,
  type SortMode,
  type StatusFilter,
  type TaskLogEntry,
  type TaskTag,
} from './taskLog';
import type { TaskRecord } from './workspace';

export interface CountdownState {
  readonly text: string;
  readonly isOverdue: boolean;
}

export interface TaskStats {
  readonly total: number;
  readonly active: number;
  readonly done: number;
}

export const getTaskStats = (records: readonly TaskRecord[]): TaskStats => {
  const active = records.filter((record) => record.entry.status === 'active').length;
  return {
    total: records.length,
    active,
    done: records.length - active,
  };
};

export const selectFocusRecord = (records: readonly TaskRecord[]): TaskRecord | null => {
  const active = records.filter((record) => record.entry.status === 'active');
  if (active.length === 0) {
    return null;
  }
  return [...active].sort((left, right) => {
    const weightDiff = right.entry.weight - left.entry.weight;
    return weightDiff || getDeadlineTime(left.entry) - getDeadlineTime(right.entry);
  })[0];
};

export const selectVisibleRecords = (
  records: readonly TaskRecord[],
  filter: StatusFilter,
  query: string,
  sortMode: SortMode,
): readonly TaskRecord[] => {
  const normalizedQuery = query.trim().toLowerCase();
  return sortRecords(records, sortMode).filter((record) => {
    if (filter !== 'all' && record.entry.status !== filter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = [
      record.entry.title,
      record.entry.note,
      String(record.entry.weight),
      record.entry.status === 'active' ? '进行中 active' : '已完成 done',
      ...deriveDisplayTags(record.entry),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
};

export const sortRecords = (
  records: readonly TaskRecord[],
  sortMode: SortMode,
): readonly TaskRecord[] =>
  [...records].sort((left, right) => {
    const statusDiff = statusRank(left.entry) - statusRank(right.entry);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    const sortDiff = getSortDifference(left.entry, right.entry, sortMode);
    return sortDiff || getCreatedTime(right.entry) - getCreatedTime(left.entry);
  });

export const getPageRecords = <T>(items: readonly T[], page: number, pageSize: number): readonly T[] => {
  const start = (Math.max(1, page) - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

export const getTotalPages = (totalItems: number, pageSize: number): number =>
  Math.max(1, Math.ceil(totalItems / pageSize));

export const deriveDisplayTags = (entry: TaskLogEntry): readonly string[] => {
  const tags: string[] = [];
  const add = (tag: string | TaskTag) => {
    const value = String(tag);
    if (!tags.includes(value)) {
      tags.push(value);
    }
  };
  add(`优先级 ${entry.weight}`);
  add(entry.status === 'active' ? '进行中' : '已完成');
  for (const tag of entry.tags) {
    add(tag);
  }
  return tags.slice(0, 5);
};

export const getTensionLevel = (entry: TaskLogEntry, now = new Date()): number => {
  const currentlyOverdue = entry.status === 'active' && isDeadlineOverdue(entry.deadline, now);
  if (entry.overdueAdjustCount === 0 && !currentlyOverdue) {
    return 0;
  }
  const historicalPressure = entry.overdueAdjustCount + Math.floor(entry.deadlineAdjustCount / 2);
  const livePressure = currentlyOverdue ? 1 : 0;
  return Math.min(5, Math.max(1, historicalPressure + livePressure));
};

export const formatCountdownText = (deadlineIso: string, nowMs = Date.now()): CountdownState => {
  const due = Date.parse(deadlineIso);
  if (Number.isNaN(due)) {
    return { text: '时间无效', isOverdue: true };
  }

  const diff = due - nowMs;
  const abs = Math.abs(diff);
  const totalSeconds = Math.floor(abs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const base = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;

  if (diff >= 0) {
    return { text: `剩余 ${base}`, isOverdue: false };
  }
  return { text: `已逾期 ${base}`, isOverdue: true };
};

export const formatReadableTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusRank = (entry: TaskLogEntry): number => (entry.status === 'active' ? 0 : 1);

const getSortDifference = (left: TaskLogEntry, right: TaskLogEntry, mode: SortMode): number => {
  if (mode === 'created-asc') {
    return getCreatedTime(left) - getCreatedTime(right);
  }
  if (mode === 'priority-desc') {
    return right.weight - left.weight;
  }
  if (mode === 'priority-asc') {
    return left.weight - right.weight;
  }
  return getCreatedTime(right) - getCreatedTime(left);
};

const getCreatedTime = (entry: TaskLogEntry): number => {
  const time = Date.parse(entry.createdAt);
  return Number.isNaN(time) ? 0 : time;
};

const getDeadlineTime = (entry: TaskLogEntry): number => {
  const time = Date.parse(entry.deadline);
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');
