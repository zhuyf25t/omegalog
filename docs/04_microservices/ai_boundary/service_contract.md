# AI Boundary Service Contract

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-30

This service owns external AI calls and provider secret access.

## Guarantees

- Reads `DEEPSEEK_API_KEY` from process environment only.
- Redacts and structures prompt input.
- Returns typed draft content.
- Never writes task files or summary files directly.
