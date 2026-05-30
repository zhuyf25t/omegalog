# Daily Summaries API

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

| API | Type | Request | Response | Failure |
|---|---|---|---|---|
| `DailySummary.listSummaries` | query | date range | summary records | invalid range, file-io |
| `DailySummary.generateForDate` | command | date, mode | daily summary | invalid date, provider failure, file-io |
| `DailySummary.reconcileMissing` | command | optional through date | generated/skipped/failed dates | per-date failure list |

`generateForDate` is idempotent for the same date, source hash, and algorithm version.
