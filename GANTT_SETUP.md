# Admin Gantt deployment

This branch adds Gantt below Tasks in the existing sidebar, for the authenticated Shamiel account only. It is not a live release until the backend is deployed and access verified.

## Deploy alongside the existing backend

1. Copy `functions-workload/index.js` to the existing backend's `functions/workload.js`, and copy `functions-workload/gantt-validation.js` to `functions/gantt-validation.js`. Keep the existing entrypoint and other exports intact.
2. Add once to that existing `functions/index.js`:

   ```js
   exports.ganttPlanner = require('./workload').ganttPlanner;
   ```

3. Verify deployed Firestore rules deny direct client reads and writes to `workloadPrivate`, including any broad wildcard grants. The callable uses Admin SDK and verifies the authenticated email against the existing roster. Do not overwrite existing rules. This reuses the existing private namespace; no new client-readable collection is needed.
4. Deploy only `firebase deploy --only functions:ganttPlanner --project design-project-dashboard` from the configured backend project. No AI key is used by Gantt.
5. Test real Shamiel read/save, reject member/lecturer/unauthenticated reads and saves, and reject direct client access to `workloadPrivate/gantt-plan`. Then publish the frontend through the existing hosting workflow.

No Firebase CLI/session or deployed rules were available in this workspace. Live deployment and production authorization are not verified. Keep the PR draft until these checks pass.

## Behavior

- Official milestones require a confirmed calendar date. Course-outline source/revision is optional. Teaching weeks must be mapped to dates manually; there is no invented calendar or automatic PDF extraction.
- Internal milestone target must be no later than its official date. Private task schedules link to a milestone and optionally supply start/target dates. Existing shared tasks, assignments and deadlines are never mutated.
- A task without start date is a deadline marker; tasks without an end date remain in an explicit list. Task status comes from the shared task record, not inferred on-track status.
- Month and PIC filters affect the timeline and progress snapshot. Milestones remain visible regardless of PIC. Overdue internal targets and schedules extending beyond milestone targets/official dates are labelled.
- PDF preview explains included private planning dates before download. Export includes selected-month bars/markers, milestone dates/source, task PIC/status/warnings, undated tasks, snapshot date and page numbers. PDF uses built-in ASCII fonts, so non-ASCII text is normalized for compatibility.
- Refresh reads current shared tasks. Plan revision is checked transactionally to reject stale writes. Logout clears private UI. There is no direct-client or localStorage fallback.

## Validation

`node --test functions-workload/*.test.cjs` passes 12 tests, including permission rejection, date ordering, duplicate/missing records, stale revision and ensuring saves write only the private plan. Existing workload tests also pass. Syntax checks pass for app.js, gantt.js and backend modules.

Browser/PDF visual verification is pending: Playwright is installed but its Chromium executable is absent, and browser downloads failed. A prepared browser smoke harness could not execute. Do not treat unit/syntax checks as proof of visual layout or actual PDF rendering.
