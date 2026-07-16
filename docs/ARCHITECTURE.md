# Architecture

## Boundaries

The browser owns presentation, Appwrite session state, explicitly user-approved writes, and direct permissioned file uploads. It never receives an administrative API key or an OpenAI key.

Appwrite owns identity, durable records, object storage, row/file authorization, server-side AI access, quotas, retention, and operational aggregation.

## Request flow

1. The user signs in with an Appwrite email/password session.
2. A capture is uploaded directly to the permissioned `inbox-files` bucket when it contains a file.
3. The browser executes `ai-orchestrator/extract` with text plus safe metadata, including the capture ID, file ID, user's local date, and time zone for explicit relative-date resolution.
4. The orchestrator checks the authenticated Appwrite user header, binds any file ID to an owner-matched capture document and file permission, and enforces the user's daily capture and shared AI token budgets.
5. The cheapest viable route is selected: embedded text, OCR only when needed, preview-image understanding only when layout matters, or transcription before audio extraction.
6. GPT-5.6 Terra uses high reasoning and strict Structured Outputs to return `items[]`: up to 20 small, independent tasks, events, expenses, or notes from an organized capture. An explicit Notes capture returns one faithful durable note instead. A legacy `item` alias mirrors `items[0]` only for older clients.
7. The orchestrator validates source evidence, duplicate intent, enums, dates, and times. Each item carries a `sourceExcerpt`, confidence score, and explicit `missingFields`; incomplete, refused, empty, or unsupported output fails safely.
8. The user reviews the complete batch, edits each item, removes unwanted items, and approves the set. Only then are the actions saved.
9. Thread grouping uses deterministic dates, vendors, places, people, and hashes before any model call.
10. Today briefings are generated from actionable records only and reused while the relevant item hash is unchanged; permanent notes never become fake outstanding work.
11. Ask ranks a bounded permissioned item set, uses notes as reference knowledge, reasons over urgency and dependencies, then returns a schema-validated answer, next actions, insights, and item IDs that the UI renders as clickable citations.
12. Settings generates a branded PDF locally from the user's approved items; no raw JSON export is exposed in the product UI.

## Free-plan decisions

- One database, one bucket, exactly two functions
- No default realtime subscription
- Cursor-ready compound indexes and bounded list sizes
- Full-text indexes for title, summary, and thread fields
- Versioned, hidden metadata chunks reuse the existing `people` string array for note bodies, pins, backlinks, snooze dates, and AI evidence; this avoids exhausting Free-plan attribute limits while the client and orchestrator expose only real people
- File size capped at 10 MB in the client and bucket
- Server quotas and graceful manual-review mode
- One briefing document per user/day
- Scheduled deployment-wide 30-day original-upload retention only through `ops`; approved actions and Notes remain until deletion

## Experience layers

- **Public landing page:** a minimal white, graphite, and lime product story with an interactive capture proof, feature bento, privacy section, and clear demo/sign-up paths.
- **Authenticated workspace:** an iOS-inspired shell with Today, Inbox, permanent Notes, Life Threads, Ask, a floating desktop sidebar, compact tablet navigation, phone bottom navigation, touch-sized controls, safe-area handling, and full-screen mobile capture/review.
- **Installable PWA:** standalone display, custom icons, offline app-shell fallback, and platform-specific installation guidance. Live Appwrite persistence and OpenAI processing still require a connection.
- **Portable report:** a designed multi-page PDF with a cover, summary metrics, grouped Life Threads, item status and confidence, and page numbers.

## Confidence policy

- 90-100: high confidence, still reviewable
- 80-89: normal review
- Below 80: highlighted review required
- Essential ambiguity: ask one clarifying question
- Nonessential ambiguity: omit the field and preserve the item as a note/task
- OCR, transcription, or token failure: keep the original capture and offer manual entry
