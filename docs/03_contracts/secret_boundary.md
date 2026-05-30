# Secret Boundary

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

## Rule

DeepSeek credentials are server/local-sidecar secrets. They must not appear in:

- `frontend/src/**`
- Vite `VITE_*` variables
- built frontend assets
- docs examples with real values
- task, history, or summary files in the user-selected workspace

The frontend may show whether AI is configured, but it must not render or persist the key.

## Environment

The provider reads `DEEPSEEK_API_KEY` from the process environment at the AI boundary. Repository files may name the variable but must not contain a concrete key.

The local sidecar binds to `127.0.0.1` and accepts browser calls only from configured local origins. The default allowlist is the Vite dev origins `http://127.0.0.1:5173`, `http://localhost:5173`, `http://127.0.0.1:5174`, and `http://localhost:5174`; override with `OMEGALOG_AI_PROXY_ORIGINS` when the frontend runs elsewhere.

## Allowed Flow

```text
frontend DailySummaryApi
  -> local/backend summary provider endpoint
  -> server-side DeepSeek provider reads DEEPSEEK_API_KEY
  -> typed DailySummaryDraft
  -> validated DailySummary file
```

## Forbidden Flow

```text
frontend bundle -> fetch("https://api.deepseek.com", Authorization: Bearer ...)
```

This is forbidden because the key becomes visible to the browser runtime and the built bundle.
