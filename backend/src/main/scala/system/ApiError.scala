package omegalog.system

enum ApiErrorCode:
  case Unsupported
  case PermissionDenied
  case WorkspaceNotOpen
  case TaskNotFound
  case InvalidOperation
  case FileIo
  case InvalidInput
  case Conflict
  case AiUnavailable
  case AiTimeout
  case AiRateLimited
  case ProviderResponseInvalid

object ApiErrorCode:
  def toString(value: ApiErrorCode): String =
    value match
      case ApiErrorCode.Unsupported       => "unsupported"
      case ApiErrorCode.PermissionDenied  => "permission-denied"
      case ApiErrorCode.WorkspaceNotOpen  => "workspace-not-open"
      case ApiErrorCode.TaskNotFound      => "task-not-found"
      case ApiErrorCode.InvalidOperation  => "invalid-operation"
      case ApiErrorCode.FileIo            => "file-io"
      case ApiErrorCode.InvalidInput      => "invalid-input"
      case ApiErrorCode.Conflict          => "conflict"
      case ApiErrorCode.AiUnavailable     => "ai-unavailable"
      case ApiErrorCode.AiTimeout         => "ai-timeout"
      case ApiErrorCode.AiRateLimited     => "ai-rate-limited"
      case ApiErrorCode.ProviderResponseInvalid => "provider-response-invalid"

  def fromString(value: String): Either[String, ApiErrorCode] =
    value match
      case "unsupported"       => Right(ApiErrorCode.Unsupported)
      case "permission-denied" => Right(ApiErrorCode.PermissionDenied)
      case "workspace-not-open" => Right(ApiErrorCode.WorkspaceNotOpen)
      case "task-not-found"    => Right(ApiErrorCode.TaskNotFound)
      case "invalid-operation" => Right(ApiErrorCode.InvalidOperation)
      case "file-io"           => Right(ApiErrorCode.FileIo)
      case "invalid-input"     => Right(ApiErrorCode.InvalidInput)
      case "conflict"          => Right(ApiErrorCode.Conflict)
      case "ai-unavailable"    => Right(ApiErrorCode.AiUnavailable)
      case "ai-timeout"        => Right(ApiErrorCode.AiTimeout)
      case "ai-rate-limited"   => Right(ApiErrorCode.AiRateLimited)
      case "provider-response-invalid" => Right(ApiErrorCode.ProviderResponseInvalid)
      case other               => Left(s"Unknown API error code: $other")

final case class ApiError(code: ApiErrorCode, message: String)

object ApiError:
  def unsupported(message: String): ApiError =
    ApiError(ApiErrorCode.Unsupported, message)

  def permissionDenied(message: String): ApiError =
    ApiError(ApiErrorCode.PermissionDenied, message)

  def workspaceNotOpen(message: String): ApiError =
    ApiError(ApiErrorCode.WorkspaceNotOpen, message)

  def taskNotFound(message: String): ApiError =
    ApiError(ApiErrorCode.TaskNotFound, message)

  def invalidOperation(message: String): ApiError =
    ApiError(ApiErrorCode.InvalidOperation, message)

  def fileIo(message: String): ApiError =
    ApiError(ApiErrorCode.FileIo, message)

  def invalidInput(message: String): ApiError =
    ApiError(ApiErrorCode.InvalidInput, message)

  def conflict(message: String): ApiError =
    ApiError(ApiErrorCode.Conflict, message)

  def aiUnavailable(message: String): ApiError =
    ApiError(ApiErrorCode.AiUnavailable, message)

  def aiTimeout(message: String): ApiError =
    ApiError(ApiErrorCode.AiTimeout, message)

  def aiRateLimited(message: String): ApiError =
    ApiError(ApiErrorCode.AiRateLimited, message)

  def providerResponseInvalid(message: String): ApiError =
    ApiError(ApiErrorCode.ProviderResponseInvalid, message)
