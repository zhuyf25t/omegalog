import { useEffect, useState } from 'react';
import { CheckCircle2, Pencil, RotateCcw, Timer } from 'lucide-react';
import {
  deriveDisplayTags,
  formatCountdownText,
  formatReadableTime,
  getTensionLevel,
} from '../domain/taskSelectors';
import type { TaskId } from '../domain/taskLog';
import type { TaskRecord } from '../domain/workspace';

interface TaskFocusPanelProps {
  readonly record: TaskRecord | null;
  readonly isPending: boolean;
  readonly disabled: boolean;
  readonly onComplete: (taskId: TaskId) => Promise<boolean>;
  readonly onReactivate: (taskId: TaskId) => Promise<boolean>;
  readonly onEdit: (taskId: TaskId) => void;
}

export const TaskFocusPanel = ({
  record,
  isPending,
  disabled,
  onComplete,
  onReactivate,
  onEdit,
}: TaskFocusPanelProps) => {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!record) {
    return (
      <section className="focus-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow focus-kicker">焦点事件</p>
            <h2>无焦点任务</h2>
          </div>
          <Timer size={20} />
        </div>
        <div className="focus-image cover-library" aria-hidden="true" />
        <p className="empty-copy">当前没有进行中的任务。</p>
      </section>
    );
  }

  const entry = record.entry;
  const countdown = formatCountdownText(entry.deadline, nowMs);
  const tensionLevel = getTensionLevel(entry, new Date(nowMs));
  const actionDisabled = isPending || disabled;

  return (
    <section className={`focus-panel tension-${tensionLevel}`}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow focus-kicker">焦点事件</p>
          <h2>{entry.title}</h2>
        </div>
        <span className={countdown.isOverdue ? 'status-pill danger' : 'status-pill'}>
          {countdown.text}
        </span>
      </div>

      <div className="focus-image cover-library" aria-hidden="true" />

      {entry.note ? <p className="focus-note">{entry.note}</p> : null}

      <div className="meta-row">
        <span>截止 {formatReadableTime(entry.deadline)}</span>
        <span>压力 {tensionLevel}/5</span>
      </div>

      <div className="tag-row">
        {deriveDisplayTags(entry).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="button-row">
        <button
          aria-label="编辑焦点任务"
          className="secondary-button"
          disabled={actionDisabled}
          title="编辑"
          type="button"
          onClick={() => onEdit(entry.id)}
        >
          <Pencil size={17} />
          <span>编辑</span>
        </button>
        {entry.status === 'active' ? (
          <button
            aria-label="完成焦点任务"
            className="primary-button"
            disabled={actionDisabled}
            title="完成"
            type="button"
            onClick={() => void onComplete(entry.id)}
          >
            <CheckCircle2 size={17} />
            <span>完成</span>
          </button>
        ) : (
          <button
            aria-label="重新激活焦点任务"
            className="primary-button"
            disabled={actionDisabled}
            title="重新激活"
            type="button"
            onClick={() => void onReactivate(entry.id)}
          >
            <RotateCcw size={17} />
            <span>重新激活</span>
          </button>
        )}
      </div>
    </section>
  );
};
