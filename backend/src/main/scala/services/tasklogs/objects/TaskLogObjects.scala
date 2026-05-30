package omegalog.services.tasklogs.objects

import java.time.Instant
import java.time.format.DateTimeParseException

opaque type TaskId = String

object TaskId:
  private val Pattern = "^[A-Za-z0-9_-]{4,64}$"

  def fromString(raw: String): Either[String, TaskId] =
    val value = raw.trim
    if value.matches(Pattern) then Right(value)
    else Left("Task id must be 4-64 URL-safe characters.")

  def toString(value: TaskId): String =
    value

  extension (value: TaskId)
    def asString: String =
      value

opaque type IsoDateTime = Instant

object IsoDateTime:
  def fromInstant(value: Instant): IsoDateTime =
    value

  def fromString(raw: String): Either[String, IsoDateTime] =
    try Right(Instant.parse(raw.trim))
    catch case _: DateTimeParseException => Left("Timestamp is invalid.")

  def toString(value: IsoDateTime): String =
    value.toString

  def toInstant(value: IsoDateTime): Instant =
    value

  extension (value: IsoDateTime)
    def instant: Instant =
      value

    def asString: String =
      value.toString

opaque type TaskDeadline = IsoDateTime

object TaskDeadline:
  def fromIsoDateTime(value: IsoDateTime): TaskDeadline =
    value

  def fromInstant(value: Instant): TaskDeadline =
    IsoDateTime.fromInstant(value)

  def fromString(raw: String): Either[String, TaskDeadline] =
    IsoDateTime.fromString(raw).map(fromIsoDateTime)

  def toString(value: TaskDeadline): String =
    IsoDateTime.toString(value)

  extension (value: TaskDeadline)
    def isoDateTime: IsoDateTime =
      value

    def instant: Instant =
      IsoDateTime.toInstant(value)

    def asString: String =
      IsoDateTime.toString(value)

opaque type TaskWeight = Int

object TaskWeight:
  def fromInt(raw: Int): Either[String, TaskWeight] =
    if raw >= 1 && raw <= 10 then Right(raw)
    else Left("Task weight must be between 1 and 10.")

  def toInt(value: TaskWeight): Int =
    value

  extension (value: TaskWeight)
    def asInt: Int =
      value

opaque type TaskTag = String

object TaskTag:
  val MaxLength: Int = 18
  val MaxCount: Int = 6

  def fromString(raw: String): Either[String, TaskTag] =
    val value = raw.trim
    if value.isEmpty then Left("Task tag is empty.")
    else if value.length > MaxLength then Left(s"Task tag must be at most $MaxLength characters.")
    else Right(value)

  def fromStrings(rawTags: Iterable[String]): Either[String, Vector[TaskTag]] =
    rawTags.foldLeft[Either[String, (Set[String], Vector[TaskTag])]](Right(Set.empty -> Vector.empty)) {
      case (Left(error), _) => Left(error)
      case (Right((seen, tags)), raw) =>
        fromString(raw).flatMap { tag =>
          val key = tag.toLowerCase
          if seen.contains(key) then Right(seen -> tags)
          else if tags.size >= MaxCount then Left(s"Task can have at most $MaxCount tags.")
          else Right((seen + key) -> (tags :+ tag))
        }
    }.map(_._2)

  def toString(value: TaskTag): String =
    value

  extension (value: TaskTag)
    def asString: String =
      value

opaque type TaskTitle = String

object TaskTitle:
  val MaxLength: Int = 120

  def fromString(raw: String): Either[String, TaskTitle] =
    val value = raw.trim
    if value.isEmpty then Left("Title is required.")
    else Right(value.take(MaxLength))

  def toString(value: TaskTitle): String =
    value

  extension (value: TaskTitle)
    def asString: String =
      value

opaque type TaskNote = String

object TaskNote:
  val MaxLength: Int = 1200

  def fromString(raw: String): Either[String, TaskNote] =
    Right(raw.trim.take(MaxLength))

  def toString(value: TaskNote): String =
    value

  extension (value: TaskNote)
    def asString: String =
      value

opaque type AdjustmentCount = Int

object AdjustmentCount:
  val MaxValue: Int = 99
  val zero: AdjustmentCount = 0

  def fromInt(raw: Int): Either[String, AdjustmentCount] =
    if raw >= 0 && raw <= MaxValue then Right(raw)
    else Left(s"Adjustment count must be between 0 and $MaxValue.")

  def toInt(value: AdjustmentCount): Int =
    value

  extension (value: AdjustmentCount)
    def asInt: Int =
      value

    def increment: AdjustmentCount =
      math.min(MaxValue, value + 1)

final case class DeadlineAdjustmentStats(
    deadlineAdjustCount: AdjustmentCount,
    overdueAdjustCount: AdjustmentCount
)

object DeadlineAdjustmentStats:
  val zero: DeadlineAdjustmentStats =
    DeadlineAdjustmentStats(AdjustmentCount.zero, AdjustmentCount.zero)

  def fromInts(deadlineAdjustCount: Int, overdueAdjustCount: Int): Either[String, DeadlineAdjustmentStats] =
    for
      parsedDeadlineAdjustCount <- AdjustmentCount.fromInt(deadlineAdjustCount)
      parsedOverdueAdjustCount <- AdjustmentCount.fromInt(overdueAdjustCount)
    yield DeadlineAdjustmentStats(parsedDeadlineAdjustCount, parsedOverdueAdjustCount)

  extension (value: DeadlineAdjustmentStats)
    def incrementDeadline: DeadlineAdjustmentStats =
      value.copy(deadlineAdjustCount = value.deadlineAdjustCount.increment)

    def incrementOverdue: DeadlineAdjustmentStats =
      value.copy(overdueAdjustCount = value.overdueAdjustCount.increment)

enum TaskStatus:
  case Active
  case Done

object TaskStatus:
  def toString(value: TaskStatus): String =
    value match
      case TaskStatus.Active => "active"
      case TaskStatus.Done   => "done"

  def fromString(raw: String): Either[String, TaskStatus] =
    raw match
      case "active" => Right(TaskStatus.Active)
      case "done"   => Right(TaskStatus.Done)
      case other    => Left(s"Unknown task status: $other")

sealed trait TaskLogEntry:
  def id: TaskId
  def title: TaskTitle
  def note: TaskNote
  def tags: Vector[TaskTag]
  def weight: TaskWeight
  def deadline: TaskDeadline
  def deadlineStats: DeadlineAdjustmentStats
  def createdAt: IsoDateTime
  def status: TaskStatus
  def completedAt: Option[IsoDateTime]

  final def deadlineAdjustCount: AdjustmentCount =
    deadlineStats.deadlineAdjustCount

  final def overdueAdjustCount: AdjustmentCount =
    deadlineStats.overdueAdjustCount

object TaskLogEntry:
  final case class Active private[objects] (
      id: TaskId,
      title: TaskTitle,
      note: TaskNote,
      tags: Vector[TaskTag],
      weight: TaskWeight,
      deadline: TaskDeadline,
      deadlineStats: DeadlineAdjustmentStats,
      createdAt: IsoDateTime
  ) extends TaskLogEntry:
    override val status: TaskStatus =
      TaskStatus.Active

    override val completedAt: Option[IsoDateTime] =
      None

  final case class Done private[objects] (
      id: TaskId,
      title: TaskTitle,
      note: TaskNote,
      tags: Vector[TaskTag],
      weight: TaskWeight,
      deadline: TaskDeadline,
      deadlineStats: DeadlineAdjustmentStats,
      createdAt: IsoDateTime,
      completedAtValue: IsoDateTime
  ) extends TaskLogEntry:
    override val status: TaskStatus =
      TaskStatus.Done

    override val completedAt: Option[IsoDateTime] =
      Some(completedAtValue)

  def active(
      id: TaskId,
      title: TaskTitle,
      note: TaskNote,
      tags: Vector[TaskTag],
      weight: TaskWeight,
      deadline: TaskDeadline,
      deadlineStats: DeadlineAdjustmentStats,
      createdAt: IsoDateTime
  ): TaskLogEntry =
    Active(id, title, note, tags, weight, deadline, deadlineStats, createdAt)

  def done(
      id: TaskId,
      title: TaskTitle,
      note: TaskNote,
      tags: Vector[TaskTag],
      weight: TaskWeight,
      deadline: TaskDeadline,
      deadlineStats: DeadlineAdjustmentStats,
      createdAt: IsoDateTime,
      completedAt: IsoDateTime
  ): TaskLogEntry =
    Done(id, title, note, tags, weight, deadline, deadlineStats, createdAt, completedAt)

  def fromStored(
      id: TaskId,
      title: TaskTitle,
      note: TaskNote,
      tags: Vector[TaskTag],
      weight: TaskWeight,
      status: TaskStatus,
      deadline: TaskDeadline,
      deadlineStats: DeadlineAdjustmentStats,
      createdAt: IsoDateTime,
      completedAt: Option[IsoDateTime]
  ): Either[String, TaskLogEntry] =
    (status, completedAt) match
      case (TaskStatus.Active, None) =>
        Right(active(id, title, note, tags, weight, deadline, deadlineStats, createdAt))
      case (TaskStatus.Done, Some(doneAt)) =>
        Right(done(id, title, note, tags, weight, deadline, deadlineStats, createdAt, doneAt))
      case (TaskStatus.Active, Some(_)) =>
        Left("Active task cannot have completedAt.")
      case (TaskStatus.Done, None) =>
        Left("Done task must have completedAt.")

final case class TaskDraft(
    title: TaskTitle,
    note: TaskNote,
    tags: Vector[TaskTag],
    weight: TaskWeight,
    deadline: TaskDeadline
)

object TaskDraft:
  def fromRaw(
      title: String,
      note: String,
      tags: Iterable[String],
      weight: Int,
      deadline: String
  ): Either[String, TaskDraft] =
    for
      parsedTitle <- TaskTitle.fromString(title)
      parsedNote <- TaskNote.fromString(note)
      parsedTags <- TaskTag.fromStrings(tags)
      parsedWeight <- TaskWeight.fromInt(weight)
      parsedDeadline <- TaskDeadline.fromString(deadline)
    yield TaskDraft(parsedTitle, parsedNote, parsedTags, parsedWeight, parsedDeadline)
