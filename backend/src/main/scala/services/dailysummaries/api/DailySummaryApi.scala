package omegalog.services.dailysummaries.api

import cats.effect.IO
import omegalog.services.dailysummaries.objects.*
import omegalog.services.dailysummaries.tables.DailySummaryTable
import omegalog.services.taskhistory.api.{ListTaskChanges, TaskHistoryApi}
import omegalog.services.taskhistory.objects.{TaskChangeEventId, TaskChangeQuery, TaskEventLocalDay}
import omegalog.services.workspaces.objects.WorkspaceId
import omegalog.system.{ApiError, SystemClock}

sealed trait DailySummaryApiMessage

sealed trait DailySummaryCommand extends DailySummaryApiMessage

sealed trait DailySummaryQuery extends DailySummaryApiMessage

final case class DailySummaryRange(
    workspaceId: WorkspaceId,
    fromDay: Option[SummaryDate],
    throughDay: Option[SummaryDate]
)

final case class ListDailySummaries(
    range: DailySummaryRange
) extends DailySummaryQuery

final case class GenerateDailySummary(
    workspaceId: WorkspaceId,
    day: SummaryDate,
    force: Boolean = false
) extends DailySummaryCommand

final case class ReconcileDailySummaries(
    workspaceId: WorkspaceId,
    throughDay: SummaryDate
) extends DailySummaryCommand

final case class DailySummaryReconcileResult(
    generated: Vector[SummaryDate],
    skipped: Vector[SummaryDate],
    failed: Vector[(SummaryDate, ApiError)]
)

trait DailySummaryApi:
  def listSummaries(query: ListDailySummaries): IO[Either[ApiError, Vector[DailySummary]]]

  def generateForDate(command: GenerateDailySummary): IO[Either[ApiError, DailySummary]]

  def reconcileMissing(command: ReconcileDailySummaries): IO[Either[ApiError, DailySummaryReconcileResult]]

object DailySummaryApi:
  private[dailysummaries] def fromTables(
      history: TaskHistoryApi,
      table: DailySummaryTable,
      clock: SystemClock
  ): DailySummaryApi =
    new DailySummaryService(history, table, clock)

private[dailysummaries] final class DailySummaryService(
    history: TaskHistoryApi,
    table: DailySummaryTable,
    clock: SystemClock
) extends DailySummaryApi:
  override def listSummaries(query: ListDailySummaries): IO[Either[ApiError, Vector[DailySummary]]] =
    table.list(query.range)

  override def generateForDate(command: GenerateDailySummary): IO[Either[ApiError, DailySummary]] =
    val localDay = TaskEventLocalDay.fromDate(command.day.asLocalDate)
    val historyQuery = TaskChangeQuery(command.workspaceId, Some(localDay), Some(localDay))
    history.listChanges(ListTaskChanges(historyQuery)).flatMap {
      case Left(error) => IO.pure(Left(error))
      case Right(events) =>
        clock.now.flatMap { now =>
          table.upsert(command.workspaceId, DailySummaryDrafts.local(command.day, events.map(_.eventId), now.toString))
        }
    }

  override def reconcileMissing(command: ReconcileDailySummaries): IO[Either[ApiError, DailySummaryReconcileResult]] =
    generateForDate(GenerateDailySummary(command.workspaceId, command.throughDay)).map {
      case Left(error)    => Left(error)
      case Right(summary) => Right(DailySummaryReconcileResult(Vector(summary.day), Vector.empty, Vector.empty))
    }

private object DailySummaryDrafts:
  def local(day: SummaryDate, eventIds: Vector[omegalog.services.taskhistory.objects.TaskChangeEventId], generatedAt: String): DailySummary =
    val sourceHashInput = eventIds.map(TaskChangeEventId.toString).sorted.mkString("|")
    val sourceHash = SourceHash.fromString(s"events:$sourceHashInput").toOption.get
    DailySummary(
      summaryId = DailySummaryId.fromSummaryDate(day),
      day = day,
      timeZone = "server-local",
      generatedAt = generatedAt,
      provider = SummaryProviderMetadata(SummaryProviderKind.LocalCritical, "deterministic-local", "critical-daily-v1"),
      source = DailySummarySource(eventIds, sourceHash, if eventIds.isEmpty then "empty-day" else "event-log"),
      stats = DailySummaryStats(0, 0, 0, 0, 0, eventIds.size),
      content = DailySummaryContent(
        headline = s"${SummaryDate.toString(day)} daily summary",
        markdown = s"# ${SummaryDate.toString(day)} Daily Summary",
        risks = Vector.empty,
        nextActions = Vector.empty
      )
    )
