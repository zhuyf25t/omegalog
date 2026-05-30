# Tasklogs Service Contract

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-27

## Responsibility

Owns task identity, task data, validation, status transitions, deadline adjustments, and sorting/focus rules.

## Public API

- `CreateTaskLog`
- `UpdateTaskLog`
- `CompleteTaskLog`
- `ReactivateTaskLog`
- `ListTaskLogs`

## Internal Data

- `TaskId`
- `TaskLogEntry`
- `TaskDraft`
- `TaskWeight`
- `TaskTag`
- `TaskStatus`

## Forbidden Dependencies

- Must not read browser file handles.
- Must not write archive files directly.
- Must not trust raw JSON as a task.

## Related Code

- `frontend/src/domain/taskLog.ts`
- `frontend/src/domain/taskSelectors.ts`
- `backend/src/main/scala/services/tasklogs/`
