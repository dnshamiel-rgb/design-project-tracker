# Task email reminders

The scheduled GitHub Action checks Firestore at 08:17 Malaysia time each day. It emails each assigned member once per local calendar day starting one day before a task's deadline and continuing until its status is `Done`. It uses the existing `trackerData/tasks` and `trackerData/emailReminderLog` documents and the existing EmailJS template parameters. It only considers members in `core.mjs`; update that list when the tracker member list changes.

## Enable

Add these five repository **Actions secrets** in Settings → Secrets and variables → Actions before merging the workflow:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: a service account JSON for the tracker Firebase project, stored as a secret (never in source code).
- `EMAILJS_PUBLIC_KEY`: the EmailJS public key used by the tracker.
- `EMAILJS_PRIVATE_KEY`: the EmailJS private key from Account → API Keys / Security.
- `EMAILJS_SERVICE_ID`: the tracker service ID.
- `EMAILJS_TEMPLATE_ID`: the task reminder template ID.

The EmailJS template's recipient must be `{{to_email}}`. Update any template sentence using `{{days_left}}` as “days remaining” to use `{{deadline_message}}` instead, since overdue days are negative. Existing fields (`member_name`, `task_name`, `deadline`, `days_left`, `progress`, `main_pic`, `assigned_members`, `status`) remain available.

Merge to the default branch, then run **Actions → Task email reminders → Run workflow** once to verify the first run. The job prints task IDs and member names but not email addresses or secret values. It does not send test mail for tasks that are ineligible or have already been sent today. Scheduled workflow runs can start later than the nominal time.

When EmailJS fails, the run fails and the claim becomes retryable. Re-run using the workflow's **Run workflow** button. A successful EmailJS response is recorded in the shared Firestore log, so later runs on the same date skip that recipient. A provider acceptance does not prove inbox delivery; inspect EmailJS history for delivery issues.
