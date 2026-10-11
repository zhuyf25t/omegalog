import { useState } from 'react';
import { importTasks, parseTasks, seedTasks, type ImportMode, type Task } from './domain';
const KEY = 'omegalog.cloud.tasks.v1';
const BEFORE_IMPORT = `${KEY}.before-import`;
function load() {
  try { const raw = localStorage.getItem(KEY); return { tasks: raw ? parseTasks(raw) : seedTasks(), error: '', blocked: false }; }
  catch { return { tasks: [] as Task[], error: '暂时无法读取本机记录。原始数据未被覆盖，请先下载备份。', blocked: true }; }
}
export function useTaskStorage() {
  const [state, setState] = useState(load);
  const { tasks, error, blocked } = state;
  const [hasImportBackup, setHasImportBackup] = useState(() => { try { return localStorage.getItem(BEFORE_IMPORT) !== null; } catch { return false; } });
  function setError(message: string) { setState(s => ({ ...s, error: message })); }
  function commit(next: Task[]): boolean {
    if (blocked) return false;
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: next })); setState({ tasks: next, error: '', blocked: false }); return true; }
    catch { setError('保存失败：浏览器存储不可用或空间不足。请下载备份后重试。'); return false; }
  }
  function importData(incoming: Task[], mode: ImportMode): boolean {
    try {
      if (blocked && mode === 'merge') throw new Error('原始数据无法读取，请先下载备份，再选择替换导入。');
      const next = importTasks(tasks, incoming, mode);
      const original = localStorage.getItem(KEY) ?? JSON.stringify({ version: 1, tasks });
      localStorage.setItem(BEFORE_IMPORT, original);
      setHasImportBackup(true);
      localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: next }));
      setState({ tasks: next, error: '', blocked: false });
      return true;
    } catch (e) { setError(e instanceof Error ? `导入失败：${e.message}` : '导入失败，现有记录未改变。'); return false; }
  }
  function exportData(beforeImport = false) {
    try {
      const raw = beforeImport ? localStorage.getItem(BEFORE_IMPORT) ?? '{}' : blocked ? localStorage.getItem(KEY) ?? '{}' : JSON.stringify({ version: 1, tasks }, null, 2);
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = beforeImport ? 'omegalog-before-import.json' : 'omegalog-backup.json'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('无法导出记录，请检查浏览器的存储设置。'); }
  }
  return { tasks, commit, error, blocked, exportData, importData, hasImportBackup };
}
