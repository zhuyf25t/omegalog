# Workspaces Tables

Status: implemented  
Owner Agent: database_boundary  
Last Verified: 2026-05-27

## Table Algebra

`WorkspaceTable` is a service-owned table algebra. It is not a real DB interpreter yet.

| Method | Purpose |
|---|---|
| `open` | Save/open workspace row. |
| `saveSnapshot` | Save imported workspace snapshot. |
| `find` | Find workspace row by typed id. |

## Related Code

- `backend/src/main/scala/services/workspaces/tables/WorkspaceTables.scala`

## Boundary

Only `workspaces` service code may depend on `WorkspaceTable`.
