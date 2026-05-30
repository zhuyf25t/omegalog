# Invariants

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

| Invariant | Scope | Enforced by | Status |
|---|---|---|---|
| Task id is non-empty and URL-safe. | tasklogs/workspaces | frontend `TaskId` decoder, backend `TaskId` opaque constructor | implemented |
| File name and JSON id are both retained; import does not require old files to have matching names. | workspaces | local adapter keeps `fileName`, decoder keeps `TaskId` | implemented |
| Title is non-empty after trim. | tasklogs | draft validator | implemented |
| Weight is integer 1..10. | tasklogs | frontend clamp, backend `TaskWeight` validation | implemented |
| Tags are trimmed, deduplicated, max six. | tasklogs | tag parser | implemented |
| Status is only `active` or `done`. | tasklogs | enum decoder | implemented |
| Active task has no `completedAt`. | tasklogs | frontend transition functions, backend ADT constructors | implemented |
| Done task has valid `completedAt`. | tasklogs | complete command and backend `Done` variant | implemented |
| Invalid deadline becomes default next midnight on local import/create fallback. | tasklogs | frontend decoder/draft validator | implemented |
| Folder IO does not leak into pure selectors. | frontend/workspaces | API adapter boundary | implemented |
| Archive moves only completed tasks. | archives | archive command | implemented |
| Task history is append-only. | taskhistory | local history storage/API | draft |
| Daily summaries consume events, not task snapshots. | daily_summaries | summary generator input type | draft |
| One automatic summary per day/source hash is idempotent. | daily_summaries | summary file name + source hash check | draft |
| Closed-day catch-up never summarizes the current open day automatically. | daily_summaries | scheduler/catch-up selector | draft |
| DeepSeek key never enters frontend source, docs, build output, or local task folder. | ai_boundary | secret boundary checks | draft |
