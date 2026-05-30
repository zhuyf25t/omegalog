# Archives Tables

Status: implemented  
Owner Agent: database_boundary  
Last Verified: 2026-05-27

## Table Algebra

`ArchiveTable` is a service-owned table algebra. It is not a real DB interpreter yet.

| Method | Purpose |
|---|---|
| `persistBatch` | Persist one archive batch for a workspace. |

## Related Code

- `backend/src/main/scala/services/archives/tables/ArchiveTables.scala`

## Boundary

Only `archives` service code may depend on `ArchiveTable`.
