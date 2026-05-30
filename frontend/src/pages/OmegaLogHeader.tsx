import { FolderOpen, Plus, RefreshCw } from 'lucide-react';
import type { WorkspaceStatus } from '../stores/taskLogStore';

interface OmegaLogHeaderProps {
  readonly workspaceStatus: WorkspaceStatus;
  readonly workspaceName: string | null;
  readonly isBusy: boolean;
  readonly isWorkspaceOpen: boolean;
  readonly onOpenWorkspace: () => void;
  readonly onReloadWorkspace: () => void;
  readonly onCreateTask: () => void;
}

const statusLabels: Record<WorkspaceStatus, string> = {
  idle: '未打开',
  opening: '打开中',
  ready: '已打开',
  working: '同步中',
  unsupported: '不支持',
  error: '错误',
};

export const OmegaLogHeader = ({
  workspaceStatus,
  workspaceName,
  isBusy,
  isWorkspaceOpen,
  onOpenWorkspace,
  onReloadWorkspace,
  onCreateTask,
}: OmegaLogHeaderProps) => (
  <header className="app-header">
    <div className="hero">
      <div className="codex-words" aria-hidden="true">
        <span>TRUTH</span>
        <span>POWER</span>
        <span>SCALE</span>
        <span>EDGE</span>
        <span>CONTROL</span>
        <span>VISION</span>
      </div>
      <h1>OMEGALOG</h1>
      <p>记录、归档与检索你的事件轨迹</p>
    </div>
    <div className="header-actions">
      <span className={`workspace-chip ${workspaceStatus}`}>
        {workspaceName ?? statusLabels[workspaceStatus]}
      </span>
      <button
        className="secondary-button"
        disabled={isBusy}
        type="button"
        onClick={onOpenWorkspace}
      >
        <FolderOpen size={18} />
        <span>打开文件夹</span>
      </button>
      <button
        aria-label="刷新文件夹"
        className="icon-button"
        disabled={!isWorkspaceOpen || isBusy}
        title="刷新"
        type="button"
        onClick={onReloadWorkspace}
      >
        <RefreshCw size={18} />
      </button>
      <button
        aria-label="新建任务"
        className="icon-button"
        disabled={!isWorkspaceOpen || isBusy}
        title="新建"
        type="button"
        onClick={onCreateTask}
      >
        <Plus size={18} />
      </button>
    </div>
  </header>
);
