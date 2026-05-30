import { formatDateForFilename, type TaskId, type TaskLogEntry } from '../domain/taskLog';
import { decodeTaskLogEntry, encodeTaskLogEntry } from '../domain/taskLogCodec';
import type { ImportWarning, TaskRecord } from '../domain/workspace';

export interface StoredTaskRecord extends TaskRecord {
  readonly handle: FileSystemFileHandle;
}

interface TaskLogFileReadSuccess {
  readonly ok: true;
  readonly record: StoredTaskRecord;
}

interface TaskLogFileReadFailure {
  readonly ok: false;
  readonly warning: ImportWarning;
}

export type TaskLogFileReadResult = TaskLogFileReadSuccess | TaskLogFileReadFailure;

export const isTaskLogFileName = (fileName: string): boolean => fileName.endsWith('.omegalog.json');

export const buildTaskLogFileName = (createdAt: Date, taskId: TaskId): string =>
  `${formatDateForFilename(createdAt)}_${taskId}.omegalog.json`;

export const readTaskLogFile = async (
  handle: FileSystemFileHandle,
): Promise<TaskLogFileReadResult> => {
  try {
    const file = await handle.getFile();
    const parsed: unknown = JSON.parse(await file.text());
    const decoded = decodeTaskLogEntry(parsed);
    if (!decoded.ok) {
      return {
        ok: false,
        warning: { fileName: handle.name, reason: decoded.reason },
      };
    }

    return {
      ok: true,
      record: {
        fileName: handle.name,
        storageLocation: `root/${handle.name}`,
        handle,
        entry: decoded.value,
      },
    };
  } catch (error) {
    return {
      ok: false,
      warning: {
        fileName: handle.name,
        reason: error instanceof Error ? error.message : '读取失败',
      },
    };
  }
};

export const writeTaskLogFile = async (
  handle: FileSystemFileHandle,
  entry: TaskLogEntry,
): Promise<void> => {
  const writable = await handle.createWritable();
  try {
    await writable.write(`${JSON.stringify(encodeTaskLogEntry(entry), null, 2)}\n`);
  } finally {
    await writable.close();
  }
};

export const toTaskRecord = ({
  fileName,
  storageLocation,
  entry,
}: StoredTaskRecord): TaskRecord => ({
  fileName,
  storageLocation,
  entry,
});
