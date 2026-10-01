/* Draft generation never saves minutes or creates tasks. */
(() => {
'use strict';
const byId = id => document.getElementById(id);
let generation = 0, draft = null, baseline = '';
window.resetMomDraft = function(notes = '') {
    generation++; draft = null;
    byId('momRoughNotes').value = notes;
    byId('momAiPreview').hidden = true;
    byId('momAiStatus').textContent = '';
    byId('momGenerateBtn').disabled = false;
    byId('momGenerateBtn').textContent = 'Generate draft';
    byId('momAiSection').hidden = isLecturer();
};
byId('momGenerateBtn').addEventListener('click', async () => {
    if (isLecturer()) return;
    const notes = byId('momRoughNotes').value.trim();
    if (!notes) { byId('momAiStatus').textContent = 'Add your discussion points first.'; return; }
    const meetingId = currentMomMeetingId, token = ++generation;
    const user = auth.currentUser?.uid;
    draft = null; byId('momAiPreview').hidden = true;
    baseline = byId('momSummary').value;
    byId('momGenerateBtn').disabled = true;
    byId('momGenerateBtn').textContent = 'Generating…';
    byId('momAiStatus').textContent = 'Preparing a draft for review…';
    try {
        if (!functionsInstance) throw new Error('unavailable');
        const result = await functionsInstance.httpsCallable('generateMomDraft', {timeout: 100000})({meetingId, notes, language: byId('momAiLanguage').value});
        if (token !== generation || meetingId !== currentMomMeetingId || auth.currentUser?.uid !== user || byId('momModal').classList.contains('hidden')) return;
        const value = result.data;
        if (!value || typeof value.summary !== 'string' || !Array.isArray(value.actions)) throw new Error('Invalid draft');
        draft = value;
        byId('momDraftSummary').value = value.summary;
        byId('momDraftActions').replaceChildren();
        value.actions.forEach(action => {
            const row = document.createElement('label'); row.className = 'mom-draft-action';
            const check = document.createElement('input'); check.type = 'checkbox'; check.checked = true;
            const text = document.createElement('input'); text.type = 'text'; text.value = action.text; text.setAttribute('aria-label', 'Suggested action');
            const owner = document.createElement('select'); owner.setAttribute('aria-label','Suggested PIC');
            for (const name of ['', ...members.map(m => m.name)]) {
                const option = document.createElement('option'); option.value = name; option.textContent = name || 'PIC not specified'; owner.append(option);
            }
            owner.value = action.owner || '';
            row.append(check, text, owner); byId('momDraftActions').append(row);
        });
        byId('momAiPreview').hidden = false;
        byId('momAiStatus').textContent = 'Draft only. Verify facts, decisions, PIC and dates. Untick actions you do not want.';
    } catch (error) {
        if (token === generation) byId('momAiStatus').textContent = 'Draft could not be generated. The MOM backend may need deployment, or the service is unavailable. Your notes are retained; you can still write and save minutes manually.';
    } finally {
        if (token === generation) { byId('momGenerateBtn').disabled = false; byId('momGenerateBtn').textContent = 'Generate draft'; }
    }
});
byId('momApplyDraft').addEventListener('click', () => {
    if (!draft || isLecturer()) return;
    if (byId('momSummary').value !== baseline) { byId('momAiStatus').textContent = 'Summary changed since generation. Generate a fresh draft before applying.'; return; }
    if (baseline.trim() && !window.confirm('Replace the existing discussion summary with this reviewed draft? Existing action items will be kept.')) return;
    byId('momSummary').value = byId('momDraftSummary').value;
    const key = (text, owner) => JSON.stringify([text.trim().toLowerCase(), owner]);
    const existing = new Set(currentMomActionItems.map(a => key(a.text, a.owner || '')));
    byId('momDraftActions').querySelectorAll('.mom-draft-action').forEach(row => {
        const [check, input, owner] = row.children, text = input.value.trim();
        if (check.checked && text && !existing.has(key(text, owner.value))) {
            currentMomActionItems.push({id: Date.now() + Math.random(), text, owner: owner.value, done: false, taskId: null});
            existing.add(key(text, owner.value));
        }
    });
    renderMomActionItems(); draft = null; byId('momAiPreview').hidden = true;
    byId('momAiStatus').textContent = 'Draft applied to this form. Review it, then click Save Minutes.';
});
})();
