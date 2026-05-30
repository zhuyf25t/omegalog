# Type Safety Registry

Status: draft  
Owner Agent: type_safety_checker  
Last Verified: 2026-05-30

| Item | Path | Status | Reason | Owner Agent | Next Check |
|---|---|---|---|---|---|
| Old one-file app | `project-old-structure/src/main.ts` | unsafe | DOM, IO, JSON, and domain state share globals. | type_safety_checker | Keep old project read-only as migration source. |
| Task identity | `frontend/src/domain/taskLog.ts`, `backend/src/main/scala/services/tasklogs/objects/TaskLogObjects.scala` | verified | `TaskId` is branded/opaque. | type_safety_checker | Preserve typed id in future DB schema. |
| JSON import | `frontend/src/domain/taskLogCodec.ts` | verified | Unknown JSON is decoded and normalized before UI use. | type_safety_checker | Add fixture tests. |
| Status/completedAt | `frontend/src/domain/taskLog.ts`, `backend/src/main/scala/services/tasklogs/objects/TaskLogObjects.scala` | verified | Frontend discriminated union and backend ADT prevent active+completedAt/done+null in normal constructors. | type_safety_checker | Recheck after API mapper work. |
| Weight/tags/counts | `frontend/src/domain/taskLog.ts` | verified | Value constructors clamp/normalize; backend validates. | type_safety_checker | Add unit tests for boundaries. |
| Random id generation | `frontend/src/api/localFolderTaskApi.ts` | verified | Randomness moved from domain to API adapter boundary. | boundary_checker | Recheck when server id generator is introduced. |
| Frontend shared state | `frontend/src/stores/taskLogStore.ts` | verified | Store keeps core state; selectors derive focus/count/page. | frontend_state_checker | Recheck after new views. |
| API boundary | `frontend/src/api/taskLogApi.ts` | verified | Registry names mirror API port and Scala messages after post-check fixes. | api_alignment_checker | Recheck after HTTP router. |
| DB boundary | `backend/src/main/scala/services/*/tables` | reviewed | Table traits define ownership only. | database_boundary | Choose DB before sync feature. |
| Task history events | `frontend/src/domain/taskHistory.ts`, `frontend/src/domain/taskHistoryCodec.ts`, `frontend/src/api/taskHistoryApi.ts`, `frontend/src/api/localTaskHistoryStorage.ts`, `frontend/src/api/localFileAdapter.smoke.test.ts` | implemented | Event types, snapshots, and local-day grouping are typed and covered by local adapter smoke. | type_safety_checker | Recheck real browser permission flow. |
| Daily summaries | `frontend/src/domain/summaryDate.ts`, `frontend/src/domain/dailySummary.ts`, `frontend/src/domain/dailySummaryCodec.ts`, `frontend/src/domain/dailySummaryReport.ts`, `frontend/src/api/dailySummaryApi.ts`, `frontend/src/domain/dailySummary.test.ts`, `frontend/src/api/localFileAdapter.smoke.test.ts` | implemented | Summaries carry source event ids/hash and provider metadata without secrets; pure date/hash behavior and local summary file writes are covered. | type_safety_checker | Recheck real browser permission flow and provider success path. |
| AI secret boundary | `docs/03_contracts/secret_boundary.md`, `frontend/src/api/summaryGenerationClient.ts`, `tools/deepseek-summary-proxy.mjs` | implemented | DeepSeek key stays in user env; provider proxy reads `DEEPSEEK_API_KEY` outside frontend and only allows configured local origins. | boundary_checker | Grep source/build before release. |
