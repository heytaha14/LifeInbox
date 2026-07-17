# LifeInbox

> Turn screenshots, receipts, PDFs, voice notes, and messy thoughts into clear next steps or permanent notes.

[![OpenAI Build Week](https://img.shields.io/badge/OpenAI-Build%20Week-111827)](https://openai.devpost.com/)
[![GPT-5.6 Terra](https://img.shields.io/badge/OpenAI-GPT--5.6%20Terra-78e957)](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
[![Appwrite](https://img.shields.io/badge/BaaS-Appwrite-f02e65)](https://appwrite.io/)
[![MIT License](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

**Live project:** [lifeinbox-calm.explorertaha.chatgpt.site](https://lifeinbox-calm.explorertaha.chatgpt.site/)
**OpenAI Build Week track:** Apps for Your Life

LifeInbox is a private, mobile-first personal life operating system with a clean iOS-inspired workspace. Users can ask GPT-5.6 to split a messy capture into source-grounded actions or preserve it as one permanent note, review the result, and work from Smart Focus, Today, Inbox, Notes, connected Life Threads, and an Ask experience grounded only in their own saved items.

## Why this exists

Life admin arrives through too many channels: a screenshot of a flight, a voice reminder, a receipt, a PDF renewal notice, or a half-finished thought. Traditional task apps ask the user to organize everything before it becomes useful. LifeInbox reverses that workflow:

1. Capture first.
2. Let GPT-5.6 find every distinct next step and its supporting evidence.
3. Review the whole batch before saving.
4. Act from one connected, searchable workspace.

## Judge quick test

The fastest path uses a temporary real account:

1. Open the [live project](https://lifeinbox-calm.explorertaha.chatgpt.site/).
2. Create a temporary account. Every new workspace starts empty.
3. Capture: `Renew my insurance Friday at 5 PM, email the receipt to Maya, and book a dentist appointment next Tuesday.`
4. Confirm that GPT-5.6 creates three atomic items. Move through the batch tabs and review each item's source excerpt, type, priority, date, confidence, missing fields, and suggested Life Thread.
5. Approve the batch, refresh the page, and confirm that all three items persist.
6. Complete one item, choose the **Completed** inbox filter, and confirm that it remains easy to find or restore.
7. Open **Ask LifeInbox**, ask `What should I do first?`, then click its citation to open the exact supporting item.
8. Open **New capture**, select **Save as note**, save a useful reference, and confirm it appears in **Notes** after refresh.
9. Open that note and choose **Turn into action**. Confirm the action retains a backlink to its source note.
10. Press `Ctrl/Command + K` to open Spotlight, search across items and Life Threads, then launch a 25-minute Focus Session from a result.
11. Open **Settings → Privacy**, export the designed PDF report, and inspect its cover, summary metrics, grouped items, notes, and page numbers.
12. Delete the temporary workspace from **Settings → Privacy**.

LifeInbox has no demo workspace or seeded account data. Every visible workspace is authenticated and backed by Appwrite.

## What is implemented

- Appwrite email/password sign-up, login, session restore, recovery, and logout
- Real empty workspaces with no seeded or demo data
- Text, image, PDF, and browser-recorded voice capture
- GPT-5.6 Terra Structured Outputs that split one capture into as many as 20 atomic items
- Explicit **Save as note** capture mode with a permanent, searchable Notes library and full note bodies
- Source-evidence, date/time, enum, and duplicate-intent validation with safe refusal/incomplete-output handling
- Batch review with per-item tabs, confidence, missing-information guidance, editing, removal, and approve-all
- Permissioned Appwrite rows and files owned by the signed-in user
- Today briefing generated from current high-priority and dated actions; reference notes do not become fake work
- Smart Focus ranking with explicit pins, due-date awareness, Today priority, and a distraction-free 25-minute focus timer
- Universal Spotlight command center with keyboard access, cross-workspace search, quick capture actions, and navigation
- Searchable, filterable inbox with open, Focus, task, event, expense, Later, and completed views plus complete, restore, real timed snooze, detail, and delete actions
- Note-to-action conversion with source backlinks, inherited Life Thread context, and permanent-note preservation
- Life Thread creation, AI suggestions, persistent linking, progress cockpit, quick thread capture, and non-destructive deletion
- Ask LifeInbox answers grounded in user data with clickable item citations
- Preference storage, a clear 30-day original-upload cleanup policy, a branded multi-page PDF export, and full workspace deletion
- Installable PWA with offline app shell, custom icons, safe areas, and install guidance
- Minimal white, graphite, and lime landing page with iOS-inspired product graphics and focused conversion paths
- Edge-to-edge iOS-style phone tab bar, labeled tablet rail, floating desktop shell, keyboard-safe sheets, accessible drawers/dialogs, and full-screen mobile capture/review
- Appwrite setup automation for five collections, one file bucket, indexes, and permissions
- Server-side AI orchestration, per-user capture and all-route token budgets, owned-file cleanup, and operational controls

## Architecture

```mermaid
flowchart LR
  U["User / installed PWA"] --> W["Next.js + React UI"]
  W --> A["Appwrite Auth"]
  W --> D["Appwrite Database"]
  W --> S["Private Appwrite Storage"]
  W --> F["AI Orchestrator Function"]
  F --> O["OpenAI Responses API\nGPT-5.6 Terra"]
  F --> D
  F --> S
  X["Scheduled Ops Function"] --> D
  X --> S
```

The browser receives only public Appwrite identifiers. Login is verified by a same-origin gateway that stores the Appwrite session in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, preventing cross-site cookie restrictions from downgrading a signed-in user to Appwrite's guest role. `OPENAI_API_KEY`, `OPS_SECRET`, and the one-time Appwrite bootstrap key never enter the client bundle. Appwrite Functions use scoped dynamic execution keys and every saved row/file is permissioned to its owner. File-backed extraction binds the submitted file to an owner-matched capture record before download, and original uploads are automatically removed after the deployment-wide 30-day retention period. Approved actions and permanent Notes remain until the user deletes them.

## How GPT-5.6 is used

LifeInbox uses the OpenAI Responses API with `gpt-5.6-terra` and high reasoning effort inside the Appwrite `ai-orchestrator` function.

- **Capture extraction:** converts unstructured text, images, PDFs, and voice transcripts into a strict `items[]` schema containing up to 20 independent tasks, events, expenses, and notes.
- **Superbrain questions:** ranks a bounded set of user-owned records, then uses a strict schema to return a grounded answer, concrete next actions, useful insights, and supporting item IDs.
- **Daily briefings:** summarizes at most three relevant next steps and caches them by date and item-version hash.
- **Life Thread grouping:** proposes groups only when deterministic relationships are unavailable.

AI output is treated as untrusted input. The function verifies source excerpts, normalizes dates and times conservatively, rejects duplicate or unsupported items, handles refusals and incomplete Responses API results, retries safe transient failures, records usage, and never claims that an external action was completed. Every item remains editable and nothing is persisted until the user approves the batch.

## How Codex was used

Codex was the primary engineering collaborator across the submission-period build. It accelerated:

- Converting the initial product prompt into the working React/Appwrite architecture
- Implementing authentication, database schemas, indexes, file storage, and two server functions
- Building and polishing the iOS-inspired white/lime landing page, responsive phone, tablet, desktop, and PWA experiences
- Tracing live Appwrite execution failures to empty structured output and schema-unsafe persistence
- Migrating the production model to GPT-5.6 Terra with high reasoning and hardening atomic decomposition, evidence validation, structured planning, parsing, and retry behavior
- Removing demo state and replacing fake dashboard values with real calculations
- Implementing batch review, persistent Life Threads, grounded citations, designed PDF export, deletion, and account cleanup
- Running lint, builds, automated tests, production deployment, and full browser smoke tests

### Decisions kept human-directed

- The product problem: life admin should be captured before it is organized.
- The minimal iOS-inspired white/lime product direction and review-before-save trust model.
- Appwrite as the BaaS and the choice to keep all AI secrets in server functions.
- Non-destructive Life Thread deletion: deleting a group must not delete its underlying items.
- GPT-5.6 Terra as the production model for a stronger intelligence/cost balance.

The dated commit history provides submission-period implementation evidence. The production repair and real-data work are captured in commits `62b5257` and `6d80844`.

## Run locally

### Prerequisites

- Node.js 22.13 or newer
- npm

### Local UI

```bash
git clone https://github.com/heytaha14/LifeInbox.git
cd lifeinbox
npm install
npm run dev
```

Open `http://localhost:3000`. Sign-up, persistence, capture intelligence, and Ask require the Appwrite and OpenAI setup below.

### Full Appwrite + OpenAI setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Then follow [docs/SETUP.md](docs/SETUP.md). In short:

1. Create an Appwrite project and add `localhost` as a Web platform.
2. Add the public Appwrite endpoint/project values and one-time bootstrap key to `.env.local`.
3. Run `npm run appwrite:setup` to create collections, indexes, permissions, and storage.
4. Run `npm run appwrite:deploy` to create or reconcile, package, upload, activate, and verify the Appwrite functions.
5. Add `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.6-terra`, `FREE_DAILY_CAPTURE_LIMIT=50`, and `FREE_DAILY_AI_TOKEN_LIMIT=250000` only to the AI function.
6. Add `OPS_SECRET` and `FILE_RETENTION_DAYS=30` only to the Ops function.
7. Restart the app and create a real account.

Never commit `.env.local` or expose the OpenAI/Appwrite secret keys through a `NEXT_PUBLIC_` variable.

## Appwrite resources

| Resource | ID | Purpose |
|---|---|---|
| Database | `lifeinbox` | Structured user data |
| Collection | `captures` | Original capture metadata and processing state |
| Collection | `actions` | Reviewed tasks, events, expenses, and notes |
| Collection | `threads` | Connected action groups |
| Collection | `briefings` | Versioned daily briefing cache |
| Collection | `usage` | Capture, token, OCR, STT, cache, and failure counters |
| Bucket | `inbox-files` | Private original uploads, limited to 10 MB |
| Function | `ai-orchestrator` | Extract, Ask, brief, and grouping routes |
| Function | `ops` | Retention, deletion, cleanup, usage, and operational seams |

## Quality and verification

```bash
npm run lint
npm run typecheck
npm test
npm ci --prefix functions/ai-orchestrator --omit=dev
npm ci --prefix functions/ops --omit=dev
node --check functions/ai-orchestrator/src/main.js
node --check functions/ops/src/main.js
```

The production flow should be release-checked with a temporary account through sign-up, empty-state rendering, compound GPT-5.6 extraction, batch approval, reload persistence, completion filtering, generated briefing, grounded Ask citation, PDF export, responsive breakpoints, PWA installation, and full workspace deletion. Remove the temporary account after the test.

## Documentation

- [Production setup](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API and function routes](docs/API.md)
- [Security and privacy](docs/SECURITY.md)
- [Appwrite Free operations](docs/APPWRITE_FREE.md)
- [Operations runbook](docs/RUNBOOK.md)
- [Build Week submission pack](docs/BUILD_WEEK_SUBMISSION.md)

## License

LifeInbox is available under the [MIT License](LICENSE).
