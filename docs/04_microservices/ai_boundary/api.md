# AI Boundary API

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

| API | Type | Request | Response | Failure |
|---|---|---|---|---|
| `AISummary.createDailySummaryDraft` | internal command | structured summary input, idempotency key | validated draft | ai-unavailable, ai-timeout, ai-rate-limited, provider-response-invalid |

The frontend must not call DeepSeek directly. A backend or local sidecar reads `DEEPSEEK_API_KEY`.
