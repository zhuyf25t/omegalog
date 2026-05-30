import { create } from 'zustand';
import type { TaskId } from '../domain/taskLog';
import type { WorkspaceSnapshot } from '../domain/workspace';
import { createTaskLogActions } from './taskLogActions';
import { defaultControls } from './taskLogControls';
import type {
  TaskLogActions,
  TaskLogControls,
  TaskLogStoreState,
  WorkspaceStatus,
} from './taskLogStoreTypes';

export type {
  TaskLogActions,
  TaskLogControls,
  TaskLogStoreState,
  WorkspaceStatus,
} from './taskLogStoreTypes';

const useTaskLogStore = create<TaskLogStoreState>()((set) => ({
  workspaceStatus: 'idle',
  snapshot: null,
  selectedComposerTaskId: null,
  controls: defaultControls,
  pendingTaskIds: [],
  lastError: null,
  actions: createTaskLogActions(set),
}));

export const useWorkspaceStatus = (): WorkspaceStatus =>
  useTaskLogStore((state) => state.workspaceStatus);

export const useWorkspaceSnapshot = (): WorkspaceSnapshot | null =>
  useTaskLogStore((state) => state.snapshot);

export const useSelectedComposerTaskId = (): TaskId | null =>
  useTaskLogStore((state) => state.selectedComposerTaskId);

export const useTaskLogControls = (): TaskLogControls =>
  useTaskLogStore((state) => state.controls);

export const usePendingTaskIds = (): readonly TaskId[] =>
  useTaskLogStore((state) => state.pendingTaskIds);

export const useTaskLogLastError = (): string | null => useTaskLogStore((state) => state.lastError);

export const useTaskLogActions = (): TaskLogActions => useTaskLogStore((state) => state.actions);
