import type { TaskId } from '../domain/taskLog';
import type { ArchiveBatch, TaskRecord, WorkspaceSnapshot } from '../domain/workspace';
import type { TaskLogStoreState, WorkspaceStatus } from './taskLogStoreTypes';

export const addPendingTask = (taskIds: readonly TaskId[], taskId: TaskId): readonly TaskId[] =>
  taskIds.includes(taskId) ? taskIds : [...taskIds, taskId];

export const removePendingTask = (
  taskIds: readonly TaskId[],
  taskId: TaskId,
): readonly TaskId[] => taskIds.filter((candidate) => candidate !== taskId);

export const upsertRecord = (
  snapshot: WorkspaceSnapshot,
  record: TaskRecord,
): WorkspaceSnapshot => {
  const exists = snapshot.records.some((candidate) => candidate.entry.id === record.entry.id);
  const records = exists
    ? snapshot.records.map((candidate) =>
        candidate.entry.id === record.entry.id ? record : candidate,
      )
    : [record, ...snapshot.records];

  return {
    ...snapshot,
    records,
  };
};

export const removeArchivedRecords = (
  snapshot: WorkspaceSnapshot,
  batch: ArchiveBatch,
): WorkspaceSnapshot => ({
  ...snapshot,
  records: snapshot.records.filter((record) => !batch.archivedIds.includes(record.entry.id)),
});

export const finishWithSnapshot = (
  snapshot: WorkspaceSnapshot,
): Partial<TaskLogStoreState> => ({
  workspaceStatus: 'ready',
  snapshot,
  lastError: null,
});

export const statusAfterFailure = (snapshot: WorkspaceSnapshot | null): WorkspaceStatus =>
  snapshot ? 'ready' : 'error';
