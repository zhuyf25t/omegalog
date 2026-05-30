# Daily Summaries Service Contract

Status: draft  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

Daily summaries are derived from task history events. They do not mutate tasks and do not read private task tables.

## Guarantees

- Automatic generation covers only closed local days.
- Missed closed days are reconciled on the next open/reload/visibility resume.
- Empty days can produce `empty-day` reports to make catch-up auditable.
- Provider secrets are owned by the AI boundary, not summaries.
