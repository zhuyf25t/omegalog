# Object Catalog

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

| Object | Identity type | Fields | Lifecycle | Owner service | Notes |
|---|---|---|---|---|---|
| `WorkspaceId` | opaque string | display name, storage reference | open/import/close | `workspaces` | Backend API uses this; browser handle stays inside frontend local adapter. |
| `WorkspaceName` | value object | display name | open/import | `workspaces` | Empty name normalizes to `workspace`. |
| `WorkspaceStorageRef` | value object | storage URI/ref | open/import | `workspaces` | Future DB/server storage boundary. |
| `WorkspaceSnapshot` | `WorkspaceId` | name, task records, import warnings | loaded/reloaded/imported | `workspaces` | Frontend core state and backend API response. |
| `TaskId` | opaque string | generated id/file-name component | created/updated/completed/reactivated/archived | `tasklogs` | Must not be mixed with title or file name. |
| `TaskLogEntry` | `TaskId` | active/done ADT with title, note, tags, weight, deadline, stats, timestamps | active/done | `tasklogs` | Backend uses `Active`/`Done` variants to prevent illegal `status + completedAt`. |
| `TaskDraft` | none | title, note, tags, weight, deadline | create/update request | `tasklogs` | Validated request object, not persisted directly. |
| `TaskDeadline` | value object | ISO datetime | parsed/updated/repaired | `tasklogs` | Separate from raw string. |
| `DeadlineAdjustmentStats` | value object | deadline adjust count, overdue adjust count | updated when deadline changes | `tasklogs` | Counts clamp to service rules. |
| `TaskTag` | normalized text | label | parsed/deduped | `tasklogs` | Max six tags, max 18 chars each in frontend; backend validates max six. |
| `TaskWeight` | integer value object | 1..10 | parsed/clamped or rejected | `tasklogs` | Drives focus selection. |
| `TaskStatus` | enum | `active`, `done` | lifecycle state | `tasklogs` | No `archived` status; archive is storage movement/batch result. |
| `TaskListQuery` | request object | workspace id, optional status | query | `tasklogs` | Backend query boundary for archives and future routes. |
| `TaskFileRef` | file name/ref | file name | imported/written/moved | `workspaces` | File handle never reaches UI components or backend service objects. |
| `TaskStorageLocation` | storage ref | root/archive/future URI | imported/archived | `workspaces` | Captures location without changing `TaskStatus`. |
| `TaskRecord` | `TaskFileRef` + `TaskId` | storage ref plus `TaskLogEntry` | imported/written/listed | `workspaces` + `tasklogs` output | Shared output object; task meaning owned by `tasklogs`, storage ref owned by `workspaces`. |
| `ImportWarning` | `TaskFileRef` | reason | import result | `workspaces` | Invalid files are skipped, not coerced silently. |
| `ArchiveBatch` | command result | archived ids/count | archive command output | `archives` | Represents one archive operation. |
| `TaskChangeEventId` | branded string | event id/file-name component | generated/appended/read | `taskhistory` | Identifies one immutable task history event. |
| `TaskChangeEvent` | `TaskChangeEventId` | event type, source API, occurredAt, localDay, task ids, before/after snapshots, changed fields | validated -> appended -> consumed | `taskhistory` | Append-only evidence for daily summaries. |
| `TaskChangeType` | enum | created, updated, completed, reactivated, archived | event classification | `taskhistory` | Must not be arbitrary text. |
| `SummaryDate` | local date string | `YYYY-MM-DD` plus timezone interpretation | open/closed day boundary | `daily_summaries` | Summaries are generated only for closed days unless manually forced. |
| `DailySummary` | `SummaryId` | day, source event ids/hash, stats, critical report, provider metadata, generatedAt | missing -> generated -> stale/regenerated | `daily_summaries` | Derived artifact; never embedded in `TaskLogEntry`. |
| `SummaryRun` | run id | target day, trigger, status, started/finished times, failure | future/uncertain audit ledger | `daily_summaries` | Not persisted in the current slice; current code only has in-memory `SummaryRunStatus`. |
| `SummaryProviderMetadata` | value object | local-critical or backend-ai proxy metadata, model, prompt version | selected per generation | `daily_summaries` | Persisted metadata only; no secret fields. |
| `AiProvider` | value object | provider kind, endpoint family | configured by boundary | `ai_boundary` | External provider metadata, separate from persisted summary metadata. |
| `SecretRef` | value object | environment variable name | configured outside repo | `ai_boundary` | References `DEEPSEEK_API_KEY` without storing the key. |

## Forbidden Raw Types

| Raw value | Should be | Reason |
|---|---|---|
| `string taskId` | `TaskId` | Task identity must not be confused with file name or title. |
| `number weight` | `TaskWeight` | Weight is constrained to integer 1..10. |
| `string status` | `TaskStatus` plus `TaskLogEntry.Active/Done` | Unknown status and illegal completedAt combinations must fail decoding. |
| `unknown parsedJson` | decoder result | UI must not render unchecked JSON. |
| `FileSystemFileHandle` in component props | `TaskLogApi` method | Browser IO is a boundary effect. |
| `string eventType` | `TaskChangeType` | Daily summaries need typed, countable events. |
| `string summaryDate` | `SummaryDate` | Midnight/catch-up logic needs a typed closed-day boundary. |
| DeepSeek API key in frontend or docs | server-side `SecretRef` / `DEEPSEEK_API_KEY` env | Browser bundles and docs are not secret stores. |

## Objects Needing Review

| Object | Concern | Proposed action |
|---|---|---|
| `UserId` | Not needed for local-only app, required for future sync/auth. | Add only when backend router/auth is implemented. |
| `ArchivePolicy` | Current archive command moves all completed records. | Introduce only when user needs date/tag/status-specific archive rules. |
| `SummaryRunId` | Current frontend slice uses in-memory run status only. | Add persisted run ledger before audit-grade generation history. |
| `SummaryRevisionPolicy` | Late imported events can make an existing daily report stale. | Current slice uses one current summary per day and source hash stale detection; add revisions if audit-grade history is needed. |
