# API Alignment Checker Report

Status: reviewed
Owner Agent: api_alignment_checker
Last Verified: 2026-05-27

## Post-Fix Owner Note

Status: verified  
Last Verified: 2026-05-27

The red findings below were produced before the post-check fixes. They have been addressed in `docs/03_contracts/api_registry.md`, `docs/03_contracts/frontend_backend_alignment.md`, `frontend/src/api/taskLogApi.ts`, `frontend/src/domain/workspace.ts`, and `frontend/src/api/localFolderTaskApi.ts`. Current gate status is tracked in `docs/07_checks/api_alignment_report.md`.

## Scope

Checked API contract docs, frontend API port and local adapter, Zustand response consumption, and Scala service API messages:

- `docs/03_contracts/api_registry.md`
- `docs/03_contracts/frontend_backend_alignment.md`
- `frontend/src/api/taskLogApi.ts`
- `frontend/src/api/localFolderTaskApi.ts`
- `frontend/src/api/fileSystemAccess.ts`
- `frontend/src/stores/taskLogStore.ts`
- `backend/src/main/scala/services/workspaces/api/WorkspaceApi.scala`
- `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala`
- `backend/src/main/scala/services/archives/api/ArchiveApi.scala`

Question checked: are API names, input fields, router transforms, backend messages, responses, failures, and permissions in the same world?

## Findings

- [red] `OpenWorkspace` is not field-aligned with the documented frontend request.
  Evidence: registry says `Workspace.openLocalFolder` frontend request is `none` and transform is `browser permission -> workspace handle` while backend message is `OpenWorkspace`; backend `OpenWorkspace` requires `displayName` and `storageRef`. The frontend adapter opens a directory and returns a snapshot using `directory.name`, but no contract documents `directory.name -> displayName` or handle/ref -> `storageRef`.
  Files: `docs/03_contracts/api_registry.md:11`, `frontend/src/api/localFolderTaskApi.ts:34`, `frontend/src/api/localFolderTaskApi.ts:150`, `backend/src/main/scala/services/workspaces/api/WorkspaceApi.scala:12`.
  Impact: a future router would have to guess backend fields.

- [red] `ImportFolderEntries` still conflicts across registry, frontend port, and backend message.
  Evidence: registry exposes `TaskLog.importFolderEntries`; backend defines `ImportFolderEntries(workspaceId, workspaceName, records, warnings)` and `importFolderEntries`; frontend public `TaskLogApi` has no `importFolderEntries` method, and `frontend_backend_alignment.md` does not map it. The local adapter does import work inside private `loadFolder()`.
  Files: `docs/03_contracts/api_registry.md:12`, `docs/03_contracts/frontend_backend_alignment.md:13`, `frontend/src/api/taskLogApi.ts:4`, `frontend/src/api/localFolderTaskApi.ts:108`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:30`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:63`.
  Impact: API ownership is unclear: public TaskLog API, private local adapter behavior, or workspace import flow.

- [red] `ListTaskLogs` is a backend public query but is missing from the API registry and frontend-backend alignment table.
  Evidence: backend defines `ListTaskLogs` and `listTaskLogs`; `ArchiveApi` consumes it; docs/03 registry has no `TaskLog.listTaskLogs` row, and alignment table has no list mapping.
  Files: `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:58`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:73`, `backend/src/main/scala/services/archives/api/ArchiveApi.scala:36`, `docs/03_contracts/api_registry.md:9`, `docs/03_contracts/frontend_backend_alignment.md:13`.
  Impact: one backend API is outside the documented contract world.

- [red] Response shape for `TaskRecord` is not aligned.
  Evidence: frontend `TaskRecord` is `{ fileName, entry }`; backend `TaskRecord` is `{ fileName, storageLocation, entry }`; store upserts and archive removal consume only the frontend shape.
  Files: `frontend/src/domain/workspace.ts:12`, `frontend/src/stores/taskLogStore.ts:81`, `frontend/src/stores/taskLogStore.ts:95`, `backend/src/main/scala/services/workspaces/objects/WorkspaceObjects.scala:88`.
  Impact: a backend response mapper would either leak an undocumented `storageLocation` or silently drop it. Response mapper field loss is not acceptable.

- [yellow] `reloadWorkspace` exists in the frontend API port and store but is not registered in docs/03 and has no backend message.
  Evidence: frontend port exposes `reloadWorkspace`; store calls it; local adapter implements it by reloading the active directory. Registry/alignment docs omit it, and backend APIs have no equivalent.
  Files: `frontend/src/api/taskLogApi.ts:7`, `frontend/src/api/localFolderTaskApi.ts:39`, `frontend/src/stores/taskLogStore.ts:188`, `docs/03_contracts/api_registry.md:9`, `docs/03_contracts/frontend_backend_alignment.md:13`.
  Impact: probably local-adapter-only, but the contract does not say that.

- [yellow] Failure code semantics are only partially aligned.
  Evidence: frontend `TaskLogApiError` allows `unsupported`, `permission-denied`, `workspace-not-open`, `task-not-found`, `invalid-operation`, `file-io`; backend `ApiErrorCode` also includes `invalid-input` and `conflict`. Backend code can return `invalidInput` during workspace snapshot decode and `conflict` from task update transition validation.
  Files: `frontend/src/api/taskLogApi.ts:15`, `backend/src/main/scala/system/ApiError.scala:3`, `backend/src/main/scala/services/workspaces/api/WorkspaceApi.scala:43`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:181`.
  Impact: future HTTP consumers need an explicit error-code mapping or frontend error union expansion.

- [yellow] Router transforms are documented as future intent, but there is no router code in the checked tree.
  Evidence: docs say Scala backend messages are ready for HTTP routing when a server source of truth is added; file scan found API/domain files but no route/controller/http/fetch layer. Current frontend is a local folder adapter.
  Files: `docs/03_contracts/api_registry.md:7`, `docs/03_contracts/frontend_backend_alignment.md:9`, `frontend/src/api/localFolderTaskApi.ts:25`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:62`.
  Impact: field transforms and permission semantics cannot be mechanically verified yet.

- [green] Create/update/complete/reactivate names and core responses are directionally aligned.
  Evidence: frontend port methods map to backend messages with matching business names and return `TaskRecord`; store consumes returned records via `upsertRecord`.
  Files: `frontend/src/api/taskLogApi.ts:8`, `docs/03_contracts/frontend_backend_alignment.md:16`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:37`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:42`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:48`, `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala:53`, `frontend/src/stores/taskLogStore.ts:211`.
  Caveat: workspaceId injection for these backend messages is still not fully documented for a real router.

## Required Changes

1. Choose canonical ownership for folder import: either expose `importFolderEntries` in the frontend port/alignment docs, or declare it as backend-only/internal and document the local adapter import boundary.
2. Add `TaskLog.listTaskLogs` to `docs/03_contracts/api_registry.md` and `frontend_backend_alignment.md`, or make it explicitly internal to backend services.
3. Align `TaskRecord` response shape by either adding `storageLocation` to the frontend response contract or defining a documented response DTO that drops it intentionally.
4. Document `OpenWorkspace` field conversion from local folder/browser state to `displayName` and `storageRef`.

## Suggested Changes

1. Mark `reloadWorkspace` as local-adapter-only or give it a backend message and registry row.
2. Align frontend and backend error code enums before adding an HTTP router.
3. Add explicit router-transform rows for `workspaceId` injection on create/update/complete/reactivate.

## Uncertain

- It is uncertain whether `ImportFolderEntries` should remain a tasklogs public command or be folded into workspace import/snapshot flow.
- It is uncertain whether `ListTaskLogs` is intended as a public API or only a backend service-to-service query for archive.
- It is uncertain whether `storageLocation` is an internal backend field or part of the public `TaskRecord` contract.

## Handoff

API contract alignment should resolve the red ownership and response-shape conflicts before adding HTTP router work or expanding frontend/backend features.
