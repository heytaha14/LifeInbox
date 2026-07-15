# Function API

All `ai-orchestrator` calls require an authenticated Appwrite function execution. The function reads the user identity from Appwrite's execution headers and never accepts a client-supplied user ID.

## `POST /extract`

Request body:

```json
{
  "route": "extract",
  "source": "text",
  "input": "Renew insurance Friday at 5 PM, then email the receipt to Maya",
  "localDate": "2026-07-15",
  "timezone": "Asia/Calcutta"
}
```

The function decomposes the capture into as many as 20 independent, source-grounded items and returns:

```json
{
  "items": [
    {
      "id": "li-...",
      "type": "task",
      "title": "Renew insurance",
      "summary": "Renew the insurance policy before the deadline.",
      "priority": "medium",
      "dueDate": "2026-07-17",
      "time": "17:00",
      "confidence": 93,
      "missingFields": [],
      "sourceExcerpt": "Renew insurance Friday at 5 PM",
      "needsReview": false
    },
    {
      "id": "li-...",
      "type": "task",
      "title": "Email the receipt to Maya",
      "summary": "Send Maya the insurance receipt after renewal.",
      "priority": "medium",
      "dueDate": null,
      "time": null,
      "confidence": 95,
      "missingFields": [],
      "sourceExcerpt": "then email the receipt to Maya",
      "needsReview": false
    }
  ],
  "item": {
    "id": "li-...",
    "type": "task",
    "title": "Renew insurance",
    "summary": "Renew the insurance policy before the deadline.",
    "priority": "medium",
    "dueDate": "2026-07-17",
    "time": "17:00",
    "confidence": 93,
    "missingFields": [],
    "sourceExcerpt": "Renew insurance Friday at 5 PM",
    "needsReview": false
  },
  "itemCount": 2,
  "needsReview": false,
  "needsReviewItemIds": [],
  "model": "gpt-5.6-terra"
}
```

`items[]` is the canonical contract. `item` is retained as a temporary compatibility alias for `items[0]`; new clients should not use it as the complete result. The abbreviated example focuses on review fields; returned items also carry the applicable amount, currency, location, people, status, source, thread, display-date, and creation metadata. Every item contains a supporting `sourceExcerpt`. The function validates enum values, dates, times, duplicate intents, and textual evidence before returning the batch. Unsupported evidence, empty output, refusals, incomplete Responses API results, or malformed structured output fail safely and leave the original capture intact.

Low-confidence items or items with entries in `missingFields` are marked `needsReview`. The client always presents the full batch for editable review before any action documents are saved.

## `POST /ask`

Request body: `{ "route": "ask", "question": "What is due this week?" }`.

Returns `{ answer, nextActions, insights, citations, model, reasoningEffort }`. Terra uses high reasoning over a bounded, permissioned record set and a strict output schema. Every citation and non-null `nextActions[].itemId` is validated against an Appwrite action document included in the model context. The client renders the plan and resolves source IDs to clickable chips.

## `POST /today-brief`

Request body: `{ "route": "today-brief" }`.

Returns `{ briefing, itemIds, cached }`. Cache validity is based on a hash of the relevant item IDs, dates, and priorities.

## `POST /regroup-thread`

Returns deterministic groups when existing thread hints are sufficient and calls the model only for genuinely ambiguous ungrouped sets.

## Ops routes

The scheduled `ops` function defaults to `cleanup`. Manual calls require `x-ops-secret`.

- `/cleanup`: removes original files and capture metadata older than the retention period
- `/usage`: returns the bounded current-day usage summary
- `/billing-webhook`: accepts provider-ready mock events without granting entitlements yet
- `/health`: verifies the ops function entrypoint

## Error contract

Errors use `{ error, message? }` and do not include secrets, prompts, source documents, or stack traces. A failed extraction never deletes or mutates the original capture.
