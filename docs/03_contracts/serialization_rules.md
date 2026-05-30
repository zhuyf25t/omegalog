# Serialization Rules

Status: draft  
Owner Agent: database_boundary  
Last Verified: 2026-05-30

## `.omegalog.json` Shape

```json
{
  "id": "34540a98",
  "title": "计系概 lec11",
  "note": "lec11-networking_rpc.pptx",
  "tags": ["计算机"],
  "weight": 5,
  "status": "active",
  "deadline": "2026-06-15T16:00:00.000Z",
  "deadlineAdjustCount": 1,
  "overdueAdjustCount": 0,
  "createdAt": "2026-05-23T04:29:38.086Z",
  "completedAt": null
}
```

## Decode Rules

- Unknown JSON must pass through a decoder before becoming `TaskLogEntry`.
- Invalid id/title/status/createdAt rejects the file.
- Invalid deadline is repaired to default next midnight from `createdAt`.
- Missing note becomes empty string.
- Missing tags become empty list.
- Weight is clamped to 1..10.
- Adjustment counts are clamped to 0..99.

## Encode Rules

- Write pretty JSON plus trailing newline.
- Write only the canonical entry fields listed above.
- File name format: `yyyy-mm-dd_hh-mm-ss_<taskId>.omegalog.json`.
- Archived records keep the same file name under `archive/`.

## System Metadata Files

History and summaries must live under `.omegalog-system/` so the task importer ignores them.

```text
.omegalog-system/
  history/YYYY-MM-DD/*.omegalog-event.json
  summaries/YYYY-MM-DD.omegalog-summary.json
```

Event and summary JSON use `schemaVersion: 1`, canonical fields, pretty JSON plus trailing newline. Decoders must reject unknown root shapes before data reaches React state.

Provider metadata may store provider kind/model/prompt version, but never provider keys.

`summary-runs.jsonl` is reserved for a future audit-grade revision ledger and is not part of the current local storage contract.

## DB Future Rule

If a database is added, row decoding must mirror these rules: row -> decoder -> typed object, typed object -> encoder -> SQL parameters.
