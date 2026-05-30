import { buildLocalCriticalSummary, buildSourceHash, getSummaryStats } from './dailySummaryReport';
import {
  getNextLocalMidnightDelayMs,
  selectEventsForDay,
  selectMissingSummaryDates,
} from './dailySummarySelectors';
import { type SummaryDate } from './summaryDate';
import { createTaskId, type TaskId } from './taskLog';
import { type TaskChangeEvent, type TaskChangeEventId } from './taskHistory';

const taskId = (value: string): TaskId => {
  const parsed = createTaskId(value);
  if (!parsed.ok) {
    throw new Error(`invalid test task id: ${value}`);
  }
  return parsed.value;
};

const day = (value: string): SummaryDate => value as SummaryDate;
const eventId = (value: string): TaskChangeEventId => value as TaskChangeEventId;

const event = (
  id: string,
  eventType: TaskChangeEvent['eventType'],
  localDay: SummaryDate,
  taskIds: readonly TaskId[],
): TaskChangeEvent => ({
  schemaVersion: 1,
  eventId: eventId(id),
  eventType,
  sourceApi: 'test',
  occurredAt: `${localDay}T09:00:00.000Z`,
  localDay,
  timeZone: 'Asia/Shanghai',
  taskIds,
  before: [],
  after: [],
  changedFields: [],
});

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEqual = <T>(actual: T, expected: T, message: string): void => {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
};

const assertArrayEqual = <T>(
  actual: readonly T[],
  expected: readonly T[],
  message: string,
): void => {
  assertEqual(JSON.stringify(actual), JSON.stringify(expected), message);
};

const taskA = taskId('taska001');
const taskB = taskId('taskb001');
const events = [
  event('evt_001', 'created', day('2026-05-27'), [taskA]),
  event('evt_002', 'updated', day('2026-05-28'), [taskA]),
  event('evt_003', 'completed', day('2026-05-28'), [taskA]),
  event('evt_004', 'reactivated', day('2026-05-29'), [taskB]),
];

const stats = getSummaryStats(events);
assertEqual(stats.created, 1, 'created count');
assertEqual(stats.updated, 1, 'updated count');
assertEqual(stats.completed, 1, 'completed count');
assertEqual(stats.reactivated, 1, 'reactivated count');
assertEqual(stats.archived, 0, 'archived count');
assertEqual(stats.touchedTasks, 2, 'touched task count');

assertEqual(
  buildSourceHash(events),
  buildSourceHash([...events].reverse()),
  'source hash is order independent',
);
assert(
  buildSourceHash(events) !==
    buildSourceHash([...events, event('evt_005', 'archived', day('2026-05-29'), [taskA])]),
  'source hash changes when input events change',
);

assertArrayEqual(
  selectEventsForDay(events, day('2026-05-28')).map((item) => item.eventId),
  [eventId('evt_002'), eventId('evt_003')],
  'events for day stay ordered',
);

const existingSummary = buildLocalCriticalSummary(day('2026-05-27'), [events[0]], new Date(0));
assertArrayEqual(
  selectMissingSummaryDates(events, [existingSummary], day('2026-05-29')),
  [day('2026-05-28'), day('2026-05-29')],
  'missing summary dates continue after latest summary',
);
assertArrayEqual(
  selectMissingSummaryDates(events, [], day('2026-05-29')),
  [day('2026-05-27'), day('2026-05-28'), day('2026-05-29')],
  'missing summary dates start from first event when no summaries exist',
);
assertArrayEqual(
  selectMissingSummaryDates(events, [], day('2026-05-26')),
  [],
  'missing summary dates stop when through day is before first event',
);
assertArrayEqual(
  selectMissingSummaryDates(events, [existingSummary, buildLocalCriticalSummary(day('2026-05-29'), [events[3]], new Date(0))], day('2026-05-29')),
  [day('2026-05-28')],
  'missing summary dates include middle gaps',
);

assertEqual(
  getNextLocalMidnightDelayMs(new Date(2026, 4, 30, 23, 59, 0, 0)),
  62_000,
  'midnight scheduler waits until 00:00:02 local time',
);
assertEqual(
  getNextLocalMidnightDelayMs(new Date(2026, 4, 30, 0, 0, 1, 500)),
  86_400_500,
  'midnight scheduler schedules the next day after midnight',
);

const emptySummary = buildLocalCriticalSummary(day('2026-05-30'), [], new Date(0));
assertEqual(emptySummary.source.inputCompleteness, 'empty-day', 'empty-day completeness');
assert(emptySummary.content.risks.length > 0, 'empty-day summary has critical risks');

console.log('daily summary tests passed');
