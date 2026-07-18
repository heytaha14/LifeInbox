# LifeInbox judge demo video production pack

## Final format

- **Runtime:** 2 minutes 30 seconds
- **Structure:** 15 clips, exactly 10 seconds each
- **Delivery:** 1920x1080, 16:9, 30 fps, H.264 MP4
- **Source recording:** capture the website at 2560x1440 or 1920x1080, 60 fps, browser zoom at 100%
- **Audio:** one consistent warm, confident English voice; modern low-volume instrumental bed; subtle interface sound design
- **Rule:** show the real LifeInbox interface. Omni may frame, crop, highlight, caption, and transition the recording, but it must not redraw, rename, or invent product controls.

The complete edit is 150 seconds, safely below the Devpost three-minute limit. It explicitly demonstrates the working product, GPT-5.6, Codex collaboration, product design, real-life impact, and implementation quality.

## Prepare the recording

1. Create a temporary account with no personal information.
2. Record the landing page, sign-up, and the real empty Today view.
3. Use this exact compound capture:

   `Renew my insurance Friday at 5 PM, email the receipt to Maya, and book a dentist appointment next Tuesday.`

4. Record the AI result only after it has finished. Avoid leaving loading time in the final edit.
5. Approve the items, refresh once to prove persistence, complete one item, and open the Completed filter.
6. Create one permanent note:

   `Venue access: use the east entrance after 6 PM. Parking is beside Gate B.`

7. Turn that note into a linked action and show its Life Thread.
8. Ask:

   `What should I do first, and why?`

9. Open the returned citation, use Find anything, export the designed PDF, and show the PWA/mobile layout.
10. Delete the temporary workspace after recording.

Hide email addresses, passwords, browser bookmarks, notifications, and unrelated tabs. Use a fresh browser profile or crop the recording to the website viewport.

## Omni master prompt

Paste this at the beginning of every 10-second generation request, followed by the clip-specific block below:

```text
Create one exact 10-second segment for a modern software product demo.

Use the attached LifeInbox screen recording as the immutable primary visual layer. Preserve every pixel of the product interface, all spelling, layout, colors, numbers, buttons, and cursor actions. Do not regenerate the UI, invent screens, add fake features, alter text, or replace the real cursor interaction.

Visual direction: premium minimal iOS-inspired product film, bright white background, graphite typography, restrained violet and soft-blue accents, subtle frosted-glass labels, clean depth, gentle cursor spotlight, crisp 2D motion graphics, and smooth editorial pacing. Keep overlays outside important interface controls. Use at most one short headline and one supporting label at a time. No stock people, no sci-fi holograms, no neon green, no fake dashboards, no illegible microtext, and no excessive zoom.

Editing: use the specified portion of the screen recording, remove waiting time, preserve natural cursor motion, add a subtle 2 percent push-in or clean device-frame move, then finish with a match-cut-ready transition. Captions must exactly match the supplied voiceover. Keep title-safe margins.

Audio: use the exact voiceover supplied below with one consistent warm, confident, natural English voice at a brisk but clear pace. Add quiet modern instrumental music and restrained interface clicks or soft whooshes. Voice must remain dominant. Do not add any spoken words.

Output: 16:9, 1920x1080, 30 fps, exactly 10 seconds, no watermark, no end card unless requested.
```

If Omni changes interface text, generate only the motion-graphic overlay without the screen recording and place that overlay above the untouched recording in the final editor.

## Fifteen 10-second clips

### Clip 01 - The problem and promise (0:00-0:10)

**Record:** Landing hero, LifeInbox mark, headline, and smart-capture preview.

**Voiceover:**

> Life admin arrives as screenshots, receipts, voice notes, PDFs, and tangled thoughts. LifeInbox gives everything one calm, private place to land.

**On-screen graphic:** `LIFE ADMIN, UNTANGLED` followed by four small outline icons: image, receipt, microphone, document.

**Clip-specific Omni prompt:**

```text
Use the landing hero recording. Begin on a clean white field with four small outline capture icons drifting into alignment, then reveal the real LifeInbox hero beneath them. Add the headline "LIFE ADMIN, UNTANGLED" in graphite with a restrained violet underline. End with the cursor near "Start capturing free."

VOICEOVER: "Life admin arrives as screenshots, receipts, voice notes, PDFs, and tangled thoughts. LifeInbox gives everything one calm, private place to land."
```

### Clip 02 - Real account, real ownership (0:10-0:20)

**Record:** Sign-up completion and empty Today screen.

**Voiceover:**

> Every account begins truly empty. There is no demo workspace: each Appwrite record and file belongs only to the signed-in user.

**On-screen graphic:** `REAL ACCOUNT` / `ZERO SEEDED DATA`

**Clip-specific Omni prompt:**

```text
Use the sign-up-to-empty-workspace recording. Make a clean match cut from the account confirmation into the empty Today view. Add two compact frosted labels: "REAL ACCOUNT" and "ZERO SEEDED DATA." Briefly trace a thin violet ownership line from the profile avatar to the empty workspace, without covering controls.

VOICEOVER: "Every account begins truly empty. There is no demo workspace: each Appwrite record and file belongs only to the signed-in user."
```

### Clip 03 - One universal capture surface (0:20-0:30)

**Record:** Open New capture and move across Text, Image, PDF, and Voice.

**Voiceover:**

> One capture surface accepts text, images, PDFs, and voice. I can organize actions or deliberately keep information as a permanent note.

**On-screen graphic:** `TEXT  IMAGE  PDF  VOICE`

**Clip-specific Omni prompt:**

```text
Use the real New capture modal. Keep the modal fully legible. Add a gentle spotlight that moves across Text, Image, PDF, and Voice in sequence, then pauses between "Organize actions" and "Save as note." Add the small headline "ONE PLACE TO DROP ANYTHING."

VOICEOVER: "One capture surface accepts text, images, PDFs, and voice. I can organize actions or deliberately keep information as a permanent note."
```

### Clip 04 - The messy input (0:30-0:40)

**Record:** Paste the exact compound capture and click Let AI organize.

**Voiceover:**

> This single thought contains three intentions: renew insurance, email Maya, and book a dentist. I drop it in without organizing anything first.

**On-screen graphic:** Three subtle numbered markers appear beside the three clauses.

**Clip-specific Omni prompt:**

```text
Use the real typing and submit recording. Keep the capture text sharp and unchanged. As the sentence appears, add three restrained violet numbered markers aligned with the three clauses. On the click, pull the markers into one small label reading "1 CAPTURE / 3 INTENTIONS." Remove all loading time after the click.

VOICEOVER: "This single thought contains three intentions: renew insurance, email Maya, and book a dentist. I drop it in without organizing anything first."
```

### Clip 05 - GPT-5.6 atomic understanding (0:40-0:50)

**Record:** Completed Review 3 items screen and the three item tabs.

**Voiceover:**

> GPT-5.6 Terra uses high reasoning and strict Structured Outputs to separate every intent into three small, independent, source-grounded items.

**On-screen graphic:** `GPT-5.6 TERRA` / `HIGH REASONING` / `STRICT OUTPUT`

**Clip-specific Omni prompt:**

```text
Start directly on the completed "Review 3 items" screen. Do not show a loading state. Add three compact technical labels one after another: "GPT-5.6 TERRA," "HIGH REASONING," and "STRICT OUTPUT." Use thin connector lines from the original capture to the three real item tabs. Preserve all confidence values.

VOICEOVER: "GPT-5.6 Terra uses high reasoning and strict Structured Outputs to separate every intent into three small, independent, source-grounded items."
```

### Clip 06 - Trust before persistence (0:50-1:00)

**Record:** Move through the three review tabs; show evidence, confidence, date, type, and editable title.

**Voiceover:**

> Each draft exposes its evidence, confidence, date, priority, and missing information. I can edit or remove anything before a single item is saved.

**On-screen graphic:** `REVIEW BEFORE SAVE`

**Clip-specific Omni prompt:**

```text
Use the review-tabs recording. Cut briskly between the three real items while a thin focus frame highlights source evidence, confidence, date, and editable fields. Add one centered label, "REVIEW BEFORE SAVE." Avoid adding checkmarks that imply automatic approval.

VOICEOVER: "Each draft exposes its evidence, confidence, date, priority, and missing information. I can edit or remove anything before a single item is saved."
```

### Clip 07 - Save, persist, organize (1:00-1:10)

**Record:** Click Save all 3, show Today, then refresh and show the items still present.

**Voiceover:**

> After approval, all three items persist in Appwrite, survive a refresh, and flow into Today and the Inbox without losing their source context.

**On-screen graphic:** `APPROVED -> APPWRITE -> TODAY`

**Clip-specific Omni prompt:**

```text
Use the Save all 3, Today, and refresh recording. Compress the sequence into three clean beats. Add a minimal horizontal flow graphic: "APPROVED -> APPWRITE -> TODAY." After refresh, use a subtle violet pulse around the restored items to prove persistence.

VOICEOVER: "After approval, all three items persist in Appwrite, survive a refresh, and flow into Today and the Inbox without losing their source context."
```

### Clip 08 - Smart Focus and completion (1:10-1:20)

**Record:** Show Smart Focus, start the focus timer briefly, complete an item, and open Completed.

**Voiceover:**

> Smart Focus reduces the day to three clear moves and a quiet focus session. Completed work stays searchable instead of disappearing.

**On-screen graphic:** `3 CLEAR MOVES` / `25:00`

**Clip-specific Omni prompt:**

```text
Use the Smart Focus, timer, completion, and Completed-filter recording. Add "3 CLEAR MOVES" beside the focus stack and a clean circular 25:00 motion ring around the real timer. Finish on the completed item visible in the Completed filter.

VOICEOVER: "Smart Focus reduces the day to three clear moves and a quiet focus session. Completed work stays searchable instead of disappearing."
```

### Clip 09 - Notes are knowledge, not fake tasks (1:20-1:30)

**Record:** New capture -> Save as note -> paste venue information -> review/save -> Notes view.

**Voiceover:**

> Not everything is a task. Notes preserve complete reference information until I delete it, without polluting Today with fake outstanding work.

**On-screen graphic:** `PERMANENT NOTE` / `NOT A TASK`

**Clip-specific Omni prompt:**

```text
Use the real Save as note flow and Notes library. Add a soft paper-card transition that never covers the note text. Show two small labels: "PERMANENT NOTE" and "NOT A TASK." End with the saved venue note in the real Notes view.

VOICEOVER: "Not everything is a task. Notes preserve complete reference information until I delete it, without polluting Today with fake outstanding work."
```

### Clip 10 - Notes become action and context (1:30-1:40)

**Record:** Open the note, click Turn into action, save the linked action, then show the Life Thread.

**Voiceover:**

> When information becomes actionable, I turn the note into a linked task. Life Threads keep the action, people, dates, and original context together.

**On-screen graphic:** `KNOWLEDGE -> ACTION -> THREAD`

**Clip-specific Omni prompt:**

```text
Use the note-to-action and Life Thread recording. Draw a precise violet connection from the real note card to the real linked action, then transition into the Life Thread cockpit. Add the minimal flow "KNOWLEDGE -> ACTION -> THREAD."

VOICEOVER: "When information becomes actionable, I turn the note into a linked task. Life Threads keep the action, people, dates, and original context together."
```

### Clip 11 - Grounded Ask (1:40-1:50)

**Record:** Ask `What should I do first, and why?` and reveal the completed answer.

**Voiceover:**

> Ask LifeInbox reasons only over my permissioned workspace. It recommends the next move, explains why, and returns citations instead of unsupported advice.

**On-screen graphic:** `GROUNDED IN YOUR DATA`

**Clip-specific Omni prompt:**

```text
Use the Ask recording with the completed answer already available; remove network waiting. Keep the question and answer readable. Add the quiet header "GROUNDED IN YOUR DATA" and a thin focus frame around the real citation chip. Do not create an artificial AI chat response.

VOICEOVER: "Ask LifeInbox reasons only over my permissioned workspace. It recommends the next move, explains why, and returns citations instead of unsupported advice."
```

### Clip 12 - Citations and Spotlight search (1:50-2:00)

**Record:** Click the Ask citation to open its item, close it, press Command/Ctrl+K, and search.

**Voiceover:**

> Every citation opens its exact source item. LifeInbox Spotlight also finds any task, note, person, or Thread without navigating through menus.

**On-screen graphic:** `ANSWER -> SOURCE` / `FIND ANYTHING`

**Clip-specific Omni prompt:**

```text
Use the citation-open and Spotlight recording. Add one precise line from the citation chip to the opened source card, then match cut into the real Find anything panel. Add only "ANSWER -> SOURCE" and "FIND ANYTHING" as short labels.

VOICEOVER: "Every citation opens its exact source item. LifeInbox Spotlight also finds any task, note, person, or Thread without navigating through menus."
```

### Clip 13 - Designed PDF ownership (2:00-2:10)

**Record:** Settings -> Privacy -> Export LifeInbox report, then show the PDF cover and one interior page.

**Voiceover:**

> My data remains portable. LifeInbox exports a designed multipage PDF with metrics, grouped items, notes, status, confidence, and page numbers.

**On-screen graphic:** `YOUR DATA, PORTABLE`

**Clip-specific Omni prompt:**

```text
Use the real export action and real generated PDF. Transition from the Privacy setting into a clean, slightly angled page presentation. Show the authentic cover and one interior page without rewriting them. Add the headline "YOUR DATA, PORTABLE."

VOICEOVER: "My data remains portable. LifeInbox exports a designed multipage PDF with metrics, grouped items, notes, status, confidence, and page numbers."
```

### Clip 14 - PWA, responsive design, and privacy (2:10-2:20)

**Record:** Desktop view, tablet responsive view, phone view, PWA install prompt, and Privacy section.

**Voiceover:**

> The same clean workspace adapts to desktop, tablet, and phone, installs as a PWA, keeps AI keys server-side, and supports complete deletion.

**On-screen graphic:** Three device frames plus `PRIVATE BY DESIGN`

**Clip-specific Omni prompt:**

```text
Use only the real desktop, tablet, phone, PWA, and Privacy recordings. Arrange the untouched recordings into three crisp device frames on white, then focus on the phone and install prompt. Add a restrained shield outline and "PRIVATE BY DESIGN." No floating 3D phones and no invented mobile UI.

VOICEOVER: "The same clean workspace adapts to desktop, tablet, and phone, installs as a PWA, keeps AI keys server-side, and supports complete deletion."
```

### Clip 15 - Codex, engineering, and closing promise (2:20-2:30)

**Record:** Quick montage of repository README/architecture/tests, then return to the LifeInbox landing hero.

**Voiceover:**

> Codex helped turn my product direction into tested architecture, resilient AI, and a deployed experience. LifeInbox: drop it in, understand it, move on.

**On-screen graphic:** `BUILT WITH CODEX + GPT-5.6` followed by the LifeInbox mark and live URL.

**Clip-specific Omni prompt:**

```text
Use the real repository documentation and test-result recording for the first five seconds, with readable glimpses of architecture, tests, and deployment. Match cut back to the authentic LifeInbox landing hero. Add "BUILT WITH CODEX + GPT-5.6," then finish on the LifeInbox mark and "lifeinbox-calm.explorertaha.chatgpt.site." Keep the final frame still for the last 1.5 seconds.

VOICEOVER: "Codex helped turn my product direction into tested architecture, resilient AI, and a deployed experience. LifeInbox: drop it in, understand it, move on."
```

## Assembly guide

1. Generate all clips with the same voice description, typography, color palette, music direction, and loudness.
2. Assemble in numeric order with straight cuts or 4-to-6-frame match dissolves. Do not add a second title sequence.
3. Keep screen text visible long enough to read. Speed up cursor travel, not the proof moments.
4. Normalize voice around -16 LUFS integrated, keep music roughly 12 to 16 dB below speech, and use a true peak below -1 dB.
5. Add accurate burned-in English captions, then upload a matching `.srt` file to YouTube.
6. Export once at high quality. Watch the final video at normal speed on a phone and laptop before upload.
7. Upload to YouTube as **Public**, not Unlisted, and confirm the public URL works in a signed-out browser.

The ready-to-upload caption file is [LIFEINBOX_DEMO.srt](LIFEINBOX_DEMO.srt).

## YouTube metadata

**Title**

`LifeInbox - A private AI superbrain for real-life admin | OpenAI Build Week`

**Description template**

```text
LifeInbox turns messy text, images, PDFs, receipts, and voice captures into source-grounded tasks, events, expenses, notes, and connected Life Threads.

Built with Codex, GPT-5.6 Terra, the OpenAI Responses API, Appwrite, Next.js, React, and TypeScript for OpenAI Build Week.

Try it: https://lifeinbox-calm.explorertaha.chatgpt.site/
Code: https://github.com/heytaha14/LifeInbox
Devpost: https://devpost.com/software/lifeinbox
```

**Thumbnail text**

`DROP THE MESS. GET THE NEXT MOVE.`

Use a real LifeInbox review screen with the three extracted items. Keep the thumbnail bright, white, and readable at phone size.

## Final judge check

- The video is public on YouTube and under three minutes.
- Real product screens are shown; no AI-generated interface is presented as functionality.
- Voiceover explicitly explains both GPT-5.6 and Codex.
- The real empty workspace, compound capture, editable review, persistence, Notes, Life Threads, Ask citations, PDF, PWA, and privacy controls appear.
- No passwords, email addresses, private files, API keys, or test-user data remain visible.
- The final Devpost form uses the public YouTube URL and the primary `/feedback` session ID.
