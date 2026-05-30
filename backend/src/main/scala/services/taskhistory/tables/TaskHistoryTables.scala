package omegalog.services.taskhistory.tables

import cats.effect.IO
import omegalog.services.taskhistory.objects.*
import omegalog.services.tasklogs.objects.TaskId
import omegalog.services.workspaces.objects.WorkspaceId
import omegalog.system.ApiError

private[taskhistory] final case class TaskChangeEventRow(
    workspaceId: String,
    eventId: String,
    eventType: String,
    sourceApi: String,
    occurredAt: String,
    localDay: String,
    timeZone: String,
    taskIds: Vector[String],
    changedFields: Vector[String]
)

private[taskhistory] object TaskChangeEventRow:
  def fromEvent(event: TaskChangeEvent): TaskChangeEventRow =
    TaskChangeEventRow(
      workspaceId = WorkspaceId.toString(event.workspaceId),
      eventId = TaskChangeEventId.toString(event.eventId),
      eventType = TaskChangeType.toString(event.eventType),
      sourceApi = event.sourceApi,
      occurredAt = event.occurredAt.toString,
      localDay = TaskEventLocalDay.toString(event.localDay),
      timeZone = event.timeZone,
      taskIds = event.taskIds.map(TaskId.toString),
      changedFields = event.changedFields
    )

private[taskhistory] trait TaskHistoryTable:
  def append(event: TaskChangeEvent): IO[Either[ApiError, TaskChangeEvent]]

  def list(query: TaskChangeQuery): IO[Either[ApiError, Vector[TaskChangeEvent]]]
