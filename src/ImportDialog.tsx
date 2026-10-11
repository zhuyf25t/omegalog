import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { parseImport, type ImportMode, type Task } from './domain';

export function ImportDialog({ current, onClose, onImport }: { current: Task[]; onClose: () => void; onImport: (incoming: Task[], mode: ImportMode) => boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef(0);
  const [incoming, setIncoming] = useState<Task[] | null>(null);
  const [filename, setFilename] = useState('');
  const [mode, setMode] = useState<ImportMode>('merge');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { request.current++; if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  async function read(file?: File) {
    const id = ++request.current;
    setIncoming(null); setError(''); setFilename(file?.name ?? '');
    if (!file) { setLoading(false); return; }
    if (file.size > 5 * 1024 * 1024) { setLoading(false); setError('请选择不超过 5 MB 的任务 JSON。'); return; }
    setLoading(true);
    try {
      const tasks = parseImport(await file.text());
      if (id !== request.current) return;
      if (tasks.length > 5000) throw new Error('单次最多导入 5000 条任务。');
      setIncoming(tasks);
    } catch (e) { if (id === request.current) setError(e instanceof Error ? e.message : '文件读取失败，请重新选择。'); }
    finally { if (id === request.current) setLoading(false); }
  }
  const known = new Set(current.map(t => t.id));
  const duplicates = incoming?.filter(t => known.has(t.id)).length ?? 0;
  const added = (incoming?.length ?? 0) - duplicates;
  return <dialog ref={dialog} className="task-dialog import-dialog" aria-labelledby="import-title" onCancel={onClose}>
    <div className="dialog-heading"><div><span className="eyebrow"><Upload size={14} /> BRING YOUR LITTLE STEPS</span><h2 id="import-title">导入任务 JSON</h2></div><button className="icon-button" aria-label="关闭导入" onClick={onClose}><X size={20} /></button></div>
    <p className="import-help">选择这版的备份，或旧版 OmegaLog 的单条任务 / 任务数组。文件只在本机读取。</p>
    <label className="field">选择 JSON 文件<input type="file" accept=".json,application/json" onChange={e => void read(e.target.files?.[0])} /></label>
    {loading && <p role="status" className="import-help">正在读取…</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {incoming && <>
      <div className="import-preview"><strong>{filename}</strong><p>识别到 {incoming.length} 条任务 · {duplicates} 条与本机 ID 相同</p><ul>{incoming.slice(0, 3).map(t => <li key={t.id}>{t.title}</li>)}</ul>{incoming.length > 3 && <small>其余 {incoming.length - 3} 条也会一同处理。</small>}</div>
      <fieldset className="import-modes"><legend>导入方式</legend><label><input type="radio" name="import-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} /><span>合并到现有任务<small>新增 {added} 条；ID 相同的 {duplicates} 条保留本机版本。</small></span></label><label><input type="radio" name="import-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /><span>替换全部任务<small>将本机 {current.length} 条替换为文件中的 {incoming.length} 条；会保存替换前的备份。</small></span></label></fieldset>
    </>}
    <div className="dialog-actions"><button className="button quiet" onClick={onClose}>取消</button><button className="button primary" disabled={!incoming || loading || (mode === 'merge' && !added)} onClick={() => { if (incoming && !onImport(incoming, mode)) setError('未能保存导入，请检查页面提示；现有任务没有被替换。'); }}>{mode === 'replace' ? `替换为 ${incoming?.length ?? 0} 条任务` : '确认合并'}</button></div>
  </dialog>;
}
