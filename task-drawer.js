/* Read-only task detail drawer. Editing stays in the existing task form. */
(() => {
 let drawer, body, activeId, opener;
 const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const safeUrl = value => { try { const u=new URL(value);return ["https:","http:"].includes(u.protocol)?u.href:""; } catch(_){return "";} };
 function attachment(url,label,file=false) {
  const href=safeUrl(url);
  return href ? '<a class="drawer-attachment '+(file?'task-file-chip':'')+'" href="'+escape(href)+'" title="'+escape(label)+'" target="_blank" rel="noopener">'+'<span class="drawer-file-icon" aria-hidden="true">'+(file?(/\.docx?$/i.test(label)?'W':'FILE'):'↗')+'</span><span class="drawer-file-info"><span class="'+(file?'task-file-chip__name':'')+'">'+escape(label)+'</span><small>'+(file?'Click to preview':'Open link')+'</small></span></a>' : '<p class="drawer-muted">File or link unavailable</p>';
 }
 function setup(){
  if(drawer)return;
  drawer=document.createElement("dialog");drawer.id="taskDetailDrawer";drawer.setAttribute("aria-labelledby","taskDetailTitle");
  drawer.innerHTML='<header class="task-detail-header"><div class="drawer-heading"><small>TASK DETAILS</small><h2 id="taskDetailTitle"></h2><p class="drawer-chapter"></p></div><button type="button" aria-label="Close task details">×</button></header><div class="task-detail-body"></div><footer class="task-detail-footer"></footer>';
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
  drawer.querySelector("#taskDetailTitle").textContent=task.name||"Untitled task";
  drawer.querySelector(".drawer-chapter").textContent=getTaskChapter(task)+(getTaskWorkPackage(task)?" · "+getTaskWorkPackage(task):"");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(task.deadline||"") ? new Date(task.deadline+"T12:00:00") : null;
  const dateLabel=date && !isNaN(date.getTime()) ? date.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : task.deadline||"Not set";
  body.innerHTML=(window.taskUpdateLabel(task)?'<p class="drawer-muted task-updated-label" title="'+escape(new Date(task.updatedAt).toLocaleString())+'">'+escape(window.taskUpdateLabel(task))+'</p>':'') +

   '<div class="drawer-progress-heading"><span class="drawer-status '+(task.status==="Done"?'is-done':'')+'">'+escape(task.status||"Not Started")+'</span><strong>'+progress+'%</strong></div>'+
   '<div class="drawer-progress"><progress max="100" value="'+progress+'" aria-label="Task progress"></progress></div>'+
   '<dl class="drawer-facts"><div><dt>Main PIC</dt><dd>'+escape(task.mainPIC||"Unassigned")+'</dd></div><div><dt>Assigned to</dt><dd>'+escape((task.assigned||[]).join(", ")||"Unassigned")+'</dd></div><div><dt>Priority</dt><dd>'+escape(task.priority||"Not set")+'</dd></div><div><dt>Deadline</dt><dd>'+escape(dateLabel)+'<small>'+escape(deadline.text)+'</small></dd></div></dl>'+
   '<section class="'+(checklist.length?'':'drawer-empty-row')+'"><h3>Checklist'+(checklist.length?' <span>'+done+'/'+checklist.length+'</span>':'')+'</h3>'+(checklist.length?'<ul class="drawer-checklist">'+checklist.map(x=>'<li><span aria-label="'+(x.done?'Completed':'Not completed')+'">'+(x.done?'✓':'○')+'</span><span class="'+(x.done?'drawer-check-done':'')+'">'+escape(x.text)+'</span></li>').join("")+'</ul>':'<p class="drawer-muted">No items yet</p>')+'</section>'+
   '<section><h3>Attachments</h3>'+(evidence.join("")||'<p class="drawer-muted">No attachments yet.</p>')+'</section>'+
   '<section><div class="drawer-feedback-heading"><h3>Lecturer feedback</h3><span class="drawer-review-badge '+(marking.status==="approved"?'is-approved':'')+'">'+escape(markingLabel)+'</span></div>'+(marking.remarks?'<p class="drawer-remarks">'+escape(marking.remarks)+'</p>':'')+(marking.markedBy?'<p class="drawer-muted">Reviewed by '+escape(marking.markedBy)+'</p>':'')+'</section>';
  const footer=drawer.querySelector('.task-detail-footer');
  footer.hidden=isLecturer();
  footer.innerHTML=(!isLecturer()?'<button type="button" class="drawer-edit">Edit task</button>':'');
  const edit=footer.querySelector(".drawer-edit");
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
