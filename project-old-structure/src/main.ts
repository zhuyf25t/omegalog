import './style.css';

type LogStatus = 'active' | 'done';
type SortMode = 'created-desc' | 'created-asc' | 'priority-desc' | 'priority-asc';
type StatusFilter = 'all' | 'active' | 'done';

interface LogEntry {
  id: string;
  title: string;
  note: string;
  tags: string[];
  weight: number;
  status: LogStatus;
  deadline: string;
  deadlineAdjustCount: number;
  overdueAdjustCount: number;
  createdAt: string;
  completedAt: string | null;
}

interface LogRecord {
  fileName: string;
  handle: FileSystemFileHandle;
  entry: LogEntry;
}

type DirectoryLike = FileSystemDirectoryHandle & {
  values: () => AsyncIterable<FileSystemHandle>;
};

type MutableDirectory = FileSystemDirectoryHandle & {
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
  removeEntry?: (name: string, options?: { recursive?: boolean }) => Promise<void>;
};

type PermissionAwareDirectory = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
};

interface CountdownState {
  text: string;
  isOverdue: boolean;
}

const openFolderBtn = document.getElementById('open-folder-btn') as HTMLButtonElement;
const supportWarning = document.getElementById('support-warning') as HTMLParagraphElement;
const welcomeView = document.getElementById('welcome-view') as HTMLElement;
const workspaceView = document.getElementById('workspace-view') as HTMLElement;

const folderName = document.getElementById('folder-name') as HTMLSpanElement;
const countTotal = document.getElementById('count-total') as HTMLSpanElement;
const countActive = document.getElementById('count-active') as HTMLSpanElement;
const countDone = document.getElementById('count-completed') as HTMLSpanElement;
const noLogsState = document.getElementById('no-logs') as HTMLDivElement;
const logCards = document.getElementById('log-list') as HTMLDivElement;
const sortButtons = document.querySelectorAll<HTMLButtonElement>('.sort-btn[data-sort]');
const archiveSearch = document.getElementById('archive-search') as HTMLInputElement;
const filterToggle = document.getElementById('filter-toggle') as HTMLButtonElement;
const archiveDoneBtn = document.getElementById('archive-done-btn') as HTMLButtonElement;
const prioritySortBtn = document.getElementById('priority-sort-btn') as HTMLButtonElement;
const createdSortBtn = document.getElementById('created-sort-btn') as HTMLButtonElement;
const archiveFooter = document.getElementById('archive-footer') as HTMLDivElement;

const focusPanel = document.getElementById('focus-panel') as HTMLElement;
const focusImage = document.getElementById('focus-image') as HTMLDivElement;
const focusTitle = document.getElementById('focus-title') as HTMLHeadingElement;
const focusCountdown = document.getElementById('focus-countdown') as HTMLParagraphElement;
const focusDeadline = document.getElementById('focus-deadline') as HTMLParagraphElement;
const focusNote = document.getElementById('focus-note') as HTMLParagraphElement;
const focusTags = document.getElementById('focus-tags') as HTMLDivElement;
const focusEditBtn = document.getElementById('focus-edit-btn') as HTMLButtonElement;
const focusCompleteBtn = document.getElementById('focus-complete-btn') as HTMLButtonElement;

const logForm = document.getElementById('log-form') as HTMLFormElement;
const logFormTitle = document.getElementById('log-form-title') as HTMLParagraphElement;
const logSubmitBtn = document.getElementById('log-submit') as HTMLButtonElement;
const addFab = document.getElementById('add-log-fab') as HTMLButtonElement;
const titleInput = document.getElementById('log-title') as HTMLInputElement;
const noteInput = document.getElementById('log-note') as HTMLTextAreaElement;
const tagsInput = document.getElementById('log-tags') as HTMLInputElement;
const weightInput = document.getElementById('log-weight') as HTMLInputElement;
const weightValue = document.getElementById('log-weight-value') as HTMLOutputElement;
const deadlineInput = document.getElementById('log-deadline') as HTMLInputElement;

const congratsOverlay = document.getElementById('congrats-overlay') as HTMLDivElement;
const particleLayer = document.getElementById('particle-layer') as HTMLDivElement;
const statusToast = document.getElementById('status-toast') as HTMLDivElement;

const isFsSupported =
  typeof (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker ===
  'function';

const openDirectoryPicker = async (): Promise<FileSystemDirectoryHandle> => {
  const picker = (window as Window & {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
  }).showDirectoryPicker;
  if (!picker) {
    throw new Error('File System Access API not supported');
  }
  return picker({ mode: 'readwrite' });
};

let activeDirectory: FileSystemDirectoryHandle | null = null;
let records: LogRecord[] = [];
let congratsTimer: ReturnType<typeof setTimeout> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let currentSortMode: SortMode = 'created-desc';
let statusFilter: StatusFilter = 'all';
let currentPage = 1;
const pageSize = 3;
let editingRecord: LogRecord | null = null;
let isSaving = false;
let isArchiving = false;
let shouldOpenComposerAfterFolder = false;
let archiveQuery = '';
const pendingRecordIds = new Set<string>();

if (!isFsSupported) {
  supportWarning.classList.remove('hidden');
  openFolderBtn.disabled = true;
  addFab.disabled = true;
}

openFolderBtn.addEventListener('click', async () => {
  if (!isFsSupported) {
    return;
  }

  try {
    const directory = await openDirectoryPicker();
    activeDirectory = directory;
    closeComposer();
    await loadFolder(activeDirectory);
    renderWorkspace();
    startCountdownTicker();
    showToast(`已连接档案库：${directory.name}`);
    if (shouldOpenComposerAfterFolder) {
      openComposer();
    }
  } catch (error) {
    if (!isAbortError(error)) {
      console.error('打开文件夹失败', error);
      showToast('打开文件夹失败，请确认授权后重试。');
    }
  } finally {
    shouldOpenComposerAfterFolder = false;
  }
});

addFab.addEventListener('click', () => {
  if (!activeDirectory) {
    shouldOpenComposerAfterFolder = true;
    openFolderBtn.click();
    return;
  }
  toggleComposer();
});

sortButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.sort;
    if (!isSortMode(mode)) {
      return;
    }
    currentSortMode = mode;
    currentPage = 1;
    renderWorkspace();
  });
});

archiveSearch.addEventListener('input', () => {
  archiveQuery = archiveSearch.value.trim().toLowerCase();
  currentPage = 1;
  renderWorkspace();
});

filterToggle.addEventListener('click', () => {
  const nextFilter: Record<StatusFilter, StatusFilter> = {
    all: 'active',
    active: 'done',
    done: 'all',
  };
  statusFilter = nextFilter[statusFilter];
  currentPage = 1;
  renderWorkspace();
  showToast(`筛选：${getFilterLabel(statusFilter)}`);
});

archiveDoneBtn.addEventListener('click', async () => {
  await archiveCompletedLogs();
});

createdSortBtn.addEventListener('click', () => {
  currentSortMode = currentSortMode === 'created-desc' ? 'created-asc' : 'created-desc';
  currentPage = 1;
  renderWorkspace();
});

prioritySortBtn.addEventListener('click', () => {
  currentSortMode = currentSortMode === 'priority-desc' ? 'priority-asc' : 'priority-desc';
  currentPage = 1;
  renderWorkspace();
});

weightInput.addEventListener('input', () => {
  weightValue.textContent = weightInput.value;
});

focusEditBtn.addEventListener('click', () => {
  const focus = getFocusRecord();
  if (focus) {
    openComposer(focus);
  }
});

focusCompleteBtn.addEventListener('click', async () => {
  const focus = getFocusRecord();
  if (focus) {
    await completeLog(focus);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !isSaving && !logForm.classList.contains('hidden')) {
    closeComposer();
  }
});

logForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeDirectory || isSaving) {
    return;
  }

  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  const note = noteInput.value.trim();
  const tags = parseTagsInput(tagsInput.value);
  const weight = clampWeight(Number(weightInput.value));
  const now = new Date();
  const deadline = parseDeadlineInput(deadlineInput.value) ?? buildDefaultDeadline(now);

  try {
    isSaving = true;
    logSubmitBtn.disabled = true;
    logForm.setAttribute('aria-busy', 'true');
    if (!(await ensureWritablePermission(activeDirectory))) {
      throw new Error('未获得文件夹写入权限');
    }

    if (editingRecord) {
      const deadlineChanged = hasDeadlineChanged(editingRecord.entry.deadline, deadline);
      const adjustedAfterOverdue =
        deadlineChanged &&
        editingRecord.entry.status === 'active' &&
        isDeadlineOverdue(editingRecord.entry.deadline, now);
      const nextEntry: LogEntry = {
        ...editingRecord.entry,
        title,
        note,
        tags,
        weight,
        deadline,
        deadlineAdjustCount: editingRecord.entry.deadlineAdjustCount + (deadlineChanged ? 1 : 0),
        overdueAdjustCount: editingRecord.entry.overdueAdjustCount + (adjustedAfterOverdue ? 1 : 0),
      };
      await writeEntry(editingRecord.handle, {
        ...nextEntry,
      });
    } else {
      const id = generateId();
      const fileName = `${formatDateForFilename(now)}_${id}.omegalog.json`;
      const entry: LogEntry = {
        id,
        title,
        note,
        tags,
        weight,
        status: 'active',
        deadline,
        deadlineAdjustCount: 0,
        overdueAdjustCount: 0,
        createdAt: now.toISOString(),
        completedAt: null,
      };
      const handle = await activeDirectory.getFileHandle(fileName, { create: true });
      await writeEntry(handle, entry);
    }

    const wasEditing = editingRecord !== null;
    await loadFolder(activeDirectory);
    renderWorkspace();
    closeComposer();
    showToast(wasEditing ? '调整已保存。' : '日志已写入档案库。');
    addFab.focus();
  } catch (error) {
    console.error('保存日志失败', error);
    showToast('保存失败，请检查文件夹写入权限。');
  } finally {
    isSaving = false;
    logSubmitBtn.disabled = false;
    logForm.setAttribute('aria-busy', 'false');
  }
});

async function ensureWritablePermission(directory: FileSystemDirectoryHandle): Promise<boolean> {
  const handle = directory as PermissionAwareDirectory;
  const descriptor = { mode: 'readwrite' as const };

  if (handle.queryPermission) {
    const state = await handle.queryPermission(descriptor);
    if (state === 'granted') {
      return true;
    }
  }

  if (handle.requestPermission) {
    return (await handle.requestPermission(descriptor)) === 'granted';
  }

  return true;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  );
}

function isSortMode(value: string | undefined): value is SortMode {
  return (
    value === 'created-desc' ||
    value === 'created-asc' ||
    value === 'priority-desc' ||
    value === 'priority-asc'
  );
}

function renderWorkspace() {
  const opened = activeDirectory !== null;
  welcomeView.classList.toggle('hidden', opened);
  workspaceView.classList.toggle('hidden', !opened);
  addFab.classList.remove('hidden');

  if (!opened) {
    stopCountdownTicker();
    folderName.textContent = '未选择文件夹';
    countTotal.textContent = '0';
    countActive.textContent = '0';
    countDone.textContent = '0';
    updateArchiveDoneButton(0);
    logCards.innerHTML = '';
    archiveFooter.innerHTML = '';
    focusPanel.classList.add('hidden');
    noLogsState.textContent = '选择一个文件夹。每条日志都会成为一个真实文件。';
    noLogsState.classList.remove('search-empty');
    noLogsState.classList.remove('hidden');
    return;
  }

  folderName.textContent = activeDirectory!.name;

  const total = records.length;
  const activeCount = records.filter((item) => item.entry.status === 'active').length;
  const doneCount = records.length - activeCount;

  countTotal.textContent = String(total);
  countActive.textContent = String(activeCount);
  countDone.textContent = String(doneCount);
  updateArchiveDoneButton(doneCount);
  updateSortButtons();

  logCards.innerHTML = '';
  if (records.length === 0) {
    focusPanel.classList.add('hidden');
    noLogsState.textContent = '还没有日志。创建第一条。';
    noLogsState.classList.remove('search-empty');
    noLogsState.classList.remove('hidden');
    renderArchiveFooter(0);
    return;
  }

  renderFocusPanel();

  const visibleRecords = getVisibleRecords();
  if (visibleRecords.length === 0) {
    noLogsState.textContent = '没有匹配的事件。清空搜索或切换筛选。';
    noLogsState.classList.add('search-empty');
    noLogsState.classList.remove('hidden');
    archiveFooter.innerHTML = '';
    return;
  }

  noLogsState.classList.add('hidden');
  noLogsState.classList.remove('search-empty');
  const totalPages = getTotalPages(visibleRecords.length);
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  for (const record of getPageRecords(visibleRecords)) {
    logCards.appendChild(buildCard(record));
  }
  renderArchiveFooter(visibleRecords.length);

  updateCountdowns();
}

function updateSortButtons() {
  sortButtons.forEach((button) => {
    const active = button.dataset.sort === currentSortMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  createdSortBtn.textContent = getCreatedSortButtonText(currentSortMode);
  createdSortBtn.setAttribute('aria-label', `按${getCreatedSortLabel(currentSortMode)}排序`);
  createdSortBtn.classList.toggle('active', isCreatedSort(currentSortMode));
  createdSortBtn.setAttribute('aria-pressed', String(isCreatedSort(currentSortMode)));
  prioritySortBtn.textContent = getPrioritySortButtonText(currentSortMode);
  prioritySortBtn.setAttribute('aria-label', `按${getPrioritySortLabel(currentSortMode)}排序`);
  prioritySortBtn.classList.toggle('active', isPrioritySort(currentSortMode));
  prioritySortBtn.setAttribute('aria-pressed', String(isPrioritySort(currentSortMode)));
  filterToggle.textContent = statusFilter === 'all' ? '筛选' : getFilterLabel(statusFilter);
  filterToggle.setAttribute('aria-pressed', String(statusFilter !== 'all'));
}

function updateArchiveDoneButton(doneCount: number) {
  archiveDoneBtn.disabled = !activeDirectory || doneCount === 0 || isArchiving;
  archiveDoneBtn.textContent = isArchiving ? '归档中' : '归档已完成';
  archiveDoneBtn.title =
    doneCount === 0 ? '当前没有已完成事件可归档' : `将 ${doneCount} 个已完成事件移动到 archive 文件夹`;
}

function getTotalPages(totalItems: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

function getPageRecords(list: LogRecord[]): LogRecord[] {
  const start = (currentPage - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

function renderArchiveFooter(totalItems: number) {
  archiveFooter.innerHTML = '';
  if (!activeDirectory || records.length === 0) {
    return;
  }

  const totalPages = getTotalPages(totalItems);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const summary = document.createElement('span');
  summary.className = 'archive-page-summary';
  summary.textContent = totalItems === 0 ? '无匹配事件' : `${start}-${end} / ${totalItems}`;
  archiveFooter.appendChild(summary);

  const prev = createPageButton('‹', currentPage > 1, () => {
    currentPage -= 1;
    renderWorkspace();
  });
  archiveFooter.appendChild(prev);

  for (let page = 1; page <= totalPages; page += 1) {
    if (totalPages > 7 && page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
      if (page === 2 || page === totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        archiveFooter.appendChild(ellipsis);
      }
      continue;
    }
    const button = createPageButton(String(page), page !== currentPage, () => {
      currentPage = page;
      renderWorkspace();
    });
    button.classList.toggle('active', page === currentPage);
    archiveFooter.appendChild(button);
  }

  const next = createPageButton('›', currentPage < totalPages, () => {
    currentPage += 1;
    renderWorkspace();
  });
  archiveFooter.appendChild(next);

  const sizeButton = document.createElement('span');
  sizeButton.className = 'page-size-btn';
  sizeButton.textContent = `每页 ${pageSize} 条`;
  archiveFooter.appendChild(sizeButton);
}

function createPageButton(label: string, enabled: boolean, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'page-btn';
  button.textContent = label;
  button.disabled = !enabled;
  button.addEventListener('click', onClick);
  return button;
}

function renderFocusPanel() {
  const focus = getFocusRecord();
  if (!focus) {
    focusPanel.classList.remove('hidden');
    clearTensionClasses(focusPanel);
    focusTitle.textContent = '暂无进行中事件';
    focusCountdown.textContent = '所有任务已归档';
    focusCountdown.removeAttribute('data-id');
    focusCountdown.classList.remove('overdue');
    focusDeadline.textContent = '完成事件会继续留在右侧档案中。';
    focusNote.textContent = '';
    focusTags.innerHTML = '';
    focusEditBtn.disabled = true;
    focusCompleteBtn.disabled = true;
    setCoverVisual(focusImage, {
      id: 'empty',
      title: '暂无进行中事件',
      note: '',
      tags: ['归档'],
      weight: 5,
      status: 'done',
      deadline: new Date().toISOString(),
      deadlineAdjustCount: 0,
      overdueAdjustCount: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
    return;
  }

  const countdown = formatCountdownText(focus.entry.deadline);
  focusPanel.classList.remove('hidden');
  applyTensionClass(focusPanel, focus.entry);
  focusTitle.textContent = focus.entry.title;
  setCoverVisual(focusImage, focus.entry);
  focusCountdown.dataset.id = focus.entry.id;
  focusCountdown.textContent = countdown.text;
  focusCountdown.classList.toggle('overdue', countdown.isOverdue);
  focusDeadline.textContent = `创建于 ${formatReadableTime(focus.entry.createdAt)}`;
  focusNote.textContent = focus.entry.note || '没有备注，只有目标。';
  focusTags.innerHTML = '';
  for (const tag of deriveTags(focus.entry)) {
    const chip = document.createElement('span');
    chip.textContent = tag;
    focusTags.appendChild(chip);
  }
  focusEditBtn.disabled = false;
  focusCompleteBtn.disabled = false;
}

function toggleComposer() {
  if (logForm.classList.contains('hidden')) {
    openComposer();
  } else if (!isSaving) {
    closeComposer();
  }
}

function openComposer(record?: LogRecord) {
  editingRecord = record ?? null;
  logForm.classList.remove('hidden');
  addFab.classList.add('active');
  addFab.textContent = '×';
  addFab.setAttribute('aria-label', '关闭新增面板');
  addFab.setAttribute('aria-expanded', 'true');
  logFormTitle.textContent = editingRecord ? '调整事件' : '新增日志';
  logSubmitBtn.textContent = editingRecord ? '保存调整' : '写入日志';
  titleInput.value = editingRecord?.entry.title ?? '';
  noteInput.value = editingRecord?.entry.note ?? '';
  tagsInput.value = editingRecord?.entry.tags.join(', ') ?? '';
  weightInput.value = String(editingRecord?.entry.weight ?? 5);
  weightValue.textContent = weightInput.value;
  deadlineInput.value = buildDateTimeLocalValue(
    new Date(editingRecord?.entry.deadline ?? buildDefaultDeadline(new Date())),
  );
  titleInput.focus();
}

function closeComposer() {
  logForm.classList.add('hidden');
  editingRecord = null;
  addFab.classList.remove('active');
  addFab.textContent = '+';
  addFab.setAttribute('aria-label', '新增日志');
  addFab.setAttribute('aria-expanded', 'false');
  logFormTitle.textContent = '新增日志';
  logSubmitBtn.textContent = '写入日志';
  titleInput.value = '';
  noteInput.value = '';
  tagsInput.value = '';
  weightInput.value = '5';
  weightValue.textContent = '5';
  deadlineInput.value = '';
}

function buildCard(record: LogRecord): HTMLElement {
  const card = document.createElement('article');
  card.className = `log-card log-row ${record.entry.status}`;
  card.dataset.id = record.entry.id;
  card.setAttribute('role', 'listitem');
  applyTensionClass(card, record.entry);

  const titleCell = document.createElement('div');
  titleCell.className = 'row-title-cell';

  const thumb = document.createElement('span');
  thumb.className = 'row-thumb cover-library';
  thumb.setAttribute('aria-hidden', 'true');
  setCoverVisual(thumb, record.entry);
  titleCell.appendChild(thumb);

  const titleWrap = document.createElement('div');
  titleWrap.className = 'row-title-wrap';

  const title = document.createElement('h3');
  title.className = 'card-title row-title';
  title.textContent = record.entry.title;
  titleWrap.appendChild(title);

  const note = document.createElement('p');
  note.className = 'card-note row-note';
  note.textContent = record.entry.note || '没有备注，只有目标。';
  titleWrap.appendChild(note);

  titleCell.appendChild(titleWrap);
  card.appendChild(titleCell);

  const tagCell = document.createElement('div');
  tagCell.className = 'row-tags';
  for (const tag of deriveTags(record.entry).slice(0, 2)) {
    const tagNode = document.createElement('span');
    tagNode.textContent = tag;
    tagCell.appendChild(tagNode);
  }
  card.appendChild(tagCell);

  const created = document.createElement('p');
  created.className = 'card-meta row-created';
  created.textContent = formatReadableTime(record.entry.createdAt);
  card.appendChild(created);

  const badge = document.createElement('span');
  badge.className = 'state-tag';
  badge.textContent = record.entry.status === 'active' ? '进行中' : '已归档';

  const actions = document.createElement('div');
  actions.className = 'row-actions';

  const detailBtn = document.createElement('button');
  detailBtn.className = 'row-link';
  detailBtn.textContent = '调整';
  detailBtn.type = 'button';
  detailBtn.addEventListener('click', () => {
    openComposer(record);
  });
  actions.appendChild(detailBtn);

  if (record.entry.status === 'active') {
    const completeBtn = document.createElement('button');
    completeBtn.className = 'row-ghost';
    completeBtn.textContent = '完成';
    completeBtn.type = 'button';
    completeBtn.addEventListener('click', async () => {
      await completeLog(record);
    });
    actions.appendChild(completeBtn);
  } else {
    const reactivateBtn = document.createElement('button');
    reactivateBtn.className = 'row-ghost';
    reactivateBtn.textContent = '重新激活';
    reactivateBtn.type = 'button';
    reactivateBtn.addEventListener('click', async () => {
      await reactivateLog(record);
    });
    actions.appendChild(reactivateBtn);
  }

  const statusActionCell = document.createElement('div');
  statusActionCell.className = 'status-action-cell';
  statusActionCell.append(badge, actions);
  card.appendChild(statusActionCell);

  if (record.entry.status === 'active') {
    card.addEventListener('click', async (event) => {
      if (isInsideButton(event.target)) {
        return;
      }
      await completeLog(record);
    });
  }

  return card;
}

function isInsideButton(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, input, textarea') !== null;
}

async function archiveCompletedLogs() {
  if (!activeDirectory || isArchiving) {
    return;
  }

  const completedRecords = records.filter((record) => record.entry.status === 'done');
  if (completedRecords.length === 0) {
    showToast('当前没有已完成事件可归档。');
    return;
  }

  try {
    isArchiving = true;
    updateArchiveDoneButton(completedRecords.length);

    if (!(await ensureWritablePermission(activeDirectory))) {
      throw new Error('未获得文件夹写入权限');
    }

    const archiveDirectory = await getArchiveDirectory(activeDirectory);
    for (const record of completedRecords) {
      const target = await archiveDirectory.getFileHandle(record.fileName, { create: true });
      await writeEntry(target, record.entry);
      await removeDirectoryEntry(activeDirectory, record.fileName);
    }

    if (editingRecord?.entry.status === 'done') {
      closeComposer();
    }
    currentPage = 1;
    await loadFolder(activeDirectory);
    renderWorkspace();
    showToast(`已归档 ${completedRecords.length} 个已完成事件。`);
  } catch (error) {
    console.error('归档已完成事件失败', error);
    showToast('归档失败，请检查文件夹写入权限后重试。');
  } finally {
    isArchiving = false;
    updateArchiveDoneButton(records.filter((record) => record.entry.status === 'done').length);
  }
}

async function getArchiveDirectory(directory: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  const handle = directory as MutableDirectory;
  return handle.getDirectoryHandle('archive', { create: true });
}

async function removeDirectoryEntry(directory: FileSystemDirectoryHandle, fileName: string) {
  const handle = directory as MutableDirectory;
  if (!handle.removeEntry) {
    throw new Error('当前浏览器不支持删除文件');
  }
  await handle.removeEntry(fileName);
}

async function completeLog(record: LogRecord) {
  if (record.entry.status !== 'active' || !activeDirectory) {
    return;
  }
  if (pendingRecordIds.has(record.entry.id)) {
    return;
  }
  pendingRecordIds.add(record.entry.id);

  const updated: LogEntry = {
    ...record.entry,
    status: 'done',
    completedAt: new Date().toISOString(),
  };

  try {
    if (!(await ensureWritablePermission(activeDirectory))) {
      throw new Error('未获得文件夹写入权限');
    }
    await writeEntry(record.handle, updated);
    await loadFolder(activeDirectory);
    renderWorkspace();
    showToast('事件已完成。');
    showCongratulations();
  } catch (error) {
    console.error('完成更新失败', error);
    showToast('完成更新失败，请检查文件夹写入权限。');
  } finally {
    pendingRecordIds.delete(record.entry.id);
  }
}

async function reactivateLog(record: LogRecord) {
  if (record.entry.status !== 'done' || !activeDirectory) {
    return;
  }
  if (pendingRecordIds.has(record.entry.id)) {
    return;
  }
  pendingRecordIds.add(record.entry.id);

  const now = new Date();
  const oldDeadline = Date.parse(record.entry.deadline);
  const updated: LogEntry = {
    ...record.entry,
    status: 'active',
    deadline:
      Number.isNaN(oldDeadline) || oldDeadline <= now.getTime()
        ? buildDefaultDeadline(now)
        : record.entry.deadline,
    completedAt: null,
  };

  try {
    if (!(await ensureWritablePermission(activeDirectory))) {
      throw new Error('未获得文件夹写入权限');
    }
    await writeEntry(record.handle, updated);
    await loadFolder(activeDirectory);
    renderWorkspace();
    showToast('事件已重新激活。');
  } catch (error) {
    console.error('重新激活失败', error);
    showToast('重新激活失败，请检查文件夹写入权限。');
  } finally {
    pendingRecordIds.delete(record.entry.id);
  }
}

function showCongratulations() {
  if (congratsTimer) {
    clearTimeout(congratsTimer);
    congratsTimer = null;
  }
  particleLayer.innerHTML = '';
  for (let i = 0; i < 72; i += 1) {
    particleLayer.appendChild(createParticle());
  }
  congratsOverlay.classList.remove('hidden');
  congratsOverlay.setAttribute('aria-hidden', 'false');

  congratsTimer = setTimeout(() => {
    congratsOverlay.classList.add('hidden');
    congratsOverlay.setAttribute('aria-hidden', 'true');
    particleLayer.innerHTML = '';
  }, 2500);
}

function createParticle(): HTMLSpanElement {
  const particle = document.createElement('span');
  const palette = ['#f2c95e', '#d89f3b', '#a8332f', '#b7c7b8', '#ffdca9'];
  const size = 4 + Math.floor(Math.random() * 7);
  particle.className = 'particle';
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.backgroundColor = palette[Math.floor(Math.random() * palette.length)];
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.animationDuration = `${1.2 + Math.random() * 1.3}s`;
  particle.style.animationDelay = `${Math.random() * 0.6}s`;
  particle.style.setProperty('--x', `${(Math.random() * 140 - 70).toFixed(1)}px`);
  return particle;
}

function showToast(message: string) {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  statusToast.textContent = message;
  statusToast.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    statusToast.classList.add('hidden');
    statusToast.textContent = '';
  }, 2400);
}

function startCountdownTicker() {
  stopCountdownTicker();
  countdownTimer = window.setInterval(() => {
    updateCountdowns();
  }, 1000);
  updateCountdowns();
}

function stopCountdownTicker() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function updateCountdowns() {
  if (!activeDirectory) {
    return;
  }

  const recordMap = new Map(records.map((record) => [record.entry.id, record]));
  const countdownNodes = document.querySelectorAll<HTMLElement>('.countdown[data-id]');

  for (const node of countdownNodes) {
    const id = node.dataset.id;
    if (!id) {
      continue;
    }

    const record = recordMap.get(id);
    if (!record || record.entry.status !== 'active') {
      continue;
    }

    const result = formatCountdownText(record.entry.deadline);
    node.textContent = `倒计时：${result.text}`;
    node.classList.toggle('overdue', result.isOverdue);
    const row = findLogRow(record.entry.id);
    if (row) {
      applyTensionClass(row, record.entry);
    }
  }

  const focusId = focusCountdown.dataset.id;
  if (focusId) {
    const record = recordMap.get(focusId);
    if (record && record.entry.status === 'active') {
      const result = formatCountdownText(record.entry.deadline);
      focusCountdown.textContent = result.text;
      focusCountdown.classList.toggle('overdue', result.isOverdue);
      applyTensionClass(focusPanel, record.entry);
    }
  }

  for (const record of records) {
    const row = findLogRow(record.entry.id);
    if (row) {
      applyTensionClass(row, record.entry);
    }
  }
}

function findLogRow(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.log-row[data-id="${CSS.escape(id)}"]`);
}

const tensionClassNames = [
  'tension',
  'tension-1',
  'tension-2',
  'tension-3',
  'tension-4',
  'tension-5',
  'currently-overdue',
];

function applyTensionClass(element: HTMLElement, entry: LogEntry) {
  clearTensionClasses(element);
  const level = getTensionLevel(entry);
  if (level === 0) {
    return;
  }

  element.classList.add('tension', `tension-${level}`);
  if (entry.status === 'active' && isDeadlineOverdue(entry.deadline)) {
    element.classList.add('currently-overdue');
  }
}

function clearTensionClasses(element: HTMLElement) {
  element.classList.remove(...tensionClassNames);
}

function getTensionLevel(entry: LogEntry): number {
  const overdueAdjusts = normalizeCount(entry.overdueAdjustCount);
  const deadlineAdjusts = normalizeCount(entry.deadlineAdjustCount);
  const currentlyOverdue = entry.status === 'active' && isDeadlineOverdue(entry.deadline);
  if (overdueAdjusts === 0 && !currentlyOverdue) {
    return 0;
  }

  const historicalPressure = overdueAdjusts + Math.floor(deadlineAdjusts / 2);
  const livePressure = currentlyOverdue ? 1 : 0;
  return Math.min(5, Math.max(1, historicalPressure + livePressure));
}

function hasDeadlineChanged(previousIso: string, nextIso: string): boolean {
  const previous = Date.parse(previousIso);
  const next = Date.parse(nextIso);
  if (Number.isNaN(previous) || Number.isNaN(next)) {
    return previousIso !== nextIso;
  }
  return Math.floor(previous / 60000) !== Math.floor(next / 60000);
}

function isDeadlineOverdue(deadlineIso: string, at = new Date()): boolean {
  const deadline = Date.parse(deadlineIso);
  if (Number.isNaN(deadline)) {
    return true;
  }
  return deadline < at.getTime();
}

function getFocusRecord(): LogRecord | null {
  const activeRecords = records.filter((record) => record.entry.status === 'active');
  if (activeRecords.length === 0) {
    return null;
  }

  return activeRecords.sort((a, b) => {
    const weightDiff = b.entry.weight - a.entry.weight;
    return weightDiff || getDeadlineTime(a) - getDeadlineTime(b);
  })[0];
}

function getVisibleRecords(): LogRecord[] {
  const sorted = getSortedRecords();
  return sorted.filter((record) => {
    if (statusFilter !== 'all' && record.entry.status !== statusFilter) {
      return false;
    }
    if (!archiveQuery) {
      return true;
    }
    const haystack = [
      record.entry.title,
      record.entry.note,
      String(record.entry.weight),
      record.entry.status === 'active' ? '进行中' : '已完成 已归档',
      ...deriveTags(record.entry),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(archiveQuery);
  });
}

function getSortedRecords(): LogRecord[] {
  const list = [...records];

  return list.sort((a, b) => {
    const statusDiff = statusRank(a, 'active') - statusRank(b, 'active');
    if (statusDiff !== 0) {
      return statusDiff;
    }

    const sortDiff = getSortDifference(a, b, currentSortMode);
    return sortDiff || getCreatedTime(b) - getCreatedTime(a);
  });
}

function getSortDifference(a: LogRecord, b: LogRecord, mode: SortMode): number {
  if (mode === 'created-asc') {
    return getCreatedTime(a) - getCreatedTime(b);
  }
  if (mode === 'priority-desc') {
    return b.entry.weight - a.entry.weight;
  }
  if (mode === 'priority-asc') {
    return a.entry.weight - b.entry.weight;
  }
  return getCreatedTime(b) - getCreatedTime(a);
}

function getCreatedSortButtonText(mode: SortMode): string {
  if (mode === 'created-asc') {
    return '创建时间 ↑';
  }
  return isCreatedSort(mode) ? '创建时间 ↓' : '创建时间';
}

function getPrioritySortButtonText(mode: SortMode): string {
  if (mode === 'priority-asc') {
    return '标签 ↑';
  }
  return mode === 'priority-desc' ? '标签 ↓' : '标签';
}

function getSortLabel(mode: SortMode): string {
  if (mode === 'created-asc') {
    return '创建时间升序';
  }
  if (mode === 'priority-desc') {
    return '优先级从高到低';
  }
  if (mode === 'priority-asc') {
    return '优先级从低到高';
  }
  return '创建时间降序';
}

function getCreatedSortLabel(mode: SortMode): string {
  return mode === 'created-asc' ? '创建时间升序' : '创建时间降序';
}

function getPrioritySortLabel(mode: SortMode): string {
  if (mode === 'priority-asc') {
    return '优先级从低到高';
  }
  return '优先级从高到低';
}

function isCreatedSort(mode: SortMode): boolean {
  return mode === 'created-desc' || mode === 'created-asc';
}

function isPrioritySort(mode: SortMode): boolean {
  return mode === 'priority-desc' || mode === 'priority-asc';
}

function getFilterLabel(filter: StatusFilter): string {
  if (filter === 'active') {
    return '只看进行中';
  }
  if (filter === 'done') {
    return '只看已完成';
  }
  return '全部事件';
}

function deriveTags(entry: LogEntry): string[] {
  const tags: string[] = [];

  const add = (tag: string) => {
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  };

  add(getPriorityLabel(entry.weight));
  add(entry.status === 'active' ? '进行中' : '已完成');
  for (const tag of entry.tags) {
    if (shouldHideDisplayTag(tag)) {
      continue;
    }
    add(tag);
  }

  return tags.slice(0, 4);
}

function getPriorityLabel(weight: number): string {
  return `优先级 ${clampWeight(weight)}`;
}

function shouldHideDisplayTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  return [
    '数学',
    '高优先级',
    '中优先级',
    '低优先级',
    '进行中',
    '已完成',
    '已归档',
  ].includes(normalized);
}

function setCoverVisual(element: HTMLElement, _entry: LogEntry) {
  const baseClass = element.classList.contains('row-thumb') ? 'row-thumb' : 'focus-image';
  element.className = `${baseClass} cover-library`;
  element.style.removeProperty('background-image');
  element.style.removeProperty('background-position');
  element.style.removeProperty('background-size');
  element.style.removeProperty('background-repeat');
}

function statusRank(record: LogRecord, first: LogStatus): number {
  if (record.entry.status === first) {
    return 0;
  }
  return 1;
}

function getDeadlineTime(record: LogRecord): number {
  const time = Date.parse(record.entry.deadline);
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function getCreatedTime(record: LogRecord): number {
  const time = Date.parse(record.entry.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

function getCompletedTime(record: LogRecord): number {
  if (!record.entry.completedAt) {
    return 0;
  }
  const time = Date.parse(record.entry.completedAt);
  return Number.isNaN(time) ? 0 : time;
}

function formatCountdownText(deadlineIso: string): CountdownState {
  const due = Date.parse(deadlineIso);
  if (Number.isNaN(due)) {
    return { text: '时间无效', isOverdue: true };
  }

  const diff = due - Date.now();
  const abs = Math.abs(diff);
  const totalSeconds = Math.floor(abs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const base = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;

  if (diff >= 0) {
    return { text: `剩余 ${base}`, isOverdue: false };
  }
  return { text: `已逾期 ${base}`, isOverdue: true };
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

async function loadFolder(directory: FileSystemDirectoryHandle) {
  const found: LogRecord[] = [];

  const dir = directory as DirectoryLike;
  for await (const candidate of dir.values()) {
    if (candidate.kind !== 'file') {
      continue;
    }
    const fileHandle = candidate as FileSystemFileHandle;
    if (!fileHandle.name.endsWith('.omegalog.json')) {
      continue;
    }

    try {
      const file = await fileHandle.getFile();
      const parsed = JSON.parse(await file.text());
      const entry = parseLogEntry(parsed);
      if (!entry) {
        console.warn(`跳过损坏的日志：${fileHandle.name}`);
        continue;
      }
      found.push({
        fileName: fileHandle.name,
        handle: fileHandle,
        entry,
      });
    } catch (error) {
      console.warn(`读取失败：${fileHandle.name}`, error);
    }
  }

  records = found.sort((a, b) => {
    return new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime();
  });
}

function parseLogEntry(value: unknown): LogEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const obj = value as Partial<LogEntry>;

  if (typeof obj.id !== 'string' || obj.id.trim().length === 0) {
    return null;
  }
  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    return null;
  }
  if (typeof obj.createdAt !== 'string' || Number.isNaN(new Date(obj.createdAt).getTime())) {
    return null;
  }
  if (obj.status !== 'active' && obj.status !== 'done') {
    return null;
  }
  if (obj.completedAt != null && typeof obj.completedAt !== 'string') {
    return null;
  }
  if (obj.completedAt && Number.isNaN(new Date(obj.completedAt).getTime())) {
    return null;
  }

  let deadline = obj.deadline;
  if (typeof deadline !== 'string' || Number.isNaN(new Date(deadline).getTime())) {
    deadline = buildDefaultDeadline(new Date(obj.createdAt));
  } else {
    deadline = new Date(deadline).toISOString();
  }

  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
    : [];
  const weight = clampWeight(Number(obj.weight ?? 5));
  const deadlineAdjustCount = normalizeCount(obj.deadlineAdjustCount);
  const overdueAdjustCount = normalizeCount(obj.overdueAdjustCount);

  return {
    id: obj.id,
    title: obj.title,
    note: typeof obj.note === 'string' ? obj.note : '',
    tags: uniqueTags(tags),
    weight,
    status: obj.status,
    deadline,
    deadlineAdjustCount,
    overdueAdjustCount,
    createdAt: new Date(obj.createdAt).toISOString(),
    completedAt: obj.completedAt ? new Date(obj.completedAt).toISOString() : null,
  };
}

async function writeEntry(handle: FileSystemFileHandle, entry: LogEntry) {
  const writable = await handle.createWritable();
  await writable.write(`${JSON.stringify(entry, null, 2)}\n`);
  await writable.close();
}

function formatDateForFilename(date: Date): string {
  const p = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(
    date.getHours(),
  )}-${p(date.getMinutes())}-${p(date.getSeconds())}`;
}

function buildDefaultDeadline(createdAt: Date): string {
  const deadline = new Date(createdAt);
  deadline.setHours(24, 0, 0, 0);
  if (deadline.getTime() <= createdAt.getTime()) {
    deadline.setDate(deadline.getDate() + 1);
  }
  return deadline.toISOString();
}

function buildDateTimeLocalValue(date: Date): string {
  const p = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(
    date.getHours(),
  )}:${p(date.getMinutes())}`;
}

function parseDeadlineInput(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function parseTagsInput(value: string): string[] {
  return uniqueTags(
    value
      .split(/[,，、\s]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag && !shouldHideDisplayTag(tag)),
  );
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = tag.slice(0, 18);
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }
  return result.slice(0, 6);
}

function clampWeight(value: number): number {
  if (!Number.isFinite(value)) {
    return 5;
  }
  return Math.min(10, Math.max(1, Math.round(value)));
}

function normalizeCount(value: unknown): number {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count < 0) {
    return 0;
  }
  return Math.min(99, Math.floor(count));
}

function formatReadableTime(value: string): string {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function generateId(): string {
  if (crypto?.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

renderWorkspace();
