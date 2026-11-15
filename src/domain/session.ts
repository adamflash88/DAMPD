/** Session summaries used by Home, Tune and History. */
import type { AdjustmentEvent, RunOutcome, Session, TestRunEvent } from './types';

export function testRunsOf(s: Session): TestRunEvent[] {
  return s.events.filter((e): e is TestRunEvent => e.type === 'testRun');
}

export function adjustmentEventsOf(s: Session): AdjustmentEvent[] {
  return s.events.filter((e): e is AdjustmentEvent => e.type === 'adjustment');
}

export interface SessionSummary {
  testRuns: number;
  adjustments: number;
  outcomes: Record<RunOutcome, number>;
  lastAdjustment: AdjustmentEvent | undefined;
  lastTestRun: TestRunEvent | undefined;
  /** Adjustments since the most recent test run (not yet evaluated on track). */
  untestedAdjustments: number;
}

export function summarizeSession(s: Session): SessionSummary {
  const runs = testRunsOf(s);
  const adjustments = adjustmentEventsOf(s);
  const outcomes: Record<RunOutcome, number> = { better: 0, worse: 0, same: 0, unsure: 0 };
  for (const r of runs) if (r.outcome) outcomes[r.outcome]++;
  let untested = 0;
  for (let i = s.events.length - 1; i >= 0; i--) {
    const e = s.events[i];
    if (!e || e.type === 'testRun') break;
    if (e.type === 'adjustment') untested++;
  }
  return {
    testRuns: runs.length,
    adjustments: adjustments.length,
    outcomes,
    lastAdjustment: adjustments[adjustments.length - 1],
    lastTestRun: runs[runs.length - 1],
    untestedAdjustments: untested,
  };
}

/** Whether the next test run should ask "did it feel better?". */
export function shouldAskOutcome(s: Session): boolean {
  return testRunsOf(s).length > 0 || adjustmentEventsOf(s).length > 0;
}

export function sessionTitle(s: Pick<Session, 'trackName'>): string {
  return s.trackName.trim() || 'Untitled session';
}

/** "1h 05m" / "12m". */
export function formatDuration(fromISO: string, toISO: string): string {
  const mins = Math.max(0, Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
