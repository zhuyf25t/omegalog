# Frontend Backend Alignment

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

## Alignment Strategy

The frontend depends on a typed `TaskLogApi` port. The current implementation is `LocalFolderTaskApi`, which preserves old local-file behavior. The Scala backend defines equivalent service messages so a future HTTP router can replace the local adapter without changing page components.

## Request/Response Mapping

| Frontend Method | Domain Request | Backend Message | Response |
|---|---|---|---|
| `openLocalFolder()` | none | `OpenWorkspace` | `WorkspaceSnapshot` |
| `reloadWorkspace()` | current local workspace | `ListTaskLogs` plus workspace lookup in future router | `WorkspaceSnapshot` |
| `createEntry(draft)` | `TaskDraft` | `CreateTaskLog` | `TaskRecord` |
| `updateEntry(taskId, draft)` | `TaskId`, `TaskDraft` | `UpdateTaskLog` | `TaskRecord` |
| `completeEntry(taskId)` | `TaskId` | `CompleteTaskLog` | `TaskRecord` |
| `reactivateEntry(taskId)` | `TaskId` | `ReactivateTaskLog` | `TaskRecord` |
| `archiveCompletedEntries()` | current workspace | `ArchiveCompletedEntries` | `ArchiveBatch` |
| `recordTaskChange(command)` | adapter-created typed event | `RecordTaskChange` | `TaskChangeEvent` |
| `listTaskChanges(range)` | local date range | `ListTaskChanges` | `TaskChangeEvent[]` |
| `loadDailySummaryState()` | current local workspace | `ListTaskChanges` + `ListDailySummaries` | `{ events, summaries }` |
| `generateDailySummary(day)` | typed summary date | `GenerateDailySummary` | `DailySummary` |
| `reconcileDailySummaries(throughDay)` | optional closed-day boundary | `ReconcileDailySummaries` | per-day generated/skipped/failed result |
| `createDailySummaryDraft(input)` | structured summary input, no key | `CreateDailySummaryDraft(input)` | validated draft/content |

## Boundaries

- React components never receive file handles.
- Zustand store stores core workspace snapshot and UI controls only.
- Derived data is computed by selectors.
- Backend objects do not know about browser APIs.
- `archives` reaches completed tasks through `TaskLogApi.listTaskLogs`, not `tasklogs.tables`.
- `daily_summaries` consumes `taskhistory` API output, not private task tables.
- AI provider keys are injected only by the backend/local sidecar from `DEEPSEEK_API_KEY`.
