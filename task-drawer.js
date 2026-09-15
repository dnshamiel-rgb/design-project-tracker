/* Read-only task detail drawer. Editing stays in the existing task form. */
(() => {
 let drawer, body, activeId, opener;
 const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const safeUrl = value => { try { const u=new URL(value);return ["https:","http:"].includes(u.protocol)?u.href:""; } catch(_){return "";} };
 function attachment(url,label,file=false) {
  const href=safeUrl(url);
  return href ? '<a class="drawer-attachment '+(file?'task-file-chip':'')+'" href="'+escape(href)+'" title="'+escape(label)+'" target="_blank" rel="noopener">'+(file?'📄 ':'🔗 ')+'<span class="'+(file?'task-file-chip__name':'')+'">'+escape(label)+'</span></a>' : '<p class="drawer-muted">File or link unavailable</p>';
 }
 function setup(){
  if(drawer)return;
  drawer=document.createElement("dialog");drawer.id="taskDetailDrawer";drawer.setAttribute("aria-labelledby","taskDetailTitle");
  drawer.innerHTML='<header class="task-detail-header"><span>TASK DETAILS</span><button type="button" aria-label="Close task details">×</button></header><div class="task-detail-body"></div>';
  document.body.append(drawer);body=drawer.querySelector(".task-detail-body");
  drawer.querySelector("button").onclick=()=>drawer.close();
  drawer.addEventListener("close",()=>{activeId=null;if(opener?.isConnected)opener.focus();});
  drawer.addEventListener("click",e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)drawer.close();}});
 }
 function render(task){
  const number=Number(task.progress||0), progress=Number.isFinite(number)?Math.min(100,Math.max(0,number)):0;
  const checklist=Array.isArray(task.subtasks)?task.subtasks:[];
  const done=checklist.filter(x=>x.done).length;
  const marking=task.lecturerMarking||{};
  const deadline=getDeadlineStatus(task);
  const evidence=[];
  if(task.fileName||task.fileUrl)evidence.push(attachment(task.fileUrl,task.fileName||"Attached file",true));
  if(task.attachment)evidence.push(attachment(task.attachment,"Attachment link"));
  (Array.isArray(task.links)?task.links:[]).forEach(x=>evidence.push(attachment(x.url,x.label||"Link")));
  const markingLabel=getMarkingInfo(marking.status||"not_reviewed").label;
  body.innerHTML='<h2 id="taskDetailTitle">'+escape(task.name||"Untitled task")+'</h2>'+
   '<p class="drawer-muted">'+escape(getTaskChapter(task))+(getTaskWorkPackage(task)?' · '+escape(getTaskWorkPackage(task)):'')+'</p>'+
   '<div class="drawer-status">'+escape(task.status||"Not Started")+'</div>'+
   '<div class="drawer-progress"><progress max="100" value="'+progress+'" aria-label="Task progress"></progress><strong>'+progress+'%</strong></div>'+
   '<dl class="drawer-facts"><div><dt>Main PIC</dt><dd>'+escape(task.mainPIC||"Unassigned")+'</dd></div><div><dt>Assigned to</dt><dd>'+escape((task.assigned||[]).join(", ")||"Unassigned")+'</dd></div><div><dt>Priority</dt><dd>'+escape(task.priority||"Not set")+'</dd></div><div><dt>Deadline</dt><dd>'+escape(task.deadline||"Not set")+'<small>'+escape(deadline.text)+'</small></dd></div></dl>'+
   '<section><h3>Checklist <span>'+done+'/'+checklist.length+'</span></h3>'+(checklist.length?'<ul class="drawer-checklist">'+checklist.map(x=>'<li><span aria-label="'+(x.done?'Completed':'Not completed')+'">'+(x.done?'✓':'○')+'</span><span class="'+(x.done?'drawer-check-done':'')+'">'+escape(x.text)+'</span></li>').join("")+'</ul>':'<p class="drawer-muted">No checklist items yet.</p>')+'</section>'+
   '<section><h3>Attachments</h3>'+(evidence.join("")||'<p class="drawer-muted">No attachments yet.</p>')+'</section>'+
   '<section><h3>Lecturer feedback</h3><strong>'+escape(markingLabel)+'</strong><p class="drawer-remarks">'+escape(marking.remarks||"No feedback yet.")+'</p>'+(marking.markedBy?'<p class="drawer-muted">Reviewed by '+escape(marking.markedBy)+'</p>':'')+'</section>'+
   (!isLecturer()?'<button type="button" class="drawer-edit">Edit task</button>':'');
  const edit=body.querySelector(".drawer-edit");
  if(edit)edit.onclick=()=>{if(isLecturer())return;const id=task.id;drawer.close();editTask(id);};
 }
 window.openTaskDetails=id=>{
  const task=tasks.find(x=>String(x.id)===String(id));if(!task)return;
  setup();activeId=id;opener=document.activeElement;render(task);
  if(!drawer.open)drawer.showModal();body.scrollTop=0;
 };
 window.refreshTaskDetails=()=>{
  if(!drawer?.open||activeId==null)return;
  const task=tasks.find(x=>String(x.id)===String(activeId));
  if(task)render(task);else drawer.close();
 };
})();
