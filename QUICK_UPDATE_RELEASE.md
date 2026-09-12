# Quick Task Update

Replaces the required-hours member form with on-track, more-time (expected completion date), or help (reason) reports. Week defaults to the current Monday. The bulk on-track button selects all visible tasks; Save Update confirms them. Partial updates are allowed and reports for other tasks are retained. Dates and help reasons are validated server-side. Proposed dates never update task deadlines by themselves.

Leader cards show status counts and expandable task reports. Missing reports stay unknown. Historical hour check-ins remain stored, but neither new leader cards nor AI infer task status or spare capacity from them. AI receives per-member reports for active assigned tasks and uses a forced structured tool response. Reports whose recorded deadline differs from the current deadline are treated as not updated. Each report carries its own timestamp.

## Deploy order

1. Download this commit's `functions-workload/index.js` into `~/brainstorm_ai_backend_ready/functions/workload.js`.
2. Keep the existing `exports.workloadPlanner = require('./workload').workloadPlanner;` integration.
3. Run `node --check` and deploy only `functions:workloadPlanner` to `design-project-dashboard`.
4. Merge the frontend PR after backend deployment. Existing clients can still use the legacy checkin action during rollout.
5. Test one on-track update, more-time date, help reason, save/reload and the leader summary in live accounts.

No new API secret or Firestore rule is required. Existing workload collections remain server-only. The feature does not send messages or emails.

## Validation

Node syntax checks and eight mocked backend tests pass, including authorization, structured AI output, quick-update validation and preservation of other reports without modifying tasks. Browser visual and authenticated live tests remain pending. No backend deployment or merge was performed by this change.
