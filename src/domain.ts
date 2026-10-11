export type TaskStatus = 'active' | 'done';
export type Filter = 'all' | TaskStatus;
export const sortOptions = [
  ['priority', '优先级：高 → 低'], ['priority-low', '优先级：低 → 高'],
  ['deadline', '截止时间：早 → 晚'], ['deadline-late', '截止时间：晚 → 早'],
  ['newest', '创建时间：新 → 旧'], ['oldest', '创建时间：旧 → 新'],
] as const;
export type Sort = typeof sortOptions[number][0];
type TaskBase = { id: string; title: string; note: string; tags: string[]; priority: number; deadline: string; createdAt: string };
export type Task = TaskBase & ({ status: 'active'; completedAt: null } | { status: 'done'; completedAt: string });
export type Draft = Pick<Task, 'title' | 'note' | 'tags' | 'priority' | 'deadline'>;

export function toggleTask(task: Task, now: string): Task {
  return task.status === 'active' ? { ...task, status: 'done', completedAt: now } : { ...task, status: 'active', completedAt: null };
}
export function selectTasks(tasks: Task[], filter: Filter, query: string, sort: Sort): Task[] {
  const text = query.trim().toLocaleLowerCase();
  return tasks.filter(t => (filter === 'all' || t.status === filter) && `${t.title} ${t.note} ${t.tags.join(' ')}`.toLocaleLowerCase().includes(text)).sort((a, b) => {
    let difference = 0;
    if (sort === 'priority' || sort === 'priority-low') difference = (b.priority - a.priority) * (sort === 'priority' ? 1 : -1);
    else if (sort === 'deadline' || sort === 'deadline-late') difference = (Date.parse(a.deadline) - Date.parse(b.deadline)) * (sort === 'deadline' ? 1 : -1);
    else difference = (Date.parse(b.createdAt) - Date.parse(a.createdAt)) * (sort === 'newest' ? 1 : -1);
    return difference || Date.parse(a.deadline) - Date.parse(b.deadline) || a.id.localeCompare(b.id);
  });
}
export function focusTask(tasks: Task[]): Task | undefined { return selectTasks(tasks, 'active', '', 'priority')[0]; }
export function parseTasks(raw: string): Task[] {
  const value: unknown = JSON.parse(raw.replace(/^\uFEFF/, ''));
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('tasks' in value) || !Array.isArray(value.tasks)) throw new Error('任务数据格式不正确');
  const ids = new Set<string>();
  const tasks: Task[] = [];
  for (const item of value.tasks) {
    if (!item || typeof item !== 'object') throw new Error('任务记录无效');
    const t = item as Record<string, unknown>;
    if (typeof t.id !== 'string' || !t.id || ids.has(t.id) || typeof t.title !== 'string' || !t.title.trim() || typeof t.note !== 'string' || !Array.isArray(t.tags) || !t.tags.every(x => typeof x === 'string') || typeof t.priority !== 'number' || !Number.isInteger(t.priority) || t.priority < 1 || t.priority > 10 || typeof t.deadline !== 'string' || !Number.isFinite(Date.parse(t.deadline)) || typeof t.createdAt !== 'string' || !Number.isFinite(Date.parse(t.createdAt))) throw new Error('任务记录无效');
    if (!(t.status === 'active' && t.completedAt === null) && !(t.status === 'done' && typeof t.completedAt === 'string' && Number.isFinite(Date.parse(t.completedAt)))) throw new Error('任务状态无效');
    ids.add(t.id);
    const base = { id: t.id, title: t.title, note: t.note, tags: [...t.tags] as string[], priority: t.priority, deadline: t.deadline, createdAt: t.createdAt };
    tasks.push(t.status === 'active' ? { ...base, status: 'active', completedAt: null } : { ...base, status: 'done', completedAt: t.completedAt as string });
  }
  return tasks;
}
export type ImportMode = 'merge' | 'replace';
export function parseImport(raw: string): Task[] {
  let value: unknown;
  try { value = JSON.parse(raw.replace(/^\uFEFF/, '')); }
  catch { throw new Error('文件不是有效的 JSON，请选择导出的任务备份。'); }
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  let items: unknown[];
  if (record && 'version' in record) return parseTasks(raw);
  if (Array.isArray(value)) items = value;
  else if (record && typeof record.id === 'string' && typeof record.title === 'string') items = [record];
  else throw new Error('请选择任务备份、任务数组或旧版 OmegaLog 的单条任务 JSON。');
  // The original OmegaLog stores one task per JSON and calls priority "weight".
  const normalized = items.map(item => {
    if (!item || typeof item !== 'object') throw new Error('任务记录无效');
    const t = item as Record<string, unknown>;
    return { ...t, priority: t.priority ?? t.weight, note: t.note ?? '', tags: t.tags ?? [] };
  });
  return parseTasks(JSON.stringify({ version: 1, tasks: normalized }));
}
export function importTasks(current: Task[], incoming: Task[], mode: ImportMode): Task[] {
  if (mode === 'replace') return [...incoming];
  const ids = new Set(current.map(t => t.id));
  return [...current, ...incoming.filter(t => !ids.has(t.id))];
}
export function localInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function defaultDeadline(): string { const d = new Date(); d.setHours(23, 59, 0, 0); return localInput(d); }
export function seedTasks(now = new Date()): Task[] {
  const due = (days: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(23, 59, 0, 0); return d.toISOString(); };
  const createdAt = now.toISOString();
  return [
    { id: 'sample-homework', title: '完成无代码课程作业', note: '把想象中的云海，变成真正可以使用的小网站。', tags: ['学习', '课程作业'], priority: 9, deadline: due(0), createdAt, status: 'active', completedAt: null },
    { id: 'sample-reading', title: '读完《小王子》的一章', note: '慢一点，留意那些值得记住的句子。', tags: ['阅读'], priority: 5, deadline: due(1), createdAt, status: 'active', completedAt: null },
    { id: 'sample-ideas', title: '整理这一周的小灵感', note: '给零散的想法找一个舒服的位置。', tags: ['生活', '灵感'], priority: 3, deadline: due(3), createdAt, status: 'active', completedAt: null },
    { id: 'sample-break', title: '给自己留十分钟发呆', note: '今天也有好好照顾自己。', tags: ['休息'], priority: 2, deadline: due(0), createdAt, status: 'done', completedAt: createdAt },
  ];
}
