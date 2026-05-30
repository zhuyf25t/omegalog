import { TaskLogApiError } from './taskLogApi';

export type DirectoryLike = FileSystemDirectoryHandle & {
  values: () => AsyncIterable<FileSystemHandle>;
};

export type MutableDirectory = FileSystemDirectoryHandle & {
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileSystemDirectoryHandle>;
  removeEntry?: (name: string, options?: { recursive?: boolean }) => Promise<void>;
};

export type PermissionAwareDirectory = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
};

export const isFileSystemAccessSupported = (): boolean =>
  typeof window.showDirectoryPicker === 'function';

export const openWorkspaceDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  if (!window.showDirectoryPicker) {
    throw new TaskLogApiError('unsupported', '当前浏览器不支持文件夹读写，请使用 Chrome 或 Edge。');
  }
  return window.showDirectoryPicker({ mode: 'readwrite' });
};

export const ensureWritablePermission = async (
  directory: FileSystemDirectoryHandle,
): Promise<void> => {
  const handle = directory as PermissionAwareDirectory;
  const descriptor = { mode: 'readwrite' as const };

  if (handle.queryPermission) {
    const state = await handle.queryPermission(descriptor);
    if (state === 'granted') {
      return;
    }
  }

  if (handle.requestPermission) {
    const state = await handle.requestPermission(descriptor);
    if (state === 'granted') {
      return;
    }
  }

  throw new TaskLogApiError('permission-denied', '没有获得文件夹写入权限。');
};

export const getArchiveDirectory = async (
  directory: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> => {
  const handle = directory as MutableDirectory;
  return handle.getDirectoryHandle('archive', { create: true });
};

export const removeDirectoryEntry = async (
  directory: FileSystemDirectoryHandle,
  fileName: string,
): Promise<void> => {
  const handle = directory as MutableDirectory;
  if (!handle.removeEntry) {
    throw new TaskLogApiError('unsupported', '当前浏览器不支持删除文件。');
  }
  await handle.removeEntry(fileName);
};
