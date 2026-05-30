# DeepSeek AI Flow

Status: draft  
Owner Agent: flow_infra  
Last Verified: 2026-05-30

## Purpose

Use DeepSeek to draft a stricter critical daily report without exposing the provider key to the browser bundle.

## Flow

```text
DailySummaryInput
  -> redact/structure prompt
  -> backend/local sidecar provider reads DEEPSEEK_API_KEY
  -> DeepSeek chat completion
  -> validate structured draft
  -> persist DailySummary
```

## Fallback

If AI is unavailable or not configured, the local adapter creates a deterministic `local-critical-v1` report. The fallback is less fluent but preserves the feature and the catch-up ledger.

## Failure Semantics

- `ai-unavailable`: provider endpoint not configured.
- `ai-timeout`: provider did not return in time.
- `ai-rate-limited`: provider quota/rate limit.
- `provider-response-invalid`: provider returned text that failed validation.

Provider failures should not block task creation or editing. They affect only summary generation for that date.
