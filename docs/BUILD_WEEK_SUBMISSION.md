# OpenAI Build Week submission pack

This is the judge-ready project copy, verification path, and sub-three-minute demo script. Four submission fields remain intentionally incomplete and must be supplied by the submitter before final submission.

## Submission identity

- **Project:** LifeInbox
- **Tagline:** Drop in the mess. Get clear, connected next steps.
- **Category:** Apps for Your Life
- **Live project:** https://lifeinbox-calm.explorertaha.chatgpt.site/
- **Code:** https://github.com/heytaha14/LifeInbox
- **Devpost draft:** https://devpost.com/software/lifeinbox
- **License:** MIT

## Suggested Devpost write-up

### Inspiration

Life admin rarely arrives as one tidy task. It arrives as a screenshot of a flight, a receipt, a voice note with three reminders, a PDF renewal notice, or a thought typed while walking. Most productivity tools ask people to organize that information before it becomes useful. LifeInbox starts with the opposite premise: capture first, understand instantly, and review before anything enters a trusted workspace.

### What it does

LifeInbox turns text, images, PDFs, receipts, and recorded voice into editable tasks, events, expenses, and notes. One messy capture can become as many as 20 small, independent items. GPT-5.6 Luna identifies dates, times, priority, people, amounts, locations, missing information, confidence, a supporting source excerpt, and a suggested Life Thread for each item.

The user reviews the entire batch, edits or removes individual items, and approves only what is correct. Approved items power a focused Today briefing, searchable active and completed inbox views, connected Life Threads, and Ask LifeInbox answers with clickable citations back to exact saved items.

The product includes a clean iOS-inspired white, graphite, and lime interface; a responsive phone, tablet, and desktop workspace; an installable PWA; per-user Appwrite permissions; retention and deletion controls; and a designed multi-page PDF report with cover, metrics, grouped items, and page numbers.

### How we built it

The client uses Next.js, React, TypeScript, GSAP, and an installable PWA shell. Appwrite provides email/password authentication, database collections, private file storage, document/file permissions, and two Node.js server functions. The AI orchestrator calls the OpenAI Responses API with GPT-5.6 Luna for strict structured extraction, grounded questions, cached daily briefings, and relationship grouping. A separate Ops function handles retention, workspace deletion, usage seams, and scheduled cleanup.

Capture extraction uses strict Structured Outputs with a canonical `items[]` response. The orchestrator decomposes compound captures, validates supporting evidence, removes duplicate intent, normalizes dates and times conservatively, and handles refusal, incomplete, empty, or malformed model output safely. The client retains compatibility with the legacy `item` alias while treating `items[]` as the complete result.

Codex was the primary engineering collaborator. It translated the product direction into the architecture, implemented the responsive product and Appwrite data flows, hardened GPT-5.6 extraction, diagnosed production failures, added batch review and designed PDF export, created tests and documentation, deployed the stack, and verified the production experience. Human-directed decisions included the capture-first workflow, review-before-save trust model, visual direction, security boundaries, and non-destructive Life Thread deletion.

### Challenges

The hardest AI challenge was not producing a plausible title; it was preserving every explicit intent without merging unrelated actions or inventing details. The solution was an atomic array schema, deliberate reasoning, precise decomposition rules, exact source excerpts, evidence validation, duplicate checks, explicit missing fields, and editable batch review.

We also hardened the Responses API boundary for cases where a model refuses, returns an incomplete response, exhausts its output budget, or produces an empty/malformed payload. Those states now fail safely while preserving the original capture. At the persistence boundary, normalizing Appwrite document identity from `$id` fixed item actions, thread counts, and citation chips after reload.

### Accomplishments

- A complete working product, not a single-prompt AI demo
- One capture decomposed into up to 20 source-grounded atomic items
- Strict Structured Outputs plus evidence, date/time, and duplicate validation
- Editable batch review with confidence and missing-information cues
- Grounded Ask answers with clickable item-level citations
- Active and completed inbox filtering with reversible completion
- Designed branded PDF export instead of a raw JSON dump
- Real Appwrite authentication, per-user persistence, and isolated demo data
- Minimal iOS-inspired responsive UI and installable PWA behavior
- Private-by-design server-only AI keys, retention, export, and deletion controls

### What we learned

AI accuracy is a product system, not a model claim. A capable model still needs representative prompts, bounded context, strict schemas, evidence checks, deterministic normalization, visible uncertainty, and an approval boundary. GPT-5.6 provides the intelligence; the surrounding engineering makes it trustworthy and useful.

### What's next

Next steps include opt-in calendar and email connectors, richer recurring reminders, shared household Threads, notification delivery, encrypted or password-protected PDF exports, broader accessibility testing, and internationalization.

## Judge quick test

1. Open the live project and choose **Explore the demo** to inspect the responsive workspace without credentials.
2. Create a temporary account to verify that a real workspace begins empty.
3. Capture: `Renew my insurance Friday at 5 PM, email the receipt to Maya, and book a dentist appointment next Tuesday.`
4. Confirm three editable review tabs, inspect confidence/source evidence, then approve the batch.
5. Refresh and confirm that the items persist. Complete one and find it with the **Completed** filter.
6. Ask `What should I do first?` and click the returned citation to open the supporting item.
7. Open **Settings → Privacy**, generate the PDF export, and inspect its designed cover, metrics, grouped content, and page numbers.
8. Delete the temporary workspace after testing.

## Demo video script — target 2:40

The final video must be public on YouTube, under three minutes, and include voiceover explaining the project, GPT-5.6, and Codex. Record at a brisk but readable pace and avoid waiting on camera for network calls.

### 0:00–0:18 — problem and product

> Life admin arrives as screenshots, receipts, PDFs, voice notes, and thoughts with several actions tangled together. LifeInbox gives all of it one private place to land and turns the mess into clear next steps.

Show the white/lime landing page, capture proof graphic, and supported input types.

### 0:18–0:35 — real empty account

> A new account starts empty. Demo data stays in explicit demo mode, while every real row and file is permissioned to the signed-in Appwrite user.

Open a prepared temporary account and show the empty Today screen.

### 0:35–1:12 — compound capture and batch review

> I will drop in one messy note: renew my insurance Friday at five, email the receipt to Maya, and book a dentist appointment next Tuesday. The server-side OpenAI function uses GPT-5.6 Luna and strict Structured Outputs to find every distinct intent, verify it against source evidence, and return three atomic items.

Paste the sample. Show the three review tabs, confidence, source context, editable fields, and approve-all action. Do not spend time editing unless a field needs correction.

### 1:12–1:37 — persistence and organization

> After approval, all three items persist in Appwrite, feed the Today briefing, and organize into Life Threads. The inbox separates active and completed work, so finishing something never makes it impossible to find.

Refresh, show the items, complete one, and choose the **Completed** filter.

### 1:37–1:58 — grounded Ask

> Ask LifeInbox retrieves relevant user-owned items before calling GPT-5.6. Its answer is grounded in that context and its citation opens the exact saved item behind the recommendation.

Ask `What should I do first?`, then click a citation chip.

### 1:58–2:20 — designed PDF and PWA

> This is also a practical personal workspace. Instead of a raw JSON dump, LifeInbox exports a designed PDF with a cover, summary metrics, grouped items, statuses, confidence, and page numbers. It is installable as a PWA and adapts its navigation and capture flow for phone, tablet, and desktop.

Generate and briefly show the PDF, then show one mobile responsive view or the installed-app prompt.

### 2:20–2:40 — trust and Codex

> Nothing is saved before review, AI keys stay server-side, and users control retention and full workspace deletion. Codex was my primary engineering collaborator: it implemented and redesigned the product, hardened the AI and Appwrite flows, added tests and documentation, deployed the stack, and helped verify the complete experience. LifeInbox: drop it in, understand it, and move on.

End on the Today screen or landing hero with the LifeInbox mark.

## Final Devpost checklist

- [x] Working project built with Codex and GPT-5.6
- [x] Apps for Your Life category selected in this pack
- [x] English project description prepared
- [x] Public code repository prepared with MIT license and complete README
- [x] Free live testing URL documented
- [x] Setup, architecture, security, API, and judge test paths documented
- [x] Codex collaboration and key human decisions documented
- [ ] **SUBMITTER_TYPE** — Individual, Team of Individuals, or Organization
- [ ] **COUNTRY_OF_RESIDENCE**
- [ ] **PUBLIC_YOUTUBE_DEMO_URL** — public, voiceover, under three minutes
- [ ] **CODEX_FEEDBACK_SESSION_ID** — run `/feedback` in the main LifeInbox Codex task and copy the returned ID
- [ ] Perform the final OpenAI Build Week submission and verify it is not left as a draft

Do not mark the four required fields complete or perform the final submission until the submitter provides them.

The currently documented submission deadline is July 21, 2026 at 5:00 PM Pacific Time (July 22, 2026 at 00:00 UTC). Verify the live Devpost rules before relying on this date.
