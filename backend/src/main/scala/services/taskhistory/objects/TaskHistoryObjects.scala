package omegalog.services.taskhistory.objects

import omegalog.services.tasklogs.objects.*
import omegalog.services.workspaces.objects.WorkspaceId

import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeParseException

opaque type TaskChangeEventId = String

object TaskChangeEventId:
  def fromString(raw: String): Either[String, TaskChangeEventId] =
    val value = raw.trim
    if value.matches("^[A-Za-z0-9_-]{4,96}$") then Right(value)
    else Left("Task change event id must be 4-96 URL-safe characters.")

  def toString(value: TaskChangeEventId): String =
    value

  extension (value: TaskChangeEventId)
    def asString: String =
      value

opaque type TaskEventLocalDay = LocalDate

object TaskEventLocalDay:
  def fromDate(value: LocalDate): TaskEventLocalDay =
    value

  def fromString(raw: String): Either[String, TaskEventLocalDay] =
    try Right(LocalDate.parse(raw.trim))
    catch case _: DateTimeParseException => Left("Task event local day is invalid.")

  def toString(value: TaskEventLocalDay): String =
    value.toString

  extension (value: TaskEventLocalDay)
    def asLocalDate: LocalDate =
      value

enum TaskChangeType:
  case Created
  case Updated
  case Completed
  case Reactivated
  case Archived

object TaskChangeType:
  def toString(value: TaskChangeType): String =
    value match
      case TaskChangeType.Created     => "created"
      case TaskChangeType.Updated     => "updated"
      case TaskChangeType.Completed   => "completed"
      case TaskChangeType.Reactivated => "reactivated"
      case TaskChangeType.Archived    => "archived"

  def fromString(raw: String): Either[String, TaskChangeType] =
    raw match
      case "created"     => Right(TaskChangeType.Created)
      case "updated"     => Right(TaskChangeType.Updated)
      case "completed"   => Right(TaskChangeType.Completed)
      case "reactivated" => Right(TaskChangeType.Reactivated)
      case "archived"    => Right(TaskChangeType.Archived)
      case other         => Left(s"Unknown task change type: $other")

final case class TaskEventSnapshot(
    id: TaskId,
    title: TaskTitle,
    note: TaskNote,
    tags: Vector[TaskTag],
    weight: TaskWeight,
    status: TaskStatus,
    deadline: TaskDeadline,
    completedAt: Option[IsoDateTime]
)

object TaskEventSnapshot:
  def fromEntry(entry: TaskLogEntry): TaskEventSnapshot =
    TaskEventSnapshot(
      id = entry.id,
      title = entry.title,
      note = entry.note,
      tags = entry.tags,
      weight = entry.weight,
      status = entry.status,
      deadline = entry.deadline,
      completedAt = entry.completedAt
    )

final case class TaskChangeEvent(
    eventId: TaskChangeEventId,
    workspaceId: WorkspaceId,
    eventType: TaskChangeType,
    sourceApi: String,
    occurredAt: Instant,
    localDay: TaskEventLocalDay,
    timeZone: String,
    taskIds: Vector[TaskId],
    before: Vector[TaskEventSnapshot],
    after: Vector[TaskEventSnapshot],
    changedFields: Vector[String]
)

final case class TaskChangeQuery(
    workspaceId: WorkspaceId,
    fromDay: Option[TaskEventLocalDay],
    throughDay: Option[TaskEventLocalDay]
)
