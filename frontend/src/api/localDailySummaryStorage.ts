import type { DailySummary } from '../domain/dailySummary';
import { decodeDailySummary, encodeDailySummary } from '../domain/dailySummaryCodec';
import type { DirectoryLike, MutableDirectory } from './fileSystemAccess';

const systemDirectoryName = '.omegalog-system';
const summariesDirectoryName = 'summaries';

export const writeDailySummaryFile = async (
  workspace: FileSystemDirectoryHandle,
  summary: DailySummary,
): Promise<void> => {
  const summariesDirectory = await getSystemChildDirectory(workspace, summariesDirectoryName, true);
  if (!summariesDirectory) {
    return;
  }
  const handle = await summariesDirectory.getFileHandle(
    `${summary.day}.omegalog-summary.json`,
    { create: true },
  );
  await writeJson(handle, encodeDailySummary(summary));
};

export const readDailySummaries = async (
  workspace: FileSystemDirectoryHandle,
): Promise<readonly DailySummary[]> => {
  const summariesDirectory = await getSystemChildDirectory(workspace, summariesDirectoryName, false);
  if (!summariesDirectory) {
    return [];
  }

  const summaries: DailySummary[] = [];
  for await (const handle of (summariesDirectory as DirectoryLike).values()) {
    if (handle.kind !== 'file' || !handle.name.endsWith('.omegalog-summary.json')) {
      continue;
    }
    const decoded = await readJsonFile(handle as FileSystemFileHandle, decodeDailySummary);
    if (decoded) {
      summaries.push(decoded);
    }
  }
  return summaries.sort((left, right) => right.day.localeCompare(left.day));
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
