import type { SortMode, StatusFilter, TaskDraft, TaskId } from '../domain/taskLog';
import type { WorkspaceSnapshot } from '../domain/workspace';

export type WorkspaceStatus = 'idle' | 'opening' | 'ready' | 'working' | 'unsupported' | 'error';

export interface TaskLogControls {
  readonly query: string;
  readonly filter: StatusFilter;
  readonly sortMode: SortMode;
  readonly page: number;
}

export interface TaskLogActions {
  readonly openWorkspace: () => Promise<boolean>;
  readonly reloadWorkspace: () => Promise<boolean>;
  readonly createEntry: (draft: TaskDraft) => Promise<boolean>;
  readonly updateEntry: (taskId: TaskId, draft: TaskDraft) => Promise<boolean>;
  readonly completeEntry: (taskId: TaskId) => Promise<boolean>;
  readonly reactivateEntry: (taskId: TaskId) => Promise<boolean>;
  readonly archiveCompletedEntries: () => Promise<boolean>;
  readonly setControls: (controls: Partial<TaskLogControls>) => void;
  readonly setQuery: (query: string) => void;
  readonly setFilter: (filter: StatusFilter) => void;
  readonly setSortMode: (sortMode: SortMode) => void;
  readonly setPage: (page: number) => void;
  readonly selectComposerTask: (taskId: TaskId | null) => void;
}

export interface TaskLogStoreState {
  readonly workspaceStatus: WorkspaceStatus;
  readonly snapshot: WorkspaceSnapshot | null;
  readonly selectedComposerTaskId: TaskId | null;
  readonly controls: TaskLogControls;
  readonly pendingTaskIds: readonly TaskId[];
  readonly lastError: string | null;
  readonly actions: TaskLogActions;
}
