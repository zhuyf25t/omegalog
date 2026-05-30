import {
  buildSummaryId,
  type DailySummary,
  type DailySummaryStats,
} from './dailySummary';
import { getLocalTimeZone, type SummaryDate } from './summaryDate';
import type { TaskChangeEvent } from './taskHistory';

export const getSummaryStats = (events: readonly TaskChangeEvent[]): DailySummaryStats => {
  const touchedTasks = new Set<string>();
  const counts = {
    created: 0,
    updated: 0,
    completed: 0,
    reactivated: 0,
    archived: 0,
  };
  for (const event of events) {
    counts[event.eventType] += 1;
    for (const taskId of event.taskIds) {
      touchedTasks.add(taskId);
    }
  }
  return {
    ...counts,
    touchedTasks: touchedTasks.size,
  };
};

export const buildSourceHash = (events: readonly TaskChangeEvent[]): string => {
  const input = events
    .map((event) => `${event.eventId}:${event.eventType}:${event.occurredAt}`)
    .sort()
    .join('|');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const buildLocalCriticalSummary = (
  day: SummaryDate,
  events: readonly TaskChangeEvent[],
  generatedAt = new Date(),
): DailySummary => {
  const stats = getSummaryStats(events);
  const sourceHash = buildSourceHash(events);
  const hasEvents = events.length > 0;
  const headline = hasEvents
    ? `${day} 严格复盘：${stats.touchedTasks} 个任务发生变化，完成 ${stats.completed} 项。`
    : `${day} 严格复盘：没有记录到任务推进。`;
  const risks = buildRisks(stats, hasEvents);
  const nextActions = buildNextActions(stats, hasEvents);

  return {
    schemaVersion: 1,
    summaryId: buildSummaryId(day),
    day,
    timeZone: getLocalTimeZone(),
    generatedAt: generatedAt.toISOString(),
    provider: {
      kind: 'local-critical-v1',
      model: 'deterministic-local',
      promptVersion: 'critical-daily-v1',
    },
    source: {
      eventIds: events.map((event) => event.eventId),
      sourceHash,
      inputCompleteness: hasEvents ? 'event-log' : 'empty-day',
    },
    stats,
    content: {
      headline,
      markdown: buildMarkdown(day, stats, events, risks, nextActions),
      risks,
      nextActions,
    },
  };
};

const buildRisks = (stats: DailySummaryStats, hasEvents: boolean): readonly string[] => {
  if (!hasEvents) {
    return ['没有任务事件记录，说明当天没有形成可审计的推进证据。'];
  }
  const risks: string[] = [];
  if (stats.completed === 0) {
    risks.push('有任务变更但没有完成记录，需要警惕只整理不交付。');
  }
  if (stats.updated > stats.completed + stats.created) {
    risks.push('编辑次数高于新增和完成，可能存在反复改计划但推进不足。');
  }
  if (stats.reactivated > 0) {
    risks.push('存在重新激活任务，说明完成判断可能过早或验收标准不够清晰。');
  }
  return risks.length > 0 ? risks : ['当天记录结构健康，主要风险是继续保持可验证的完成标准。'];
};

const buildNextActions = (stats: DailySummaryStats, hasEvents: boolean): readonly string[] => {
  if (!hasEvents) {
    return ['明天至少创建或完成一个可验证任务，避免日志空转。'];
  }
  const actions = ['为未完成的高优先级任务补充下一步动作和截止时间。'];
  if (stats.completed === 0) {
    actions.unshift('先选择一个最小任务完成，不要继续扩大任务池。');
  }
  if (stats.updated > 0) {
    actions.push('复查被编辑的任务，确认修改是缩小范围而不是推迟压力。');
  }
  return actions;
};

const buildMarkdown = (
  day: SummaryDate,
  stats: DailySummaryStats,
  events: readonly TaskChangeEvent[],
  risks: readonly string[],
  nextActions: readonly string[],
): string => {
  const eventLines =
    events.length > 0
      ? events.slice(0, 12).map((event) => {
          const title = event.after[0]?.title ?? event.before[0]?.title ?? event.taskIds[0];
          return `- ${event.eventType}: ${title}`;
        })
      : ['- 没有任务历史事件。'];

  return [
    `# ${day} 每日严格总结`,
    '',
    '## 数据',
    `- 新增：${stats.created}`,
    `- 更新：${stats.updated}`,
    `- 完成：${stats.completed}`,
    `- 重新激活：${stats.reactivated}`,
    `- 归档：${stats.archived}`,
    `- 触达任务：${stats.touchedTasks}`,
    '',
    '## 事实记录',
    ...eventLines,
    '',
    '## 批判视角',
    ...risks.map((risk) => `- ${risk}`),
    '',
    '## 下一步',
    ...nextActions.map((action) => `- ${action}`),
  ].join('\n');
};
