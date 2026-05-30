# Frontend Application State

Status: draft  
Owner Agent: frontend_react_ts  
Last Verified: 2026-05-30

## Core State

Runtime state is owned by `frontend/src/stores/taskLogStore.ts`.

`taskLogStore.ts` is now a small Zustand composition file:

- initial workspace/task UI state,
- `createTaskLogActions(set)` wiring,
- typed selector hooks for state/actions.

Supporting store modules:

- `taskLogStoreTypes.ts`: typed state, actions, controls, workspace status, and visible error state.
- `taskLogActions.ts`: action API implementation against `taskLogApi`.
- `taskLogActionHandlers.ts`: async operation start/fail/finish helpers.
- `taskLogReducers.ts`: pure snapshot/pending/archive reducers.
- `taskLogControls.ts`: query/filter/sort/page normalization helpers.

Daily summary state is added as a separate slice/module set:

- `dailySummaryStoreTypes.ts`: summary state, run status, and typed actions.
- `dailySummaryActions.ts`: calls `dailySummaryApi`, never DeepSeek directly.
- `dailySummaryReducers.ts`: pure summary/run state updates.

Stored controls are `query`, `filter`, `sortMode`, and `page`. `pageSize` is not a store control.

Transient toast feedback is removed. The store does not create or retain success/update toasts such as "task updated"; user-visible failures remain in `lastError` and are rendered by `OmegaLogApp` in the `.app-error` region.

## Page-Local State

`frontend/src/pages/OmegaLogApp.tsx` owns only page shell state:

- composer open/closed state,
- composer target task selection routing,
- URL control synchronization through `taskLogUrlControls.ts`.

`frontend/src/pages/OmegaLogWorkspace.tsx` owns page-local view constants. `tasksPerPage` is a local constant there, not global store state.

Daily summary sheet open/closed state is page-local unless it later becomes URL-shareable.

## URL-Owned Controls

Search query, status filter, sort mode, and page are mirrored into the URL by `useTaskLogUrlControls`.

Zustand stores the hydrated runtime copy; the URL remains the shareable page identity for those controls.

Selected summary date can be added to URL only if users need shareable report links. The first slice can derive it from latest summary/current day.

## Derived State

Computed by selectors/functions, not stored:

- total/active/done counts,
- focus task,
- visible records,
- page records,
- total pages,
- countdown text,
- tension level.
- missing summary dates,
- latest summary excerpt,
- summary status labels.

## IO Effects

Only store actions call the local file adapter. Components call typed store actions, not file handles.

The local file adapter is split by boundary:

- `localFolderTaskApi.ts`: `TaskLogApi` implementation and operation orchestration.
- `localTaskFileStorage.ts`: file name, JSON read/write, stored record conversion.
- `localTaskFolderImport.ts`: folder scan/import warnings.
- `localTaskRecords.ts`: snapshot construction and record lookup.
- `localTaskIds.ts`: local task id generation.
- `taskHistoryApi.ts`: typed task history port and local adapter.
- `localTaskHistoryStorage.ts`: `.omegalog-system/history` file IO.
- `localDailySummaryStorage.ts`: `.omegalog-system/summaries` file IO.
- `localDailySummaryApi.ts`: history read, summary generation, and catch-up orchestration.
- `summaryGenerationClient.ts`: calls only the app-owned provider/proxy; it must not contain a DeepSeek key.

## Busy / Disabled Contract

`workspaceStatus === 'opening' || workspaceStatus === 'working'` is treated as busy.

Busy state is propagated to write-operation controls in:

- `OmegaLogHeader.tsx`,
- `TaskFocusPanel.tsx`,
- `TaskList.tsx`,
- `TaskArchivePanel.tsx`,
- `TaskComposer.tsx`.
- `DailySummaryPanel.tsx`.

## Related Code

- `frontend/src/pages/OmegaLogApp.tsx`
- `frontend/src/pages/OmegaLogHeader.tsx`
- `frontend/src/pages/OmegaLogWorkspace.tsx`
- `frontend/src/pages/taskLogUrlControls.ts`
- `frontend/src/components/TaskComposer.tsx`
- `frontend/src/components/TaskFocusPanel.tsx`
- `frontend/src/components/TaskArchivePanel.tsx`
- `frontend/src/components/TaskList.tsx`
- `frontend/src/stores/taskLogStore.ts`
- `frontend/src/stores/taskLogActions.ts`
- `frontend/src/stores/taskLogActionHandlers.ts`
- `frontend/src/stores/taskLogControls.ts`
- `frontend/src/stores/taskLogReducers.ts`
- `frontend/src/stores/taskLogStoreTypes.ts`
- `frontend/src/stores/dailySummaryStore.ts`
- `frontend/src/stores/dailySummaryActions.ts`
- `frontend/src/stores/dailySummaryReducers.ts`
- `frontend/src/stores/dailySummaryStoreTypes.ts`
