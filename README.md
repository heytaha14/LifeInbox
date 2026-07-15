# LifeInbox

LifeInbox is a polished, mobile-first life-admin assistant. A user can capture text, screenshots, receipts, PDFs, and voice notes; review the details LifeInbox extracts; and then work from a calm Today view, searchable inbox, connected Life Threads, and a grounded Ask experience.

The app is designed around Appwrite Free constraints: one database, one bucket, two functions, permissioned rows/files, deterministic filtering before AI, lazy cached briefings, cursor-ready indexes, content hashes for deduplication, and explicit usage controls.

## What is implemented

- Landing, product demo, privacy, pricing, FAQ, and responsive navigation
- Appwrite email/password sign-up, login, session restore, and logout
- Credential-free demo mode for testing the entire interface now
- Universal text, image, PDF, and voice capture UI with drop states and graceful fallbacks
- Split review workflow with editable extracted fields and confidence handling
- Today briefing, focus list, progress summary, and quick capture
- Filterable/searchable inbox with completion and item details
- Life Threads overview and thread detail drawer
- Ask LifeInbox with grounded item citations
- Profile, quota, capture preferences, retention, export, and account controls
- Appwrite setup script for one database, five collections, one bucket, indexes, and user permissions
- `ai-orchestrator` function for extraction, Ask, cached briefing, grouping, quotas, and token usage
- `ops` function for retention cleanup, daily usage aggregation, billing seams, and health checks

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Choose **Explore the demo** to exercise every user-facing flow without credentials.

## Connect Appwrite

1. Create an Appwrite project and add a Web platform for `localhost` plus your production domain.
2. Copy `.env.example` to `.env.local`.
3. Add the public endpoint/project values to `.env.local`.
4. Create a server API key with database, collection/attribute/index, bucket, and function management scopes. Keep it server-only as `APPWRITE_API_KEY`; never use a `NEXT_PUBLIC_` prefix.
5. Load `.env.local` into your shell, then run `npm run appwrite:setup` once.
6. Put the Appwrite project ID into `appwrite.json` and deploy both functions with the Appwrite CLI.
7. Add the function-only variables shown in `.env.example` to both functions as appropriate. `OPENAI_API_KEY` belongs only on `ai-orchestrator`.

The website never needs or reads the Appwrite API key. Browser requests use the logged-in Appwrite session and document/file permissions.

## Appwrite resources

| Resource | ID | Purpose |
|---|---|---|
| Database | `lifeinbox` | All structured product data |
| Collection | `captures` | Raw capture metadata, dedupe hash, processing state |
| Collection | `actions` | Reviewed tasks, events, expenses, and notes |
| Collection | `threads` | Related action groups and summaries |
| Collection | `briefings` | One lazy cached briefing per user/day |
| Collection | `usage` | Daily quotas, tokens, OCR/STT, cache, and failures |
| Bucket | `inbox-files` | Original user-owned uploads with 10 MB cap |
| Function | `ai-orchestrator` | Extract, Ask, brief, search/group routing |
| Function | `ops` | Retention, usage, billing seam, admin health |

## Important environment rules

- Public: only `NEXT_PUBLIC_APPWRITE_*` identifiers and endpoint.
- Secret: `APPWRITE_API_KEY`, `OPENAI_API_KEY`, and `OPS_SECRET`.
- The OpenAI key must exist only in Appwrite Function variables.
- Use separate Appwrite projects for preview and production when integration tests can mutate data.

## Quality commands

```bash
npm run build
npm run lint
npm test
node --check functions/ai-orchestrator/src/main.js
node --check functions/ops/src/main.js
```

More detail is in [Architecture](docs/ARCHITECTURE.md), [API](docs/API.md), [Security and privacy](docs/SECURITY.md), and [Free-plan operations](docs/APPWRITE_FREE.md).
