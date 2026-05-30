import type { TaskDraft, TaskId } from '../domain/taskLog';
import type { ArchiveBatch, TaskRecord, WorkspaceSnapshot } from '../domain/workspace';

export interface TaskLogApi {
  readonly isSupported: () => boolean;
  readonly openLocalFolder: () => Promise<WorkspaceSnapshot>;
  readonly importFolderEntries: () => Promise<WorkspaceSnapshot>;
  readonly reloadWorkspace: () => Promise<WorkspaceSnapshot>;
  readonly createEntry: (draft: TaskDraft) => Promise<TaskRecord>;
  readonly updateEntry: (taskId: TaskId, draft: TaskDraft) => Promise<TaskRecord>;
  readonly completeEntry: (taskId: TaskId) => Promise<TaskRecord>;
  readonly reactivateEntry: (taskId: TaskId) => Promise<TaskRecord>;
  readonly archiveCompletedEntries: () => Promise<ArchiveBatch>;
}

export class TaskLogApiError extends Error {
  readonly code:
    | 'unsupported'
    | 'permission-denied'
    | 'workspace-not-open'
    | 'task-not-found'
    | 'invalid-input'
    | 'invalid-operation'
    | 'conflict'
    | 'file-io';

  constructor(code: TaskLogApiError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'TaskLogApiError';
  }
}

export const toUserMessage = (error: unknown): string => {
  if (error instanceof TaskLogApiError) {
    return error.message;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return '';
  }
  return '操作失败，请检查文件夹权限后重试。';
};
