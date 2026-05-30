package omegalog.services.ai.api

import cats.effect.IO
import omegalog.services.ai.objects.*
import omegalog.system.ApiError

sealed trait AiSummaryApiMessage

sealed trait AiSummaryCommand extends AiSummaryApiMessage

final case class CreateDailySummaryDraft(
    input: DailySummaryDraftInput
) extends AiSummaryCommand

trait AiSummaryProxyApi:
  def createDailySummaryDraft(command: CreateDailySummaryDraft): IO[Either[ApiError, DailySummaryDraft]]
