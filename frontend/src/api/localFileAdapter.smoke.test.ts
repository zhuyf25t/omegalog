import { dailySummaryApi } from './localDailySummaryApi';
import { taskLogApi } from './localFolderTaskApi';
import { taskHistoryApi } from './taskHistoryApi';
import { createTaskWeight, parseDeadlineInput, type TaskDraft } from '../domain/taskLog';
import { normalizeTags } from '../domain/taskLog';

type FakeHandle = FakeDirectoryHandle | FakeFileHandle;

class FakeFileHandle {
  readonly kind = 'file';
  content = '';

  constructor(readonly name: string) {}

  async getFile(): Promise<File> {
    return new File([this.content], this.name, { type: 'application/json' });
  }

  async createWritable(): Promise<{ write: (value: unknown) => Promise<void>; close: () => Promise<void> }> {
    let nextContent = '';
    return {
      write: async (value: unknown) => {
        nextContent += String(value);
      },
      close: async () => {
        this.content = nextContent;
      },
    };
  }
}

class FakeDirectoryHandle {
  readonly kind = 'directory';
  readonly entries = new Map<string, FakeHandle>();

  constructor(readonly name: string) {}

  async *values(): AsyncIterable<FakeHandle> {
    for (const entry of this.entries.values()) {
      yield entry;
    }
  }

  async getFileHandle(name: string, options: { readonly create?: boolean } = {}): Promise<FakeFileHandle> {
    const current = this.entries.get(name);
    if (current instanceof FakeFileHandle) {
      return current;
    }
    if (current) {
      throw new Error(`${name} is not a file`);
    }
    if (!options.create) {
      throw new Error(`${name} does not exist`);
    }
    const file = new FakeFileHandle(name);
    this.entries.set(name, file);
    return file;
  }

  async getDirectoryHandle(
    name: string,
    options: { readonly create?: boolean } = {},
  ): Promise<FakeDirectoryHandle> {
    const current = this.entries.get(name);
    if (current instanceof FakeDirectoryHandle) {
      return current;
    }
    if (current) {
      throw new Error(`${name} is not a directory`);
    }
    if (!options.create) {
      throw new Error(`${name} does not exist`);
    }
    const directory = new FakeDirectoryHandle(name);
    this.entries.set(name, directory);
    return directory;
  }

  async removeEntry(name: string): Promise<void> {
    this.entries.delete(name);
  }

  async queryPermission(): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(): Promise<PermissionState> {
    return 'granted';
  }
}

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const listFiles = (directory: FakeDirectoryHandle, prefix = ''): readonly string[] => {
  const paths: string[] = [];
  for (const [name, entry] of directory.entries) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry instanceof FakeFileHandle) {
      paths.push(path);
    } else {
      paths.push(...listFiles(entry, path));
    }
  }
  return paths.sort();
};

const workspace = new FakeDirectoryHandle('smoke-workspace');

globalThis.window = {
  showDirectoryPicker: async () => workspace,
  __OMEGALOG_AI_PROXY_URL__: 'http://127.0.0.1:9/unavailable',
} as unknown as Window & typeof globalThis;

const draft: TaskDraft = {
  title: 'Smoke task',
  note: 'local adapter smoke',
  tags: normalizeTags(['smoke', 'summary']),
  weight: createTaskWeight(8),
  deadline: parseDeadlineInput('', new Date('2026-05-30T09:00:00.000Z')),
};

const opened = await taskLogApi.openLocalFolder();
assert(opened.records.length === 0, 'workspace starts empty');

const created = await taskLogApi.createEntry(draft);
const completed = await taskLogApi.completeEntry(created.entry.id);
assert(completed.entry.status === 'done', 'task can be completed through local adapter');

const events = await taskHistoryApi.listEvents();
assert(events.length === 2, 'task mutations write history events');
assert(events.map((event) => event.eventType).join(',') === 'created,completed', 'history event order');

const summary = await dailySummaryApi.generateForDate(events[0].localDay);
assert(summary.provider.kind === 'local-critical-v1', 'AI proxy failure falls back to local summary');
assert(summary.source.eventIds.length === 2, 'summary records event source ids');

const loaded = await dailySummaryApi.loadState();
assert(loaded.events.length === 2, 'daily summary state reloads history events');
assert(loaded.summaries.some((item) => item.day === summary.day), 'daily summary state reloads summary files');

const reloaded = await taskLogApi.reloadWorkspace();
assert(reloaded.records.length === 1, 'task reload ignores .omegalog-system files');
assert(reloaded.records[0]?.entry.status === 'done', 'task reload preserves completed state');

const files = listFiles(workspace);
assert(files.some((path) => path.endsWith('.omegalog.json')), 'task file was written');
assert(
  files.some((path) => path.startsWith('.omegalog-system/history/') && path.endsWith('.omegalog-event.json')),
  'history event file was written',
);
assert(
  files.some((path) => path.startsWith('.omegalog-system/summaries/') && path.endsWith('.omegalog-summary.json')),
  'summary file was written',
);

const systemOnlyWorkspace = new FakeDirectoryHandle('system-only-workspace');
await systemOnlyWorkspace.getDirectoryHandle('.omegalog-system', { create: true });
taskHistoryApi.attachWorkspace(systemOnlyWorkspace as unknown as FileSystemDirectoryHandle);
dailySummaryApi.attachWorkspace(systemOnlyWorkspace as unknown as FileSystemDirectoryHandle);

const emptyState = await dailySummaryApi.loadState();
assert(emptyState.events.length === 0, 'missing history child reads as an empty event list');
assert(emptyState.summaries.length === 0, 'missing summaries child reads as an empty summary list');

console.log('local file adapter smoke passed');
