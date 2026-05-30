# Workspaces Objects

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-27

## Owned Objects

- `WorkspaceId`
- `WorkspaceName`
- `WorkspaceStorageRef`
- `TaskFileRef`
- `TaskStorageLocation`
- `ImportWarning`
- `TaskRecord`
- `WorkspaceSnapshot`

## Related Code

- `backend/src/main/scala/services/workspaces/objects/WorkspaceObjects.scala`
- `frontend/src/domain/workspace.ts`

## Boundary

`TaskRecord` carries a `TaskLogEntry`, but workspaces owns only the storage reference side. Task lifecycle rules stay in `tasklogs`.
