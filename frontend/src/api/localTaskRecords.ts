import type { TaskId } from '../domain/taskLog';
import { sameTaskId } from '../domain/taskTransitions';
import {
  createWorkspaceId,
  type ImportWarning,
  type TaskRecord,
  type WorkspaceSnapshot,
} from '../domain/workspace';
import { toTaskRecord, type StoredTaskRecord } from './localTaskFileStorage';
import { TaskLogApiError } from './taskLogApi';

export const buildWorkspaceSnapshot = (
  directory: FileSystemDirectoryHandle,
  records: readonly StoredTaskRecord[],
  warnings: readonly ImportWarning[],
): WorkspaceSnapshot => ({
  id: createWorkspaceId(directory.name),
  name: directory.name,
  records: records.map(toTaskRecord),
  warnings,
});

export const requireStoredTaskRecord = (
  records: readonly StoredTaskRecord[],
  taskId: TaskId,
): StoredTaskRecord => {
  const record = records.find((item) => sameTaskId(item.entry.id, taskId));
  if (!record) {
    throw new TaskLogApiError('task-not-found', '找不到要操作的事件。');
  }
  return record;
};

export const requireTaskRecord = (
  records: readonly StoredTaskRecord[],
  taskId: TaskId,
): TaskRecord => toTaskRecord(requireStoredTaskRecord(records, taskId));
