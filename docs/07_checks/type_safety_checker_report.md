# Type Safety Checker Report

Status: verified  
Owner Agent: type_safety_checker  
Checked At: 2026-05-27

## Scope

Read-only type-safety check of:

- `AGENTS.md`
- `docs/07_checks/type_safety_registry.md`
- `docs/03_contracts/api_registry.md`
- `docs/03_contracts/frontend_backend_alignment.md`
- `frontend/src/domain/*`
- `frontend/src/api/*`
- `frontend/src/stores/*`
- `backend/src/main/scala/services/*/objects/*.scala`
- `backend/src/main/scala/services/*/api/*.scala`
- narrow grep for frontend API bypass outside `frontend/src/api`

Core question: which business facts are still naked primitives, and which failure/missing/state cases are not in types?

## Findings

- [green] Frontend task lifecycle encodes the `TaskStatus` + `completedAt` invariant.
  Evidence: `frontend/src/domain/taskLog.ts` defines `ActiveTaskLogEntry` with `status: 'active'` and `completedAt: null`, `DoneTaskLogEntry` with `status: 'done'` and `completedAt: IsoDateTime`, and exports `TaskLogEntry` as their union.

- [green] Backend task lifecycle encodes the same invariant.
  Evidence: `backend/src/main/scala/services/tasklogs/objects/TaskLogObjects.scala` defines sealed task entry variants and rejects illegal stored pairs during decoding.

- [green] Main business IDs are typed, not naked IDs, across the requested domain/API surfaces.
  Evidence: frontend `TaskId` and `WorkspaceId` are branded. Backend `TaskId` and `WorkspaceId` are opaque. Backend API commands use typed IDs.

- [yellow] Frontend `WorkspaceId` construction is still weaker than the backend rule.
  Evidence: `frontend/src/domain/workspace.ts` trims and clamps a `local:` id string, while backend `WorkspaceId.fromString` validates the accepted shape. This is acceptable for the local-folder slice but should be aligned before an HTTP router or shared persistence layer.

- [yellow] Frontend workspace runtime state is still a product type rather than a full state machine.
  Evidence: `frontend/src/stores/taskLogStoreTypes.ts` keeps `workspaceStatus`, `snapshot`, `pendingTaskIds`, and `lastError` as independent fields. Current actions maintain the intended combinations, but a discriminated union would make illegal UI states harder to represent.

- [yellow] Frontend failure code set is narrower than the backend failure code set.
  Evidence: local `TaskLogApiError` covers the current browser-folder adapter. Backend `ApiErrorCode` includes additional server-oriented cases. Align these before adding the HTTP router.

- [green] `ArchiveBatch` no longer stores a duplicated derived count.
  Evidence: `frontend/src/domain/workspace.ts` keeps only `archivedIds`; `getArchivedCount(batch)` derives the count from `archivedIds.length`.

- [green] `unknown` is contained at boundaries; no `any` escape was found in requested frontend domain/API/store files.
  Evidence: JSON input is parsed as `unknown` and decoded by domain codecs. Type assertions remain only for branded constructors and browser API wrappers at the IO edge.

- [green] Backend `objects` are pure data/constructors/codecs; no IO or random/file/network side effects were found in requested `objects` files.
  Evidence: IO appears in API/table layers, which is the expected edge.

- [green] Frontend does not appear to bypass the typed API port for task persistence.
  Evidence: file system and JSON effects are inside `frontend/src/api/*`; store actions call `taskLogApi` from `frontend/src/stores/taskLogActions.ts`. A narrow grep in `frontend/src/components`, `frontend/src/pages`, and `frontend/src/main.tsx` found no persistence/API bypass.

- [green] The previous DOM `SortMode` cast was removed.
  Evidence: `frontend/src/components/TaskToolbar.tsx` now parses the DOM value with `readSortMode` before calling `onSortModeChange`.

## Required Changes

No red findings remain for the current local-folder frontend slice.

## Suggested Changes

- Align frontend/backend API error code ADTs before introducing the HTTP router.
- Strengthen `WorkspaceId` construction on the frontend to match backend validation.
- Convert workspace runtime state to a discriminated union when the next state-heavy feature is added.

## Verification

- `docs/07_checks/type_safety_registry.md` marks the post-fix task lifecycle and archive count items as `verified`.
- `npm run typecheck` passed on 2026-05-27.
- `npm run build` passed on 2026-05-27.

## Handoff

- `api_contract_alignment`: align frontend `TaskLogApiError` with backend `ApiErrorCode` before HTTP router work.
- `frontend_react_ts`: consider encoding workspace runtime state as a discriminated union in a later cleanup.
- `test_checker`: add fixture/property tests for task status/completedAt decoding and transitions.
