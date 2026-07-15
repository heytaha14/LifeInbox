# LifeInbox production setup

This guide connects the existing LifeInbox website to Appwrite Cloud and OpenAI without exposing either secret key to the browser.

## 1. Prerequisites

- Node.js 22.13 or newer and npm
- An Appwrite Cloud account
- An OpenAI API Platform account with billing or available credits
- The Appwrite CLI: `npm install -g appwrite-cli`

## 2. Create the Appwrite project

1. Open Appwrite Console and create a project named **LifeInbox**.
2. In **Project settings**, copy the project ID and the API endpoint for your region.
3. Add a **Web** platform for `localhost`.
4. Add another **Web** platform for `lifeinbox-calm.explorertaha.chatgpt.site`.
5. If a custom domain is added later, register that hostname as another Web platform before using authentication or password recovery there.

## 3. Create the one-time bootstrap API key

In **Project settings > API keys**, create a key named `LifeInbox local setup`. Grant the database-management and bucket-management write scopes needed to create the database, collections, attributes, indexes, and storage bucket. Keep this key only in `.env.local`; it is not used by the website and is not deployed to either function.

Copy `.env.example` to `.env.local`, then set:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://<YOUR_REGION>.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<YOUR_PROJECT_ID>
APPWRITE_API_KEY=<YOUR_BOOTSTRAP_API_KEY>
```

Leave the provided LifeInbox resource IDs unchanged unless you intentionally want custom IDs. Never rename `APPWRITE_API_KEY` to start with `NEXT_PUBLIC_`.

Create all database and storage resources:

```powershell
npm install
npm run appwrite:setup
```

The setup is safe to rerun: existing resources are kept.

## 4. Configure and deploy the Appwrite Functions

1. Put your project ID into the `projectId` field of `appwrite.config.json`.
2. If your Appwrite endpoint differs from the default, update the `endpoint` field too.
3. Log in and deploy:

```powershell
appwrite login
npm run appwrite:deploy
```

The checked-in function scopes create a short-lived dynamic Appwrite key for each execution. Do not add the bootstrap `APPWRITE_API_KEY` to either function.

## 5. Create and connect the OpenAI API key

1. Open the OpenAI API Platform and create a project for LifeInbox.
2. Add billing or credits and set a sensible monthly project budget/alert.
3. Create a project API key and copy it once.
4. In Appwrite Console, open **Functions > LifeInbox AI Orchestrator > Settings > Environment variables**.
5. Add these variables and mark the API key secret:

```env
OPENAI_API_KEY=<YOUR_OPENAI_PROJECT_KEY>
OPENAI_MODEL=gpt-5.6-luna
FREE_DAILY_CAPTURE_LIMIT=50
```

6. Redeploy the AI function after creating or changing variables.

For **LifeInbox Ops**, add:

```env
OPS_SECRET=<A_LONG_RANDOM_SECRET>
FILE_RETENTION_DAYS=30
```

Then redeploy the Ops function. The secret is only needed for protected administrator routes; signed-in users can still request deletion of their own workspace.

If the default resource IDs were changed, also add the matching `APPWRITE_DATABASE_ID`, collection ID, and bucket ID variables to both functions.

## 6. Connect the hosted website

The hosted website needs only the public `NEXT_PUBLIC_APPWRITE_*` values from `.env.local`. It must never receive `APPWRITE_API_KEY`, `OPENAI_API_KEY`, or `OPS_SECRET`. Build and publish the website again after adding public values so the browser bundle points to the correct Appwrite project.

## 7. End-to-end verification

Test in this order:

1. Create an account and log out/log in.
2. Request a password recovery email and complete the reset on the production domain.
3. Capture a compound note such as `Renew insurance Friday at 5 PM, email the receipt to Maya, and book a dentist appointment next Tuesday`; confirm that it becomes separate editable review items, then approve the batch.
4. Upload one image and one PDF.
5. Record a short voice note and approve its transcription.
6. Complete, snooze, edit, and delete an item; use the **Completed** inbox filter to find it and restore it if needed.
7. Create a Life Thread, ask a question with citations, and click a citation to open its supporting item.
8. Refresh and confirm data persists.
9. Export the designed PDF report, confirm its cover, summary metrics, grouped items, and page numbers, then change preferences and test account deletion with a temporary user.
10. Review Appwrite function execution logs and OpenAI usage for unexpected errors or spending.

## 8. Install the PWA

- Android/desktop Chrome or Edge: choose **Install app** when LifeInbox offers it, or use the browser install icon.
- iPhone/iPad Safari: tap **Share**, then **Add to Home Screen**.
- Installed mode uses custom icons, standalone app chrome, safe-area spacing, and an offline app-shell fallback. Live Appwrite and AI actions still require a network connection.

## Security checklist

- Never paste secret keys into chat, screenshots, client code, or Git.
- Use separate Appwrite and OpenAI projects/keys for development and production.
- Apply a spending limit and alerts to the OpenAI project.
- Rotate a key immediately if it may have been exposed.
- Delete or disable the local bootstrap Appwrite key after resources are created if you do not plan to rerun setup.
