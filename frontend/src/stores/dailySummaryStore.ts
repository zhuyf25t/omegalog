import { create } from 'zustand';
import type {
  DailySummaryActions,
  DailySummaryStoreState,
} from './dailySummaryStoreTypes';
import { createDailySummaryActions } from './dailySummaryActions';
import type { DailySummary, SummaryRunStatus } from '../domain/dailySummary';
import type { TaskChangeEvent } from '../domain/taskHistory';

const useDailySummaryStore = create<DailySummaryStoreState>()((set) => ({
  events: [],
  summaries: [],
  runStatus: 'idle',
  lastError: null,
  actions: createDailySummaryActions(set),
}));

export const useTaskEvents = (): readonly TaskChangeEvent[] =>
  useDailySummaryStore((state) => state.events);

export const useDailySummaries = (): readonly DailySummary[] =>
  useDailySummaryStore((state) => state.summaries);

export const useDailySummaryRunStatus = (): SummaryRunStatus =>
  useDailySummaryStore((state) => state.runStatus);

export const useDailySummaryLastError = (): string | null =>
  useDailySummaryStore((state) => state.lastError);

export const useDailySummaryActions = (): DailySummaryActions =>
  useDailySummaryStore((state) => state.actions);

export type {
  DailySummaryActions,
  DailySummaryStoreState,
} from './dailySummaryStoreTypes';
