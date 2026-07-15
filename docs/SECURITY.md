# Security and privacy

## Authorization

- Collections grant signed-in users only the ability to create documents.
- Each created document receives read/update/delete permissions for its owning user.
- The bucket follows the same file-level permission model.
- Server functions derive the user from Appwrite execution headers; payload user IDs are ignored.
- Administrative keys are restricted to setup and server functions.

## Secret handling

- `APPWRITE_API_KEY` is a local bootstrap secret only; `OPENAI_API_KEY` and `OPS_SECRET` are Appwrite Function secrets.
- Appwrite Functions authenticate to Appwrite with scoped per-execution dynamic keys rather than a deployed static API key.
- No secret has a `NEXT_PUBLIC_` prefix.
- Function logs contain route names and a short user-ID prefix only; they must never log capture text or files.

## Data minimization

- Embedded PDF text is preferred over OCR.
- OCR is reserved for scanned pages.
- Model image input is reserved for captures whose layout materially changes meaning.
- EXIF and temporary derivatives should be removed by the preprocessing layer before model input.
- Original files follow the user's retention setting and are removed by `ops`.

## Abuse controls

- Per-user daily quotas are enforced before an AI call.
- Inputs and result sets are bounded.
- Strict Structured Outputs prevent arbitrary model-shaped writes; extraction is capped at 20 items per capture.
- Source excerpts are checked against textual evidence, dates and times are normalized conservatively, and duplicate intents are removed before review.
- Refusals, incomplete responses, empty batches, malformed fields, and unsupported evidence fail closed without mutating the original capture.
- Repeated results should use content hashes and caches.
- Quota exhaustion returns a soft lock while leaving existing data usable.

## Incident response

1. Disable the affected function in Appwrite.
2. Rotate the exposed API/OpenAI/ops secret.
3. Review Appwrite execution logs without exporting user capture content.
4. Verify document and bucket permissions using a dedicated test user.
5. Notify affected users when disclosure is confirmed and applicable law requires it.
6. Restore with reduced scopes, new keys, and a regression test.
