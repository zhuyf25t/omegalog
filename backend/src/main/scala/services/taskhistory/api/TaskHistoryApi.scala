package omegalog.services.taskhistory.api

import cats.effect.IO
import omegalog.services.taskhistory.objects.*
import omegalog.services.taskhistory.tables.TaskHistoryTable
import omegalog.system.ApiError

sealed trait TaskHistoryApiMessage

sealed trait TaskHistoryCommand extends TaskHistoryApiMessage

sealed trait TaskHistoryQuery extends TaskHistoryApiMessage

final case class RecordTaskChange(
    event: TaskChangeEvent
) extends TaskHistoryCommand

final case class ListTaskChanges(
    query: TaskChangeQuery
) extends TaskHistoryQuery

trait TaskHistoryApi:
  def recordChange(command: RecordTaskChange): IO[Either[ApiError, TaskChangeEvent]]

  def listChanges(query: ListTaskChanges): IO[Either[ApiError, Vector[TaskChangeEvent]]]

object TaskHistoryApi:
  private[taskhistory] def fromTables(table: TaskHistoryTable): TaskHistoryApi =
    new TaskHistoryService(table)

private[taskhistory] final class TaskHistoryService(table: TaskHistoryTable) extends TaskHistoryApi:
  override def recordChange(command: RecordTaskChange): IO[Either[ApiError, TaskChangeEvent]] =
    table.append(command.event)

  override def listChanges(query: ListTaskChanges): IO[Either[ApiError, Vector[TaskChangeEvent]]] =
    table.list(query.query)
