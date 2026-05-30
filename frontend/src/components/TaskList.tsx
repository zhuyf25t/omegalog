import { CheckCircle2, ChevronLeft, ChevronRight, Pencil, RotateCcw } from 'lucide-react';
import { deriveDisplayTags, formatReadableTime } from '../domain/taskSelectors';
import type { TaskId } from '../domain/taskLog';
import type { TaskRecord } from '../domain/workspace';

interface TaskListProps {
  readonly records: readonly TaskRecord[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalVisible: number;
  readonly pendingTaskIds: readonly TaskId[];
  readonly selectedTaskId: TaskId | null;
  readonly disabled: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onEdit: (taskId: TaskId) => void;
  readonly onComplete: (taskId: TaskId) => Promise<boolean>;
  readonly onReactivate: (taskId: TaskId) => Promise<boolean>;
}

export const TaskList = ({
  records,
  currentPage,
  totalPages,
  totalVisible,
  pendingTaskIds,
  selectedTaskId,
  disabled,
  onPageChange,
  onEdit,
  onComplete,
  onReactivate,
}: TaskListProps) => (
  <section className="task-list-section">
    <div className="archive-table-head task-table-head">
      <span>事件标题</span>
      <span>标签</span>
      <span>时间</span>
      <span className="table-head-status">
        <span>状态 / 操作</span>
        <strong>
          {currentPage}/{totalPages}
        </strong>
      </span>
    </div>

    {records.length > 0 ? (
      <div className="archive-list task-list">
        {records.map((record) => {
          const entry = record.entry;
          const isPending = pendingTaskIds.includes(entry.id);
          const isSelected = selectedTaskId === entry.id;
          const actionDisabled = isPending || disabled;
          const statusLabel = entry.status === 'active' ? '进行中' : '已完成';
          const statusTime =
            entry.status === 'active'
              ? `截止 ${formatReadableTime(entry.deadline)}`
              : `完成 ${entry.completedAt ? formatReadableTime(entry.completedAt) : '--'}`;

          return (
            <article
              className={`log-row task-card ${entry.status} ${isSelected ? 'selected' : ''}`}
              key={entry.id}
            >
              <div className="row-title-cell">
                <div className="row-thumb cover-library" aria-hidden="true" />
                <div className="row-title-wrap">
                  <h3 className="row-title">{entry.title}</h3>
                  {entry.note ? <p className="row-note">{entry.note}</p> : null}
                </div>
              </div>

              <div className="row-tags">
                {deriveDisplayTags(entry).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="row-created">
                <span>{statusTime}</span>
                <small>{record.fileName}</small>
              </div>

              <div className="status-action-cell">
                <span className={`state-tag ${entry.status}`}>{statusLabel}</span>
                <div className="row-actions">
                  <button
                    aria-label="编辑任务"
                    className="row-ghost"
                    disabled={actionDisabled}
                    title="编辑"
                    type="button"
                    onClick={() => onEdit(entry.id)}
                  >
                    <Pencil size={17} />
                  </button>
                  {entry.status === 'active' ? (
                    <button
                      aria-label="完成任务"
                      className="row-link"
                      disabled={actionDisabled}
                      title="完成"
                      type="button"
                      onClick={() => void onComplete(entry.id)}
                    >
                      <CheckCircle2 size={17} />
                    </button>
                  ) : (
                    <button
                      aria-label="重新激活任务"
                      className="row-link"
                      disabled={actionDisabled}
                      title="重新激活"
                      type="button"
                      onClick={() => void onReactivate(entry.id)}
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    ) : (
      <p className="empty-copy">没有匹配的任务。</p>
    )}

    <div className="pagination-row">
      <button
        aria-label="上一页"
        className="secondary-button"
        disabled={currentPage <= 1}
        title="上一页"
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={17} />
        <span>上一页</span>
      </button>
      <span>{totalVisible} 条</span>
      <button
        aria-label="下一页"
        className="secondary-button"
        disabled={currentPage >= totalPages}
        title="下一页"
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>下一页</span>
        <ChevronRight size={17} />
      </button>
    </div>
  </section>
);
