import type { TaskId, TaskLogEntry } from './taskLog';

declare const workspaceIdBrand: unique symbol;

export type WorkspaceId = string & { readonly [workspaceIdBrand]: true };

export interface ImportWarning {
  readonly fileName: string;
  readonly reason: string;
}

export interface TaskRecord {
  readonly fileName: string;
  readonly storageLocation: string;
  readonly entry: TaskLogEntry;
}

export interface WorkspaceSnapshot {
  readonly id: WorkspaceId;
  readonly name: string;
  readonly records: readonly TaskRecord[];
  readonly warnings: readonly ImportWarning[];
}

export interface ArchiveBatch {
  readonly archivedIds: readonly TaskId[];
}

export const createWorkspaceId = (name: string): WorkspaceId => {
  const displayName = name.trim() || 'workspace';
  return `local:${displayName}`.slice(0, 128) as WorkspaceId;
};

export const getArchivedCount = (batch: ArchiveBatch): number => batch.archivedIds.length;
