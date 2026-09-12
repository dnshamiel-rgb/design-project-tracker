const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const context={exports:{},require:n=>n==='firebase-functions/v2/https'?{onCall:(_,f)=>f,HttpsError:class extends Error{constructor(c,m){super(m);this.code=c;}}}:n==='firebase-functions/params'?{defineSecret:()=>({}),defineString:()=>({})}:n==='firebase-admin'?{apps:[1],firestore:()=>({})}:require(n)};
vm.runInNewContext(fs.readFileSync(__dirname+'/index.js','utf8'),context);
const v=context.exports._test;
test('week validation rejects invalid dates and non Mondays',()=>{assert.equal(v.week('2026-09-14'),'2026-09-14');for(const x of ['2026-09-15','2026-02-30','bad'])assert.throws(()=>v.week(x));});
test('capacity zero valid, missing and impossible hours invalid',()=>{assert.equal(v.hours(0,168),0);for(const x of [undefined,null,-1,169,NaN,'8'])assert.throws(()=>v.hours(x,168));});
test('changes reject duplicate, missing and completed tasks or unknown owners',()=>{const tasks=[{id:1,status:'In Progress'},{id:2,status:'Done'}];const c={taskId:'1',mainPIC:'Shamiel',deadline:'2026-09-18'};assert.equal(v.validateChanges([c],tasks).length,1);for(const changes of [[c,c],[{...c,taskId:'2'}],[{...c,taskId:'3'}],[{...c,mainPIC:'Other'}],[{...c,deadline:'tomorrow'}]])assert.throws(()=>v.validateChanges(changes,tasks));});
test('member cannot invoke leader actions; lecturer rejected',async()=>{const f=context.exports.workloadPlanner;await assert.rejects(f({auth:{token:{email:'2023126973@student.uitm.edu.my'}},data:{action:'apply'}}),e=>e.code==='permission-denied');await assert.rejects(f({auth:{token:{email:'lecturer@example.com'}},data:{action:'read'}}),e=>e.code==='permission-denied');});
test('Anthropic integration creates a private draft without changing tasks',async()=>{
 const writes=[];
 const db={doc:path=>({get:async()=>({data:()=>path==='trackerData/tasks'?{list:[{id:1,name:'Sizing',mainPIC:'Shamiel',status:'In Progress'}]}:undefined}),set:async data=>writes.push({path,data})}),collection:()=>({where:()=>({get:async()=>({docs:[]})})}),runTransaction:async f=>f({get:async()=>({data:()=>undefined}),set:()=>{}})};
 const ctx={exports:{},AbortSignal,fetch:async(url,opts)=>{assert.equal(url,'https://api.anthropic.com/v1/messages');const b=JSON.parse(opts.body);assert.equal(b.model,'claude-haiku-4-5-20251001');assert.equal(typeof b.system,'string');assert.equal(b.messages.length,1);return {ok:true,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify({brief:['Check-in required before assessing capacity.'],changes:[]})}]})};},require:n=>n==='firebase-functions/v2/https'?{onCall:(_,f)=>f,HttpsError:class extends Error{constructor(c,m){super(m);this.code=c;}}}:n==='firebase-functions/params'?{defineSecret:()=>({value:()=> 'test-only'})}:n==='firebase-admin'?{apps:[1],firestore:()=>db}:require(n)};
 vm.runInNewContext(fs.readFileSync(__dirname+'/index.js','utf8'),ctx);
 const result=await ctx.exports.workloadPlanner({auth:{uid:'leader',token:{email:'2023305361@student.uitm.edu.my'}},data:{action:'analyse',week:'2026-09-14',target:'Finish sizing'}});
 assert.equal(result.brief.length,1);assert.equal(writes.length,1);assert.match(writes[0].path,/^workloadPrivate\//);
});
