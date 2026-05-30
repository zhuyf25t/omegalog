import type { SummaryDate } from '../domain/summaryDate';
import type { TaskChangeEvent } from '../domain/taskHistory';
import { decodeTaskChangeEvent, encodeTaskChangeEvent } from '../domain/taskHistoryCodec';
import type { DirectoryLike, MutableDirectory } from './fileSystemAccess';

const systemDirectoryName = '.omegalog-system';
const historyDirectoryName = 'history';

export const appendTaskChangeEventFile = async (
  workspace: FileSystemDirectoryHandle,
  event: TaskChangeEvent,
): Promise<void> => {
  const dayDirectory = await getHistoryDayDirectory(workspace, event.localDay, true);
  const fileName = `${event.occurredAt.replace(/[-:.TZ]/g, '')}_${event.eventId}.omegalog-event.json`;
  const handle = await dayDirectory.getFileHandle(fileName, { create: true });
  await writeJson(handle, encodeTaskChangeEvent(event));
};

export const readTaskChangeEvents = async (
  workspace: FileSystemDirectoryHandle,
): Promise<readonly TaskChangeEvent[]> => {
  const historyDirectory = await getSystemChildDirectory(workspace, historyDirectoryName, false);
  if (!historyDirectory) {
    return [];
  }

  const events: TaskChangeEvent[] = [];
  for await (const dayHandle of (historyDirectory as DirectoryLike).values()) {
    if (dayHandle.kind !== 'directory') {
      continue;
    }
    for await (const eventHandle of (dayHandle as DirectoryLike).values()) {
      if (eventHandle.kind !== 'file' || !eventHandle.name.endsWith('.omegalog-event.json')) {
        continue;
      }
      const decoded = await readJsonFile(eventHandle as FileSystemFileHandle, decodeTaskChangeEvent);
      if (decoded) {
        events.push(decoded);
      }
    }
  }

  return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
};

const getHistoryDayDirectory = async (
  workspace: FileSystemDirectoryHandle,
  day: SummaryDate,
  create: boolean,
): Promise<FileSystemDirectoryHandle> => {
  const historyDirectory = await getSystemChildDirectory(workspace, historyDirectoryName, create);
  if (!historyDirectory) {
    throw new Error('History directory is unavailable.');
  }
  return (historyDirectory as MutableDirectory).getDirectoryHandle(day, { create });
};

const getSystemChildDirectory = async (
  workspace: FileSystemDirectoryHandle,
  childName: string,
  create: boolean,
): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const systemDirectory = await (workspace as MutableDirectory).getDirectoryHandle(
      systemDirectoryName,
      { create },
    );
    return await (systemDirectory as MutableDirectory).getDirectoryHandle(childName, { create });
  } catch (error) {
    if (create) {
      throw error;
    }
    return null;
  }
};

const writeJson = async (handle: FileSystemFileHandle, value: unknown): Promise<void> => {
  const writable = await handle.createWritable();
  try {
    await writable.write(`${JSON.stringify(value, null, 2)}\n`);
  } finally {
    await writable.close();
  }
};

const readJsonFile = async <T>(
  handle: FileSystemFileHandle,
  decoder: (value: unknown) => { readonly ok: true; readonly value: T } | { readonly ok: false },
): Promise<T | null> => {
  try {
    const file = await handle.getFile();
    const parsed: unknown = JSON.parse(await file.text());
    const decoded = decoder(parsed);
    return decoded.ok ? decoded.value : null;
  } catch {
    return null;
  }
};
