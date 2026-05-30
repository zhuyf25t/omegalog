package omegalog.services.dailysummaries.tables

import cats.effect.IO
import omegalog.services.dailysummaries.api.DailySummaryRange
import omegalog.services.dailysummaries.objects.*
import omegalog.services.workspaces.objects.WorkspaceId
import omegalog.system.ApiError

private[dailysummaries] final case class DailySummaryRow(
    workspaceId: String,
    summaryId: String,
    day: String,
    sourceHash: String,
    providerKind: String,
    promptVersion: String,
    generatedAt: String,
    markdown: String
)

private[dailysummaries] trait DailySummaryTable:
  def list(range: DailySummaryRange): IO[Either[ApiError, Vector[DailySummary]]]

  def upsert(workspaceId: WorkspaceId, summary: DailySummary): IO[Either[ApiError, DailySummary]]
