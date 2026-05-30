# Database Boundary

Status: reviewed  
Owner Agent: database_boundary  
Last Verified: 2026-05-30

## Current Boundary

The current source of truth is the user-selected local folder. Each task is a JSON file in the workspace root. Completed tasks may be moved to `archive/`.

## Future Table Ownership

| Table | Owner service | Columns | Access |
|---|---|---|---|
| `workspaces` | `workspaces` | workspace id, owner id, display name, storage URI | private to `workspaces` |
| `task_logs` | `tasklogs` | task id, workspace id, title, note, weight, status, deadline, counts, timestamps | private to `tasklogs` |
| `task_tags` | `tasklogs` | task id, tag | private to `tasklogs` |
| `archive_batches` | `archives` | batch id, workspace id, archived count, created at | private to `archives` |
| `task_history_events` | `taskhistory` | event id, workspace id, local day, occurred at, event type, task ids, before/after snapshots | private to `taskhistory` |
| `daily_summaries` | `daily_summaries` | workspace id, summary date, source hash, provider metadata, report content, generated at | private to `daily_summaries` |
| none | `ai_boundary` | no owned table; reads provider secrets from environment | no persistence |

## Rules

- Services must not query each other's tables.
- Frontend must not know table names.
- Local file adapter and DB adapter must implement the same API-level behavior.
- Large attachments, if added, must go to object storage; DB stores metadata and object key only.
