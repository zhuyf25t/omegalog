# Documentation Critic Agent Report

Status: reviewed
Owner Agent: docs_critic
Last Verified: 2026-05-27
Related Code: path-existence check only; code content was not reviewed
Related API / DB / Frontend State: `docs/03_contracts/api_registry.md`, `docs/04_microservices/*/service_contract.md`, `docs/05_frontend/application_state.md`
Open Questions: see `## Uncertain`

## Post-Fix Owner Note

Status: verified  
Last Verified: 2026-05-27

The red findings below were produced before the implementation and docs repair pass completed. Missing service docs, object catalog entries, API naming conflicts, trace matrix confidence, and UI reference placeholders have been fixed. Current gate status is tracked in `docs/00_index.md` and `docs/07_checks/doc_code_trace_matrix.md`.

## Scope

Reviewed current OMEGALOG docs requested by the user: root and docs AGENTS files, product docs, topos docs, API/DB/serialization contracts, microservice contracts, frontend state doc, local file flow doc, and check docs. No code was changed. Code was only checked for referenced path existence to assess trace gaps.

## Findings

- [red] False trace confidence: docs claim implemented code paths that are missing.
  Evidence: `docs/07_checks/doc_code_trace_matrix.md` traces `frontend/src/pages/OmegaLogApp.tsx`, `frontend/src/stores/taskLogStore.ts`, and backend service API/object files as `implemented`; path check found those files missing. `docs/00_index.md` also marks backend/frontend/API alignment as `implemented`.
  Impact: docs are not document-compiled with the current tree; downstream agents may trust nonexistent implementation.
  Required change: either create the referenced code in a separate implementation pass, or downgrade affected doc/check statuses to `uncertain` and trace only existing files until generation is complete.

- [red] Microservice documentation contract is not satisfied.
  Evidence: `docs/04_microservices/AGENTS.md` requires each service to have `service_contract.md`, `objects.md`, `api.md`, `tables.md`, and `forbidden_dependencies.md`; `workspaces`, `tasklogs`, and `archives` currently only have `service_contract.md`.
  Impact: service ownership, public API messages, internal tables, and forbidden dependencies are compressed into one summary and cannot be checked independently.
  Required change: add the missing per-service docs or explicitly change the local docs rule to say a single `service_contract.md` is the accepted shape for this migration slice.

- [red] `TaskRecord` is used as a core object/relation node but is missing from `object_catalog.md`.
  Evidence: `docs/02_topos/relation_catalog.md` uses `TaskRecord` in `contains`, `persists`, `describes`, and `archives`; `docs/02_topos/redundancy_review.md` defines `TaskRecord` as storage reference plus entry; `docs/03_contracts/api_registry.md` returns `TaskRecord`; but `docs/02_topos/object_catalog.md` does not list it.
  Impact: a relationship object with storage identity and lifecycle exists in contracts but not in the object model. This is a type-safety gap.
  Required change: promote `TaskRecord` into `object_catalog.md`, assign owner service and identity, and decide whether it is owned by `workspaces`, `tasklogs`, or is a boundary DTO.

- [red] API names and ownership conflict across registry and service contracts.
  Evidence: `docs/03_contracts/api_registry.md` registers `TaskLog.importFolderEntries` / `ImportFolderEntries`; `docs/04_microservices/workspaces/service_contract.md` lists `ImportWorkspaceSnapshot`; `docs/04_microservices/tasklogs/service_contract.md` lists `ListTaskLogs`, which is not in the registry; `docs/03_contracts/frontend_backend_alignment.md` does not include import/list mapping.
  Impact: frontend, router, and backend are not one API world. It is unclear which service owns folder import and list semantics.
  Required change: choose canonical API names and owners, then update `api_registry.md`, `frontend_backend_alignment.md`, and service contracts together.

- [red] Microservice boundary leak around workspace handles and archive storage.
  Evidence: `docs/03_contracts/api_registry.md` says `TaskLog.importFolderEntries` receives a `workspace handle`; `docs/04_microservices/tasklogs/service_contract.md` says tasklogs must not read browser file handles. The same registry says `Archive.archiveCompletedEntries` transforms `workspace handle -> archive directory`, while `docs/02_topos/object_catalog.md` says `TaskFileRef` and storage references belong to `workspaces`.
  Impact: file-system handles are bleeding into tasklogs/archives contracts. This violates the declared boundary that workspaces owns storage references and file IO.
  Required change: reshape docs so workspaces/local adapter owns raw file handles, tasklogs owns decoded task meaning, and archives operates through typed task/workspace APIs or a workspaces storage API.

- [yellow] Status vocabulary is mostly compliant, but gate colors are mixed into status language.
  Evidence: `docs/AGENTS.md` allows only `draft`, `reviewed`, `implemented`, `verified`, `uncertain`, `unsafe`. `docs/07_checks/compile_test_log.md` has `Overall status` with `Green`, `Yellow`, `Red`; `docs/07_checks/api_alignment_report.md` says `Yellow until verification completes` while `Status: implemented`.
  Impact: color labels are useful for findings, but using them as status can hide whether the artifact is `implemented`, `verified`, or `uncertain`.
  Suggested change: keep red/yellow/green as gate color labels, not status values; add an allowed `Status:` value next to any gate color.

- [yellow] Required doc metadata is missing across many non-AGENTS docs.
  Evidence: `docs/AGENTS.md` requires every document to include `Status`, `Owner Agent`, `Last Verified`, `Related Code`, `Related API / DB / Frontend State`, and `Open Questions`. Many docs only include the first three. Examples: `docs/02_topos/object_catalog.md`, `docs/03_contracts/api_registry.md`, `docs/06_flow_infra/local_file_flow.md`, and `docs/07_checks/doc_code_trace_matrix.md` lack explicit `Related Code` and/or `Open Questions` sections.
  Impact: docs cannot be mechanically checked for ownership, code trace, and uncertainty.
  Suggested change: add a small metadata block to each canonical doc.

- [yellow] Product reference image doc is a placeholder.
  Evidence: `docs/01_product/ui_reference_images.md` is `Status: draft` and still contains `TODO` content.
  Impact: product screenshots/assets are not mapped to pages, buttons, or core data, so UI-driven requirements are weakly traceable.
  Suggested change: either fill it from available product assets or mark it explicitly out of scope for this migration slice.

- [yellow] `TaskDraft` appears in API/service docs but is not in the object catalog.
  Evidence: `docs/03_contracts/api_registry.md` uses `TaskDraft` as create/update request; `docs/04_microservices/tasklogs/service_contract.md` lists `TaskDraft`; `docs/02_topos/object_catalog.md` does not list it.
  Impact: draft validation rules exist implicitly but the draft object is not modeled.
  Suggested change: add `TaskDraft` as an input value object with validation lifecycle, or state that it is frontend-only DTO and trace it accordingly.

- [green] Core domain split is directionally sound.
  Evidence: `docs/02_topos/redundancy_review.md` separates `TaskLogEntry`, `TaskRecord`, `WorkspaceSnapshot`, and derived selectors; `docs/02_topos/forbidden_relations.md` names file-handle, raw JSON, userId, and derived-state forbidden edges.
  Note: this remains green only after the red ownership and trace gaps above are fixed.

## Required Changes

1. Fix false `implemented` trace claims for missing frontend/backend paths, or create those files in a separate implementation pass.
2. Add or explicitly waive required per-service docs: `objects.md`, `api.md`, `tables.md`, `forbidden_dependencies.md`.
3. Add `TaskRecord` to the object catalog and assign service ownership.
4. Align API names: `ImportFolderEntries` vs `ImportWorkspaceSnapshot`, and `ListTaskLogs` vs registry omission.
5. Remove `workspace handle` from tasklogs/archives service-level contracts unless it is explicitly confined to the local adapter edge.

## Suggested Changes

1. Normalize gate color wording so allowed status words remain the only `Status` values.
2. Add required metadata blocks to canonical docs.
3. Complete or de-scope `docs/01_product/ui_reference_images.md`.
4. Add `TaskDraft` to the object catalog or mark it as a DTO with trace coverage.

## Uncertain

- It is uncertain whether the missing frontend/backend files are intentionally not generated yet or were expected to exist after the migration pass. Next check: main agent or docs_sync_checker should compare intended phase against the actual tree.
- It is uncertain whether `TaskRecord` should be owned by `workspaces`, `tasklogs`, or defined as an API boundary DTO. Next check: object_relation_optimizer should decide whether this relation should become an object with explicit owner.
- It is uncertain whether archive remains a file move or becomes logical database status. This is already tracked in product open questions and should stay `uncertain` until the storage direction is chosen.

## Handoff

- `docs_sync_checker`: repair trace matrix and status claims against actual paths.
- `api_contract_alignment`: reconcile import/list/archive API names and request shapes.
- `object_relation_optimizer`: decide `TaskRecord` and `TaskDraft` object ownership.
- `boundary_checker`: verify workspace file-handle ownership does not leak into tasklogs or archives.

## Blocker Judgment

Red for further feature implementation that relies on docs as source of truth. Green for a docs-repair pass scoped to the findings above.
