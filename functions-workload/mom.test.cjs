const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function harness(body){
 const writes=[];let providerCalls=0;
 const db={doc:path=>({path,get:async()=>({data:()=>path==='trackerData/meetings'?{list:[{id:1,title:'Review',date:'2026-10-01'}]}:{}})}),runTransaction:async f=>f({get:async()=>({data:()=>({})}),set:(ref,data)=>writes.push(ref.path)})};
 const ctx={exports:{},AbortSignal,fetch:async()=>{providerCalls++;return {ok:true,json:async()=>body}},require:n=>n==='firebase-functions/v2/https'?{onCall:(_,f)=>f,HttpsError:class extends Error{constructor(code,msg){super(msg);this.code=code}}}:n==='firebase-functions/params'?{defineSecret:()=>({value:()=> 'test'})}:n==='firebase-admin/app'?{getApps:()=>[{}]}:n==='firebase-admin/firestore'?{getFirestore:()=>db}:require(n)};
 vm.runInNewContext(fs.readFileSync(__dirname+'/mom.js','utf8'),ctx);
 return {run:ctx.exports.generateMomDraft,writes,calls:()=>providerCalls};
}
const req=()=>({auth:{uid:'member',token:{email:'2023305361@student.uitm.edu.my'}},data:{meetingId:1,notes:'Check units. Shamiel to revise.',language:'English'}});
const response=(owner='Shamiel')=>({stop_reason:'tool_use',content:[{type:'tool_use',name:'submit_minutes',input:{summary:'Discussion: Units require review.',actions:[{text:'Check units',owner}]}}]});
test('rejects unauthenticated and nonmember users before provider call',async()=>{const h=harness(response());await assert.rejects(h.run({data:{}}),e=>e.code==='permission-denied');const r=req();r.auth.token.email='other@example.com';await assert.rejects(h.run(r),e=>e.code==='permission-denied');assert.equal(h.calls(),0)});
test('generation returns draft and writes only quota, never meetings/tasks',async()=>{const h=harness(response());const d=await h.run(req());assert.equal(d.actions[0].owner,'Shamiel');assert.deepEqual(h.writes,['momAiLimits/member']);});
test('rejects fabricated owner and truncated provider response',async()=>{for(const body of [response('Unknown person'),{...response(),stop_reason:'max_tokens'}]){await assert.rejects(harness(body).run(req()),e=>e.code==='unavailable')}});
test('rejects missing meeting and oversized notes without calling provider',async()=>{const h=harness(response());const r=req();r.data.meetingId=2;await assert.rejects(h.run(r),e=>e.code==='not-found');r.data.notes='x'.repeat(12001);await assert.rejects(h.run(r),e=>e.code==='invalid-argument');assert.equal(h.calls(),0)});
