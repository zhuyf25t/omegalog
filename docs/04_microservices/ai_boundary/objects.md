# AI Boundary Objects

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

| Object | Fields | Notes |
|---|---|---|
| `AiProvider` | provider kind, model label | Metadata only. |
| `SecretRef` | environment variable name | Never contains the actual secret. |
| `DailySummaryInput` | day, stats, source events | Structured prompt input. |
| `DailySummaryDraft` | markdown/content sections | Validated provider output. |
