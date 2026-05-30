import { FormEvent, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import {
  buildDefaultDeadline,
  formatDateTimeLocalValue,
  makeTaskDraft,
  type TaskDraft,
  type TaskId,
} from '../domain/taskLog';
import type { TaskRecord } from '../domain/workspace';

interface TaskComposerProps {
  readonly record: TaskRecord | null;
  readonly disabled: boolean;
  readonly onCreate: (draft: TaskDraft) => Promise<boolean>;
  readonly onUpdate: (taskId: TaskId, draft: TaskDraft) => Promise<boolean>;
  readonly onCancelEdit: () => void;
}

const getInitialDeadline = (record: TaskRecord | null): string =>
  formatDateTimeLocalValue(record?.entry.deadline ?? buildDefaultDeadline(new Date()));

const getInitialTags = (record: TaskRecord | null): string =>
  record ? record.entry.tags.join(', ') : '';

export const TaskComposer = ({
  record,
  disabled,
  onCreate,
  onUpdate,
  onCancelEdit,
}: TaskComposerProps) => {
  const [title, setTitle] = useState(record?.entry.title ?? '');
  const [note, setNote] = useState(record?.entry.note ?? '');
  const [tagsText, setTagsText] = useState(getInitialTags(record));
  const [weight, setWeight] = useState<number>(record?.entry.weight ?? 5);
  const [deadlineLocal, setDeadlineLocal] = useState(getInitialDeadline(record));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = record !== null;

  const resetForm = () => {
    setTitle('');
    setNote('');
    setTagsText('');
    setWeight(5);
    setDeadlineLocal(formatDateTimeLocalValue(buildDefaultDeadline(new Date())));
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = makeTaskDraft(
      title,
      note,
      tagsText,
      weight,
      deadlineLocal,
      record ? new Date(record.entry.createdAt) : new Date(),
    );

    if (!draft.ok) {
      setFormError(draft.reason);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    const succeeded = isEditing
      ? await onUpdate(record.entry.id, draft.value)
      : await onCreate(draft.value);
    setIsSubmitting(false);

    if (succeeded && !isEditing) {
      resetForm();
    }
  };

  return (
    <form className="composer tool-panel" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Task</p>
          <h2>{isEditing ? '编辑任务' : '新增任务'}</h2>
        </div>
        <button
          aria-label={isEditing ? '取消编辑' : '关闭新增任务'}
          className="icon-button"
          disabled={isSubmitting}
          title={isEditing ? '取消编辑' : '关闭新增任务'}
          type="button"
          onClick={onCancelEdit}
        >
          <X size={18} />
        </button>
      </div>

      <label className="field">
        <span>标题</span>
        <input
          disabled={disabled || isSubmitting}
          maxLength={120}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
      </label>

      <label className="field">
        <span>备注</span>
        <textarea
          disabled={disabled || isSubmitting}
          maxLength={1200}
          rows={4}
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>标签</span>
          <input
            disabled={disabled || isSubmitting}
            type="text"
            value={tagsText}
            onChange={(event) => setTagsText(event.currentTarget.value)}
          />
        </label>

        <label className="field">
          <span>优先级 {weight}</span>
          <input
            disabled={disabled || isSubmitting}
            max={10}
            min={1}
            type="range"
            value={weight}
            onChange={(event) => setWeight(Number(event.currentTarget.value))}
          />
        </label>
      </div>

      <label className="field">
        <span>截止时间</span>
        <input
          disabled={disabled || isSubmitting}
          type="datetime-local"
          value={deadlineLocal}
          onChange={(event) => setDeadlineLocal(event.currentTarget.value)}
        />
      </label>

      {formError ? <p className="form-error">{formError}</p> : null}

      <div className="composer-actions">
        <button
          className="secondary-button"
          disabled={isSubmitting}
          type="button"
          onClick={onCancelEdit}
        >
          取消
        </button>
        <button className="primary-button" disabled={disabled || isSubmitting} type="submit">
          {isEditing ? <Save size={18} /> : <Plus size={18} />}
          <span>{isEditing ? '保存' : '新增'}</span>
        </button>
      </div>
    </form>
  );
};
