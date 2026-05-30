package omegalog.services.dailysummaries.objects

import omegalog.services.taskhistory.objects.TaskChangeEventId

import java.time.LocalDate
import java.time.format.DateTimeParseException

opaque type SummaryDate = LocalDate

object SummaryDate:
  def fromDate(value: LocalDate): SummaryDate =
    value

  def fromString(raw: String): Either[String, SummaryDate] =
    try Right(LocalDate.parse(raw.trim))
    catch case _: DateTimeParseException => Left("Summary date is invalid.")

  def toString(value: SummaryDate): String =
    value.toString

  extension (value: SummaryDate)
    def asLocalDate: LocalDate =
      value

opaque type DailySummaryId = String

object DailySummaryId:
  def fromSummaryDate(day: SummaryDate): DailySummaryId =
    s"daily_${SummaryDate.toString(day)}"

  def toString(value: DailySummaryId): String =
    value

opaque type SourceHash = String

object SourceHash:
  def fromString(raw: String): Either[String, SourceHash] =
    val value = raw.trim
    if value.isEmpty then Left("Source hash is required.")
    else Right(value)

  def toString(value: SourceHash): String =
    value

enum SummaryProviderKind:
  case LocalCritical
  case AiProxy

final case class SummaryProviderMetadata(
    kind: SummaryProviderKind,
    model: String,
    promptVersion: String
)

final case class DailySummaryStats(
    created: Int,
    updated: Int,
    completed: Int,
    reactivated: Int,
    archived: Int,
    touchedTasks: Int
)

final case class DailySummaryContent(
    headline: String,
    markdown: String,
    risks: Vector[String],
    nextActions: Vector[String]
)

final case class DailySummarySource(
    eventIds: Vector[TaskChangeEventId],
    sourceHash: SourceHash,
    inputCompleteness: String
)

final case class DailySummary(
    summaryId: DailySummaryId,
    day: SummaryDate,
    timeZone: String,
    generatedAt: String,
    provider: SummaryProviderMetadata,
    source: DailySummarySource,
    stats: DailySummaryStats,
    content: DailySummaryContent
)

enum SummaryRunStatus:
  case Planned
  case Running
  case Succeeded
  case Failed
  case Skipped
