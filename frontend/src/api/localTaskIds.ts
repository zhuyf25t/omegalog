import { createTaskId, type TaskId } from '../domain/taskLog';
import { TaskLogApiError } from './taskLogApi';

export const generateTaskId = (): TaskId => {
  const raw =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  const result = createTaskId(raw);
  if (!result.ok) {
    throw new TaskLogApiError('invalid-input', '生成任务 id 失败。');
  }
  return result.value;
};
