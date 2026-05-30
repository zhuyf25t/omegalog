package omegalog.services.ai.objects

import omegalog.services.dailysummaries.objects.DailySummaryContent
import omegalog.services.taskhistory.objects.TaskChangeEvent

opaque type SecretRef = String

object SecretRef:
  def fromEnvName(raw: String): Either[String, SecretRef] =
    val value = raw.trim
    if value.matches("^[A-Z0-9_]{3,128}$") then Right(value)
    else Left("Secret ref must be an environment variable name.")

  def toString(value: SecretRef): String =
    value

enum AiProviderKind:
  case DeepSeek

final case class AiProvider(
    kind: AiProviderKind,
    model: String,
    secretRef: SecretRef
)

final case class DailySummaryDraftInput(
    day: String,
    events: Vector[TaskChangeEvent],
    localDraft: DailySummaryContent
)

final case class DailySummaryDraft(
    content: DailySummaryContent
)
