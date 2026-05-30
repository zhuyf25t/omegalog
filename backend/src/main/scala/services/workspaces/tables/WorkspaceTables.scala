package omegalog.services.workspaces.tables

import cats.effect.IO
import omegalog.services.workspaces.objects.*
import omegalog.system.ApiError

private[workspaces] final case class WorkspaceRow(
    id: String,
    displayName: String,
    storageRef: String
)

private[workspaces] object WorkspaceRow:
  def fromOpen(
      id: WorkspaceId,
      displayName: WorkspaceName,
      storageRef: WorkspaceStorageRef
  ): WorkspaceRow =
    WorkspaceRow(
      id = WorkspaceId.toString(id),
      displayName = WorkspaceName.toString(displayName),
      storageRef = WorkspaceStorageRef.toString(storageRef)
    )

  def toSnapshot(
      row: WorkspaceRow,
      records: Vector[TaskRecord],
      warnings: Vector[ImportWarning]
  ): Either[String, WorkspaceSnapshot] =
    for
      id <- WorkspaceId.fromString(row.id)
      displayName <- WorkspaceName.fromString(row.displayName)
      _ <- WorkspaceStorageRef.fromString(row.storageRef)
    yield WorkspaceSnapshot(id, displayName, records, warnings)

private[workspaces] trait WorkspaceTable:
  def open(row: WorkspaceRow): IO[Either[ApiError, WorkspaceRow]]

  def saveSnapshot(snapshot: WorkspaceSnapshot): IO[Either[ApiError, Unit]]

  def loadSnapshot(id: WorkspaceId): IO[Either[ApiError, Option[WorkspaceSnapshot]]]
