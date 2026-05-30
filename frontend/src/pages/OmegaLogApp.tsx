import { useState } from 'react';
import {
  usePendingTaskIds,
  useSelectedComposerTaskId,
  useTaskLogActions,
  useTaskLogControls,
  useTaskLogLastError,
  useWorkspaceSnapshot,
  useWorkspaceStatus,
} from '../stores/taskLogStore';
import { OmegaLogHeader } from './OmegaLogHeader';
import { OmegaLogWorkspace } from './OmegaLogWorkspace';
import { useTaskLogUrlControls } from './taskLogUrlControls';
import { useDailySummaryScheduler } from './useDailySummaryScheduler';

export const OmegaLogApp = () => {
  const snapshot = useWorkspaceSnapshot();
  const workspaceStatus = useWorkspaceStatus();
  const controls = useTaskLogControls();
  const selectedTaskId = useSelectedComposerTaskId();
  const pendingTaskIds = usePendingTaskIds();
  const lastError = useTaskLogLastError();
  const actions = useTaskLogActions();
  const [isComposerOpen, setComposerOpen] = useState(false);

  useTaskLogUrlControls(controls, actions.setControls);

  const isBusy = workspaceStatus === 'opening' || workspaceStatus === 'working';
  const isWorkspaceOpen = snapshot !== null;
  useDailySummaryScheduler(isWorkspaceOpen, workspaceStatus);

  const openComposerForTask = (taskId: typeof selectedTaskId) => {
    actions.selectComposerTask(taskId);
    setComposerOpen(true);
  };
  const closeComposer = () => {
    actions.selectComposerTask(null);
    setComposerOpen(false);
  };

  return (
    <>
      <div className="ambient-bg" aria-hidden="true" />
      <main className="app-shell">
        <OmegaLogHeader
          isBusy={isBusy}
          isWorkspaceOpen={isWorkspaceOpen}
          workspaceName={snapshot?.name ?? null}
          workspaceStatus={workspaceStatus}
          onCreateTask={() => openComposerForTask(null)}
          onOpenWorkspace={() => void actions.openWorkspace()}
          onReloadWorkspace={() => void actions.reloadWorkspace()}
        />

        {lastError ? <div className="app-error">{lastError}</div> : null}

        <OmegaLogWorkspace
          actions={actions}
          controls={controls}
          isComposerOpen={isComposerOpen}
          pendingTaskIds={pendingTaskIds}
          selectedTaskId={selectedTaskId}
          snapshot={snapshot}
          workspaceStatus={workspaceStatus}
          onCloseComposer={closeComposer}
          onOpenComposer={openComposerForTask}
        />
      </main>
    </>
  );
};
