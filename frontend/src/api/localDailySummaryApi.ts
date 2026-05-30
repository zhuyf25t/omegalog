import {
  type DailySummary,
} from '../domain/dailySummary';
import { getYesterday, type SummaryDate } from '../domain/summaryDate';
import { buildLocalCriticalSummary, buildSourceHash } from '../domain/dailySummaryReport';
import { selectEventsForDay, selectMissingSummaryDates } from '../domain/dailySummarySelectors';
import { ensureWritablePermission, isFileSystemAccessSupported } from './fileSystemAccess';
import { DailySummaryApiError, type DailySummaryApi, type DailySummaryStateSnapshot } from './dailySummaryApi';
import { readDailySummaries, writeDailySummaryFile } from './localDailySummaryStorage';
import { requestAiSummaryDraft } from './summaryGenerationClient';
import { taskHistoryApi } from './taskHistoryApi';

class LocalDailySummaryApi implements DailySummaryApi {
  private workspace: FileSystemDirectoryHandle | null = null;

  isSupported(): boolean {
    return isFileSystemAccessSupported();
  }

  attachWorkspace(workspace: FileSystemDirectoryHandle): void {
    this.workspace = workspace;
  }

  async loadState(): Promise<DailySummaryStateSnapshot> {
    const workspace = this.requireWorkspace();
    const [events, summaries] = await Promise.all([
      taskHistoryApi.listEvents(),
      readDailySummaries(workspace),
    ]);
    return { events, summaries };
  }

  async generateForDate(day: SummaryDate): Promise<DailySummary> {
    const workspace = this.requireWorkspace();
    await ensureWritablePermission(workspace);
    const state = await this.loadState();
    const events = selectEventsForDay(state.events, day);
    const existing = state.summaries.find((summary) => summary.day === day);
    const sourceHash = buildSourceHash(events);
    if (existing?.source.sourceHash === sourceHash) {
      return existing;
    }

    const localDraft = buildLocalCriticalSummary(day, events);
    const aiContent = await requestAiSummaryDraft({ day, events, localDraft });
    const summary: DailySummary = aiContent
      ? {
          ...localDraft,
          provider: {
            kind: 'ai-proxy',
            model: 'server-configured',
            promptVersion: 'critical-daily-v1',
          },
          content: aiContent,
        }
      : localDraft;

    await writeDailySummaryFile(workspace, summary);
    return summary;
  }

  async reconcileMissing(throughDay: SummaryDate = getYesterday()): Promise<{
    readonly generated: readonly SummaryDate[];
    readonly skipped: readonly SummaryDate[];
    readonly failed: readonly { readonly day: SummaryDate; readonly reason: string }[];
  }> {
    const state = await this.loadState();
    const missingDays = selectMissingSummaryDates(state.events, state.summaries, throughDay);
    const generated: SummaryDate[] = [];
    const skipped: SummaryDate[] = [];
    const failed: { readonly day: SummaryDate; readonly reason: string }[] = [];

    for (const day of missingDays) {
      try {
        const before = await this.loadState();
        const existing = before.summaries.find((summary) => summary.day === day);
        const events = selectEventsForDay(before.events, day);
        if (existing?.source.sourceHash === buildSourceHash(events)) {
          skipped.push(day);
          continue;
        }
        await this.generateForDate(day);
        generated.push(day);
      } catch (error) {
        failed.push({
          day,
          reason: error instanceof Error ? error.message : 'summary generation failed',
        });
      }
    }

    return { generated, skipped, failed };
  }

  private requireWorkspace(): FileSystemDirectoryHandle {
    if (!this.workspace) {
      throw new DailySummaryApiError('workspace-not-open', '请先打开一个日志文件夹。');
    }
    return this.workspace;
  }
}

export const dailySummaryApi = new LocalDailySummaryApi();
