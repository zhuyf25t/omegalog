import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Leaf, X } from 'lucide-react';
import { defaultDeadline, localInput, type Draft, type Task } from './domain';
export function TaskDialog({ task, onClose, onSave }: { task: Task | null; onClose: () => void; onSave: (draft: Draft) => boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [tags, setTags] = useState(task?.tags.join('，') ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 5);
  const [deadline, setDeadline] = useState(task ? localInput(new Date(task.deadline)) : defaultDeadline());
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('先为这件事起个名字吧。'); return; }
    if (!Number.isFinite(Date.parse(deadline))) { setError('请选择有效的截止时间。'); return; }
    const draft = { title: title.trim(), note: note.trim(), tags: [...new Set(tags.split(/[,，、]/).map(t => t.trim().slice(0, 18)).filter(Boolean))].slice(0, 6), priority, deadline: new Date(deadline).toISOString() };
    if (!onSave(draft)) setError('没有保存成功，请检查页面上的提示。');
  }
  return <dialog ref={dialog} className="task-dialog" onCancel={onClose} onClick={e => { if (e.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }} aria-labelledby="dialog-title">
    <form onSubmit={submit}>
      <div className="dialog-heading"><div><span className="eyebrow"><Leaf size={14} /> A LITTLE STEP</span><h2 id="dialog-title">{task ? '修改这件小事' : '记下一件小事'}</h2></div><button type="button" className="icon-button" aria-label="关闭任务表单" onClick={onClose}><X size={20} /></button></div>
      <label className="field">任务标题<input autoFocus required maxLength={120} placeholder="想做的事，从一个名字开始" value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="field">补充几句话 <span className="optional">选填</span><textarea maxLength={1200} rows={3} placeholder="为什么想做？下一小步是什么？" value={note} onChange={e => setNote(e.target.value)} /></label>
      <div className="form-columns"><label className="field">截止时间<input type="datetime-local" required value={deadline} onChange={e => setDeadline(e.target.value)} /></label><label className="field">标签 <span className="optional">逗号分隔</span><input maxLength={120} placeholder="学习，生活，灵感" value={tags} onChange={e => setTags(e.target.value)} /></label></div>
      <label className="priority-field"><span>优先级 <strong>{priority}<small> / 10</small></strong></span><input aria-label="任务优先级" type="range" min={1} max={10} value={priority} onChange={e => setPriority(Number(e.target.value))} /><span className="range-label"><span>慢慢来</span><span>优先照顾</span></span></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions"><span>每一步，都算数。</span><button type="button" className="button quiet" onClick={onClose}>取消</button><button type="submit" className="button primary">{task ? '保存修改' : '加入我的 Log'}<ArrowUpRight size={17} /></button></div>
    </form>
  </dialog>;
}
