import {
  ensureWritablePermission,
  getArchiveDirectory,
  isFileSystemAccessSupported,
  openWorkspaceDirectory,
  removeDirectoryEntry,
} from './fileSystemAccess';
import { buildTaskLogFileName, writeTaskLogFile, type StoredTaskRecord } from './localTaskFileStorage';
import { importTaskFolder } from './localTaskFolderImport';
import { generateTaskId } from './localTaskIds';
import {
  buildWorkspaceSnapshot,
  requireStoredTaskRecord,
  requireTaskRecord,
} from './localTaskRecords';
import { TaskLogApiError, type TaskLogApi } from './taskLogApi';
import { dailySummaryApi } from './localDailySummaryApi';
import { taskHistoryApi } from './taskHistoryApi';
import { type TaskDraft, type TaskId } from '../domain/taskLog';
import { taskEventSnapshotFromEntry } from '../domain/taskHistory';
import {
  completeTaskLogEntry,
  createTaskLogEntry,
  reactivateTaskLogEntry,
  updateTaskLogEntry,
} from '../domain/taskTransitions';
import type { ArchiveBatch, ImportWarning, TaskRecord, WorkspaceSnapshot } from '../domain/workspace';

class LocalFolderTaskApi implements TaskLogApi {
  private activeDirectory: FileSystemDirectoryHandle | null = null;
  private records: readonly StoredTaskRecord[] = [];
  private warnings: readonly ImportWarning[] = [];

  isSupported(): boolean {
    return isFileSystemAccessSupported();
  }

  async openLocalFolder(): Promise<WorkspaceSnapshot> {
    this.activeDirectory = await openWorkspaceDirectory();
    dailySummaryApi.attachWorkspace(this.activeDirectory);
    taskHistoryApi.attachWorkspace(this.activeDirectory);
    return this.importFolderEntries();
  }

  async importFolderEntries(): Promise<WorkspaceSnapshot> {
    this.requireDirectory();
    return this.loadFolder();
  }

  async reloadWorkspace(): Promise<WorkspaceSnapshot> {
    return this.importFolderEntries();
  }

  async createEntry(draft: TaskDraft): Promise<TaskRecord> {
    const directory = this.requireDirectory();
    await ensureWritablePermission(directory);
    const now = new Date();
    const entry = createTaskLogEntry(generateTaskId(), draft, now);
    const fileName = buildTaskLogFileName(now, entry.id);
    const handle = await directory.getFileHandle(fileName, { create: true });
    await writeTaskLogFile(handle, entry);
    await taskHistoryApi.recordTaskChange(
      taskHistoryApi.buildTaskChangeEvent(
        'created',
        'TaskLog.createEntry',
        [],
        [taskEventSnapshotFromEntry(entry)],
        now,
      ),
    );
    await this.loadFolder();
    return this.requireRecord(entry.id);
  }

  async updateEntry(taskId: TaskId, draft: TaskDraft): Promise<TaskRecord> {
    const directory = this.requireDirectory();
    await ensureWritablePermission(directory);
    const record = this.requireStoredRecord(taskId);
    const now = new Date();
    const updated = updateTaskLogEntry(record.entry, draft, now);
    await writeTaskLogFile(record.handle, updated);
    await taskHistoryApi.recordTaskChange(
      taskHistoryApi.buildTaskChangeEvent(
        'updated',
        'TaskLog.updateEntry',
        [taskEventSnapshotFromEntry(record.entry)],
        [taskEventSnapshotFromEntry(updated)],
        now,
      ),
    );
    await this.loadFolder();
    return this.requireRecord(taskId);
  }

  async completeEntry(taskId: TaskId): Promise<TaskRecord> {
    const directory = this.requireDirectory();
    await ensureWritablePermission(directory);
    const record = this.requireStoredRecord(taskId);
    const now = new Date();
    const updated = completeTaskLogEntry(record.entry, now);
    await writeTaskLogFile(record.handle, updated);
    await taskHistoryApi.recordTaskChange(
      taskHistoryApi.buildTaskChangeEvent(
        'completed',
        'TaskLog.completeEntry',
        [taskEventSnapshotFromEntry(record.entry)],
        [taskEventSnapshotFromEntry(updated)],
        now,
      ),
    );
    await this.loadFolder();
    return this.requireRecord(taskId);
  }

  async reactivateEntry(taskId: TaskId): Promise<TaskRecord> {
    const directory = this.requireDirectory();
    await ensureWritablePermission(directory);
    const record = this.requireStoredRecord(taskId);
    const now = new Date();
    const updated = reactivateTaskLogEntry(record.entry, now);
    await writeTaskLogFile(record.handle, updated);
    await taskHistoryApi.recordTaskChange(
      taskHistoryApi.buildTaskChangeEvent(
        'reactivated',
        'TaskLog.reactivateEntry',
        [taskEventSnapshotFromEntry(record.entry)],
        [taskEventSnapshotFromEntry(updated)],
        now,
      ),
    );
    await this.loadFolder();
    return this.requireRecord(taskId);
  }

  async archiveCompletedEntries(): Promise<ArchiveBatch> {
    const directory = this.requireDirectory();
    await ensureWritablePermission(directory);
    const completedRecords = this.records.filter((record) => record.entry.status === 'done');
    if (completedRecords.length === 0) {
      throw new TaskLogApiError('invalid-operation', '当前没有已完成事件可归档。');
    }

    const archiveDirectory = await getArchiveDirectory(directory);
    const now = new Date();
    for (const record of completedRecords) {
      const target = await archiveDirectory.getFileHandle(record.fileName, { create: true });
      await writeTaskLogFile(target, record.entry);
      await removeDirectoryEntry(directory, record.fileName);
      await taskHistoryApi.recordTaskChange(
        taskHistoryApi.buildTaskChangeEvent(
          'archived',
          'Archive.archiveCompletedEntries',
          [taskEventSnapshotFromEntry(record.entry)],
          [],
          now,
        ),
      );
    }

    await this.loadFolder();
    return {
      archivedIds: completedRecords.map((record) => record.entry.id),
    };
  }

  private async loadFolder(): Promise<WorkspaceSnapshot> {
    const imported = await importTaskFolder(this.requireDirectory());
    this.records = imported.records;
    this.warnings = imported.warnings;
    return this.snapshot();
  }

  private snapshot(): WorkspaceSnapshot {
    return buildWorkspaceSnapshot(this.requireDirectory(), this.records, this.warnings);
  }

  private requireDirectory(): FileSystemDirectoryHandle {
    if (!this.activeDirectory) {
      throw new TaskLogApiError('workspace-not-open', '请先打开一个日志文件夹。');
    }
    return this.activeDirectory;
  }

  private requireStoredRecord(taskId: TaskId): StoredTaskRecord {
    return requireStoredTaskRecord(this.records, taskId);
  }

  private requireRecord(taskId: TaskId): TaskRecord {
    return requireTaskRecord(this.records, taskId);
  }
}

export const taskLogApi: TaskLogApi = new LocalFolderTaskApi();
