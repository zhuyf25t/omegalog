# Daily Summary Objects

Status: draft  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

| Object | Fields | Notes |
|---|---|---|
| `SummaryDate` | local `YYYY-MM-DD` | Typed day identity. |
| `DailySummary` | id, day, timezone, source ids/hash, stats, provider, markdown, generatedAt | Persisted report artifact. |
| `SummaryRun` | run id, date, trigger, status, startedAt, finishedAt, error | Future/uncertain persisted audit ledger; current slice only uses in-memory `SummaryRunStatus`. |
| `SummaryProviderMetadata` | `local-critical-v1` or backend AI metadata | Persisted report metadata; no secret fields. |
