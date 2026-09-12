/* Workload UI: all private reads and mutations go through authenticated callables. */
(() => {
  let state = null, busy = false, proposal = null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const week = () => { const d = new Date(); d.setDate(d.getDate() - (d.getDay()+6)%7); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const call = async (action, payload = {}) => {
    if (!functionsInstance) throw Error('Workload service is not configured.');
    const uid=auth?.currentUser?.uid;
    const response=await functionsInstance.httpsCallable('workloadPlanner')({action, ...payload});
    if(!uid || auth?.currentUser?.uid!==uid) throw Error('Session changed. Reload your workload.');
    return response.data;
  };
  const status = message => { document.querySelectorAll('.wl-status').forEach(e => e.textContent = message); };
  const run = async fn => { if(busy) return; busy=true; document.querySelectorAll('.wl button').forEach(e=>e.disabled=true); try { await fn(); } catch(e) { status(e.code === 'functions/not-found' ? 'Workload service is awaiting Firebase deployment.' : e.message); } finally {busy=false;document.querySelectorAll('.wl button').forEach(e=>e.disabled=false);} };
  function install() {
    const day=document.getElementById('myday'), hub=document.getElementById('leaderhub');
    if(!day || !hub) return;
    day.insertAdjacentHTML('beforeend', '<div id="wl-check" class="panel wl hidden"><h3>Weekly Quick Check-in</h3><p>Your available time and remaining work for the selected week.</p><label>Week starting Monday <input id="wl-week" type="date"></label><button id="wl-load">Load week</button><p class="wl-status" role="status"></p><div id="wl-form"></div></div>');
    hub.insertAdjacentHTML('afterbegin','<div id="wl-leader" class="panel wl hidden"><span class="eyebrow">LEADER ONLY</span><h3>AI Workload Planner</h3><p>Plan a target, review capacity, then approve changes.</p><label>Week starting Monday <input id="wl-leader-week" type="date"></label><button id="wl-refresh">Refresh workload</button><p class="wl-status" role="status"></p><div id="wl-capacity"></div><label>Target for this week <textarea id="wl-target" maxlength="600" placeholder="Chapter 4 ready for SV by Friday"></textarea></label><button id="wl-analyse">Analyse &amp; Draft Plan</button><div id="wl-proposal"></div></div>');
    document.getElementById('wl-week').value=week(); document.getElementById('wl-leader-week').value=week();
    document.getElementById('wl-load').onclick=()=>run(()=>refresh(document.getElementById('wl-week').value));
    document.getElementById('wl-refresh').onclick=()=>run(()=>refresh(document.getElementById('wl-leader-week').value));
    document.getElementById('wl-analyse').onclick=()=>run(async()=>{
      if(!state || !isGroupLeader()) return;
      if(document.getElementById('wl-leader-week').value!==state.week) throw Error('Refresh the selected week first.');
      status('Preparing your draft…');
      proposal=await call('analyse',{week:state.week,target:document.getElementById('wl-target').value});
      renderProposal();status('Draft only. Review each selected change before applying.');
    });
    // Role changes clear private data; reads use the Firebase identity, never the profile name.
    auth?.onAuthStateChanged(()=>{state=null;proposal=null;document.getElementById('wl-capacity').textContent='';document.getElementById('wl-proposal').textContent='';document.getElementById('wl-form').textContent=''; document.getElementById('wl-check').classList.add('hidden');document.getElementById('wl-leader').classList.add('hidden');if(auth.currentUser)run(()=>refresh(week()));});
  }
  async function refresh(w) {
    state=await call('read',{week:w});proposal=null;
    document.getElementById('wl-week').value=w;document.getElementById('wl-leader-week').value=w;
    document.getElementById('wl-check').classList.remove('hidden');document.getElementById('wl-leader').classList.toggle('hidden',!state.leader);
    document.getElementById('wl-proposal').textContent='';
    const mine=state.checkins.find(c=>c.name===state.name)||{};
    document.getElementById('wl-form').innerHTML=`<form id="wl-save-form"><label>Available hours this week <input name="capacity" type="number" min="0" max="168" step="0.5" required value="${esc(mine.capacity??'')}"></label><p>For shared tasks, enter only your share. Weekly hours must not exceed remaining hours.</p>${state.tasks.filter(t=>t.mainPIC===state.name||(t.assigned||[]).includes(state.name)).map(t=>{const e=(mine.entries||[]).find(x=>String(x.taskId)===String(t.id))||{};return `<fieldset data-task="${esc(t.id)}"><legend>${esc(t.name)}</legend><label>Your remaining hours <input name="remaining" type="number" min="0" max="1000" step="0.5" required value="${esc(e.remaining??'')}"></label><label>Your hours planned this week <input name="hours" type="number" min="0" max="168" step="0.5" required value="${esc(e.hours??'')}"></label><label>Blocker <select name="blocker">${['None','Not enough time','Waiting for data','Need help'].map(b=>`<option ${e.blocker===b?'selected':''}>${b}</option>`).join('')}</select></label><label>Can meet target? <select name="confidence">${['Yes','At risk','No'].map(b=>`<option ${e.confidence===b?'selected':''}>${b}</option>`).join('')}</select></label></fieldset>`;}).join('')}<button>Save Check-in</button></form>`;
    document.getElementById('wl-save-form').onsubmit=e=>{e.preventDefault();run(async()=>{const f=e.target;await call('checkin',{week:w,capacity:Number(f.elements.capacity.value),entries:[...f.querySelectorAll('fieldset')].map(x=>({taskId:x.dataset.task,remaining:Number(x.querySelector('[name=remaining]').value),hours:Number(x.querySelector('[name=hours]').value),blocker:x.querySelector('[name=blocker]').value,confidence:x.querySelector('[name=confidence]').value}))});await refresh(w);status('Check-in saved.');});};
    if(state.leader) document.getElementById('wl-capacity').innerHTML='<div class="wl-table"><table><thead><tr><th>Member</th><th>Planned hours</th><th>Capacity</th><th>Position</th></tr></thead><tbody>'+state.members.map(m=>{const c=state.checkins.find(x=>x.name===m);if(!c)return `<tr><td>${esc(m)}</td><td>—</td><td>—</td><td>Check-in required</td></tr>`;const h=c.entries.filter(e=>state.tasks.some(t=>String(t.id)===e.taskId&&(t.mainPIC===m||(t.assigned||[]).includes(m)))).reduce((s,e)=>s+e.hours,0);const missing=state.tasks.filter(t=>(t.mainPIC===m||(t.assigned||[]).includes(m))&&!c.entries.some(e=>e.taskId===String(t.id))).length;return `<tr><td>${esc(m)}</td><td>${h}</td><td>${c.capacity}</td><td>${missing?`${missing} estimates missing; `:''}${h>c.capacity?`Over by ${h-c.capacity} h`:h===c.capacity?'Full':`${c.capacity-h} h available`}</td></tr>`;}).join('')+'</tbody></table></div>';
    status('Loaded week '+w+'. Missing check-ins are unknown capacity.');
  }
  function renderProposal(){
    const el=document.getElementById('wl-proposal');
    el.innerHTML='<h4>Where do I need to step in?</h4>'+proposal.brief.map(b=>`<p class="wl-brief">${esc(b)}</p>`).join('')+'<h4>Review changes</h4><p>Changing PIC retains existing collaborators. Confirm suitability and update check-ins after reassignment.</p>'+proposal.changes.map((c,i)=>{const t=state.tasks.find(t=>String(t.id)===c.taskId);return `<fieldset data-change="${i}"><label><input type="checkbox" checked> ${esc(t?.name)}</label><p>Current PIC: ${esc(t?.mainPIC)} · Deadline: ${esc(t?.deadline||'None')}</p><label>New PIC <select>${state.members.map(n=>`<option ${n===c.mainPIC?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label>New deadline <input type="date" value="${esc(c.deadline)}"></label><p>${esc(c.reason)}</p></fieldset>`;}).join('')+'<button id="wl-apply">Apply Selected Changes</button>';
    document.getElementById('wl-apply').onclick=()=>run(async()=>{const changes=[...el.querySelectorAll('[data-change]')].filter(x=>x.querySelector('[type=checkbox]').checked).map(x=>({...proposal.changes[Number(x.dataset.change)],mainPIC:x.querySelector('select').value,deadline:x.querySelector('[type=date]').value}));if(!changes.length)throw Error('Select at least one change.');await call('apply',{proposalId:proposal.id,changes});await refresh(state.week);status('Plan applied. Task assignments and deadlines updated.');});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
