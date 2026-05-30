# Archives Service Contract

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-27

## Responsibility

Owns archive commands and archive batch results. The current local adapter moves completed JSON files into `archive/`.

## Public API

- `ArchiveCompletedEntries`

## Internal Data

- `ArchiveBatch`
- archived task ids

## Forbidden Dependencies

- Must not archive active tasks.
- Must not bypass task API semantics when a DB backend is introduced.

## Related Code

- `frontend/src/api/localFolderTaskApi.ts`
- `backend/src/main/scala/services/archives/`
