# Tasklogs API

Status: implemented  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-27

| API Message | Type | Semantics | Status |
|---|---|---|---|
| `ImportFolderEntries` | command | Replace/import decoded folder records and warnings for a workspace. | implemented |
| `CreateTaskLog` | command | Create active task from `TaskDraft`. | implemented |
| `UpdateTaskLog` | command | Update title/note/tags/weight/deadline and adjustment stats. | implemented |
| `CompleteTaskLog` | command | Transition active task to done. | implemented |
| `ReactivateTaskLog` | command | Transition done task to active and repair stale deadline. | implemented |
| `ListTaskLogs` | query | List workspace tasks, optionally filtered by status. | implemented |

## Related Code

- `backend/src/main/scala/services/tasklogs/api/TaskLogApi.scala`
- `frontend/src/api/taskLogApi.ts`
