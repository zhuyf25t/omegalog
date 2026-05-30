# Task History Service Contract

Status: draft  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

The service owns append-only task mutation evidence. It does not own task lifecycle rules; `tasklogs` still owns task transitions.

## Guarantees

- Events are immutable after write.
- Events are ordered by `occurredAt` and stable file name.
- Events contain typed before/after snapshots sufficient for daily reports.
- Summary services read history through the public API.
