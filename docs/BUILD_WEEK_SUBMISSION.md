# OpenAI Build Week submission pack

This file is a working submission checklist and demo script. Replace the two marked placeholders before the final Devpost submission.

## Submission identity

- **Project:** LifeInbox
- **Tagline:** Turn life admin into clear, connected next steps with GPT-5.6.
- **Category:** Apps for Your Life
- **Live project:** https://lifeinbox-calm.explorertaha.chatgpt.site/
- **Code:** https://github.com/heytaha14/LifeInbox
- **Devpost draft:** https://devpost.com/software/lifeinbox
- **License:** MIT

## Suggested Devpost write-up

### Inspiration

Life admin arrives everywhere: screenshots, receipts, voice notes, PDFs, messages, and half-finished thoughts. Existing productivity tools often ask people to organize that information before it becomes useful. LifeInbox starts with the opposite premise: capture first, understand instantly, and review before anything enters your trusted workspace.

### What it does

LifeInbox turns unstructured personal information into editable tasks, events, expenses, and notes. GPT-5.6 extracts dates, priority, people, amounts, locations, confidence, and a suggested Life Thread. Approved items power a daily briefing, searchable inbox, connected Life Threads, and a grounded Ask interface with citations back to the user's own records.

It supports text, images, PDFs, and recorded voice; installs as a PWA; adapts to phone, tablet, and desktop; stores data with per-user Appwrite permissions; and lets users export or completely delete their workspace.

### How we built it

The client uses Next.js, React, TypeScript, GSAP, and an installable PWA shell. Appwrite provides authentication, database collections, file storage, permissions, and two Node.js server functions. The AI orchestrator calls the OpenAI Responses API with GPT-5.6 Luna for structured extraction, grounded questions, cached daily briefings, and relationship grouping. A separate Ops function handles retention and deletion workflows.

Codex was the primary implementation collaborator. It translated the product direction into the architecture, built the responsive product, provisioned Appwrite resources, implemented and hardened the AI functions, diagnosed production failures from execution logs, added tests, deployed the stack, and ran end-to-end browser verification. Human-directed decisions included the capture-first workflow, review-before-save trust model, visual direction, security boundaries, and non-destructive thread deletion.

### Challenges

The most important production bug was subtle: the model could consume its output budget without returning valid structured text, causing extraction to fail at `JSON.parse`. The fix added explicit reasoning settings, larger output budgets, a safe retry, structured-output validation, and clear failure states. A second issue came from Appwrite returning document identity as `$id`; normalizing that boundary fixed persistence actions, thread counts, and citation chips after reload.

### Accomplishments

- A complete product experience rather than a single AI demo
- Real authentication and per-user persistence with demo isolation
- Multimodal capture with editable, confidence-aware review
- Grounded answers with item-level citations
- Private-by-design server-side AI keys and Appwrite permissions
- Responsive PWA behavior across mobile, tablet, and desktop
- Verified account and data deletion flows

### What we learned

AI features become trustworthy through the surrounding engineering: strict schemas, deterministic retrieval, review states, clear security boundaries, graceful failure handling, and end-to-end production verification. GPT-5.6 provides the intelligence, but the product experience depends on making uncertainty visible and keeping the user in control.

### What's next

Next steps include opt-in calendar/email connectors, richer recurring reminders, shared household Threads, notification delivery, encrypted exports, and additional accessibility and internationalization work.

## Demo video script — target 2:35

The final video must be public on YouTube, under three minutes, and include voiceover explaining the project, Codex, and GPT-5.6.

### 0:00–0:18 — problem

> Life admin arrives as screenshots, receipts, voice notes, PDFs, and thoughts we are afraid to forget. LifeInbox gives all of it one place to land, without asking you to organize it first.

Show the landing page and supported capture types.

### 0:18–0:43 — real empty account

> A new account starts completely empty and private. Demo data is isolated to demo mode, while every real row and file is permissioned to the signed-in Appwrite user.

Create or open a temporary account and show the empty Today screen.

### 0:43–1:15 — GPT-5.6 capture

> I can type a messy instruction, upload an image or PDF, or record a voice note. The server-side OpenAI function uses GPT-5.6 Luna to extract a strict, editable item with type, date, priority, confidence, and a suggested Life Thread.

Capture the Dr Mehta sample, show the review screen, then approve.

### 1:15–1:40 — persistence and connected context

> After approval, the item persists in Appwrite, updates the daily briefing, and connects to a Health Life Thread. Refreshing proves this is a working application, not a static prototype.

Refresh, show the generated briefing, inbox item, and Health thread.

### 1:40–2:02 — grounded Ask

> Ask LifeInbox retrieves only relevant user-owned items before calling GPT-5.6. The answer is grounded in that context and links back to a clickable citation instead of inventing facts.

Ask `What should I do first?` and click the citation.

### 2:02–2:22 — control and responsiveness

> Users can complete, snooze, export, or delete items. Deleting a Life Thread keeps its underlying items, and deleting a workspace removes the test account and its data. The interface is an installable PWA customized for phone, tablet, and desktop.

Show thread deletion, settings/privacy, and a quick responsive/PWA view.

### 2:22–2:35 — Codex

> Codex was my primary engineering collaborator: it implemented the responsive product and backend, diagnosed live Appwrite and structured-output failures, hardened security and persistence, added tests, deployed the stack, and verified the complete production flow. LifeInbox is the result: capture first, understand instantly, and stay in control.

End on the Today screen and LifeInbox logo.

## Final Devpost checklist

- [x] Working project built with Codex and GPT-5.6
- [x] Apps for Your Life category selected in this pack
- [x] English project description prepared
- [x] Public code repository published with MIT license and complete README
- [x] Devpost project identity, write-up, links, technologies, and thumbnail completed
- [x] Free live testing URL available
- [x] Setup, sample-data, security, and judge test paths documented
- [x] Codex collaboration and key decisions documented
- [ ] **PUBLIC_YOUTUBE_VIDEO_URL** — record/upload the script above
- [ ] **CODEX_FEEDBACK_SESSION_ID** — run `/feedback` in the core Codex project thread and copy the returned ID
- [ ] Confirm submitter type (Individual, Team of Individuals, or Organization)
- [ ] Confirm country of residence
- [ ] Submit, then verify the Devpost project is not left as a draft

The official submission deadline is July 21, 2026 at 5:00 PM Pacific Time (July 22, 2026 at 00:00 UTC).
