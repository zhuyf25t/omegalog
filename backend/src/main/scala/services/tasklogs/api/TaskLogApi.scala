package omegalog.services.tasklogs.api

import cats.effect.IO
import omegalog.services.tasklogs.objects.*
import omegalog.services.tasklogs.tables.TaskLogTable
import omegalog.services.workspaces.objects.*
import omegalog.system.{ApiError, IdGenerator, SystemClock}

import java.time.Instant
import java.time.temporal.ChronoUnit

sealed trait TaskLogApiMessage

sealed trait TaskLogCommand extends TaskLogApiMessage

sealed trait TaskLogQuery extends TaskLogApiMessage

final case class TaskListQuery(
    workspaceId: WorkspaceId,
    status: Option[TaskStatus] = None
)

object TaskListQuery:
  def all(workspaceId: WorkspaceId): TaskListQuery =
    TaskListQuery(workspaceId, None)

  def byStatus(workspaceId: WorkspaceId, status: TaskStatus): TaskListQuery =
    TaskListQuery(workspaceId, Some(status))

final case class ImportFolderEntries(
    workspaceId: WorkspaceId,
    workspaceName: WorkspaceName,
    records: Vector[TaskRecord],
    warnings: Vector[ImportWarning]
) extends TaskLogCommand

final case class CreateTaskLog(
    workspaceId: WorkspaceId,
    draft: TaskDraft
) extends TaskLogCommand

final case class UpdateTaskLog(
    workspaceId: WorkspaceId,
    taskId: TaskId,
    draft: TaskDraft
) extends TaskLogCommand

final case class CompleteTaskLog(
    workspaceId: WorkspaceId,
    taskId: TaskId
) extends TaskLogCommand

final case class ReactivateTaskLog(
    workspaceId: WorkspaceId,
    taskId: TaskId
) extends TaskLogCommand

final case class ListTaskLogs(
    query: TaskListQuery
) extends TaskLogQuery

trait TaskLogApi:
  def importFolderEntries(command: ImportFolderEntries): IO[Either[ApiError, WorkspaceSnapshot]]

  def createEntry(command: CreateTaskLog): IO[Either[ApiError, TaskRecord]]

  def updateEntry(command: UpdateTaskLog): IO[Either[ApiError, TaskRecord]]

  def completeEntry(command: CompleteTaskLog): IO[Either[ApiError, TaskRecord]]

  def reactivateEntry(command: ReactivateTaskLog): IO[Either[ApiError, TaskRecord]]

  def listTaskLogs(query: ListTaskLogs): IO[Either[ApiError, Vector[TaskRecord]]]

object TaskLogApi:
  private[tasklogs] def fromTables(
      table: TaskLogTable,
      clock: SystemClock,
      taskIds: IdGenerator[TaskId]
  ): TaskLogApi =
    new TaskLogService(table, clock, taskIds)

private[tasklogs] final class TaskLogService(
    table: TaskLogTable,
    clock: SystemClock,
    taskIds: IdGenerator[TaskId]
) extends TaskLogApi:
  override def importFolderEntries(command: ImportFolderEntries): IO[Either[ApiError, WorkspaceSnapshot]] =
    table.replaceImported(command.workspaceId, command.records).map {
      case Left(error) => Left(error)
      case Right(savedRecords) =>
        Right(WorkspaceSnapshot(command.workspaceId, command.workspaceName, savedRecords, command.warnings))
    }

  override def createEntry(command: CreateTaskLog): IO[Either[ApiError, TaskRecord]] =
    for
      taskId <- taskIds.nextId
      now <- clock.now
      created = TaskLogTransitions.create(taskId, command.draft, now)
      result <- table.insert(command.workspaceId, created)
    yield result

  override def updateEntry(command: UpdateTaskLog): IO[Either[ApiError, TaskRecord]] =
    table.find(command.workspaceId, command.taskId).flatMap {
      case Left(error) => IO.pure(Left(error))
      case Right(None) => IO.pure(Left(ApiError.taskNotFound("Task not found.")))
      case Right(Some(record)) =>
        clock.now.flatMap { now =>
          TaskLogTransitions.update(record.entry, command.draft, now) match
            case Left(error)    => IO.pure(Left(error))
            case Right(updated) => table.update(command.workspaceId, updated)
        }
    }

  override def completeEntry(command: CompleteTaskLog): IO[Either[ApiError, TaskRecord]] =
    table.find(command.workspaceId, command.taskId).flatMap {
      case Left(error) => IO.pure(Left(error))
      case Right(None) => IO.pure(Left(ApiError.taskNotFound("Task not found.")))
      case Right(Some(record)) =>
        clock.now.flatMap { now =>
          TaskLogTransitions.complete(record.entry, now) match
            case Left(error)    => IO.pure(Left(error))
            case Right(updated) => table.update(command.workspaceId, updated)
        }
    }

  override def reactivateEntry(command: ReactivateTaskLog): IO[Either[ApiError, TaskRecord]] =
    table.find(command.workspaceId, command.taskId).flatMap {
      case Left(error) => IO.pure(Left(error))
      case Right(None) => IO.pure(Left(ApiError.taskNotFound("Task not found.")))
      case Right(Some(record)) =>
        clock.now.flatMap { now =>
          TaskLogTransitions.reactivate(record.entry, now) match
            case Left(error)    => IO.pure(Left(error))
            case Right(updated) => table.update(command.workspaceId, updated)
        }
    }

  override def listTaskLogs(query: ListTaskLogs): IO[Either[ApiError, Vector[TaskRecord]]] =
    table.listByWorkspace(query.query.workspaceId).map {
      case Left(error) => Left(error)
      case Right(records) =>
        Right(query.query.status.fold(records)(status => records.filter(_.entry.status == status)))
    }

private object TaskLogTransitions:
  def create(taskId: TaskId, draft: TaskDraft, now: Instant): TaskLogEntry =
    TaskLogEntry.active(
      id = taskId,
      title = draft.title,
      note = draft.note,
      tags = draft.tags,
      weight = draft.weight,
      deadline = draft.deadline,
      deadlineStats = DeadlineAdjustmentStats.zero,
      createdAt = IsoDateTime.fromInstant(now)
    )

  def update(current: TaskLogEntry, draft: TaskDraft, now: Instant): Either[ApiError, TaskLogEntry] =
    val deadlineChanged = hasDeadlineChanged(current.deadline, draft.deadline)
    val wasAdjustedAfterOverdue =
      deadlineChanged && current.status == TaskStatus.Active && current.deadline.instant.isBefore(now)
    val withDeadlineAdjustment =
      if deadlineChanged then current.deadlineStats.incrementDeadline else current.deadlineStats
    val nextStats =
      if wasAdjustedAfterOverdue then withDeadlineAdjustment.incrementOverdue else withDeadlineAdjustment

    TaskLogEntry
      .fromStored(
        id = current.id,
        title = draft.title,
        note = draft.note,
        tags = draft.tags,
        weight = draft.weight,
        status = current.status,
        deadline = draft.deadline,
        deadlineStats = nextStats,
        createdAt = current.createdAt,
        completedAt = current.completedAt
      )
      .left
      .map(ApiError.conflict)

  def complete(current: TaskLogEntry, now: Instant): Either[ApiError, TaskLogEntry] =
    current.status match
      case TaskStatus.Done =>
        Left(ApiError.invalidOperation("Task is already done."))
      case TaskStatus.Active =>
        Right(
          TaskLogEntry.done(
            id = current.id,
            title = current.title,
            note = current.note,
            tags = current.tags,
            weight = current.weight,
            deadline = current.deadline,
            deadlineStats = current.deadlineStats,
            createdAt = current.createdAt,
            completedAt = IsoDateTime.fromInstant(now)
          )
        )

  def reactivate(current: TaskLogEntry, now: Instant): Either[ApiError, TaskLogEntry] =
    current.status match
      case TaskStatus.Active =>
        Left(ApiError.invalidOperation("Task is already active."))
      case TaskStatus.Done =>
        val nextDeadline =
          if current.deadline.instant.isAfter(now) then current.deadline
          else TaskDeadline.fromInstant(now.plus(1, ChronoUnit.DAYS))
        Right(
          TaskLogEntry.active(
            id = current.id,
            title = current.title,
            note = current.note,
            tags = current.tags,
            weight = current.weight,
            deadline = nextDeadline,
            deadlineStats = current.deadlineStats,
            createdAt = current.createdAt
          )
        )

  private def hasDeadlineChanged(previous: TaskDeadline, next: TaskDeadline): Boolean =
    previous.instant.toEpochMilli / 60000L != next.instant.toEpochMilli / 60000L
