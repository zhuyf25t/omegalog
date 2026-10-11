import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusTask, importTasks, parseImport, parseTasks, seedTasks, selectTasks, toggleTask } from './domain.ts';
test('完成及重新开启保持任务内容，完成时间与状态一致', () => {
  const task = seedTasks(new Date('2026-10-11T12:00:00+08:00'))[0];
  const done = toggleTask(task, '2026-10-11T05:00:00Z');
  assert.equal(done.status, 'done'); assert.equal(done.completedAt, '2026-10-11T05:00:00Z');
  assert.deepEqual(toggleTask(done, '2026-10-11T06:00:00Z'), task);
});
test('六种排序按所选字段跨状态排序，而非固定把完成项放最后', () => {
  const [base] = seedTasks();
  const a = { ...base, id: 'a', priority: 3, deadline: '2026-11-03T00:00:00Z', createdAt: '2026-10-01T00:00:00Z' };
  const b = toggleTask({ ...base, id: 'b', priority: 10, deadline: '2026-11-01T00:00:00Z', createdAt: '2026-10-03T00:00:00Z' }, '2026-10-04T00:00:00Z');
  const c = { ...base, id: 'c', priority: 5, deadline: '2026-11-02T00:00:00Z', createdAt: '2026-10-02T00:00:00Z' };
  const tasks = [a, b, c];
  for (const sort of ['priority', 'deadline', 'newest'] as const) assert.deepEqual(selectTasks(tasks, 'all', '', sort).map(t => t.id), ['b', 'c', 'a']);
  for (const sort of ['priority-low', 'deadline-late', 'oldest'] as const) assert.deepEqual(selectTasks(tasks, 'all', '', sort).map(t => t.id), ['a', 'c', 'b']);
  assert.deepEqual(tasks.map(t => t.id), ['a', 'b', 'c']);
});
test('导入兼容备份、数组、旧版 weight；合并保留本机同 ID，替换按文件', () => {
  const tasks = seedTasks();
  assert.deepEqual(parseImport('\uFEFF' + JSON.stringify({ version: 1, tasks })), tasks);
  assert.deepEqual(parseImport(JSON.stringify(tasks)), tasks);
  const { priority, ...legacy } = tasks[0];
  assert.deepEqual(parseImport(JSON.stringify({ ...legacy, weight: priority })), [tasks[0]]);
  const changed = { ...tasks[0], title: '同 ID 的其他内容' };
  const next = { ...tasks[1], id: 'new-task' };
  assert.deepEqual(importTasks(tasks, [changed, next], 'merge'), [...tasks, next]);
  assert.deepEqual(importTasks(tasks, [changed, next], 'replace'), [changed, next]);
  assert.deepEqual(importTasks(tasks, [], 'replace'), []);
  assert.throws(() => parseImport('{broken'));
  assert.throws(() => parseImport(JSON.stringify({ api_key: 'not-a-task' })));
  assert.throws(() => parseImport(JSON.stringify({ version: 2, tasks })));
  assert.throws(() => parseImport(JSON.stringify([tasks[0], tasks[0]])));
});
test('焦点从未完成任务按优先级选择，搜索覆盖标签与备注', () => {
  const tasks = seedTasks();
  assert.equal(focusTask(tasks)?.id, 'sample-homework');
  assert.equal(selectTasks(tasks, 'active', '灵感', 'priority')[0].id, 'sample-ideas');
  assert.equal(selectTasks(tasks, 'done', '', 'priority').length, 1);
  assert.equal(focusTask(tasks.map(t => t.status === 'active' ? toggleTask(t, new Date().toISOString()) : t)), undefined);
});
test('备份可往返，损坏状态及重复身份不能覆盖数据', () => {
  const tasks = seedTasks();
  assert.deepEqual(parseTasks(JSON.stringify({ version: 1, tasks })), tasks);
  assert.throws(() => parseTasks(JSON.stringify({ version: 1, tasks: [tasks[0], tasks[0]] })));
  assert.throws(() => parseTasks(JSON.stringify({ version: 1, tasks: [{ ...tasks[0], completedAt: 'invalid' }] })));
  assert.throws(() => parseTasks(JSON.stringify({ version: 1, tasks: [{ ...tasks[0], priority: 100 }] })));
});
