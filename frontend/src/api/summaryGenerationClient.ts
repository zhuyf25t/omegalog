import type {
  DailySummary,
  DailySummaryContent,
} from '../domain/dailySummary';
import type { SummaryDate } from '../domain/summaryDate';
import type { TaskChangeEvent } from '../domain/taskHistory';

export interface DailySummaryDraftInput {
  readonly day: SummaryDate;
  readonly events: readonly TaskChangeEvent[];
  readonly localDraft: DailySummary;
}

type AiProxyWindow = Window & {
  readonly __OMEGALOG_AI_PROXY_URL__?: string;
};

const defaultProxyUrl = 'http://127.0.0.1:8787/api/ai/daily-summary-draft';

export const requestAiSummaryDraft = async (
  input: DailySummaryDraftInput,
): Promise<DailySummaryContent | null> => {
  const proxyUrl = (window as AiProxyWindow).__OMEGALOG_AI_PROXY_URL__ ?? defaultProxyUrl;

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: input.day,
        events: input.events,
        localDraft: input.localDraft,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const parsed: unknown = await response.json();
    if (!isSummaryContent(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const isSummaryContent = (value: unknown): value is DailySummaryContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.headline === 'string' &&
    typeof record.markdown === 'string' &&
    Array.isArray(record.risks) &&
    Array.isArray(record.nextActions)
  );
};
