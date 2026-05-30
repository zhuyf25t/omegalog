import { useEffect, useState } from 'react';
import type { SortMode, StatusFilter } from '../domain/taskLog';
import { defaultControls } from '../stores/taskLogControls';
import type { TaskLogControls } from '../stores/taskLogStore';

type SetTaskLogControls = (controls: Partial<TaskLogControls>) => void;

export const useTaskLogUrlControls = (
  controls: TaskLogControls,
  setControls: SetTaskLogControls,
): void => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncFromHistory = () => {
      setControls(readControlsFromUrl(window.location.search));
    };

    syncFromHistory();
    setIsHydrated(true);
    window.addEventListener('popstate', syncFromHistory);
    return () => window.removeEventListener('popstate', syncFromHistory);
  }, [setControls]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const nextSearch = buildSearchFromControls(controls);
    if (window.location.search === nextSearch) {
      return;
    }
    window.history.replaceState(null, '', `${window.location.pathname}${nextSearch}`);
  }, [controls, isHydrated]);
};

export const readControlsFromUrl = (
  search: string,
  fallback: TaskLogControls = defaultControls,
): Partial<TaskLogControls> => {
  const params = new URLSearchParams(search);
  const query = params.get('q') ?? fallback.query;
  const filter = readStatusFilter(params.get('filter')) ?? fallback.filter;
  const sortMode = readSortMode(params.get('sort')) ?? fallback.sortMode;
  const page = readPage(params.get('page')) ?? fallback.page;

  return {
    query,
    filter,
    sortMode,
    page,
  };
};

export const buildSearchFromControls = (controls: TaskLogControls): string => {
  const params = new URLSearchParams();
  if (controls.query.trim()) {
    params.set('q', controls.query.trim());
  }
  if (controls.filter !== 'all') {
    params.set('filter', controls.filter);
  }
  if (controls.sortMode !== 'created-desc') {
    params.set('sort', controls.sortMode);
  }
  if (controls.page > 1) {
    params.set('page', String(controls.page));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
};

const readStatusFilter = (value: string | null): StatusFilter | null => {
  if (value === 'all' || value === 'active' || value === 'done') {
    return value;
  }
  return null;
};

const readSortMode = (value: string | null): SortMode | null => {
  if (
    value === 'created-desc' ||
    value === 'created-asc' ||
    value === 'priority-desc' ||
    value === 'priority-asc'
  ) {
    return value;
  }
  return null;
};

const readPage = (value: string | null): number | null => {
  if (!value) {
    return null;
  }
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) {
    return null;
  }
  return Math.floor(page);
};
