package omegalog.services.tasklogs.tables

import cats.effect.IO
import omegalog.services.tasklogs.objects.*
import omegalog.services.workspaces.objects.*
import omegalog.system.ApiError

private[tasklogs] final case class TaskLogRow(
    workspaceId: String,
    fileName: String,
    storageLocation: String,
    taskId: String,
    title: String,
    note: String,
    tags: Vector[String],
    weight: Int,
    status: String,
    deadline: String,
    deadlineAdjustCount: Int,
    overdueAdjustCount: Int,
    createdAt: String,
    completedAt: Option[String]
)

private[tasklogs] object TaskLogRow:
  def fromRecord(workspaceId: WorkspaceId, record: TaskRecord): TaskLogRow =
    val entry = record.entry
    TaskLogRow(
      workspaceId = WorkspaceId.toString(workspaceId),
      fileName = TaskFileRef.toString(record.fileName),
      storageLocation = TaskStorageLocation.toString(record.storageLocation),
      taskId = TaskId.toString(entry.id),
      title = TaskTitle.toString(entry.title),
      note = TaskNote.toString(entry.note),
      tags = entry.tags.map(TaskTag.toString),
      weight = TaskWeight.toInt(entry.weight),
      status = TaskStatus.toString(entry.status),
      deadline = TaskDeadline.toString(entry.deadline),
      deadlineAdjustCount = AdjustmentCount.toInt(entry.deadlineAdjustCount),
      overdueAdjustCount = AdjustmentCount.toInt(entry.overdueAdjustCount),
      createdAt = IsoDateTime.toString(entry.createdAt),
      completedAt = entry.completedAt.map(IsoDateTime.toString)
    )

  def toRecord(row: TaskLogRow): Either[String, TaskRecord] =
    for
      _ <- WorkspaceId.fromString(row.workspaceId)
      fileName <- TaskFileRef.fromString(row.fileName)
      storageLocation <- TaskStorageLocation.fromString(row.storageLocation)
      taskId <- TaskId.fromString(row.taskId)
      title <- TaskTitle.fromString(row.title)
      note <- TaskNote.fromString(row.note)
      tags <- TaskTag.fromStrings(row.tags)
      weight <- TaskWeight.fromInt(row.weight)
      status <- TaskStatus.fromString(row.status)
      deadline <- TaskDeadline.fromString(row.deadline)
      stats <- DeadlineAdjustmentStats.fromInts(row.deadlineAdjustCount, row.overdueAdjustCount)
      createdAt <- IsoDateTime.fromString(row.createdAt)
      completedAt <- decodeOptional(row.completedAt)(IsoDateTime.fromString)
      entry <- TaskLogEntry.fromStored(
        taskId,
        title,
        note,
        tags,
        weight,
        status,
        deadline,
        stats,
        createdAt,
        completedAt
      )
    yield TaskRecord(fileName, storageLocation, entry)

  private def decodeOptional[A](value: Option[String])(decode: String => Either[String, A]): Either[String, Option[A]] =
    value match
      case None        => Right(None)
      case Some(raw)   => decode(raw).map(Some(_))

private[tasklogs] trait TaskLogTable:
  def insert(workspaceId: WorkspaceId, entry: TaskLogEntry): IO[Either[ApiError, TaskRecord]]

  def update(workspaceId: WorkspaceId, entry: TaskLogEntry): IO[Either[ApiError, TaskRecord]]

  def find(workspaceId: WorkspaceId, taskId: TaskId): IO[Either[ApiError, Option[TaskRecord]]]

  def listByWorkspace(workspaceId: WorkspaceId): IO[Either[ApiError, Vector[TaskRecord]]]

  def replaceImported(workspaceId: WorkspaceId, records: Vector[TaskRecord]): IO[Either[ApiError, Vector[TaskRecord]]]
