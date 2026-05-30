# Project Docs Index

Status: verified  
Owner Agent: docs_creator  
Last Verified: 2026-05-30

## Project one-liner

OMEGALOG is a local-first task log that imports `.omegalog.json` files from a user-selected folder, lets the user create/update/complete/reactivate/archive tasks, records append-only task history, and generates daily critical reports from the history stream.

## Current phase

- [x] Discovery
- [x] Domain modeling
- [x] API contract
- [x] Skeleton implementation
- [x] Vertical slice
- [x] Verification
- [x] Migration / refactor

## Key documents

- Product: `docs/01_product/vision.md`
- Journeys: `docs/01_product/user_journeys.md`
- Objects: `docs/02_topos/object_catalog.md`
- Relations: `docs/02_topos/relation_catalog.md`
- State machines: `docs/02_topos/state_machines.md`
- API: `docs/03_contracts/api_registry.md`
- Serialization: `docs/03_contracts/serialization_rules.md`
- Microservices: `docs/04_microservices/`
- Frontend state: `docs/05_frontend/application_state.md`
- Local file flow: `docs/06_flow_infra/local_file_flow.md`
- Daily summary scheduler: `docs/06_flow_infra/daily_summary_scheduler_flow.md`
- Secret boundary: `docs/03_contracts/secret_boundary.md`
- Type safety: `docs/07_checks/type_safety_registry.md`
- Trace matrix: `docs/07_checks/doc_code_trace_matrix.md`

## Current Gate Status

| Area | Status | Reason | Next action |
|---|---|---|---|
| Docs | verified | Required docs, service docs, reports, and trace matrix are present after implementation. | Keep docs synchronized with new features. |
| Backend | verified | `sbt compile` passed for Scala service boundary skeleton. | Add router/table interpreter only when backend runtime is needed. |
| Frontend | verified | `npm run typecheck` and `npm run build` passed. | Browser smoke test in Chrome/Edge for folder picker. |
| API alignment | verified | Post-check fixes added `importFolderEntries`, `ListTaskLogs`, `storageLocation`, and documented router transforms. | Re-run checker after HTTP router work. |
| DB boundary | reviewed | Table algebras exist; no real DB interpreter or migration yet. | Choose SQLite/Postgres before sync feature. |
| Tests | verified | Compile/build gates passed; browser interaction remains explicit uncertainty. | Add unit tests for codecs/transitions next. |

## Active Feature Slice

| Feature | Status | Design rule |
|---|---|---|
| Task history | draft | Task mutations append typed `TaskChangeEvent` records under `.omegalog-system/history/`; summaries consume events, not mutable task snapshots. |
| Daily summaries | draft | The app generates closed local days only. If the app was closed at midnight, the next open/reload reconciles missing days. |
| DeepSeek boundary | draft | Provider keys stay outside `frontend/src`, build output, and docs. The frontend can call only a typed local/backend summary provider. |
