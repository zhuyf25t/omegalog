import './style.css';

type LogStatus = 'active' | 'done';
type SortMode = 'created-desc' | 'created-asc' | 'priority-desc' | 'priority-asc';
type StatusFilter = 'all' | 'active' | 'done';
type CoverVariant = 'library' | 'formula' | 'physics' | 'writing' | 'crimson';

interface LogEntry {
  id: string;
  title: string;
  note: string;
  tags: string[];
  weight: number;
  status: LogStatus;
  deadline: string;
  createdAt: string;
  completedAt: string | null;
  coverVariant?: CoverVariant;
  coverDataUrl?: string;
  coverGeneratedAt?: string;
}

interface LogRecord {
  fileName: string;
  handle: FileSystemFileHandle;
  entry: LogEntry;
}

type DirectoryLike = FileSystemDirectoryHandle & {
  values: () => AsyncIterable<FileSystemHandle>;
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
const focusCoverBtn = document.getElementById('focus-cover-btn') as HTMLButtonElement;

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

focusCoverBtn.addEventListener('click', async () => {
  const focus = getFocusRecord();
  if (focus) {
    await generateCover(focus);
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
      const coverVariant = chooseCoverVariant({
        title,
        note,
        tags,
        weight,
        status: editingRecord.entry.status,
      });
      const coverGeneratedAt = now.toISOString();
      const nextEntry: LogEntry = {
        ...editingRecord.entry,
        title,
        note,
        tags,
        weight,
        deadline,
        coverVariant,
        coverGeneratedAt,
      };
      nextEntry.coverDataUrl = buildCoverDataUrl(nextEntry);
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
        createdAt: now.toISOString(),
        completedAt: null,
        coverVariant: chooseCoverVariant({ title, note, tags, weight, status: 'active' }),
        coverGeneratedAt: now.toISOString(),
      };
      entry.coverDataUrl = buildCoverDataUrl(entry);
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
    focusTitle.textContent = '暂无进行中事件';
    focusCountdown.textContent = '所有任务已归档';
    focusCountdown.removeAttribute('data-id');
    focusCountdown.classList.remove('overdue');
    focusDeadline.textContent = '完成事件会继续留在右侧档案中。';
    focusNote.textContent = '';
    focusTags.innerHTML = '';
    focusEditBtn.disabled = true;
    focusCompleteBtn.disabled = true;
    focusCoverBtn.disabled = true;
    setCoverVisual(focusImage, {
      id: 'empty',
      title: '暂无进行中事件',
      note: '',
      tags: ['归档'],
      weight: 5,
      status: 'done',
      deadline: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      coverVariant: 'library',
    });
    return;
  }

  const countdown = formatCountdownText(focus.entry.deadline);
  focusPanel.classList.remove('hidden');
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
  focusCoverBtn.disabled = false;
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

  const titleCell = document.createElement('div');
  titleCell.className = 'row-title-cell';

  const thumb = document.createElement('span');
  thumb.className = `row-thumb ${getThumbTone(record.entry)}`;
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

async function generateCover(record: LogRecord) {
  if (!activeDirectory) {
    return;
  }
  if (pendingRecordIds.has(record.entry.id)) {
    return;
  }
  pendingRecordIds.add(record.entry.id);

  const variant = chooseCoverVariant(record.entry, true);
  const updated: LogEntry = {
    ...record.entry,
    coverVariant: variant,
    coverGeneratedAt: new Date().toISOString(),
  };
  updated.coverDataUrl = buildCoverDataUrl(updated);

  try {
    if (!(await ensureWritablePermission(activeDirectory))) {
      throw new Error('未获得文件夹写入权限');
    }
    await writeEntry(record.handle, updated);
    await loadFolder(activeDirectory);
    renderWorkspace();
    showToast('头图已重新生成并写入事件文件。');
  } catch (error) {
    console.error('生成头图失败', error);
    showToast('生成头图失败，请检查文件夹写入权限。');
  } finally {
    pendingRecordIds.delete(record.entry.id);
  }
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
  }

  const focusId = focusCountdown.dataset.id;
  if (focusId) {
    const record = recordMap.get(focusId);
    if (record && record.entry.status === 'active') {
      const result = formatCountdownText(record.entry.deadline);
      focusCountdown.textContent = result.text;
      focusCountdown.classList.toggle('overdue', result.isOverdue);
    }
  }
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

function getThumbTone(entry: LogEntry): string {
  return `cover-${getCoverVariant(entry)}`;
}

function getCoverVariant(entry: LogEntry): CoverVariant {
  return entry.coverVariant ?? chooseCoverVariant(entry);
}

function chooseCoverVariant(
  entry: Pick<LogEntry, 'title' | 'note' | 'tags' | 'weight' | 'status'> & { coverVariant?: CoverVariant },
  forceDifferent = false,
): CoverVariant {
  const source = `${entry.title} ${entry.note} ${entry.tags.join(' ')}`;
  const preferred = getCoverVariantByContent(source, entry.weight, entry.status);
  if (!forceDifferent || !('coverVariant' in entry) || entry.coverVariant !== preferred) {
    return preferred;
  }

  const variants: CoverVariant[] = ['library', 'formula', 'physics', 'writing', 'crimson'];
  const currentIndex = variants.indexOf(entry.coverVariant as CoverVariant);
  return variants[(currentIndex + 1) % variants.length];
}

function getCoverVariantByContent(source: string, weight: number, status: LogStatus): CoverVariant {
  if (status === 'done') {
    return 'library';
  }
  if (weight >= 9) {
    return 'crimson';
  }
  if (/物理|力学|能量|热力学|Physics/i.test(source)) {
    return 'physics';
  }
  if (/写作|Essay|Draft|论文|草稿/i.test(source)) {
    return 'writing';
  }
  if (/数学|高微|代数|概率|公式|推导/.test(source)) {
    return 'formula';
  }
  return weight >= 7 ? 'crimson' : 'library';
}

function buildCoverDataUrl(entry: LogEntry): string {
  const variant = getCoverVariant(entry);
  const palette = getCoverPalette(variant);
  const title = escapeSvg(entry.title.slice(0, 42));
  const tagLine = escapeSvg(deriveTags(entry).slice(0, 3).join(' · '));
  const weight = escapeSvg(`WEIGHT ${entry.weight}/10`);
  const status = escapeSvg(entry.status === 'active' ? 'ACTIVE' : 'ARCHIVED');
  const motif = getCoverMotif(variant);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.a}"/><stop offset="0.52" stop-color="${palette.b}"/><stop offset="1" stop-color="${palette.c}"/></linearGradient>
<radialGradient id="lamp" cx="72%" cy="22%" r="46%"><stop offset="0" stop-color="${palette.glow}" stop-opacity="0.78"/><stop offset="0.38" stop-color="${palette.glow}" stop-opacity="0.16"/><stop offset="1" stop-color="${palette.glow}" stop-opacity="0"/></radialGradient>
<pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0v42" fill="none" stroke="#f4d389" stroke-opacity="0.08"/></pattern>
</defs>
<rect width="960" height="540" fill="url(#bg)"/>
<rect width="960" height="540" fill="url(#grid)"/>
<rect width="960" height="540" fill="url(#lamp)"/>
${motif}
<path d="M80 405 C210 354 326 370 460 405 C572 434 680 430 852 386" fill="none" stroke="#f6d887" stroke-opacity="0.18" stroke-width="2"/>
<rect x="62" y="62" width="836" height="416" rx="24" fill="none" stroke="#f0c66a" stroke-opacity="0.24"/>
<text x="92" y="330" fill="#ffe6a1" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700">${title}</text>
<text x="94" y="376" fill="#fff1ce" fill-opacity="0.72" font-family="Arial, sans-serif" font-size="24">${tagLine}</text>
<text x="94" y="426" fill="#f0c66a" font-family="Arial, sans-serif" font-size="22" font-weight="700">${weight}</text>
<text x="756" y="426" fill="#fff1ce" fill-opacity="0.62" font-family="Arial, sans-serif" font-size="20" font-weight="700">${status}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getCoverPalette(variant: CoverVariant) {
  if (variant === 'formula') {
    return { a: '#241b0d', b: '#0d241b', c: '#050604', glow: '#f4d389' };
  }
  if (variant === 'physics') {
    return { a: '#101f1c', b: '#061012', c: '#050604', glow: '#9dd7c2' };
  }
  if (variant === 'writing') {
    return { a: '#2b2115', b: '#17110a', c: '#060504', glow: '#f8dfac' };
  }
  if (variant === 'crimson') {
    return { a: '#35140f', b: '#18110b', c: '#050403', glow: '#ffbf73' };
  }
  return { a: '#2b2315', b: '#101914', c: '#050604', glow: '#f4d389' };
}

function getCoverMotif(variant: CoverVariant): string {
  if (variant === 'formula') {
    return '<g fill="none" stroke="#f4d389" stroke-opacity="0.22" stroke-width="2"><path d="M156 150h118M156 190h86M160 235c40-52 78-52 116 0"/><path d="M690 132h92v92h-92z"/><path d="M700 216l72-72"/></g>';
  }
  if (variant === 'physics') {
    return '<g fill="none" stroke="#b8ead7" stroke-opacity="0.22" stroke-width="2"><ellipse cx="720" cy="184" rx="120" ry="38"/><ellipse cx="720" cy="184" rx="120" ry="38" transform="rotate(60 720 184)"/><ellipse cx="720" cy="184" rx="120" ry="38" transform="rotate(120 720 184)"/><circle cx="720" cy="184" r="8" fill="#f4d389" stroke="none"/></g>';
  }
  if (variant === 'writing') {
    return '<g fill="none" stroke="#ffe8b0" stroke-opacity="0.18" stroke-width="2"><path d="M138 146h310M138 186h260M138 226h298M138 266h214"/><path d="M720 128l80 28-132 166-80 26 132-220z"/></g>';
  }
  if (variant === 'crimson') {
    return '<g fill="none" stroke="#ffcf88" stroke-opacity="0.25" stroke-width="2"><path d="M718 106l94 94-94 94-94-94z"/><path d="M718 142v116M660 200h116"/><circle cx="718" cy="200" r="88"/></g>';
  }
  return '<g fill="none" stroke="#f4d389" stroke-opacity="0.18" stroke-width="2"><path d="M128 128h180v112H128zM650 116h146v146H650z"/><path d="M160 278h620M160 298h560"/><circle cx="728" cy="189" r="54"/></g>';
}

function escapeSvg(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setCoverVisual(element: HTMLElement, entry: LogEntry) {
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
  const coverVariant = isCoverVariant(obj.coverVariant)
    ? obj.coverVariant
    : chooseCoverVariant({
        title: obj.title,
        note: typeof obj.note === 'string' ? obj.note : '',
        tags,
        weight,
        status: obj.status,
      });

  return {
    id: obj.id,
    title: obj.title,
    note: typeof obj.note === 'string' ? obj.note : '',
    tags: uniqueTags(tags),
    weight,
    status: obj.status,
    deadline,
    createdAt: new Date(obj.createdAt).toISOString(),
    completedAt: obj.completedAt ? new Date(obj.completedAt).toISOString() : null,
    coverVariant,
    coverDataUrl: isCoverDataUrl(obj.coverDataUrl) ? obj.coverDataUrl : undefined,
    coverGeneratedAt:
      typeof obj.coverGeneratedAt === 'string' && !Number.isNaN(new Date(obj.coverGeneratedAt).getTime())
        ? new Date(obj.coverGeneratedAt).toISOString()
        : undefined,
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

function isCoverVariant(value: unknown): value is CoverVariant {
  return (
    value === 'library' ||
    value === 'formula' ||
    value === 'physics' ||
    value === 'writing' ||
    value === 'crimson'
  );
}

function isCoverDataUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('data:image/svg+xml,') &&
    value.length < 24000
  );
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
