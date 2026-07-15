# Function API

All `ai-orchestrator` calls require an authenticated Appwrite function execution. The function reads the user identity from Appwrite's execution headers and never accepts a client-supplied user ID.

## `POST /extract`

Request body:

```json
{ "route": "extract", "source": "text", "input": "Renew insurance Friday at 5 PM" }
```

Returns `{ item, needsReview, model }`. The item follows the structured schema in `functions/ai-orchestrator/src/main.js`.

## `POST /ask`

Request body: `{ "route": "ask", "question": "What is due this week?" }`.

Returns `{ answer, citations }`; every citation is an Appwrite action document ID included in the answer context.

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
