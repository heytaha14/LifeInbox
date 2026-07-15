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
4. Lower free daily capture quotas before hard service limits.
5. Enter manual-review mode instead of retrying repeated AI failures.
6. Reduce file retention while preserving reviewed action records.

## Alert thresholds

- 70%: send an admin warning and inspect growth source.
- 85%: reduce nonessential AI retries and preview sizes.
- 95%: soft-lock new file/AI processing, keep existing data available, and show a clear user message.

The Free plan has no paid overage path, so monitoring should fail safely before a hard platform limit is reached.
