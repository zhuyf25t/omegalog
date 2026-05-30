import type { ImportWarning } from '../domain/workspace';
import type { DirectoryLike } from './fileSystemAccess';
import {
  isTaskLogFileName,
  readTaskLogFile,
  type StoredTaskRecord,
} from './localTaskFileStorage';

export interface LocalTaskFolderImport {
  readonly records: readonly StoredTaskRecord[];
  readonly warnings: readonly ImportWarning[];
}

export const importTaskFolder = async (
  directory: FileSystemDirectoryHandle,
): Promise<LocalTaskFolderImport> => {
  const records: StoredTaskRecord[] = [];
  const warnings: ImportWarning[] = [];
  const readableDirectory = directory as DirectoryLike;

  for await (const candidate of readableDirectory.values()) {
    if (candidate.kind !== 'file' || !isTaskLogFileName(candidate.name)) {
      continue;
    }

    const result = await readTaskLogFile(candidate as FileSystemFileHandle);
    if (result.ok) {
      records.push(result.record);
    } else {
      warnings.push(result.warning);
    }
  }

  return {
    records: sortByCreatedAtDesc(records),
    warnings,
  };
};

const sortByCreatedAtDesc = (records: readonly StoredTaskRecord[]): readonly StoredTaskRecord[] =>
  [...records].sort(
    (left, right) => Date.parse(right.entry.createdAt) - Date.parse(left.entry.createdAt),
  );
