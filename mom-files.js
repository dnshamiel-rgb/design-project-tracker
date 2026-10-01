/* PDF snapshots stored with each meeting; saving does not replace editable minutes. */
(() => {
let busy=false;
window.renderMomPdf = function(meeting) {
 const box=document.getElementById('momSavedPdf');box.replaceChildren();
 const file=meeting.mom?.pdf;
 const title=document.createElement('strong');title.textContent='Saved MOM PDF';box.append(title);
 const info=document.createElement('p');
 info.textContent=file ? 'Saved '+new Date(file.savedAt).toLocaleString()+' · '+(file.savedBy||'Team member')+'. This is a snapshot; save a new PDF after editing minutes.' : 'Save a PDF snapshot here to reopen it from this meeting.';
 box.append(info);
 if(file?.url && /^https:\/\//.test(file.url)) {const link=document.createElement('a');link.href=file.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open saved PDF ↗';box.append(link);}
 document.getElementById('momSavePdfBtn').hidden=isLecturer();
};
window.saveMomPdf = async function() {
 if(busy||isLecturer())return;
 if(!storage||!db||!auth?.currentUser){showToast('Sign in before saving a PDF.');return;}
 const meetingId=currentMomMeetingId,meeting=meetings.find(m=>m.id===meetingId);
 if(!meeting)return;
 const doc=exportMomPdf(true);if(!doc)return;
 const button=document.getElementById('momSavePdfBtn');
 const snapshot={summary:sanitizeText(document.getElementById('momSummary').value),roughNotes:document.getElementById('momRoughNotes').value,actionItems:JSON.parse(JSON.stringify(currentMomActionItems)),updatedBy:getCurrentUser()||'Unknown',updatedAt:new Date().toISOString()};
 const originalMom=JSON.stringify(meeting.mom||null);
 const filename=getMomPdfFilename(meeting);
 const ref=storage.ref().child('momFiles/'+meetingId+'/'+crypto.randomUUID()+'.pdf');
 busy=true;button.disabled=true;button.textContent='Saving PDF…';let uploaded=false,linked=false;
 try {
  await ref.put(doc.output('blob'),{contentType:'application/pdf',customMetadata:{meetingId:String(meetingId)}});uploaded=true;
  const pdf={url:await ref.getDownloadURL(),path:ref.fullPath,name:filename,savedAt:snapshot.updatedAt,savedBy:snapshot.updatedBy};
  const record=db.collection('trackerData').doc('meetings');
  await db.runTransaction(async tx=>{
   const data=await tx.get(record),list=data.data()?.list||[],index=list.findIndex(m=>m.id===meetingId);
   if(index<0)throw Error('Meeting no longer exists.');
   if(JSON.stringify(list[index].mom||null)!==originalMom)throw Error('Minutes changed in another session. Reopen the meeting before saving.');
   list[index]={...list[index],mom:{...list[index].mom,...snapshot,pdf}};
   tx.update(record,{list});
  });
  linked=true;meeting.mom={...meeting.mom,...snapshot,pdf};
  if(currentMomMeetingId===meetingId)renderMomPdf(meeting);
  showToast('Minutes and PDF saved to this meeting.');
 }catch(error){
  if(uploaded&&!linked)await ref.delete().catch(()=>{});
  showToast('PDF was not saved: '+error.message+'. You can still use Export PDF.');
 }finally{busy=false;button.disabled=false;button.textContent='Save PDF to MOM';}
};
})();
