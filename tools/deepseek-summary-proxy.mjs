import { createServer } from 'node:http';

const port = Number(process.env.OMEGALOG_AI_PROXY_PORT ?? 8787);
const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-pro';
const endpoint = process.env.DEEPSEEK_API_URL ?? 'https://api.deepseek.com/chat/completions';
const allowedOrigins = new Set(
  (process.env.OMEGALOG_AI_PROXY_ORIGINS ?? [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5174',
  ].join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const getCorsHeaders = (request) => {
  const origin = request.headers.origin;
  if (!origin) {
    return {};
  }
  if (!allowedOrigins.has(origin)) {
    return null;
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    Vary: 'Origin',
  };
};

const send = (request, response, status, payload) => {
  const corsHeaders = getCorsHeaders(request);
  if (corsHeaders === null) {
    response.writeHead(403, {
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ error: 'origin not allowed' }));
    return;
  }

  response.writeHead(status, {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('request body too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });

const buildPrompt = (input) => {
  const compactEvents = (input.events ?? []).map((event) => ({
    type: event.eventType,
    occurredAt: event.occurredAt,
    taskIds: event.taskIds,
    before: event.before?.map(stripSnapshot) ?? [],
    after: event.after?.map(stripSnapshot) ?? [],
    changedFields: event.changedFields,
  }));
  return [
    '你是 OMEGALOG 的每日复盘审计员。',
    '请基于给定任务事件写一份严格、批判、但不编造事实的中文日报。',
    '只输出 JSON，字段必须是 headline, markdown, risks, nextActions。',
    'markdown 必须包含：数据事实、问题判断、明日行动。不要提到没有证据的事情。',
    '',
    JSON.stringify(
      {
        day: input.day,
        events: compactEvents,
        localDraft: input.localDraft?.content,
      },
      null,
      2,
    ),
  ].join('\n');
};

const stripSnapshot = (snapshot) => ({
  title: snapshot.title,
  tags: snapshot.tags,
  weight: snapshot.weight,
  status: snapshot.status,
  deadline: snapshot.deadline,
  completedAt: snapshot.completedAt,
});

const isSummaryContent = (value) =>
  value &&
  typeof value === 'object' &&
  typeof value.headline === 'string' &&
  typeof value.markdown === 'string' &&
  Array.isArray(value.risks) &&
  Array.isArray(value.nextActions);

const createDraft = async (input) => {
  if (!apiKey) {
    throw Object.assign(new Error('DEEPSEEK_API_KEY is not configured.'), { status: 503 });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You generate strict Chinese daily review reports as valid JSON only.',
        },
        { role: 'user', content: buildPrompt(input) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1600,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`DeepSeek request failed: ${response.status} ${text}`), {
      status: response.status,
    });
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  const parsed = typeof content === 'string' ? JSON.parse(content) : null;
  if (!isSummaryContent(parsed)) {
    throw Object.assign(new Error('DeepSeek response did not match DailySummaryContent.'), {
      status: 502,
    });
  }
  return parsed;
};

const server = createServer(async (request, response) => {
  if (getCorsHeaders(request) === null) {
    send(request, response, 403, { error: 'origin not allowed' });
    return;
  }
  if (request.method === 'OPTIONS') {
    send(request, response, 204, {});
    return;
  }
  if (request.method !== 'POST' || request.url !== '/api/ai/daily-summary-draft') {
    send(request, response, 404, { error: 'not found' });
    return;
  }

  try {
    const input = JSON.parse(await readBody(request));
    const draft = await createDraft(input);
    send(request, response, 200, draft);
  } catch (error) {
    send(request, response, error.status ?? 500, {
      error: error instanceof Error ? error.message : 'unknown error',
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`OMEGALOG DeepSeek summary proxy listening on http://127.0.0.1:${port}`);
});
