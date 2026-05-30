# Boundary Checker Report

Status: implemented
Owner Agent: boundary_checker
Last Verified: 2026-05-27

## Post-Fix Owner Note

Status: verified  
Last Verified: 2026-05-27

The random-id boundary yellow item below was fixed after this report by moving task id generation from frontend domain code to `frontend/src/api/localFolderTaskApi.ts`. Cross-service DTO ownership is documented in `docs/02_topos/object_catalog.md` and `docs/04_microservices/*/objects.md`.

## Scope

Read-only boundary pass over:

- `AGENTS.md`
- `agent_constitutions/boundary_checker/AGENTS.md`
- `docs/02_topos/forbidden_relations.md`
- `docs/04_microservices/*/service_contract.md`
- `frontend/src/**`
- `backend/src/main/scala/services/**`
- `backend/src/main/scala/system/**`

Core question: 这段代码有没有伸手进别人的小世界？

## Findings

- [green] UI does not directly hold browser file handles.
  - Evidence: no `FileSystem*`, `showDirectoryPicker`, `createWritable`, `getFileHandle`, `removeEntry`, `JSON.parse`, or `JSON.stringify` matches under `frontend/src/pages`, `frontend/src/components`, or `frontend/src/stores`.
  - File-system handles are contained in the API adapter: `frontend/src/api/fileSystemAccess.ts:20-68` and `frontend/src/api/localFolderTaskApi.ts:21-27`, `50-51`, `94-99`, `118-132`, `184-190`.
  - `frontend/src/api/localFolderTaskApi.ts:150-156` strips `handle` before returning `WorkspaceSnapshot` records to UI state.

- [green] Frontend pages/components do not bypass the API client.
  - Evidence: pages/components only receive store actions; direct API import matches are absent there.
  - `frontend/src/stores/taskLogStore.ts:2-3` imports `taskLogApi` and `toUserMessage`.
  - `frontend/src/stores/taskLogStore.ts:171`, `191`, `211`, `241`, `272`, `301`, `326` routes commands through `taskLogApi`.

- [green] Raw JSON is decoded before UI state.
  - Evidence: `frontend/src/api/localFolderTaskApi.ts:123-126` parses unknown JSON and calls `decodeTaskLogEntry`.
  - `frontend/src/domain/taskLogCodec.ts:38-88` validates and normalizes the parsed shape before a `TaskLogEntry` is produced.

- [green] `archives` does not access `tasklogs.tables`.
  - Evidence: exact scan for `tasklogs.tables` / `TaskLogTable` under `backend/src/main/scala/services/archives` returned no matches.
  - `backend/src/main/scala/services/archives/api/ArchiveApi.scala:6` imports `TaskLogApi`, `ListTaskLogs`, and `TaskListQuery`, then calls `taskLogs.listTaskLogs(...)` at `ArchiveApi.scala:36`.

- [green] Backend `objects` files do not contain IO, table access, service calls, UUID, or random generation.
  - Evidence: scan for `cats.effect`, `IO`, `java.io`, `java.nio`, `scala.io`, `UUID`, `Random`, `randomUUID`, `Math.random`, API imports, and table imports in `backend/src/main/scala/services/*/objects/*.scala` returned no matches.
  - Existing object imports are pure type dependencies, for example `ArchiveObjects.scala:3` uses `TaskId` and `WorkspaceObjects.scala:3` uses `TaskLogEntry`.

- [green] Backend tables are package-private and service-owned.
  - Evidence: `backend/src/main/scala/services/tasklogs/tables/TaskLogTables.scala:8`, `25`, `79` use `private[tasklogs]`.
  - Evidence: `backend/src/main/scala/services/archives/tables/ArchiveTables.scala:11`, `18`, `35` use `private[archives]`.
  - Evidence: `backend/src/main/scala/services/workspaces/tables/WorkspaceTables.scala:7`, `13`, `36` use `private[workspaces]`.
  - Same-service API imports are present (`TaskLogApi.scala:5`, `ArchiveApi.scala:5`, `WorkspaceApi.scala:5`); cross-service table imports were not found.

- [yellow] Cross-service object dependencies are present and should be made explicit as public DTO/shared identity dependencies or reduced.
  - Evidence: `backend/src/main/scala/services/workspaces/objects/WorkspaceObjects.scala:3` imports `tasklogs.objects.TaskLogEntry`.
  - Evidence: `backend/src/main/scala/services/tasklogs/tables/TaskLogTables.scala:5` imports `workspaces.objects.*`.
  - Evidence: `backend/src/main/scala/services/archives/objects/ArchiveObjects.scala:3`, `archives/tables/ArchiveTables.scala:5-6`, and `archives/api/ArchiveApi.scala:7-8` import task/workspace object types.
  - Impact: this is not a table/helper breach, but the current service contracts list these as service internal data, so the public/shared type boundary is not fully declared.

- [yellow] `system.ApiError` contains service-specific domain error codes.
  - Evidence: `backend/src/main/scala/system/ApiError.scala:6-9` includes `WorkspaceNotOpen`, `TaskNotFound`, and `FileIo`.
  - Evidence: `ApiError.scala:46-56` exposes corresponding constructors.
  - Impact: `system` still has no task lifecycle rules or table logic, but specific domain errors make the infrastructure layer carry service vocabulary.

- [yellow] Frontend domain contains random ID generation instead of receiving the generated id from the edge.
  - Evidence: `frontend/src/domain/taskLog.ts:167-176` calls `crypto.randomUUID()` / `Math.random()`.
  - Evidence: `frontend/src/domain/taskTransitions.ts:12-14` calls `generateTaskId()` inside domain transition creation.
  - Impact: this is not an inter-service boundary violation, but it weakens the functional-core / IO-edge split.

## Required Changes

No red boundary violations found in this pass.

## Suggested Changes

- Declare which cross-service object types are public contract DTOs or shared identity types. Keep service-internal objects out of other services.
- Move service-specific `ApiErrorCode` cases out of `system` or split generic transport errors from service/domain errors.
- Push frontend task id generation to the API adapter edge by passing a generated `TaskId` into pure task creation.

## Uncertain

- This pass is static. It did not compile Scala/TypeScript and did not run runtime tests.
- Cross-service object imports may be acceptable if the intended architecture treats them as public contract types, but the current service contracts do not mark that boundary explicitly.

## Handoff

- `topos_domain_architect`: decide whether `TaskId`, `WorkspaceId`, `TaskLogEntry`, and `TaskRecord` are shared/public contract types or service-internal types.
- `api_contract_alignment`: if shared DTOs are intended, register them in API contracts instead of relying on implicit object imports.
