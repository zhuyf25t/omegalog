import { AlertTriangle, BookOpen, RefreshCw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  type DailySummary,
  type SummaryRunStatus,
} from '../domain/dailySummary';
import { getYesterday, type SummaryDate } from '../domain/summaryDate';
import type { TaskChangeEvent } from '../domain/taskHistory';
import {
  getSummaryExcerpt,
  selectLatestSummary,
  selectMissingSummaryDates,
} from '../domain/dailySummarySelectors';
import { DailySummarySheet } from './DailySummarySheet';

interface DailySummaryPanelProps {
  readonly events: readonly TaskChangeEvent[];
  readonly summaries: readonly DailySummary[];
  readonly runStatus: SummaryRunStatus;
  readonly error: string | null;
  readonly disabled: boolean;
  readonly onGenerate: (day: SummaryDate) => Promise<boolean>;
  readonly onReconcile: () => Promise<boolean>;
}

export const DailySummaryPanel = ({
  events,
  summaries,
  runStatus,
  error,
  disabled,
  onGenerate,
  onReconcile,
}: DailySummaryPanelProps) => {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<SummaryDate | null>(null);
  const latestSummary = useMemo(() => selectLatestSummary(summaries), [summaries]);
  const selectedSummary =
    summaries.find((summary) => summary.day === selectedDate) ?? latestSummary ?? null;
  const missingDates = useMemo(
    () => selectMissingSummaryDates(events, summaries),
    [events, summaries],
  );
  const targetDay = missingDates[0] ?? selectedSummary?.day ?? getYesterday();
  const isBusy = runStatus === 'loading' || runStatus === 'reconciling' || runStatus === 'generating';
  const statusLabel = getStatusLabel(runStatus, missingDates.length, selectedSummary);

  return (
    <section className="daily-summary-panel">
      <div className="summary-main">
        <div className="summary-title">
          <Sparkles size={18} />
          <div>
            <p className="eyebrow">Daily</p>
            <h3>每日总结</h3>
          </div>
        </div>

        <button
          className="summary-date-chip"
          disabled={!selectedSummary}
          type="button"
          onClick={() => {
            if (selectedSummary) {
              setSelectedDate(selectedSummary.day);
              setSheetOpen(true);
            }
          }}
        >
          {selectedSummary?.day ?? targetDay}
        </button>

        <span className={`summary-status ${runStatus === 'failed' ? 'failed' : ''}`}>
          {statusLabel}
        </span>

        <p className="summary-excerpt">{getSummaryExcerpt(selectedSummary)}</p>
      </div>

      <div className="summary-actions">
        <button
          className="icon-button"
          type="button"
          title="补齐缺失总结"
          aria-label="补齐缺失总结"
          disabled={disabled || isBusy}
          onClick={() => void onReconcile()}
        >
          <RefreshCw size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="生成每日总结"
          aria-label="生成每日总结"
          disabled={disabled || isBusy}
          onClick={() => {
            setSelectedDate(targetDay);
            void onGenerate(targetDay);
          }}
        >
          <Sparkles size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="打开每日总结"
          aria-label="打开每日总结"
          disabled={!selectedSummary}
          onClick={() => setSheetOpen(true)}
        >
          <BookOpen size={17} />
        </button>
      </div>

      {error ? (
        <div className="summary-error">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      ) : null}

      {isSheetOpen && selectedSummary ? (
        <DailySummarySheet summary={selectedSummary} onClose={() => setSheetOpen(false)} />
      ) : null}
    </section>
  );
};

const getStatusLabel = (
  runStatus: SummaryRunStatus,
  missingCount: number,
  summary: DailySummary | null,
): string => {
  if (runStatus === 'loading') {
    return '读取中';
  }
  if (runStatus === 'reconciling') {
    return '补跑中';
  }
  if (runStatus === 'generating') {
    return '生成中';
  }
  if (runStatus === 'failed') {
    return '失败';
  }
  if (missingCount > 0) {
    return `${missingCount} 天待补`;
  }
  return summary ? '已生成' : '待生成';
};
