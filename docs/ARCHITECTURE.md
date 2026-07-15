# Architecture

## Boundaries

The browser owns presentation, Appwrite session state, explicitly user-approved writes, and direct permissioned file uploads. It never receives an administrative API key or an OpenAI key.

Appwrite owns identity, durable records, object storage, row/file authorization, server-side AI access, quotas, retention, and operational aggregation.

## Request flow

1. The user signs in with an Appwrite email/password session.
2. A capture is uploaded directly to the permissioned `inbox-files` bucket when it contains a file.
3. The browser executes `ai-orchestrator/extract` with text plus safe metadata.
4. The orchestrator checks the authenticated Appwrite user header and the daily quota.
5. The cheapest viable route is selected: embedded text, OCR only when needed, preview-image understanding only when layout matters, or transcription before audio extraction.
6. GPT-5 nano returns a strict structured item. Confidence below 80 or missing essential fields forces review.
7. The user edits and approves the item. Only then is it saved as an action.
8. Thread grouping uses deterministic dates, vendors, places, people, and hashes before any model call.
9. Today briefings are generated on demand and reused while the relevant item hash is unchanged.
10. Ask fetches a bounded permissioned item set, filters deterministically, summarizes last, and returns item IDs as citations.

## Free-plan decisions

- One database, one bucket, exactly two functions
- No default realtime subscription
- Cursor-ready compound indexes and bounded list sizes
- Full-text indexes for title, summary, and thread fields
- File size capped at 10 MB in the client and bucket
- Server quotas and graceful manual-review mode
- One briefing document per user/day
- Scheduled retention only through `ops`
- Provider-neutral billing event route with a mock provider today

## Confidence policy

- 90-100: high confidence, still reviewable
- 80-89: normal review
- Below 80: highlighted review required
- Essential ambiguity: ask one clarifying question
- Nonessential ambiguity: omit the field and preserve the item as a note/task
- OCR, transcription, or token failure: keep the original capture and offer manual entry
