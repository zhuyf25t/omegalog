import { dailySummaryApi } from '../api/localDailySummaryApi';
import { toDailySummaryUserMessage } from '../api/dailySummaryApi';
import type { SummaryDate } from '../domain/summaryDate';
import { replaceDailySummaryState, upsertDailySummary } from './dailySummaryReducers';
import type { DailySummaryActions, DailySummaryStoreState } from './dailySummaryStoreTypes';

export type DailySummarySetState = (
  partial:
    | DailySummaryStoreState
    | Partial<DailySummaryStoreState>
    | ((state: DailySummaryStoreState) => DailySummaryStoreState | Partial<DailySummaryStoreState>),
  replace?: false,
) => void;

export const createDailySummaryActions = (
  set: DailySummarySetState,
): DailySummaryActions => ({
  loadDailySummaryState: async () => {
    set({ runStatus: 'loading', lastError: null });
    try {
      const snapshot = await dailySummaryApi.loadState();
      set(replaceDailySummaryState(snapshot.events, snapshot.summaries));
      return true;
    } catch (error) {
      set({ runStatus: 'failed', lastError: toDailySummaryUserMessage(error) });
      return false;
    }
  },
  reconcileDailySummaries: async () => {
    set({ runStatus: 'reconciling', lastError: null });
    try {
      await dailySummaryApi.reconcileMissing();
      const snapshot = await dailySummaryApi.loadState();
      set(replaceDailySummaryState(snapshot.events, snapshot.summaries));
      return true;
    } catch (error) {
      set({ runStatus: 'failed', lastError: toDailySummaryUserMessage(error) });
      return false;
    }
  },
  generateDailySummary: async (day: SummaryDate) => {
    set({ runStatus: 'generating', lastError: null });
    try {
      const summary = await dailySummaryApi.generateForDate(day);
      set((state) => ({
        summaries: upsertDailySummary(state.summaries, summary),
        runStatus: 'ready',
        lastError: null,
      }));
      return true;
    } catch (error) {
      set({ runStatus: 'failed', lastError: toDailySummaryUserMessage(error) });
      return false;
    }
  },
});
