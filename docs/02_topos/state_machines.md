# State Machines

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

## Task Lifecycle

```text
draft form input
  -> createEntry
active
  -> updateEntry
active
  -> completeEntry
done
  -> reactivateEntry
active
done
  -> archiveCompletedEntries
archived storage location
```

## Rules

- `active` entries have no `completedAt`.
- `done` entries have valid `completedAt`.
- Backend encodes this as `TaskLogEntry.Active` and `TaskLogEntry.Done`; business code cannot construct a persisted illegal pair through public constructors.
- `archiveCompletedEntries` only accepts `done` entries.
- `reactivateEntry` resets `completedAt` and repairs stale deadlines.
- `archived` is not a `TaskStatus`; it is a storage location or archive batch result.

## Workspace Load State

```text
idle -> opening -> ready
idle -> unsupported
ready -> working -> ready
ready -> error -> ready
```

The frontend store owns the current workspace load state; the local file adapter owns browser permission and file IO side effects.

## Task History Event

```text
task command requested
  -> task file written
  -> task change event appended
  -> snapshot reloaded
```

If the task file write succeeds but the event append fails, the UI must report a partial failure and summaries must reconcile only after reload.

## Daily Summary Run

```text
missing -> collecting_events -> generating -> generated
missing -> collecting_events -> no_activity_report
missing -> collecting_events -> failed
generated -> stale
stale -> regenerating -> generated
```

Only closed local days are automatically summarized. The current day can be previewed manually later, but the midnight/catch-up workflow targets yesterday and earlier.

## Catch-Up

```text
idle -> scanning -> planned -> running_dates_in_order -> complete
                                      -> partial_failed
```

On folder open, reload, visibility resume, and while-open midnight, the app computes missing closed days and generates them in ascending date order.
