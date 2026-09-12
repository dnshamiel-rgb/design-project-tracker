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
    hub.insertAdjacentHTML('afterbegin',`<div id="wl-leader" class="panel wl hidden"><div class="wl-header"><div><span class="wl-eyebrow">LEADER WORKSPACE <span>PRIVATE</span></span><h3>Plan the week.</h3><p>AI Workload Planner · A clearer view of your team’s capacity.</p></div><div class="wl-week-controls"><label>Week starting Monday<input id="wl-leader-week" type="date"></label><button id="wl-refresh" class="wl-secondary" title="Refresh workload">Refresh</button></div></div><div class="wl-section-label">TEAM CAPACITY <span id="wl-check-count"></span></div><div id="wl-capacity" class="wl-members"></div><div class="wl-target-box"><label for="wl-target"><span class="wl-eyebrow">THIS WEEK’S TARGET</span><span class="wl-target-title">What should the team finish?</span></label><div class="wl-target-row"><textarea id="wl-target" maxlength="600" placeholder="e.g. Chapter 4 ready for supervisor review by Friday"></textarea><button id="wl-analyse">Analyse &amp; Draft Plan <span aria-hidden="true">↗</span></button></div><p>Review the AI draft before making changes to tasks.</p></div><p class="wl-status" role="status"></p><div id="wl-proposal"></div></div>`);
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
    if(state.leader) {
      document.getElementById('wl-check-count').textContent=`${state.members.filter(m=>state.checkins.some(c=>c.name===m)).length} / ${state.members.length} checked in`;
      document.getElementById('wl-capacity').innerHTML=state.members.map(m=>{
        const c=state.checkins.find(x=>x.name===m);
        const own=state.tasks.filter(t=>t.mainPIC===m||(t.assigned||[]).includes(m));
        const h=c?c.entries.filter(e=>own.some(t=>String(t.id)===e.taskId)).reduce((sum,e)=>sum+e.hours,0):0;
        const missing=c?own.filter(t=>!c.entries.some(e=>e.taskId===String(t.id))).length:own.length;
        const tone=!c||missing?'unknown':h>c.capacity?'over':h===c.capacity?'full':'available';
        const label=!c?'Awaiting check-in':missing?`${missing} estimates missing`:h>c.capacity?`Over by ${h-c.capacity} h`:h===c.capacity?'At capacity':`${c.capacity-h} h available`;
        const percent=c?(c.capacity?Math.min(100,h/c.capacity*100):h?100:0):0;
        return `<article class="wl-member wl-${tone}"><div class="wl-member-top"><span class="wl-avatar">${esc(m.slice(0,1))}</span><strong>${esc(m)}</strong></div><div class="wl-hours">${c?h:'—'}<span>${c?` / ${c.capacity} h`:' / — h'}</span></div><div class="wl-meter" aria-hidden="true"><span style="width:${percent}%"></span></div><div class="wl-member-status">${esc(label)}</div><small>${own.length} active task${own.length===1?'':'s'} · ${c?'planned / available':'Capacity unknown'}</small></article>`;
      }).join('');
    }
    status('Loaded week '+w+'. Missing check-ins are unknown capacity.');
  }
  function renderProposal(){
    const el=document.getElementById('wl-proposal');
    el.innerHTML='<div class="wl-analysis-head"><div><span class="wl-eyebrow">AI BRIEF</span><h4>Where do I need to step in?</h4></div><span class="wl-draft-badge">Draft · For your review</span></div><div class="wl-insights">'+proposal.brief.map((b,i)=>{
      const text=String(b),cut=text.search(/[.!?](?:\s|$)/);
      const first=cut>=0?text.slice(0,cut+1):text;
      const compact=first.length>180?first.slice(0,177)+'…':first;
      const more=compact!==text;
      return `<article class="wl-insight"><span class="wl-insight-number">0${i+1}</span><h5>Review point ${i+1}</h5><p>${esc(compact)}</p>${more?`<details><summary>Read full analysis</summary><p>${esc(text)}</p></details>`:''}</article>`;
    }).join('')+'</div>';
    if(!proposal.changes.length){el.insertAdjacentHTML('beforeend','<div class="wl-empty-plan"><span aria-hidden="true">✓</span><div><strong>No task changes proposed</strong><p>Review the brief above. Add or update check-ins, then analyse again when ready.</p></div></div>');return;}
    el.insertAdjacentHTML('beforeend','<div class="wl-changes-head"><h4>Proposed changes</h4><p>Select the changes you want to apply. Existing collaborators stay assigned.</p></div>'+proposal.changes.map((c,i)=>{const t=state.tasks.find(t=>String(t.id)===c.taskId);return `<fieldset data-change="${i}"><label><input type="checkbox" checked> ${esc(t?.name)}</label><p>Current PIC: ${esc(t?.mainPIC)} · Deadline: ${esc(t?.deadline||'None')}</p><label>New PIC <select>${state.members.map(n=>`<option ${n===c.mainPIC?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label>New deadline <input type="date" value="${esc(c.deadline)}"></label><p>${esc(c.reason)}</p></fieldset>`;}).join('')+'<button id="wl-apply">Apply Selected Changes</button>');
    document.getElementById('wl-apply').onclick=()=>run(async()=>{const changes=[...el.querySelectorAll('[data-change]')].filter(x=>x.querySelector('[type=checkbox]').checked).map(x=>({...proposal.changes[Number(x.dataset.change)],mainPIC:x.querySelector('select').value,deadline:x.querySelector('[type=date]').value}));if(!changes.length)throw Error('Select at least one change.');await call('apply',{proposalId:proposal.id,changes});await refresh(state.week);status('Plan applied. Task assignments and deadlines updated.');});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
