# Frontend Pages

Status: draft  
Owner Agent: frontend_react_ts  
Last Verified: 2026-05-30

## `OmegaLogApp`

Related Code:

- `frontend/src/pages/OmegaLogApp.tsx`
- `frontend/src/pages/OmegaLogHeader.tsx`
- `frontend/src/pages/OmegaLogWorkspace.tsx`
- `frontend/src/pages/taskLogUrlControls.ts`

`OmegaLogApp` is the first screen and primary application shell. It now composes page-level modules instead of holding the full layout inline:

- `OmegaLogHeader`: workspace status chip and open/reload/create commands.
- `OmegaLogWorkspace`: focus panel, archive panel, toolbar, paginated task list, and task composer.
- `useDailySummaryScheduler`: workspace-open catch-up and while-open midnight trigger for daily summaries.
- `useTaskLogUrlControls`: URL hydration and URL update for query/filter/sort/page controls.

`OmegaLogApp` renders `lastError` as the visible `.app-error` region. Transient toast feedback has been removed from the page shell.

## Workspace Layout

`OmegaLogWorkspace` derives view data from the current snapshot and controls:

- task stats,
- focus task,
- visible records,
- current page records,
- selected composer record.

`tasksPerPage` is a page-local constant in `OmegaLogWorkspace`. The store keeps `page`, but does not own `pageSize`.

## Archive / List Layout

The right-side archive desk is content-height driven. `frontend/src/styles/archive-panel.css` keeps `.archive-desk` on auto rows with `height: auto` and `overflow: visible`.

The task list no longer uses an internal scrolling container. `frontend/src/styles/task-list.css` keeps `.task-list` at `height: auto`, `max-height: none`, and `overflow: visible`.

## Daily Summary Layout

`DailySummaryPanel` sits inside the right-side archive desk between the archive header and toolbar. It is compact by default: date, status chip, one-line critical excerpt, and icon buttons for generate/open.

`DailySummarySheet` shows the full report as a focused overlay/sheet so the task list does not need an internal scroll area. Styling follows the existing gold/dark library identity and lives in `frontend/src/styles/daily-summary.css`.

## State Contract

- Core state comes from `frontend/src/stores/taskLogStore.ts` and the split store modules.
- Derived state comes from `frontend/src/domain/taskSelectors.ts`.
- URL state sync goes through `frontend/src/pages/taskLogUrlControls.ts`.
- File IO goes through `frontend/src/api/taskLogApi.ts` and `frontend/src/api/localFolderTaskApi.ts`.
- Local folder implementation details are split into `localTaskFileStorage.ts`, `localTaskFolderImport.ts`, `localTaskRecords.ts`, and `localTaskIds.ts`.
- Daily summary file IO goes through `dailySummaryApi.ts`, `localDailySummaryApi.ts`, `localDailySummaryStorage.ts`, and `summaryGenerationClient.ts`.
- Task history event IO goes through `taskHistoryApi.ts` and `localTaskHistoryStorage.ts`.

## Interaction Contract

Busy state disables write-operation buttons across header, focus panel, task list, archive panel, and composer.

## Verification

- `implemented`: CSS split, page split, store split, local file API split, archive layout fix, and busy disabled propagation are reflected in code.
- `verified`: latest handoff reports `npm run typecheck` passed and `npm run build` passed.
- `verified`: Edge screenshot `F:\tmp\omegalog-final-structure.png` exists and records the right-side layout without the large blank area.
