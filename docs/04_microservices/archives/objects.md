# Archives Objects

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-27

## Owned Objects

- `ArchiveBatch`

## Related Code

- `backend/src/main/scala/services/archives/objects/ArchiveObjects.scala`
- `frontend/src/domain/workspace.ts`

## Boundary

Archive output stores archived task ids/counts. It does not create a `TaskStatus.archived`.
