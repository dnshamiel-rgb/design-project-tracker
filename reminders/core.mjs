// Dates in the tracker are YYYY-MM-DD. Evaluate them in Malaysia time.
export function malaysiaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
}

export function daysToDeadline(deadline, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline || '')) return null;
  const due = Date.parse(`${deadline}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(due) || new Date(due).toISOString().slice(0, 10) !== deadline) return null;
  return Math.round((due - current) / 86400000);
}

export const members = [
  { name: 'Shamiel', email: '2023305361@student.uitm.edu.my' },
  { name: 'Hamizan', email: '2023126973@student.uitm.edu.my' },
  { name: 'Aisyah', email: '2024901861@student.uitm.edu.my' },
  { name: 'Aina', email: '2023189595@student.uitm.edu.my' },
  { name: 'Aziemah', email: '2022496438@student.uitm.edu.my' }
];

export function eligibleRecipients(task, today) {
  if (!task || task.status === 'Done') return [];
  const days = daysToDeadline(task.deadline, today);
  if (days === null || days > 1) return [];
  const names = new Set([task.mainPIC, ...(Array.isArray(task.assigned) ? task.assigned : [])]);
  return members.filter(member => names.has(member.name)).map(member => ({ member, days }));
}

export function reminderKey(task, member, today) {
  return `${task.id}_${member.name}_${today}`;
}
