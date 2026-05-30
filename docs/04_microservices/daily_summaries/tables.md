# Daily Summaries Tables

Status: draft  
Owner Agent: database_boundary  
Last Verified: 2026-05-30

Local slice storage:

```text
.omegalog-system/summaries/YYYY-MM-DD.omegalog-summary.json
```

Future audit-grade storage may add `.omegalog-system/summaries/summary-runs.jsonl` or a DB `summary_runs` table. That ledger is currently `uncertain`, not implemented.

Future DB tables should be service-private and keyed by `(workspace_id, summary_date, algorithm_version)`.
