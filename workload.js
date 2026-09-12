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
    day.insertAdjacentHTML('beforeend', `<div id="wl-check" class="panel wl hidden"><div class="wl-header"><div><span class="wl-eyebrow">UPDATE UNTUK LEADER</span><h3>Macam mana kerja awak?</h3><p>Pilih status task awak. Tak perlu kira jam.</p></div><details class="wl-week-picker"><summary id="wl-week-label">Minggu ini</summary><label>Minggu bermula Isnin<input id="wl-week" type="date"></label><button id="wl-load" class="wl-secondary">Lihat minggu</button></details></div><p class="wl-status" role="status"></p><div id="wl-form"></div></div>`);
    hub.insertAdjacentHTML('afterbegin',`<div id="wl-leader" class="panel wl hidden"><div class="wl-header"><div><span class="wl-eyebrow">LEADER WORKSPACE <span>PRIVATE</span></span><h3>Plan the week.</h3><p>AI Team Review · Task risks, help requests and the next step.</p></div><div class="wl-week-controls"><label>Week starting Monday<input id="wl-leader-week" type="date"></label><button id="wl-refresh" class="wl-secondary" title="Refresh workload">Refresh</button></div></div><div class="wl-section-label">TEAM UPDATES <span id="wl-check-count"></span></div><div id="wl-capacity" class="wl-members"></div><div class="wl-target-box"><label for="wl-target"><span class="wl-eyebrow">THIS WEEK’S TARGET</span><span class="wl-target-title">What should the team finish?</span></label><div class="wl-target-row"><textarea id="wl-target" maxlength="600" placeholder="e.g. Chapter 4 ready for supervisor review by Friday"></textarea><button id="wl-analyse">Analyse &amp; Draft Plan <span aria-hidden="true">↗</span></button></div><p>Review the AI draft before making changes to tasks.</p></div><p class="wl-status" role="status"></p><div id="wl-proposal"></div></div>`);
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
    renderQuickForm();
    if(state.leader) {
      let updatedMembers=0;
      document.getElementById('wl-capacity').innerHTML=state.members.map(m=>{
        const own=state.tasks.filter(t=>t.mainPIC===m||(t.assigned||[]).includes(m));
        const entries=state.checkins.find(c=>c.name===m)?.quickEntries||[];
        const reports=own.map(t=>entries.find(e=>e.taskId===String(t.id)&&e.deadline===(t.deadline||'')));
        const counts={on_track:0,more_time:0,help:0,not_updated:0};reports.forEach(e=>counts[e?.state||'not_updated']++);
        if(reports.some(Boolean))updatedMembers++;
        const tone=counts.help?'over':counts.more_time?'full':counts.not_updated?'unknown':'available';
        return `<article class="wl-member wl-${tone}"><div class="wl-member-top"><span class="wl-avatar">${esc(m.slice(0,1))}</span><strong>${esc(m)}</strong></div><div class="wl-report-counts"><span>${counts.on_track} On track</span><span>${counts.more_time} Perlu masa</span><span>${counts.help} Perlu bantuan</span><span>${counts.not_updated} Belum update</span></div>${own.length?`<details class="wl-task-reports"><summary>Lihat ${own.length} task</summary>${own.map((t,i)=>{const e=reports[i];return `<div><strong>${esc(t.name)}</strong><p>${esc(statusLabel(e?.state))}${e?.expectedDate?' · Jangka siap '+esc(e.expectedDate):''}${e?.reason?' · '+esc(reasonLabel(e.reason)):''}</p>${e?.updatedAt?`<small>Update: ${esc(new Date(e.updatedAt).toLocaleString())}</small>`:''}</div>`;}).join('')}</details>`:'<small>Tiada task aktif</small>'}</article>`;
      }).join('');
      document.getElementById('wl-check-count').textContent=`${updatedMembers} / ${state.members.length} ahli ada update`;
    }
    status('Minggu '+w+' · Task tanpa update tidak dianggap on track.');
  }
  const statusLabel=value=>({on_track:'On track',more_time:'Perlu masa lagi',help:'Perlu bantuan'}[value]||'Belum update');
  const reasonLabel=value=>({waiting_data:'Tunggu data',unclear:'Tak faham / perlukan panduan',too_much_work:'Kerja terlalu banyak'}[value]||'');
  function renderQuickForm(){
    const own=state.tasks.filter(t=>t.mainPIC===state.name||(t.assigned||[]).includes(state.name));
    const entries=state.checkins.find(c=>c.name===state.name)?.quickEntries||[];
    document.getElementById('wl-week-label').textContent='Minggu '+state.week;
    const box=document.getElementById('wl-form');
    if(!own.length){box.innerHTML='<div class="wl-empty-plan"><div><strong>Tiada task aktif untuk awak</strong><p>Task yang diberikan kepada awak akan muncul di sini.</p></div></div>';return;}
    box.innerHTML=`<div class="wl-quick-toolbar"><p>${own.length} task · Pilih status, kemudian simpan.</p><button type="button" id="wl-all-track" class="wl-secondary">✓ Semua task saya on track</button></div><form id="wl-quick-form">${own.map((t,i)=>{
      const e=entries.find(e=>e.taskId===String(t.id)&&e.deadline===(t.deadline||''));
      return `<fieldset class="wl-quick-task" data-task="${esc(t.id)}"><legend>${esc(t.name)}</legend><p class="wl-task-deadline">Deadline: <strong>${esc(t.deadline||'Belum ditetapkan')}</strong>${e?.updatedAt?' · Disimpan '+esc(new Date(e.updatedAt).toLocaleString()):' · Belum update'}</p><div class="wl-options">${[['on_track','✓','On track','Boleh siap ikut deadline'],['more_time','◷','Perlu masa lagi','Pilih jangkaan tarikh siap'],['help','!','Perlu bantuan','Beritahu apa yang menghalang']].map(([v,icon,title,desc])=>`<label class="wl-option"><input type="radio" name="task-${i}" value="${v}" ${e?.state===v?'checked':''}><span><b>${icon} ${title}</b><small>${desc}</small></span></label>`).join('')}</div><label class="wl-extra wl-date ${e?.state==='more_time'?'':'hidden'}">Bila awak jangka boleh siap?<input type="date" name="expectedDate" value="${esc(e?.expectedDate||'')}" ${e?.state==='more_time'?'required':''}></label><label class="wl-extra wl-reason ${e?.state==='help'?'':'hidden'}">Apa yang menghalang?<select name="reason" ${e?.state==='help'?'required':''}><option value="">Pilih sebab</option>${['waiting_data','unclear','too_much_work'].map(v=>`<option value="${v}" ${e?.reason===v?'selected':''}>${reasonLabel(v)}</option>`).join('')}</select></label></fieldset>`;
    }).join('')}<div class="wl-quick-footer"><p>Update ini untuk semakan leader. Deadline task tidak berubah secara automatik.</p><button type="submit">Simpan Update</button></div></form>`;
    const form=document.getElementById('wl-quick-form');
    function fields(f){const v=f.querySelector('input[type=radio]:checked')?.value;f.querySelector('.wl-date').classList.toggle('hidden',v!=='more_time');f.querySelector('.wl-reason').classList.toggle('hidden',v!=='help');f.querySelector('[name=expectedDate]').required=v==='more_time';f.querySelector('[name=reason]').required=v==='help';}
    form.onchange=e=>{const f=e.target.closest('fieldset');if(f)fields(f);};
    document.getElementById('wl-all-track').onclick=()=>{form.querySelectorAll('fieldset').forEach(f=>{f.querySelector('[value=on_track]').checked=true;fields(f);});status('Semua dipilih On track. Tekan Simpan Update untuk sahkan.');};
    form.onsubmit=e=>{e.preventDefault();run(async()=>{
      const entries=[...form.querySelectorAll('fieldset')].map(f=>({taskId:f.dataset.task,state:f.querySelector('input[type=radio]:checked')?.value,expectedDate:f.querySelector('[name=expectedDate]').value,reason:f.querySelector('[name=reason]').value})).filter(e=>e.state);
      if(!entries.length)throw Error('Pilih status untuk sekurang-kurangnya satu task.');
      await call('quickUpdate',{week:state.week,entries});await refresh(state.week);status('Update disimpan. Leader boleh semak sekarang.');
    });};
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
    if(!proposal.changes.length){el.insertAdjacentHTML('beforeend','<div class="wl-empty-plan"><span aria-hidden="true">✓</span><div><strong>No task changes proposed</strong><p>Review the brief above. Add or update task reports, then analyse again when ready.</p></div></div>');return;}
    el.insertAdjacentHTML('beforeend','<div class="wl-changes-head"><h4>Proposed changes</h4><p>Select the changes you want to apply. Existing collaborators stay assigned.</p></div>'+proposal.changes.map((c,i)=>{const t=state.tasks.find(t=>String(t.id)===c.taskId);return `<fieldset data-change="${i}"><label><input type="checkbox" checked> ${esc(t?.name)}</label><p>Current PIC: ${esc(t?.mainPIC)} · Deadline: ${esc(t?.deadline||'None')}</p><label>New PIC <select>${state.members.map(n=>`<option ${n===c.mainPIC?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label>New deadline <input type="date" value="${esc(c.deadline)}"></label><p>${esc(c.reason)}</p></fieldset>`;}).join('')+'<button id="wl-apply">Apply Selected Changes</button>');
    document.getElementById('wl-apply').onclick=()=>run(async()=>{const changes=[...el.querySelectorAll('[data-change]')].filter(x=>x.querySelector('[type=checkbox]').checked).map(x=>({...proposal.changes[Number(x.dataset.change)],mainPIC:x.querySelector('select').value,deadline:x.querySelector('[type=date]').value}));if(!changes.length)throw Error('Select at least one change.');await call('apply',{proposalId:proposal.id,changes});await refresh(state.week);status('Plan applied. Task assignments and deadlines updated.');});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
