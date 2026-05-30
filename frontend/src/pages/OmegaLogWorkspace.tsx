import { useMemo } from 'react';
import { TaskArchivePanel } from '../components/TaskArchivePanel';
import { TaskComposer } from '../components/TaskComposer';
import { TaskFocusPanel } from '../components/TaskFocusPanel';
import { TaskList } from '../components/TaskList';
import { TaskToolbar } from '../components/TaskToolbar';
import { DailySummaryPanel } from '../components/DailySummaryPanel';
import {
  getPageRecords,
  getTaskStats,
  getTotalPages,
  selectFocusRecord,
  selectVisibleRecords,
} from '../domain/taskSelectors';
import type { TaskId } from '../domain/taskLog';
import type { TaskRecord, WorkspaceSnapshot } from '../domain/workspace';
import type {
  TaskLogActions,
  TaskLogControls,
  WorkspaceStatus,
} from '../stores/taskLogStore';
import {
  useDailySummaries,
  useDailySummaryActions,
  useDailySummaryLastError,
  useDailySummaryRunStatus,
  useTaskEvents,
} from '../stores/dailySummaryStore';

interface OmegaLogWorkspaceProps {
  readonly snapshot: WorkspaceSnapshot | null;
  readonly workspaceStatus: WorkspaceStatus;
  readonly controls: TaskLogControls;
  readonly selectedTaskId: TaskId | null;
  readonly pendingTaskIds: readonly TaskId[];
  readonly actions: TaskLogActions;
  readonly isComposerOpen: boolean;
  readonly onOpenComposer: (taskId: TaskId | null) => void;
  readonly onCloseComposer: () => void;
}

const emptyRecords: readonly TaskRecord[] = [];
const tasksPerPage = 3;

export const OmegaLogWorkspace = ({
  snapshot,
  workspaceStatus,
  controls,
  selectedTaskId,
  pendingTaskIds,
  actions,
  isComposerOpen,
  onOpenComposer,
  onCloseComposer,
}: OmegaLogWorkspaceProps) => {
  const records = snapshot?.records ?? emptyRecords;
  const stats = useMemo(() => getTaskStats(records), [records]);
  const focusRecord = useMemo(() => selectFocusRecord(records), [records]);
  const visibleRecords = useMemo(
    () => selectVisibleRecords(records, controls.filter, controls.query, controls.sortMode),
    [records, controls.filter, controls.query, controls.sortMode],
  );
  const totalPages = getTotalPages(visibleRecords.length, tasksPerPage);
  const currentPage = Math.min(controls.page, totalPages);
  const pageRecords = useMemo(
    () => getPageRecords(visibleRecords, currentPage, tasksPerPage),
    [visibleRecords, currentPage],
  );
  const selectedRecord = useMemo(
    () => records.find((record) => record.entry.id === selectedTaskId) ?? null,
    [records, selectedTaskId],
  );
  const isBusy = workspaceStatus === 'opening' || workspaceStatus === 'working';
  const isWorkspaceOpen = snapshot !== null;
  const isWriteDisabled = !isWorkspaceOpen || isBusy;
  const focusPending = focusRecord ? pendingTaskIds.includes(focusRecord.entry.id) : false;
  const taskEvents = useTaskEvents();
  const dailySummaries = useDailySummaries();
  const dailySummaryRunStatus = useDailySummaryRunStatus();
  const dailySummaryError = useDailySummaryLastError();
  const dailySummaryActions = useDailySummaryActions();

  return (
    <div className="workspace-layout">
      <aside className="focus-column">
        <TaskFocusPanel
          disabled={isWriteDisabled}
          isPending={focusPending}
          record={focusRecord}
          onComplete={actions.completeEntry}
          onEdit={onOpenComposer}
          onReactivate={actions.reactivateEntry}
        />
      </aside>

      <section className="archive-desk">
        <TaskArchivePanel
          disabled={isWriteDisabled}
          stats={stats}
          warnings={snapshot?.warnings ?? []}
          onArchiveCompleted={actions.archiveCompletedEntries}
        />
        <DailySummaryPanel
          disabled={isWriteDisabled}
          error={dailySummaryError}
          events={taskEvents}
          runStatus={dailySummaryRunStatus}
          summaries={dailySummaries}
          onGenerate={dailySummaryActions.generateDailySummary}
          onReconcile={dailySummaryActions.reconcileDailySummaries}
        />
        <TaskToolbar
          controls={controls}
          stats={stats}
          visibleCount={visibleRecords.length}
          onFilterChange={actions.setFilter}
          onQueryChange={actions.setQuery}
          onSortModeChange={actions.setSortMode}
        />
        <TaskList
          currentPage={currentPage}
          disabled={isWriteDisabled}
          pendingTaskIds={pendingTaskIds}
          records={pageRecords}
          selectedTaskId={selectedTaskId}
          totalPages={totalPages}
          totalVisible={visibleRecords.length}
          onComplete={actions.completeEntry}
          onEdit={onOpenComposer}
          onPageChange={actions.setPage}
          onReactivate={actions.reactivateEntry}
        />
      </section>

      {isComposerOpen ? (
        <TaskComposer
          key={selectedRecord?.entry.id ?? 'new-task'}
          disabled={isWriteDisabled}
          record={selectedRecord}
          onCancelEdit={onCloseComposer}
          onCreate={async (draft) => {
            const succeeded = await actions.createEntry(draft);
            if (succeeded) {
              onCloseComposer();
            }
            return succeeded;
          }}
          onUpdate={async (taskId, draft) => {
            const succeeded = await actions.updateEntry(taskId, draft);
            if (succeeded) {
              onCloseComposer();
            }
            return succeeded;
          }}
        />
      ) : null}
    </div>
  );
};
