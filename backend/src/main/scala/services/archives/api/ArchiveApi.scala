package omegalog.services.archives.api

import cats.effect.IO
import omegalog.services.archives.objects.ArchiveBatch
import omegalog.services.archives.tables.ArchiveTable
import omegalog.services.tasklogs.api.{ListTaskLogs, TaskListQuery, TaskLogApi}
import omegalog.services.tasklogs.objects.TaskStatus
import omegalog.services.workspaces.objects.WorkspaceId
import omegalog.system.{ApiError, SystemClock}

sealed trait ArchiveApiMessage

sealed trait ArchiveCommand extends ArchiveApiMessage

final case class ArchiveCompletedEntries(
    workspaceId: WorkspaceId
) extends ArchiveCommand

trait ArchiveApi:
  def archiveCompletedEntries(command: ArchiveCompletedEntries): IO[Either[ApiError, ArchiveBatch]]

object ArchiveApi:
  private[archives] def fromTables(
      taskLogs: TaskLogApi,
      table: ArchiveTable,
      clock: SystemClock
  ): ArchiveApi =
    new ArchiveService(taskLogs, table, clock)

private[archives] final class ArchiveService(
    taskLogs: TaskLogApi,
    table: ArchiveTable,
    clock: SystemClock
) extends ArchiveApi:
  override def archiveCompletedEntries(command: ArchiveCompletedEntries): IO[Either[ApiError, ArchiveBatch]] =
    taskLogs.listTaskLogs(ListTaskLogs(TaskListQuery.byStatus(command.workspaceId, TaskStatus.Done))).flatMap {
      case Left(error) => IO.pure(Left(error))
      case Right(records) =>
        val completedTaskIds =
          records.collect {
            case record if record.entry.status == TaskStatus.Done => record.entry.id
          }
        if completedTaskIds.isEmpty then IO.pure(Left(ApiError.invalidOperation("No completed tasks to archive.")))
        else clock.now.flatMap(now => table.persistBatch(command.workspaceId, completedTaskIds, now))
    }
