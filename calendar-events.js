/* Shared course events remain separate from task deadlines. */
(() => {
'use strict';
window.courseEvents=[];let unsubscribe=null,uid=null,editing=null,original=null,view='month',returnFocus=null,authBound=false;
const categories={submission:'Official submission',assessment:'Presentation / assessment',briefing:'Briefing / class event',internal:'Internal target'};
const $=id=>document.getElementById(id);
const canEdit=()=>!!auth?.currentUser&&!isLecturer();
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
function status(text){$('ceStatus').textContent=text;}
window.courseEventClass=e=>'course-'+(Object.hasOwn(categories,e.category)?e.category:'briefing');
window.courseEventDetail=e=>(categories[e.category]||'Event')+' · '+(e.status==='official'?'Official':e.status==='confirmed'?'Confirmed':'Tentative')+' · '+(e.time?e.time+' MYT':'All day');
window.setupCourseEvents=function(){
 if(!db||!auth)return;
 if(!authBound){authBound=true;auth.onAuthStateChanged(()=>{if(!auth.currentUser){unsubscribe?.();unsubscribe=null;uid=null;window.courseEvents=[];dialog.close();}renderCalendar();});}
 if(uid!==auth.currentUser?.uid){
  unsubscribe?.();unsubscribe=null;window.courseEvents=[];uid=auth.currentUser?.uid||null;
  if(uid)unsubscribe=db.collection('trackerData').doc('calendarEvents').onSnapshot(s=>{window.courseEvents=Object.values(s.data()?.events||{});renderCalendar();},()=>{status('Events could not sync. Check connection or access.');});
 }
};
const dialog=document.createElement('dialog');dialog.id='courseEventDialog';dialog.setAttribute('aria-labelledby','ceTitle');
dialog.innerHTML=`<form id="ceForm"><header><h2 id="ceTitle">Add event</h2><button type="button" id="ceClose" aria-label="Close event">×</button></header><div class="ce-fields"><label>Title<input id="ceName" required maxlength="160"></label><div class="ce-pair"><label>Category<select id="ceCategory"><option value="submission">Official submission</option><option value="assessment">Presentation / assessment</option><option value="briefing">Briefing / class event</option><option value="internal">Internal target</option></select></label><label>Status<select id="ceState"><option value="tentative">Tentative</option><option value="official">Official</option><option value="confirmed">Confirmed</option></select></label></div><div class="ce-pair"><label>Date<input id="ceDate" type="date" required></label><label>Time (Malaysia)<input id="ceTime" type="time"></label></div><label class="ce-check"><input id="ceAllDay" type="checkbox" checked> All day</label><label>Location or meeting link<input id="ceLocation" maxlength="500"></label><label>Source / lesson plan reference<input id="ceSource" maxlength="1000" placeholder="Required for Official dates"></label><label>Notes<textarea id="ceNotes" rows="4" maxlength="5000"></textarea></label><p id="ceMeta"></p><p id="ceError" role="status"></p></div><footer><button type="button" id="ceDelete">Delete event</button><button type="button" id="ceCancel">Cancel</button><button type="submit" id="ceSave">Save event</button></footer></form>`;
document.body.append(dialog);
const close=()=>{dialog.close();returnFocus?.focus();};$('ceClose').onclick=close;$('ceCancel').onclick=close;
$('ceAllDay').onchange=()=>{$('ceTime').disabled=$('ceAllDay').checked||!canEdit();if($('ceAllDay').checked)$('ceTime').value='';};
$('ceCategory').onchange=()=>{const internal=$('ceCategory').value==='internal';$('ceState').querySelector('[value=official]').disabled=internal;if(internal&&$('ceState').value==='official')$('ceState').value='confirmed';};
window.openCourseEvent=function(id=null,date=calendarSelectedDate){
 const e=window.courseEvents.find(e=>e.id===id);editing=e?.id||null;original=e?JSON.stringify(e):null;returnFocus=document.activeElement;
 $('ceForm').reset();$('ceTitle').textContent=e?'Event details':'Add event';
 for(const [field,key] of [['ceName','title'],['ceDate','date'],['ceTime','time'],['ceLocation','location'],['ceSource','source'],['ceNotes','notes']])$(field).value=e?.[key]||'';
 $('ceDate').value=e?.date||date||formatDate(new Date());$('ceCategory').value=e?.category||'submission';$('ceState').value=e?.status||'tentative';$('ceAllDay').checked=!e?.time;
 dialog.querySelectorAll('input,select,textarea').forEach(n=>n.disabled=!canEdit());$('ceAllDay').onchange();$('ceCategory').onchange();
 $('ceSave').hidden=!canEdit();$('ceDelete').hidden=!canEdit()||!e;$('ceError').textContent='';
 $('ceMeta').textContent=e?'Last updated by '+(e.updatedBy||'Team')+' · '+new Date(e.updatedAt).toLocaleString():'';
 if(!dialog.open)dialog.showModal();
};
async function persist(remove=false){
 if(!canEdit())return;const id=editing||crypto.randomUUID();
 const category=$('ceCategory').value,state=$('ceState').value,date=$('ceDate').value;
 if(!remove&&(!validDate(date)||!$('ceName').value.trim()||(!$('ceAllDay').checked&&!/^([01]\d|2[0-3]):[0-5]\d$/.test($('ceTime').value))||(state==='official'&&!$('ceSource').value.trim())||(category==='internal'&&state==='official'))){$('ceError').textContent='Enter a title, valid date and source for Official dates. Internal targets cannot be Official.';return;}
 const entry={id,title:$('ceName').value.trim(),date,time:$('ceAllDay').checked?'':$('ceTime').value,category,status:state,location:$('ceLocation').value.trim(),source:$('ceSource').value.trim(),notes:$('ceNotes').value.trim(),updatedAt:new Date().toISOString(),updatedBy:getCurrentUser()||'Team'};
 const ref=db.collection('trackerData').doc('calendarEvents');$('ceSave').disabled=true;$('ceDelete').disabled=true;
 try{await db.runTransaction(async tx=>{const doc=await tx.get(ref),events={...(doc.data()?.events||{})};if(editing&&JSON.stringify(events[id]||null)!==original)throw Error('Event changed. Close and reopen it before editing.');if(remove)delete events[id];else events[id]=entry;tx.set(ref,{events});});close();showToast(remove?'Event deleted.':'Event saved.');}
 catch(e){$('ceError').textContent='Could not save: '+e.message;}
 finally{$('ceSave').disabled=false;$('ceDelete').disabled=false;}
}
$('ceForm').onsubmit=e=>{e.preventDefault();return persist();};$('ceDelete').onclick=()=>{if(confirm('Delete this calendar event?'))persist(true);};
window.renderCourseEventControls=function(){
 const controls=document.querySelector('#calendar .calendar-controls');if(!controls)return;
 let add=$('ceAdd');if(!add){add=el('button','+ Event');add.id='ceAdd';add.type='button';add.onclick=()=>openCourseEvent();controls.append(add);
 const toggle=el('button','Semester timeline');toggle.id='ceView';toggle.type='button';toggle.onclick=()=>{view=view==='month'?'timeline':'month';renderCalendar();};controls.append(toggle);
 const info=el('p','','ce-status');info.id='ceStatus';controls.parentElement.after(info);
 const legend=el('div','','ce-legend');Object.entries(categories).forEach(([key,label])=>legend.append(el('span',label,'course-'+key)));info.after(legend);
 const timeline=el('div');timeline.id='ceTimeline';document.querySelector('#calendar .calendar-layout').after(timeline);
 }
 add.hidden=!canEdit();$('ceView').textContent=view==='month'?'Semester timeline':'Month view';$('ceView').setAttribute('aria-pressed',String(view==='timeline'));
 document.querySelector('#calendar .calendar-layout').hidden=view!=='month';$('ceTimeline').hidden=view!=='timeline';
 const panel=$('calendarDayPanel');const create=el('button','+ Event on this date','ce-day-add');create.type='button';create.hidden=!canEdit();create.onclick=()=>openCourseEvent();panel.append(create);
 const timeline=$('ceTimeline');timeline.replaceChildren();timeline.append(el('p','All recorded course milestones and internal targets, ordered by date. Tasks and meetings remain in Month view.','ce-status'));
 const list=window.courseEvents.slice().sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
 if(!list.length)timeline.append(el('p','No course events yet. Add dates confirmed by your coordinator.','ce-status'));
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for(const e of list){const row=el('button','', 'ce-timeline-row '+courseEventClass(e));row.type='button';row.append(el('strong',e.title),el('span',e.date+' · '+courseEventDetail(e)));const days=Math.round((Date.parse(e.date)-Date.parse(today))/86400000);row.append(el('small',days===0?'Today':days>0?days+' days remaining':Math.abs(days)+' days ago'));if(e.source)row.append(el('small','Source: '+e.source));row.onclick=()=>openCourseEvent(e.id);timeline.append(row);}
};
})();
