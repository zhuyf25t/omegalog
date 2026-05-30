package omegalog.services.archives.tables

import cats.effect.IO
import omegalog.services.archives.objects.ArchiveBatch
import omegalog.services.tasklogs.objects.TaskId
import omegalog.services.workspaces.objects.WorkspaceId
import omegalog.system.ApiError

import java.time.Instant

private[archives] final case class ArchiveBatchRow(
    workspaceId: String,
    archivedTaskIds: Vector[String],
    archivedCount: Int,
    archivedAt: String
)

private[archives] object ArchiveBatchRow:
  def fromBatch(workspaceId: WorkspaceId, batch: ArchiveBatch, archivedAt: Instant): ArchiveBatchRow =
    ArchiveBatchRow(
      workspaceId = WorkspaceId.toString(workspaceId),
      archivedTaskIds = batch.archivedIds.map(TaskId.toString),
      archivedCount = batch.archivedCount,
      archivedAt = archivedAt.toString
    )

  def toBatch(row: ArchiveBatchRow): Either[String, ArchiveBatch] =
    if row.archivedCount != row.archivedTaskIds.size then Left("Archive count does not match archived ids.")
    else
      row.archivedTaskIds.foldLeft[Either[String, Vector[TaskId]]](Right(Vector.empty)) {
        case (Left(error), _) => Left(error)
        case (Right(ids), rawId) => TaskId.fromString(rawId).map(ids :+ _)
      }.map(ArchiveBatch(_))

private[archives] trait ArchiveTable:
  def persistBatch(
      workspaceId: WorkspaceId,
      archivedTaskIds: Vector[TaskId],
      archivedAt: Instant
  ): IO[Either[ApiError, ArchiveBatch]]
