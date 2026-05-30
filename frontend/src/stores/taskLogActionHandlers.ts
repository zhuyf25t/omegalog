import { toUserMessage } from '../api/taskLogApi';
import type { TaskId } from '../domain/taskLog';
import type { TaskRecord } from '../domain/workspace';
import {
  addPendingTask,
  removePendingTask,
  statusAfterFailure,
  upsertRecord,
} from './taskLogReducers';
import type { TaskLogStoreState } from './taskLogStoreTypes';

export type TaskLogSetState = (
  partial:
    | TaskLogStoreState
    | Partial<TaskLogStoreState>
    | ((state: TaskLogStoreState) => TaskLogStoreState | Partial<TaskLogStoreState>),
  replace?: false,
) => void;

export const failWorkspaceOperation = (set: TaskLogSetState, error: unknown): false => {
  const message = toUserMessage(error);
  if (!message) {
    set((state) => ({ workspaceStatus: state.snapshot ? 'ready' : 'idle' }));
    return false;
  }
  set((state) => ({
    workspaceStatus: statusAfterFailure(state.snapshot),
    lastError: message,
  }));
  return false;
};

export const startTaskOperation = (set: TaskLogSetState, taskId: TaskId): void => {
  set((state) => ({
    workspaceStatus: 'working',
    pendingTaskIds: addPendingTask(state.pendingTaskIds, taskId),
    lastError: null,
  }));
};

export const finishTaskRecord = (
  set: TaskLogSetState,
  taskId: TaskId,
  record: TaskRecord,
  options: { readonly clearSelection?: boolean } = {},
): void => {
  set((state) => {
    const pendingTaskIds = removePendingTask(state.pendingTaskIds, taskId);
    return {
      workspaceStatus: pendingTaskIds.length > 0 ? 'working' : 'ready',
      snapshot: state.snapshot ? upsertRecord(state.snapshot, record) : state.snapshot,
      selectedComposerTaskId: options.clearSelection ? null : state.selectedComposerTaskId,
      pendingTaskIds,
      lastError: null,
    };
  });
};

export const failTaskOperation = (
  set: TaskLogSetState,
  taskId: TaskId,
  error: unknown,
): false => {
  const message = toUserMessage(error);
  set((state) => ({
    workspaceStatus: statusAfterFailure(state.snapshot),
    pendingTaskIds: removePendingTask(state.pendingTaskIds, taskId),
    lastError: message || null,
  }));
  return false;
};
