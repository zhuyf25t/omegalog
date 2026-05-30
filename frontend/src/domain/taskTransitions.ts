import {
  buildDefaultDeadline,
  hasDeadlineChanged,
  isDeadlineOverdue,
  type IsoDateTime,
  type TaskDraft,
  type TaskId,
  type TaskLogEntry,
} from './taskLog';

export const createTaskLogEntry = (taskId: TaskId, draft: TaskDraft, now: Date): TaskLogEntry => ({
  id: taskId,
  title: draft.title,
  note: draft.note,
  tags: draft.tags,
  weight: draft.weight,
  status: 'active',
  deadline: draft.deadline,
  deadlineAdjustCount: 0,
  overdueAdjustCount: 0,
  createdAt: now.toISOString() as IsoDateTime,
  completedAt: null,
});

export const updateTaskLogEntry = (
  current: TaskLogEntry,
  draft: TaskDraft,
  now: Date,
): TaskLogEntry => {
  const deadlineChanged = hasDeadlineChanged(current.deadline, draft.deadline);
  const adjustedAfterOverdue =
    deadlineChanged && current.status === 'active' && isDeadlineOverdue(current.deadline, now);

  if (current.status === 'active') {
    return {
      ...current,
      title: draft.title,
      note: draft.note,
      tags: draft.tags,
      weight: draft.weight,
      deadline: draft.deadline,
      deadlineAdjustCount: current.deadlineAdjustCount + (deadlineChanged ? 1 : 0),
      overdueAdjustCount: current.overdueAdjustCount + (adjustedAfterOverdue ? 1 : 0),
      completedAt: null,
    };
  }

  return {
    ...current,
    title: draft.title,
    note: draft.note,
    tags: draft.tags,
    weight: draft.weight,
    deadline: draft.deadline,
    deadlineAdjustCount: current.deadlineAdjustCount + (deadlineChanged ? 1 : 0),
    overdueAdjustCount: current.overdueAdjustCount + (adjustedAfterOverdue ? 1 : 0),
    completedAt: current.completedAt,
  };
};

export const completeTaskLogEntry = (current: TaskLogEntry, now: Date): TaskLogEntry => {
  if (current.status === 'done') {
    return current;
  }
  return {
    ...current,
    status: 'done',
    completedAt: now.toISOString() as IsoDateTime,
  };
};

export const reactivateTaskLogEntry = (current: TaskLogEntry, now: Date): TaskLogEntry => {
  if (current.status === 'active') {
    return current;
  }
  const deadlineTime = Date.parse(current.deadline);
  return {
    ...current,
    status: 'active',
    deadline:
      Number.isNaN(deadlineTime) || deadlineTime <= now.getTime()
        ? buildDefaultDeadline(now)
        : current.deadline,
    completedAt: null,
  };
};

export const sameTaskId = (left: TaskId, right: TaskId): boolean => left === right;
