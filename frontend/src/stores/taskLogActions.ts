import { taskLogApi } from '../api/localFolderTaskApi';
import {
  failTaskOperation,
  failWorkspaceOperation,
  finishTaskRecord,
  startTaskOperation,
  type TaskLogSetState,
} from './taskLogActionHandlers';
import {
  normalizeControls,
  withFilter,
  withPage,
  withQuery,
  withSortMode,
} from './taskLogControls';
import { finishWithSnapshot, removeArchivedRecords, upsertRecord } from './taskLogReducers';
import type { TaskLogActions } from './taskLogStoreTypes';

export const createTaskLogActions = (set: TaskLogSetState): TaskLogActions => ({
  openWorkspace: async () => {
    if (!taskLogApi.isSupported()) {
      const message = '当前浏览器不支持本地文件夹读写，请使用 Chrome 或 Edge。';
      set({
        workspaceStatus: 'unsupported',
        lastError: message,
      });
      return false;
    }

    set({ workspaceStatus: 'opening', lastError: null });
    try {
      const snapshot = await taskLogApi.openLocalFolder();
      set(finishWithSnapshot(snapshot));
      return true;
    } catch (error) {
      return failWorkspaceOperation(set, error);
    }
  },
  reloadWorkspace: async () => {
    set({ workspaceStatus: 'working', lastError: null });
    try {
      const snapshot = await taskLogApi.reloadWorkspace();
      set(finishWithSnapshot(snapshot));
      return true;
    } catch (error) {
      return failWorkspaceOperation(set, error);
    }
  },
  createEntry: async (draft) => {
    set({ workspaceStatus: 'working', lastError: null });
    try {
      const record = await taskLogApi.createEntry(draft);
      set((state) => ({
        workspaceStatus: 'ready',
        snapshot: state.snapshot ? upsertRecord(state.snapshot, record) : state.snapshot,
        selectedComposerTaskId: null,
        lastError: null,
      }));
      return true;
    } catch (error) {
      return failWorkspaceOperation(set, error);
    }
  },
  updateEntry: async (taskId, draft) => {
    startTaskOperation(set, taskId);
    try {
      const record = await taskLogApi.updateEntry(taskId, draft);
      finishTaskRecord(set, taskId, record, {
        clearSelection: true,
      });
      return true;
    } catch (error) {
      return failTaskOperation(set, taskId, error);
    }
  },
  completeEntry: async (taskId) => {
    startTaskOperation(set, taskId);
    try {
      const record = await taskLogApi.completeEntry(taskId);
      finishTaskRecord(set, taskId, record);
      return true;
    } catch (error) {
      return failTaskOperation(set, taskId, error);
    }
  },
  reactivateEntry: async (taskId) => {
    startTaskOperation(set, taskId);
    try {
      const record = await taskLogApi.reactivateEntry(taskId);
      finishTaskRecord(set, taskId, record);
      return true;
    } catch (error) {
      return failTaskOperation(set, taskId, error);
    }
  },
  archiveCompletedEntries: async () => {
    set({ workspaceStatus: 'working', lastError: null });
    try {
      const batch = await taskLogApi.archiveCompletedEntries();
      set((state) => ({
        workspaceStatus: 'ready',
        snapshot: state.snapshot ? removeArchivedRecords(state.snapshot, batch) : state.snapshot,
        lastError: null,
      }));
      return true;
    } catch (error) {
      return failWorkspaceOperation(set, error);
    }
  },
  setControls: (controls) => {
    set((state) => ({
      controls: normalizeControls(state.controls, controls),
    }));
  },
  setQuery: (query) => {
    set((state) => ({
      controls: withQuery(state.controls, query),
    }));
  },
  setFilter: (filter) => {
    set((state) => ({
      controls: withFilter(state.controls, filter),
    }));
  },
  setSortMode: (sortMode) => {
    set((state) => ({
      controls: withSortMode(state.controls, sortMode),
    }));
  },
  setPage: (page) => {
    set((state) => ({
      controls: withPage(state.controls, page),
    }));
  },
  selectComposerTask: (taskId) => {
    set({ selectedComposerTaskId: taskId });
  },
});
