# Staying within Appwrite Free

## Monitor weekly

- Function executions and failure rate
- Bucket storage and bandwidth
- Daily active users
- Capture count and average file size
- Model input/output tokens
- OCR and transcription frequency
- Briefing and Ask cache hit rate

## Cost-control order

1. Reuse cached extraction and briefing results.
2. Prefer extracted text over OCR and images.
3. Compress previews before upload or model input.
4. Lower free daily capture or all-route token budgets before hard service limits.
5. Enter manual-review mode instead of retrying repeated AI failures.
6. Reduce the deployment-wide file retention period while preserving reviewed action and permanent Note records.

## Attribute-limit strategy

The `actions` collection intentionally keeps the original compact schema. Optional LifeInbox metadata—full note bodies, Smart Focus pins, note backlinks, timed snooze values, missing fields, and source evidence—is serialized into ordered, versioned chunks inside the existing `people` string array. The browser and AI function decode those chunks before use, so reserved metadata never appears as a person. This avoids paid-plan assumptions and keeps existing Appwrite Free projects migration-safe.

## Alert thresholds

- 70%: send an admin warning and inspect growth source.
- 85%: reduce nonessential AI retries and preview sizes.
- 95%: soft-lock new file/AI processing, keep existing data available, and show a clear user message.

The Free plan has no paid overage path, so monitoring should fail safely before a hard platform limit is reached.
