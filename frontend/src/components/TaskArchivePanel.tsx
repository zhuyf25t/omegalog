import { AlertTriangle, Archive } from 'lucide-react';
import type { TaskStats } from '../domain/taskSelectors';
import type { ImportWarning } from '../domain/workspace';

interface TaskArchivePanelProps {
  readonly stats: TaskStats;
  readonly warnings: readonly ImportWarning[];
  readonly disabled: boolean;
  readonly onArchiveCompleted: () => Promise<boolean>;
}

export const TaskArchivePanel = ({
  stats,
  warnings,
  disabled,
  onArchiveCompleted,
}: TaskArchivePanelProps) => {
  const canArchive = stats.done > 0 && !disabled;

  return (
    <section className="archive-panel tool-panel">
      <div className="archive-header-strip">
        <div className="archive-title-block">
          <p className="eyebrow">Archive</p>
          <h2>事件档案</h2>
        </div>

        <div className="archive-counts" aria-label="归档统计">
          <span>
            <strong>{stats.done}</strong>
            已完成
          </span>
          <span>
            <strong>{stats.active}</strong>
            进行中
          </span>
        </div>

        <div className={`archive-warning-chip ${warnings.length > 0 ? 'has-warning' : ''}`}>
          {warnings.length > 0 ? <AlertTriangle size={16} /> : null}
          <span>{warnings.length > 0 ? `导入 warning ${warnings.length}` : '没有导入 warning'}</span>
        </div>

        <button
          aria-label="归档已完成任务"
          className="icon-button archive-action"
          disabled={!canArchive}
          title="归档已完成"
          type="button"
          onClick={() => void onArchiveCompleted()}
        >
          <Archive size={18} />
        </button>
      </div>

      {warnings.length > 0 ? (
        <div className="warning-list">
          {warnings.map((warning) => (
            <div className="warning-item" key={`${warning.fileName}-${warning.reason}`}>
              <span>{warning.fileName}</span>
              <small>{warning.reason}</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};
