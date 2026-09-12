# Workload Planner deployment

This change is a draft integration, not a live Firebase deployment. Frontend uses the existing Firebase app and default Functions region (us-central1). No API keys belong in browser files.

## Backend

The supplied Cloud Shell project uses Node 22, firebase-admin ^14.3.0, firebase-functions ^7.3.2, and Claude Haiku (`claude-haiku-4-5-20251001`) with the existing `ANTHROPIC_API_KEY` secret. The workload callable now matches that provider, model and dependencies. No new OpenAI configuration is required.

Integrate into `~/brainstorm_ai_backend_ready`: copy `functions-workload/index.js` from this branch to `functions/workload.js`, then append exactly once to the existing `functions/index.js`:

```js
exports.workloadPlanner = require('./workload').workloadPlanner;
```

Keep both existing function exports and firebase.json unchanged. The new module reuses the initialized Admin app. Deploy only `functions:workloadPlanner` to the same Firebase project after the rules checks below. Do not deploy all functions or overwrite the original index.js. Back up the existing index.js first. The original supplied backend has not been published in this public repository.

Existing generateAiInsight is not reused: its output is shared with the team, whereas workload recommendations are private to the leader.

The roster is pinned to the same five Firebase account emails used by app.js. Keep both rosters consistent. Access is checked against the authenticated token email, never localStorage or a submitted display name. Lecturer and nonmember accounts are rejected. Only Shamiel can read all check-ins, generate plans, and apply them.

## Firestore

Three NEW collection namespaces are server-only: workloadCheckins, workloadPrivate, workloadLimits. Deny direct client reads/writes to all three. The callable Admin SDK manages them. Add matching deny clauses to the deployed rules, and ensure no broad wildcard allow rule also grants access: Firestore allow rules are additive. Do not replace the existing application's rules blindly. Deployment must be blocked until member/lecturer direct-access denial is tested with the actual rules.

## Behavior

Weekly inputs use Monday dates. Capacity is available hours for that week, including explicit zero. Each member records only their own share of remaining and weekly hours. Missing input stays unknown. Completed tasks are excluded; unassigned tasks remain visible to the AI as missing estimates. The leader can select/edit proposed PIC and deadline changes before applying. Existing collaborators are retained. Weekly hours are not automatically transferred: affected members must refresh their check-ins after reassignment.

Drafts expire after one hour. Apply uses a Firestore transaction, checks the entire task snapshot and check-ins against the draft, preserves other task fields, and records the applied changes and previous values privately. Any intervening task/check-in change requires regeneration. No new reminder emails or messages are sent by this feature.

## Release checks

- Run `node --check workload.js` and `node --check functions-workload/index.js`.
- Emulator: member can read/save own check-in only; lecturer denied; member cannot analyse/apply or directly read private collections.
- Check zero/missing capacity, shared tasks, new/removed assignments, completed tasks and Monday validation.
- Use the existing Anthropic connection to generate a draft; confirm no task mutation before Apply.
- Test edited PIC/deadline, unchecked changes, stale draft, double Apply, expired draft, provider failure and concurrent task edits.
- Browser: desktop and narrow mobile layouts, keyboard forms, sign-out clearing private data, lecturer has no panel.
- Deploy the backend and rules first, then merge frontend after authenticated staging smoke test.

Backend source was inspected, but deployed Firebase access and current security rules were unavailable during implementation, so those release checks are pending. The existing app's task writes use whole-list sets: a stale legacy client could overwrite newer data after an Apply transaction; consider migrating all task writers to transactions separately.
