package omegalog.services.workspaces.objects

import omegalog.services.tasklogs.objects.TaskLogEntry

opaque type WorkspaceId = String

object WorkspaceId:
  def fromString(raw: String): Either[String, WorkspaceId] =
    val value = raw.trim
    if value.isEmpty then Left("Workspace id is required.")
    else if value.length > 128 then Left("Workspace id must be at most 128 characters.")
    else Right(value)

  def toString(value: WorkspaceId): String =
    value

  extension (value: WorkspaceId)
    def asString: String =
      value

opaque type WorkspaceName = String

object WorkspaceName:
  def fromString(raw: String): Either[String, WorkspaceName] =
    val value = raw.trim
    if value.isEmpty then Right("workspace")
    else if value.length > 120 then Right(value.take(120))
    else Right(value)

  def toString(value: WorkspaceName): String =
    value

  extension (value: WorkspaceName)
    def asString: String =
      value

opaque type WorkspaceStorageRef = String

object WorkspaceStorageRef:
  def fromString(raw: String): Either[String, WorkspaceStorageRef] =
    val value = raw.trim
    if value.isEmpty then Left("Workspace storage reference is required.")
    else Right(value)

  def toString(value: WorkspaceStorageRef): String =
    value

  extension (value: WorkspaceStorageRef)
    def asString: String =
      value

opaque type TaskFileRef = String

object TaskFileRef:
  def fromString(raw: String): Either[String, TaskFileRef] =
    val value = raw.trim
    if value.isEmpty then Left("Task file reference is required.")
    else if value.length > 255 then Left("Task file reference must be at most 255 characters.")
    else Right(value)

  def toString(value: TaskFileRef): String =
    value

  extension (value: TaskFileRef)
    def asString: String =
      value

opaque type TaskStorageLocation = String

object TaskStorageLocation:
  def fromString(raw: String): Either[String, TaskStorageLocation] =
    val value = raw.trim
    if value.isEmpty then Left("Task storage location is required.")
    else Right(value)

  def fromFileRef(value: TaskFileRef): TaskStorageLocation =
    value.asString

  def toString(value: TaskStorageLocation): String =
    value

  extension (value: TaskStorageLocation)
    def asString: String =
      value

final case class ImportWarning(fileName: TaskFileRef, reason: String)

final case class TaskRecord(
    fileName: TaskFileRef,
    storageLocation: TaskStorageLocation,
    entry: TaskLogEntry
)

final case class WorkspaceSnapshot(
    id: WorkspaceId,
    name: WorkspaceName,
    records: Vector[TaskRecord],
    warnings: Vector[ImportWarning]
)
