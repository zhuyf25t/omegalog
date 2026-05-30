import {
  buildTaskChangeEventDay,
  buildTaskChangeEventTimeZone,
  createTaskChangeEventId,
  type TaskEventSnapshot,
  type TaskChangeEvent,
} from '../domain/taskHistory';
import { ensureWritablePermission, isFileSystemAccessSupported } from './fileSystemAccess';
import { appendTaskChangeEventFile, readTaskChangeEvents } from './localTaskHistoryStorage';

export interface TaskHistoryApi {
  readonly isSupported: () => boolean;
  readonly listEvents: () => Promise<readonly TaskChangeEvent[]>;
  readonly recordTaskChange: (event: TaskChangeEvent) => Promise<TaskChangeEvent>;
  readonly buildTaskChangeEvent: (
    type: TaskChangeEvent['eventType'],
    sourceApi: string,
    before: TaskChangeEvent['before'],
    after: TaskChangeEvent['after'],
    now?: Date,
  ) => TaskChangeEvent;
}

class LocalTaskHistoryApi implements TaskHistoryApi {
  private workspace: FileSystemDirectoryHandle | null = null;

  isSupported(): boolean {
    return isFileSystemAccessSupported();
  }

  attachWorkspace(workspace: FileSystemDirectoryHandle): void {
    this.workspace = workspace;
  }

  async listEvents(): Promise<readonly TaskChangeEvent[]> {
    return readTaskChangeEvents(this.requireWorkspace());
  }

  async recordTaskChange(event: TaskChangeEvent): Promise<TaskChangeEvent> {
    const workspace = this.requireWorkspace();
    await ensureWritablePermission(workspace);
    await appendTaskChangeEventFile(workspace, event);
    return event;
  }

  buildTaskChangeEvent(
    type: TaskChangeEvent['eventType'],
    sourceApi: string,
    before: TaskChangeEvent['before'],
    after: TaskChangeEvent['after'],
    now = new Date(),
  ): TaskChangeEvent {
    const taskIds = [...before, ...after].map((snapshot) => snapshot.id);
    return {
      schemaVersion: 1,
      eventId: createTaskChangeEventId(now),
      eventType: type,
      sourceApi,
      occurredAt: now.toISOString(),
      localDay: buildTaskChangeEventDay(now),
      timeZone: buildTaskChangeEventTimeZone(),
      taskIds: [...new Set(taskIds)],
      before,
      after,
      changedFields: getChangedFields(before, after),
    };
  }

  private requireWorkspace(): FileSystemDirectoryHandle {
    if (!this.workspace) {
      throw new Error('Task history workspace is not open.');
    }
    return this.workspace;
  }
}

const getChangedFields = (
  before: TaskChangeEvent['before'],
  after: TaskChangeEvent['after'],
): readonly string[] => {
  if (before.length === 0) {
    return ['created'];
  }
  if (after.length === 0) {
    return ['archived'];
  }
  const fields: readonly (keyof Omit<TaskEventSnapshot, 'id'>)[] = [
    'title',
    'note',
    'tags',
    'weight',
    'status',
    'deadline',
    'completedAt',
  ];
  const beforeRecord = before[0];
  const afterRecord = after[0];
  return fields.filter(
    (field) => JSON.stringify(beforeRecord?.[field]) !== JSON.stringify(afterRecord?.[field]),
  );
};

export const taskHistoryApi = new LocalTaskHistoryApi();
