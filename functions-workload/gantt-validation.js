'use strict';
function validDate(s) {return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;}
function validatePlan(plan,tasks) {
 const bad=m=>{throw Error(m);};
 if(!plan||!Array.isArray(plan.milestones)||!Array.isArray(plan.schedules)||plan.milestones.length>100||plan.schedules.length>1000)bad('Invalid plan size.');
 const ids=new Set();
 const milestones=plan.milestones.map(m=>{
  if(!m||typeof m.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(m.id)||ids.has(m.id))bad('Invalid milestone ID.');ids.add(m.id);
  if(typeof m.name!=='string'||!m.name.trim()||m.name.length>160||typeof m.source!=='string'||m.source.length>300)bad('Enter a milestone name and valid source.');
  if(!validDate(m.date))bad('Enter a confirmed milestone date.');
  if(m.target&&(!validDate(m.target)||m.target>m.date))bad('Internal target must be on or before the official date.');
  return {id:m.id,name:m.name.trim(),source:m.source.trim(),date:m.date,target:m.target||''};
 });
 const seen=new Set();
 const schedules=plan.schedules.map(s=>{
  if(!s||typeof s.taskId!=='string'||!tasks.some(t=>String(t.id)===s.taskId)||seen.has(s.taskId))bad('Task changed or was removed. Refresh the plan.');seen.add(s.taskId);
  if(s.milestoneId&&!ids.has(s.milestoneId))bad('Choose an existing milestone.');
  for(const k of ['start','target'])if(s[k]&&!validDate(s[k]))bad('Invalid task date.');
  const task=tasks.find(t=>String(t.id)===s.taskId),end=s.target||(validDate(task.deadline)?task.deadline:'');
  if(s.start&&(!end||s.start>end))bad('Start date must be on or before the target or task deadline.');
  return {taskId:s.taskId,milestoneId:s.milestoneId||'',start:s.start||'',target:s.target||''};
 });return {milestones,schedules};
}
module.exports={validDate,validatePlan};
