# Daily Summary Scheduler Flow

Status: draft  
Owner Agent: flow_infra  
Last Verified: 2026-05-30

## Purpose

Generate a strict daily report for each closed local day, even when the app was not open at midnight.

## Triggers

- Workspace opened.
- Workspace reloaded.
- Browser tab becomes visible.
- While-open timer crosses local midnight.
- User manually requests a date.

## Flow

```text
trigger
  -> read local summary files
  -> call TaskHistory.listChanges
  -> compute missing closed days through yesterday
  -> generate dates in ascending order
  -> write summary file
  -> reload summary state
```

## Closed-Day Rule

Automatic generation targets only `yesterday` and earlier in the configured timezone. Today is still open and can change.

## Missed Days

If the app is closed for two days, the next open computes both missing closed dates and generates them in order. Empty days produce `empty-day` summaries so the ledger proves the catch-up happened.

## Idempotency

The current local slice stores one current summary per day. Generation checks `(summaryDate, sourceHash, promptVersion)`; if a matching summary exists, the run is skipped. If new events appear for an already summarized date, the existing summary is stale and can be regenerated in place. Audit-grade revisions can be added later with a persisted `SummaryRun` ledger.
