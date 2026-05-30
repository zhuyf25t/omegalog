# Uncertainty List

Status: uncertain  
Owner Agent: verification_safety_lead  
Last Verified: 2026-05-30

| Item | Why uncertain | Next check | Owner |
|---|---|---|---|
| Browser File System Access API support | It works only in Chromium-family browsers and needs a user gesture. | Smoke test in Chrome/Edge with a folder containing `.omegalog.json`. | frontend |
| Server persistence choice | No DB selected yet. | Decide SQLite/Postgres/local-only before sync. | database_boundary |
| Backend runtime router | Scala service messages exist, but HTTP router is not implemented in this slice. | Add router when frontend moves off local folder adapter. | api_contract_alignment |
| Real table interpreters | Tables are algebras only. | Add interpreter and migration when DB is chosen. | database_boundary |
| Browser File System Access API support | Local adapter smoke uses a fake `FileSystemDirectoryHandle`; real Chromium permission prompts still need browser confirmation. | Smoke test in Chrome/Edge with a folder containing `.omegalog.json`. | frontend |
| Provider sidecar regression tests | Configured-key sidecar smoke and frontend provider success/fallback tests pass; sidecar-level invalid-response mock is still not isolated in CI. | Add mock DeepSeek endpoint test if provider behavior changes. | test_checker |
| Task mutation atomicity | Browser file writes cannot atomically commit task JSON and history event together. | Add recovery/outbox or repair scan before audit-grade summaries. | flow_infra |
| AI sidecar availability | DeepSeek proxy is local sidecar; frontend falls back to deterministic local report if unavailable. | Smoke test sidecar with configured `DEEPSEEK_API_KEY`. | ai_boundary |
| Summary revision policy | Current slice keeps one current summary per day and detects stale source hash. | Decide whether audit-grade revisions and persisted `SummaryRun` ledger are needed. | daily_summaries |
