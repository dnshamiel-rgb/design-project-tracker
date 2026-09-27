import test from 'node:test';
import assert from 'node:assert/strict';
import { daysToDeadline, eligibleRecipients, malaysiaDate, reminderKey } from './core.mjs';

test('Malaysia date is used even when UTC is still the prior day', () => {
  assert.equal(malaysiaDate(new Date('2026-09-26T17:00:00Z')), '2026-09-27');
});
test('one day before, due today and overdue are eligible; earlier is not', () => {
  const today = '2026-09-27';
  assert.equal(daysToDeadline('2026-09-28', today), 1);
  assert.equal(daysToDeadline('2026-09-27', today), 0);
  assert.equal(daysToDeadline('2026-09-26', today), -1);
  assert.deepEqual([29, 28, 27, 26].map(day => eligibleRecipients({ id: 1, status: 'In Progress', deadline: `2026-09-${day}`, mainPIC: 'Shamiel' }, today).length), [0, 1, 1, 1]);
});
test('done, missing deadline and invalid date are skipped; recipients are deduplicated', () => {
  const task = { id: 7, name: 'Work', deadline: '2026-09-27', status: 'In Progress', mainPIC: 'Aina', assigned: ['Aina', 'Hamizan', 'Other'] };
  assert.deepEqual(eligibleRecipients(task, '2026-09-27').map(({member}) => member.name), ['Hamizan', 'Aina']);
  assert.deepEqual(eligibleRecipients({ ...task, status: 'Done' }, '2026-09-27'), []);
  assert.deepEqual(eligibleRecipients({ ...task, deadline: '' }, '2026-09-27'), []);
  assert.equal(daysToDeadline('2026-02-30', '2026-09-27'), null);
  assert.equal(reminderKey(task, {name:'Aina'}, '2026-09-27'), '7_Aina_2026-09-27');
});
