import { requestAiSummaryDraft } from './summaryGenerationClient';
import { buildLocalCriticalSummary } from '../domain/dailySummaryReport';
import { type SummaryDate } from '../domain/summaryDate';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const day = '2026-05-29' as SummaryDate;
const localDraft = buildLocalCriticalSummary(day, [], new Date(0));
const input = { day, events: [], localDraft };

globalThis.window = {
  __OMEGALOG_AI_PROXY_URL__: 'http://127.0.0.1:8787/test-ai',
} as unknown as Window & typeof globalThis;

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
  assert(init?.method === 'POST', 'AI draft client uses POST');
  assert(
    JSON.stringify(init?.headers).includes('Content-Type') ||
      (init?.headers instanceof Headers && init.headers.has('Content-Type')),
    'AI draft client sends JSON content type',
  );
  assert(!('credentials' in (init ?? {})), 'AI draft client must not send credentials');
  return Response.json({
    headline: 'AI headline',
    markdown: '# AI markdown',
    risks: ['risk'],
    nextActions: ['action'],
  });
}) as typeof fetch;

const success = await requestAiSummaryDraft(input);
assert(success?.headline === 'AI headline', 'AI draft client accepts valid summary content');

globalThis.fetch = (async () => Response.json({ headline: 'missing arrays' })) as typeof fetch;
const invalid = await requestAiSummaryDraft(input);
assert(invalid === null, 'AI draft client rejects invalid provider content');

globalThis.fetch = (async () =>
  new Response(JSON.stringify({ error: 'provider failed' }), { status: 502 })) as typeof fetch;
const failed = await requestAiSummaryDraft(input);
assert(failed === null, 'AI draft client falls back on provider failure');

globalThis.fetch = originalFetch;

console.log('summary generation client tests passed');
