# Workspaces Service Contract

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-27

## Responsibility

Owns workspace identity, import warnings, and storage references. In the current browser slice it wraps the File System Access API. In a future server slice it owns workspace rows and storage locations.

## Public API

- `OpenWorkspace`
- `ImportWorkspaceSnapshot`

## Internal Data

- `WorkspaceId`
- `WorkspaceSnapshot`
- `TaskFileRef`
- `ImportWarning`

## Forbidden Dependencies

- Must not decide task lifecycle semantics.
- Must not mutate `tasklogs` private tables.

## Related Code

- `frontend/src/domain/workspace.ts`
- `frontend/src/api/fileSystemAccess.ts`
- `backend/src/main/scala/services/workspaces/`
