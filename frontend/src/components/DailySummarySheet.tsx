import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { DailySummary } from '../domain/dailySummary';

interface DailySummarySheetProps {
  readonly summary: DailySummary;
  readonly onClose: () => void;
}

export const DailySummarySheet = ({ summary, onClose }: DailySummarySheetProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="summary-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="summary-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="每日总结报告"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="summary-sheet-header">
          <div>
            <p className="eyebrow">Daily report</p>
            <h2>{summary.day}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="关闭每日总结" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="summary-sheet-meta">
          <span>{summary.provider.kind}</span>
          <span>{summary.stats.touchedTasks} 任务</span>
          <span>{summary.source.inputCompleteness}</span>
        </div>

        <article className="summary-markdown">{summary.content.markdown}</article>
      </section>
    </div>,
    document.body,
  );
};
