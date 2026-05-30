# Tasklogs Objects

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-27

## Owned Objects

- `TaskId`
- `IsoDateTime`
- `TaskDeadline`
- `TaskWeight`
- `TaskTag`
- `TaskTitle`
- `TaskNote`
- `AdjustmentCount`
- `DeadlineAdjustmentStats`
- `TaskStatus`
- `TaskLogEntry.Active`
- `TaskLogEntry.Done`
- `TaskDraft`

## Related Code

- `backend/src/main/scala/services/tasklogs/objects/TaskLogObjects.scala`
- `frontend/src/domain/taskLog.ts`
- `frontend/src/domain/taskTransitions.ts`

## Boundary

Objects contain no DB, random id generation, browser file APIs, or network calls.
