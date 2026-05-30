package omegalog.services.workspaces.api

import cats.effect.IO
import omegalog.services.workspaces.objects.*
import omegalog.services.workspaces.tables.{WorkspaceRow, WorkspaceTable}
import omegalog.system.{ApiError, IdGenerator}

sealed trait WorkspaceApiMessage

sealed trait WorkspaceCommand extends WorkspaceApiMessage

final case class OpenWorkspace(
    displayName: WorkspaceName,
    storageRef: WorkspaceStorageRef
) extends WorkspaceCommand

final case class ImportWorkspaceSnapshot(
    snapshot: WorkspaceSnapshot
) extends WorkspaceCommand

trait WorkspaceApi:
  def openLocalFolder(command: OpenWorkspace): IO[Either[ApiError, WorkspaceSnapshot]]

  def importWorkspaceSnapshot(command: ImportWorkspaceSnapshot): IO[Either[ApiError, WorkspaceSnapshot]]

object WorkspaceApi:
  private[workspaces] def fromTables(
      table: WorkspaceTable,
      workspaceIds: IdGenerator[WorkspaceId]
  ): WorkspaceApi =
    new WorkspaceService(table, workspaceIds)

private[workspaces] final class WorkspaceService(
    table: WorkspaceTable,
    workspaceIds: IdGenerator[WorkspaceId]
) extends WorkspaceApi:
  override def openLocalFolder(command: OpenWorkspace): IO[Either[ApiError, WorkspaceSnapshot]] =
    workspaceIds.nextId.flatMap { id =>
      val row = WorkspaceRow.fromOpen(id, command.displayName, command.storageRef)
      table.open(row).map {
        case Left(error) => Left(error)
        case Right(savedRow) =>
          WorkspaceRow
            .toSnapshot(savedRow, records = Vector.empty, warnings = Vector.empty)
            .left
            .map(ApiError.invalidInput)
      }
    }

  override def importWorkspaceSnapshot(
      command: ImportWorkspaceSnapshot
  ): IO[Either[ApiError, WorkspaceSnapshot]] =
    table.saveSnapshot(command.snapshot).map {
      case Left(error) => Left(error)
      case Right(_)    => Right(command.snapshot)
    }
