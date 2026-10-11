import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Feather, Leaf, Pencil, Plus, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';
import { Background } from './Background';
import { TaskDialog } from './TaskDialog';
import { ImportDialog } from './ImportDialog';
import { focusTask, selectTasks, sortOptions, toggleTask, type Draft, type Filter, type Sort, type Task } from './domain';
import { useTaskStorage } from './storage';

const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
function dueText(task: Task, now: number) {
  const diff = Date.parse(task.deadline) - now;
  if (diff < 0) return '已经到期';
  if (diff < 3600000) return '不到一小时';
  if (diff < 86400000) return `还有 ${Math.ceil(diff / 3600000)} 小时`;
  return `还有 ${Math.ceil(diff / 86400000)} 天`;
}
function Brand() { return <a className="brand" href="#/" aria-label="OmegaLog 云间记，返回封面"><Leaf strokeWidth={1.2} /><span>OmegaLog<small>云间记</small></span></a>; }
export default function App() {
  const { tasks, commit, error, blocked, exportData, importData, hasImportBackup } = useTaskStorage();
  const [page, setPage] = useState(window.location.hash.startsWith('#/log') ? 'log' : 'cover');
  const [importOpen, setImportOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('priority');
  const [number, setNumber] = useState(1);
  const [editor, setEditor] = useState<Task | 'new' | null>(null);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<{ text: string; undo?: Task[] } | null>(null);
  useEffect(() => { const onHash = () => { setPage(window.location.hash.startsWith('#/log') ? 'log' : 'cover'); setEditor(null); }; window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 6000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { document.title = page === 'log' ? '我的 Log · OmegaLog 云间记' : 'OmegaLog · 云间记'; }, [page]);
  const active = tasks.filter(t => t.status === 'active').length;
  const done = tasks.length - active;
  const focus = focusTask(tasks);
  const visible = selectTasks(tasks, filter, query, sort);
  const pages = Math.max(1, Math.ceil(visible.length / 5));
  const current = Math.min(number, pages);
  const displayed = visible.slice((current - 1) * 5, current * 5);
  function enter(create = false) {
    window.location.hash = '/log';
    setPage('log');
    if (create) window.setTimeout(() => setEditor('new'), 30);
  }
  function complete(task: Task) {
    if (commit(tasks.map(t => t.id === task.id ? toggleTask(t, new Date().toISOString()) : t))) setToast({ text: task.status === 'active' ? '又完成了一件事，做得很好。' : '已经放回待办，按自己的节奏来。', undo: tasks });
  }
  function remove(task: Task) { if (commit(tasks.filter(t => t.id !== task.id))) setToast({ text: '这件事已从 Log 移除。', undo: tasks }); }
  function save(draft: Draft) {
    const next: Task[] = editor && editor !== 'new' ? tasks.map(t => t.id === editor.id ? { ...t, ...draft } : t) : [{ ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'active', completedAt: null }, ...tasks];
    if (!commit(next)) return false;
    setToast({ text: editor === 'new' ? '记好了，接下来慢慢完成。' : '修改已保存。' }); setEditor(null); setNumber(1); return true;
  }
  return <div className={`app ${page === 'log' ? 'log-page' : 'cover-page'}`}>
    <Background key={page} scene={page === 'log' ? 'workspace' : 'cover'} />
    <header className="site-header"><Brand /><nav aria-label="主导航"><a href="#/log" className={page === 'log' ? 'selected' : ''}>我的 Log{active > 0 && <span className="nav-count">{active}</span>}</a><a href="#/">{page === 'log' ? '回到云海' : '记录每一小步'}</a></nav></header>
    {page === 'cover' ? <main className="cover-content">
      <div className="cover-copy"><p className="eyebrow"><span /> YOUR PACE, YOUR SPACE</p><h1>一件一件，<br />慢慢完成。</h1><p className="cover-description">把待办轻轻记下，把完成好好收藏。<br />让少年与狐狸，陪你走过平常的一天。</p><div className="cover-actions"><button className="button primary" onClick={() => enter()}>进入我的 Log<ArrowRight size={19} /></button><button className="button outlined" onClick={() => enter(true)}>记录一件事<Plus size={18} /></button></div><div className="cover-note"><span className="tiny-line" /> 不必急着抵达，每一步都算数。</div></div>
    </main> : <main className="workspace-main">
      <div className="workspace-heading"><div><p className="eyebrow">A LITTLE PROGRESS, EVERY DAY</p><h1>今天，也向前一点。</h1><p>{new Date(now).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}<span className="dot">·</span>{active ? `有 ${active} 件事，等你慢慢完成` : '待办已清空，享受这一刻吧'}</p></div><div className="workspace-actions"><button className="button quiet import-button" onClick={() => setImportOpen(true)}><Upload size={16} />导入 JSON</button><button className="button quiet export-button" onClick={() => exportData()}><Download size={16} />导出备份</button><button className="button primary" disabled={blocked} onClick={() => setEditor('new')}><Plus size={18} />记录任务</button></div></div>
      {error && <div role="alert" className="storage-error">{error}<button onClick={() => exportData()}>下载备份</button></div>}
      <div className="workspace-grid">
        <aside className="focus-column">
          <section className="focus-panel">
            <div className="focus-art"><img src="/media/cover.png" alt="少年和狐狸坐在云海中的金色叶舟上" /><span className="focus-badge"><Leaf size={13} />此刻，先做这一件</span></div>
            <div className="focus-body"><p className="eyebrow">IN FOCUS <span className="line" /></p><h2>{focus?.title ?? '给自己一点留白'}</h2><p className="focus-note">{focus?.note || (focus ? '从一小步开始，就很好。' : '所有待办都已完成。可以看看云，或者记下新的期待。')}</p>
              {focus ? <><div className="focus-meta"><span><Clock3 size={14} />{dueText(focus, now)}</span><span>优先级 <strong>{focus.priority}</strong></span></div><div className="priority-track" aria-hidden="true"><span style={{ width: `${focus.priority * 10}%` }} /></div><div className="focus-tags">{focus.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="focus-actions"><button className="button outlined" disabled={blocked} onClick={() => setEditor(focus)} aria-label="编辑焦点任务"><Pencil size={15} />编辑</button><button className="button primary" disabled={blocked} onClick={() => complete(focus)}><Check size={17} />标记完成</button></div></> : <button className="button primary" disabled={blocked} onClick={() => setEditor('new')}><Plus size={16} />记下下一件事</button>}
            </div>
          </section>
          <div className="companion-note"><img src="/media/fox.png" alt="陪伴你的小狐狸" /><div><p>“重要的事，值得慢慢来。”</p><span>你的云间小伙伴</span></div></div>
        </aside>
        <section className="list-panel" aria-labelledby="list-title">
          <div className="list-heading"><div><p className="eyebrow">MY LITTLE LOG</p><h2 id="list-title">每件小事，都有回响。</h2></div><Feather size={29} strokeWidth={1} /></div>
          <div className="stats-strip" aria-label="任务统计"><div><strong>{String(tasks.length).padStart(2, '0')}</strong><span>全部记录</span></div><div><strong>{String(active).padStart(2, '0')}</strong><span>等待完成</span></div><div><strong>{String(done).padStart(2, '0')}</strong><span>已经完成</span></div><div className="progress-stat"><span>{tasks.length ? Math.round(done / tasks.length * 100) : 0}% <small>已完成</small></span><div className="progress-track"><span style={{ width: `${tasks.length ? done / tasks.length * 100 : 0}%` }} /></div></div></div>
          <div className="toolbar"><div className="filters" aria-label="任务状态">{([['all', '全部'], ['active', '进行中'], ['done', '已完成']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => { setFilter(value); setNumber(1); }}>{label}</button>)}</div><div className="search-sort"><label className="search"><Search size={16} /><input aria-label="搜索任务" type="search" placeholder="搜索任务或标签" value={query} onChange={e => { setQuery(e.target.value); setNumber(1); }} /></label><label className="sort-control"><span>排序</span><select aria-label="任务排序" value={sort} onChange={e => { const option = sortOptions.find(([value]) => value === e.target.value); if (option) { setSort(option[0]); setNumber(1); } }}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
          <p className="sort-explanation">{sortOptions.find(([value]) => value === sort)?.[1]} · 同一字段值相同的任务可能保持原顺序</p><div className="task-table-wrap"><table className="task-table"><thead><tr><th>任务 / 备注</th><th>标签</th><th>时间</th><th>状态 / 操作</th></tr></thead><tbody>{displayed.map(task => <tr key={task.id} className={task.status === 'done' ? 'task-done' : ''}><td><div className="task-title-cell"><div className={`task-thumb ${task.tags.includes('阅读') ? 'boy-thumb' : ''}`}><img src={task.tags.includes('阅读') ? '/media/boy.png' : '/media/fox.png'} alt="" /></div><div><button className="task-title" disabled={blocked} onClick={() => setEditor(task)}>{task.title}</button>{task.note && <p className="task-note" title={task.note}>{task.note}</p>}</div></div></td><td><div className="task-tags"><span className={`priority-tag ${task.priority >= 8 ? 'high' : ''}`}>P{task.priority}</span>{task.tags.slice(0, 2).map(tag => <span key={tag}>{tag}</span>)}</div></td><td><div className={`task-date ${task.status === 'active' && Date.parse(task.deadline) < now ? 'overdue' : ''}`}><span>{task.status === 'done' ? '完成于' : '截止于'}</span><time dateTime={task.status === 'done' ? task.completedAt : task.deadline}>{formatDate(task.status === 'done' ? task.completedAt : task.deadline)}</time>{task.status === 'active' && Date.parse(task.deadline) < now && <small>已到期</small>}</div></td><td><div className="task-state"><span className={`state-tag ${task.status}`}>{task.status === 'active' ? <span className="state-dot" /> : <Check size={11} />}{task.status === 'active' ? '进行中' : '已完成'}</span><div className="row-actions"><button className="icon-button" disabled={blocked} aria-label={`编辑：${task.title}`} title="编辑任务" onClick={() => setEditor(task)}><Pencil size={15} /></button><button className="icon-button complete-button" disabled={blocked} aria-label={`${task.status === 'active' ? '完成' : '重新开启'}：${task.title}`} title={task.status === 'active' ? '标记完成' : '重新开启'} onClick={() => complete(task)}>{task.status === 'active' ? <CheckCircle2 size={16} /> : <RotateCcw size={15} />}</button><button className="icon-button delete-button" disabled={blocked} aria-label={`删除：${task.title}`} title="删除任务（可以撤销）" onClick={() => remove(task)}><Trash2 size={14} /></button></div></div></td></tr>)}</tbody></table>
            {displayed.length === 0 && <div className="empty-state"><Leaf size={32} strokeWidth={1} /><h3>{query ? '没有找到这件事' : '这里，暂时留白'}</h3><p>{query ? '换个关键词，或者查看全部任务。' : filter === 'done' ? '完成第一件小事，它就会出现在这里。' : '把想做的第一件事，轻轻记下来。'}</p><button className="button quiet" onClick={() => { if (query || filter !== 'all') { setQuery(''); setFilter('all'); } else setEditor('new'); }}>{query || filter !== 'all' ? '查看全部' : '记录任务'}<ArrowUpRight size={15} /></button></div>}
          </div>
          <div className="list-footer"><span>{visible.length} 条记录{tasks.some(t => t.id.startsWith('sample-')) && <small> · 示例任务可以编辑</small>}</span>{hasImportBackup && <button className="backup-link" onClick={() => exportData(true)}>下载导入前备份</button>}<div className="pagination"><button className="icon-button" aria-label="上一页" disabled={current === 1} onClick={() => setNumber(current - 1)}><ChevronLeft size={17} /></button><span>{current} <small>/ {pages}</small></span><button className="icon-button" aria-label="下一页" disabled={current === pages} onClick={() => setNumber(current + 1)}><ChevronRight size={17} /></button></div></div>
        </section>
      </div>
    </main>}
    <footer className="site-footer"><span><Leaf size={14} />记录保存在这台设备</span><span>ONE LITTLE STEP AT A TIME</span></footer>
    {importOpen && <ImportDialog current={tasks} onClose={() => setImportOpen(false)} onImport={(incoming, mode) => {
      if (!importData(incoming, mode)) return false;
      setImportOpen(false); setFilter('all'); setQuery(''); setNumber(1);
      setToast({ text: mode === 'replace' ? `已替换为 ${incoming.length} 条任务。` : '已合并导入，相同 ID 保留本机版本。', undo: blocked ? undefined : tasks });
      return true;
    }} />}
    {editor && <TaskDialog key={editor === 'new' ? 'new' : editor.id} task={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSave={save} />}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18} /><span>{toast.text}</span>{toast.undo && <button onClick={() => { if (toast.undo && commit(toast.undo)) setToast({ text: '已撤销刚才的操作。' }); }}>撤销</button>}<button aria-label="关闭提示" onClick={() => setToast(null)}><X size={16} /></button></div>}
  </div>;
}
