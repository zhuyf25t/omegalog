import type { SortMode, StatusFilter } from '../domain/taskLog';
import type { TaskLogControls } from './taskLogStoreTypes';

export const defaultControls: TaskLogControls = {
  query: '',
  filter: 'all',
  sortMode: 'created-desc',
  page: 1,
};

export const normalizePage = (page: number): number => {
  if (!Number.isFinite(page)) {
    return 1;
  }
  return Math.max(1, Math.floor(page));
};

export const normalizeControls = (
  current: TaskLogControls,
  incoming: Partial<TaskLogControls>,
): TaskLogControls => ({
  query: incoming.query ?? current.query,
  filter: incoming.filter ?? current.filter,
  sortMode: incoming.sortMode ?? current.sortMode,
  page: normalizePage(incoming.page ?? current.page),
});

export const withQuery = (current: TaskLogControls, query: string): TaskLogControls => ({
  ...current,
  query,
  page: 1,
});

export const withFilter = (
  current: TaskLogControls,
  filter: StatusFilter,
): TaskLogControls => ({
  ...current,
  filter,
  page: 1,
});

export const withSortMode = (
  current: TaskLogControls,
  sortMode: SortMode,
): TaskLogControls => ({
  ...current,
  sortMode,
  page: 1,
});

export const withPage = (current: TaskLogControls, page: number): TaskLogControls => ({
  ...current,
  page: normalizePage(page),
});
