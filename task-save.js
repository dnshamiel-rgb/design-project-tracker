/* Task save acknowledgement and update attribution. */
(() => {
 let baseline=null, pending=null, busy=false;
 let noticeTimer=null, noticeVersion=0;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const strip=t=>Object.fromEntries(Object.entries(t||{}).filter(([k])=>!["updatedAt","updatedBy"].includes(k)));
 function diff(base,list){
  const before=new Map(base.map(t=>[String(t.id),t])), after=new Map(list.map(t=>[String(t.id),t]));
  const changes=[];
  for(const [id,t]of after){const old=before.get(id);if(!equal(strip(old),strip(t)))changes.push({id,old,next:t});}
  for(const [id,t]of before)if(!after.has(id))changes.push({id,old:t,next:null});
  return clone(changes);
 }
 function merge(latest,changes,who,when){
  const result=clone(latest);
  for(const change of changes){
   const index=result.findIndex(t=>String(t.id)===change.id), current=result[index];
   if(!change.next){
    if(current&&!equal(strip(current),strip(change.old)))throw Error("This task changed on another device. Reload and review before deleting.");
    if(index>=0)result.splice(index,1);continue;
   }
   if(!change.old){
    if(current){if(equal(strip(current),strip(change.next)))continue;throw Error("Task already exists with different changes.");}
    result.push({...change.next,updatedBy:who,updatedAt:when});continue;
   }
   if(!current)throw Error("This task was deleted on another device. Reload before saving.");
   const next={...current};
   for(const key of new Set([...Object.keys(strip(change.old)),...Object.keys(strip(change.next))])){
    if(equal(change.old[key],change.next[key]))continue;
    if(!equal(current[key],change.old[key])&&!equal(current[key],change.next[key]))throw Error("This task changed on another device. Reload and review your edits.");
    if(key in change.next)next[key]=change.next[key];else delete next[key];
   }
   result[index]={...next,updatedBy:who,updatedAt:when};
  }
  return result;
 }
 function status(state,message){
  clearTimeout(noticeTimer);
  const version=++noticeVersion;
  let bar=document.getElementById("taskSaveNotice");
  if(!bar){bar=document.createElement("div");bar.id="taskSaveNotice";bar.setAttribute("role","status");document.body.append(bar);}
  bar.style.removeProperty("display");
  bar.dataset.state=state;bar.replaceChildren();
  const text=document.createElement("span");text.textContent=message;bar.append(text);
  if(state==="failed"&&pending){
   const retry=document.createElement("button");retry.type="button";retry.textContent="Retry";
   retry.onclick=()=>attempt(pending);bar.append(retry);
  }
  const form=document.querySelector("#taskModal form");
  if(form){
   let label=document.getElementById("taskFormSaveNotice");
   if(!label){label=document.createElement("p");label.id="taskFormSaveNotice";label.setAttribute("role","status");form.append(label);}
   label.style.removeProperty("display");
   label.textContent=message;label.dataset.state=state;
  }
  if(state==="saved"){
   noticeTimer=setTimeout(()=>{
    if(version!==noticeVersion)return;
    bar.style.display="none";
    const label=document.getElementById("taskFormSaveNotice");
    if(label && label.dataset.state==="saved")label.style.display="none";
   },3000);
  }
 }
 async function attempt(batch){
  if(busy)return false;
  busy=true;pending=batch;status("saving","Saving tasks…");
  try{
   if(!db)throw Error("Storage is not connected.");
   if(navigator.onLine===false)throw Error("You are offline. Reconnect, then retry.");
   // Retrying under another signed-in user must not replay the previous user's draft.
   if((getCurrentUser()||"Unknown")!==batch.who)throw Error("Your sign-in changed. Reopen the task before saving.");
   const ref=db.collection("trackerData").doc("tasks");
   const saved=await db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    const list=snap.exists?snap.data().list||[]:[];
    const next=merge(list,batch.changes,batch.who,new Date().toISOString());
    tx.set(ref,{list:next},{merge:true});return next;
   });
   baseline=clone(saved);
   pending=null;
   status("saved","Saved to server");
   return true;
  }catch(error){status("failed","Save failed — "+error.message);return false;}
  finally{busy=false;}
 }
 window.observeSavedTasks=list=>{baseline=clone(list);};
 window.persistTaskChanges=list=>{
  if(busy){status("saving","A task save is still running. Please wait.");return Promise.resolve(false);}
  if(!baseline){status("failed","Tasks have not finished loading. Wait, then save again.");return Promise.resolve(false);}
  const changes=diff(baseline,list);
  if(!changes.length){status("saved","No unsaved task changes");return Promise.resolve(true);}
  return attempt({changes,who:getCurrentUser()||"Unknown"});
 };
 window.taskUpdateLabel=task=>{
  if(!task.updatedAt||!task.updatedBy)return "";
  const date=new Date(task.updatedAt);if(isNaN(date.getTime()))return "";
  const minutes=Math.max(0,Math.floor((Date.now()-date.getTime())/60000));
  const ago=minutes<1?"just now":minutes<60?minutes+" min ago":minutes<1440?Math.floor(minutes/60)+" h ago":Math.floor(minutes/1440)+" d ago";
  return "Updated by "+task.updatedBy+" · "+ago;
 };
})();
