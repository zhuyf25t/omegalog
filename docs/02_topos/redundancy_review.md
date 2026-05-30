# Redundancy Review

Status: implemented  
Owner Agent: object_relation_optimizer  
Last Verified: 2026-05-27

## Old Redundancy

- `LogEntry` carried business data, persistence schema, UI display assumptions, and decoder output as one type.
- `LogRecord` mixed file handle identity with domain entry.
- Global variables duplicated derivable values such as visible records, counts, focus task, and pagination boundaries.

## New Split

- `TaskLogEntry`: business task ADT.
- `TaskDraft`: validated create/update request.
- `TaskRecord`: storage reference plus entry output.
- `WorkspaceSnapshot`: current imported folder and warnings.
- `TaskListQuery`: backend query boundary.
- Selectors derive focus, counts, filtered records, page records, countdown, and tension level.

## Kept Deliberately

`TaskStatus.done` and archived storage are separate. A done task is still visible in the workspace root; an archived task has been moved out of the active folder view.
