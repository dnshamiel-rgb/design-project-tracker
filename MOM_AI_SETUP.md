# MOM draft generation — deployment required

Frontend: Meetings → Minutes → Rough notes → Generate draft → edit preview/select actions → Apply reviewed draft → Save Minutes. Applying is local only; existing actions are preserved and exact text/PIC duplicates skipped. Summary replacement requires confirmation. Raw notes persist with the minutes, alongside existing editor/time metadata. Export PDF uses the reviewed summary/actions. No automatic task creation or deadline guessing.

The new callable has not been deployed from this workspace. Existing Anthropic functions are not repurposed because their data/output contracts differ. Until deployment, generation shows an explicit service error and preserves typed notes. Manual minutes still work.

## Deploy in the existing authenticated Firebase backend

1. Copy `functions-workload/mom.js` into the existing project's `functions/mom.js`.
2. Append once to `functions/index.js`:

```js
exports.generateMomDraft = require('./mom').generateMomDraft;
```

3. Reuse the existing `ANTHROPIC_API_KEY` secret and Node 22/firebase-admin/firebase-functions dependencies. No frontend key is needed.
4. Ensure Firestore clients cannot read/write the new `momAiLimits` collection. Add `match /momAiLimits/{doc} { allow read, write: if false; }` if needed and check for broader allow rules. Admin SDK alone writes quotas. Do not replace unrelated rules.
5. From that project's root, deploy only this function:

```sh
firebase deploy --only functions:generateMomDraft
```

6. With a member account, generate a draft and verify saving/reopening notes, PDF output, retained old actions and Convert to Task. Check lecturer/nonmember rejection. Limits are 30 requests per user per UTC day and 30 seconds between attempts, including failed provider calls. No meeting records are written by generation.

Local checks: `node --check app.js`, `node --check mom-ai.js`, `node --check functions-workload/mom.js`, `node --test functions-workload/mom.test.cjs`.
