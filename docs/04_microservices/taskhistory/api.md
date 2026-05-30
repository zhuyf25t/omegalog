# Task History API

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

| API | Type | Request | Response | Failure |
|---|---|---|---|---|
| `TaskHistory.recordChange` | command | adapter-created task change event | persisted event | invalid event, conflict, file-io |
| `TaskHistory.listChanges` | query | date range | events ordered by occurredAt | invalid range, file-io |

Only task mutation adapters should call `recordChange`. React components use higher-level task and summary actions.
