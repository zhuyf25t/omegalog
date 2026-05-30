import { Search } from 'lucide-react';
import type { SortMode, StatusFilter } from '../domain/taskLog';
import type { TaskStats } from '../domain/taskSelectors';
import type { TaskLogControls } from '../stores/taskLogStore';

interface TaskToolbarProps {
  readonly controls: TaskLogControls;
  readonly stats: TaskStats;
  readonly visibleCount: number;
  readonly onQueryChange: (query: string) => void;
  readonly onFilterChange: (filter: StatusFilter) => void;
  readonly onSortModeChange: (sortMode: SortMode) => void;
}

const statusFilters: readonly { readonly label: string; readonly value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'done' },
];

const sortModes: readonly { readonly label: string; readonly value: SortMode }[] = [
  { label: '最新创建', value: 'created-desc' },
  { label: '最早创建', value: 'created-asc' },
  { label: '高优先级', value: 'priority-desc' },
  { label: '低优先级', value: 'priority-asc' },
];

export const TaskToolbar = ({
  controls,
  stats,
  visibleCount,
  onQueryChange,
  onFilterChange,
  onSortModeChange,
}: TaskToolbarProps) => (
  <section className="task-toolbar">
    <div className="stat-strip" aria-label="任务统计">
      <span>
        <strong>{stats.total}</strong>
        总数
      </span>
      <span>
        <strong>{stats.active}</strong>
        进行中
      </span>
      <span>
        <strong>{stats.done}</strong>
        已完成
      </span>
      <span>
        <strong>{visibleCount}</strong>
        匹配
      </span>
    </div>

    <div className="toolbar-controls">
      <label className="search-box">
        <Search size={17} />
        <input
          aria-label="搜索任务"
          type="search"
          value={controls.query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
      </label>

      <div className="segmented-control" aria-label="状态筛选">
        {statusFilters.map((filter) => (
          <button
            className={controls.filter === filter.value ? 'active' : ''}
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="sort-select">
        <span>排序</span>
        <select
          value={controls.sortMode}
          onChange={(event) => {
            const sortMode = readSortMode(event.currentTarget.value);
            if (sortMode) {
              onSortModeChange(sortMode);
            }
          }}
        >
          {sortModes.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  </section>
);

const readSortMode = (value: string): SortMode | null => {
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
