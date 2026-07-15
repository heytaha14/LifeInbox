# Operations runbook

## Capture processing is failing

1. Check Appwrite function execution status and environment variables.
2. Verify the user's execution reaches `ai-orchestrator` with an authenticated user header.
3. Check daily usage and provider status.
4. Keep the original capture intact and switch the UI to editable manual review.

## Login is failing

1. Verify the current origin exists as an Appwrite Web platform.
2. Confirm endpoint and project ID in website environment variables.
3. Verify email/password authentication is enabled.
4. Do not create an API key in the browser to bypass session errors.

## Files cannot upload

1. Verify the `inbox-files` bucket exists and file security is enabled.
2. Confirm the user is signed in and the upload supplies user file permissions.
3. Check the 10 MB client/bucket limit and extension allowlist.
4. Preserve capture text even if the file path fails.

## Quota or capacity alert

Follow `APPWRITE_FREE.md` thresholds. Prefer a visible soft lock and manual entry over repeated retries.
