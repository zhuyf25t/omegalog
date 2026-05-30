package omegalog.services.archives.objects

import omegalog.services.tasklogs.objects.TaskId

final case class ArchiveBatch(archivedIds: Vector[TaskId]):
  def archivedCount: Int =
    archivedIds.size

object ArchiveBatch:
  val empty: ArchiveBatch =
    ArchiveBatch(Vector.empty)
