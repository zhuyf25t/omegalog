# API Alignment Report

Status: verified  
Owner Agent: api_alignment_checker  
Last Verified: 2026-05-27

## Result

Verified after post-check fixes.

## Fixes Applied After Checker Report

- `OpenWorkspace` router transform now documents `displayName` and `storageRef`.
- `TaskLogApi` frontend port now exposes `importFolderEntries`.
- `ListTaskLogs` is registered in `docs/03_contracts/api_registry.md`.
- `TaskRecord` frontend response shape now includes `storageLocation`, matching backend.
- `reloadWorkspace` is documented as local adapter reload / future workspace lookup plus list query.
- Frontend error code union now includes `invalid-input` and `conflict`.

## Remaining Uncertain

- No HTTP router exists yet, so token -> trusted workspace/user identity is documented but not implemented.
- Real DB/table interpreters are not implemented.
