# Task History Tables

Status: draft  
Owner Agent: database_boundary  
Last Verified: 2026-05-30

Local slice storage:

```text
.omegalog-system/history/YYYY-MM-DD/*.omegalog-event.json
```

Future DB table should be service-private and keyed by `(workspace_id, event_id)` with an index on `(workspace_id, local_day, occurred_at)`.
