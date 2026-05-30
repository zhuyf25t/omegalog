# Tasklogs Tables

Status: implemented  
Owner Agent: database_boundary  
Last Verified: 2026-05-27

## Table Algebra

`TaskLogTable` is a service-owned table algebra. It is not a real DB interpreter yet.

| Method | Purpose |
|---|---|
| `replaceImported` | Replace imported records for a workspace. |
| `insert` | Insert a new task entry. |
| `update` | Update an existing task entry. |
| `find` | Find one record by workspace and task id. |
| `listByWorkspace` | List records in a workspace. |

## Related Code

- `backend/src/main/scala/services/tasklogs/tables/TaskLogTables.scala`

## Boundary

Only `tasklogs` service code may depend on `TaskLogTable`.
