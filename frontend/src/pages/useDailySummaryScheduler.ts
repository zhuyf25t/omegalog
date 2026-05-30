import { useEffect } from 'react';
import { getNextLocalMidnightDelayMs } from '../domain/dailySummarySelectors';
import type { WorkspaceStatus } from '../stores/taskLogStore';
import { useDailySummaryActions } from '../stores/dailySummaryStore';

export const useDailySummaryScheduler = (
  isWorkspaceOpen: boolean,
  workspaceStatus: WorkspaceStatus,
): void => {
  const actions = useDailySummaryActions();

  useEffect(() => {
    if (!isWorkspaceOpen || workspaceStatus === 'opening') {
      return;
    }

    void actions.loadDailySummaryState().then((loaded) => {
      if (loaded) {
        void actions.reconcileDailySummaries();
      }
    });
  }, [actions, isWorkspaceOpen, workspaceStatus]);

  useEffect(() => {
    if (!isWorkspaceOpen) {
      return;
    }

    const reconcile = () => {
      if (document.visibilityState === 'visible') {
        void actions.reconcileDailySummaries();
      }
    };

    document.addEventListener('visibilitychange', reconcile);
    return () => document.removeEventListener('visibilitychange', reconcile);
  }, [actions, isWorkspaceOpen]);

  useEffect(() => {
    if (!isWorkspaceOpen) {
      return;
    }

    let timeoutId: number | null = null;
    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        void actions.reconcileDailySummaries();
        scheduleNext();
      }, getNextLocalMidnightDelayMs());
    };

    scheduleNext();
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [actions, isWorkspaceOpen]);
};
