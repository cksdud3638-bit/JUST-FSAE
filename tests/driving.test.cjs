const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {DR,formatTime}=require('../js/driving.js');
const lap=(id,sessionId,extra={})=>({id,sessionId,driver:'A',date:'2026-09-14',time:'1:23.456',sec:83.456,valid:'valid',...extra});
test('old numeric IDs and Firebase sparse objects retain exact links without merging same-date sessions',()=>{
 const logs={0:{id:1,date:'2026-09-14'},2:{id:2,date:'2026-09-14'}};
 const rows={0:lap(10,'1'),2:lap(11,2),3:lap(12,''),4:lap(13,'deleted')};
 assert.deepEqual(DR.scope(rows,'sessionId','1',logs).map(l=>l.id),[10]);
 assert.deepEqual(DR.scope(rows,'sessionId','unlinked',logs).map(l=>l.id),[12,13]);
 assert.equal(DR.scope(rows,'sessionId','all',logs).length,4);assert.equal(DR.scope(rows,'sessionId','all',logs,'B').length,0);
});
test('time parser rejects malformed seconds and zero; display rounds with minute carry',()=>{
 for(const time of ['1:60.000','0:00.000','oops','1:23.1234','-1:22','1:2'])assert.equal(DR.time(time),null);
 assert.equal(DR.time('1:23.4'),83.4);assert.equal(DR.time('00:01'),1);assert.equal(formatTime(59.9999),'1:00.000');assert.equal(formatTime(null),'—');
});
test('invalid-only laps never become valid best, average or chart candidates',()=>{
 const rows=[lap(1,1,{valid:'invalid',time:'0:01.000'}),lap(2,1,{time:'bad',sec:1}),lap(3,1)];
 assert.equal(DR.stats(rows).count,1);assert.equal(DR.stats(rows).best,83.456);assert.equal(DR.stats(rows.slice(0,2)).best,null);assert.equal(DR.stats([]).avg,null);
});
test('upsert preserves legacy fields, unrelated collections and existing records',()=>{
 const root={testLogs:[{id:1,custom:'keep'}],lapTimes:[lap(1,1,{legacy:'keep'}),lap(2,1)],feedbacks:[{id:9,testLogLink:1,overall:7,custom:'old'}],budget:{keep:true},compDate:'2026-09-30'};
 const before=JSON.stringify(root),next=DR.mutate(root,'lapTimes',lap(1,1,{time:'1:20.000',sec:80}),false,true);
 assert.equal(next.lapTimes[0].legacy,'keep');assert.equal(next.lapTimes[1].id,2);assert.deepEqual(next.feedbacks,root.feedbacks);assert.deepEqual(next.budget,root.budget);assert.equal(next.compDate,root.compDate);assert.equal(JSON.stringify(root),before);
});
test('deleting a session preserves children and exposes them in unlinked scope',()=>{
 const root={testLogs:[{id:1}],lapTimes:[lap(2,1)],feedbacks:[{id:3,testLogLink:'1',comment:'keep'}]};
 const next=DR.mutate(root,'testLogs',{id:'1'},true);assert.equal(next.testLogs.length,0);assert.deepEqual(next.feedbacks,root.feedbacks);assert.equal(DR.scope(next.lapTimes,'sessionId','unlinked',next.testLogs).length,1);
});
test('new missing links and concurrent deleted edits are rejected; old orphan fields remain editable',()=>{
 assert.throws(()=>DR.mutate({testLogs:[]},'lapTimes',lap(1,7)),/삭제/);
 assert.throws(()=>DR.mutate({testLogs:[]},'testLogs',{id:1},false,true),/삭제/);
 const old={testLogs:[],lapTimes:[lap(1,7)]};assert.equal(DR.mutate(old,'lapTimes',lap(1,7,{note:'updated'}),false,true).lapTimes[0].note,'updated');
});
test('lap-linked feedback requires matching driver and session; linked lap cannot silently move',()=>{
 const root={testLogs:[{id:1},{id:2}],lapTimes:[lap(1,1)]};
 assert.throws(()=>DR.mutate(root,'feedbacks',{id:3,lapId:1,testLogLink:2,driver:'A'}),/일치/);
 assert.throws(()=>DR.mutate(root,'feedbacks',{id:3,lapId:1,testLogLink:1,driver:'B'}),/일치/);
 const next=DR.mutate(root,'feedbacks',{id:3,lapId:1,testLogLink:1,driver:'A',comment:'good'});
 assert.throws(()=>DR.mutate(next,'lapTimes',lap(1,2),false,true),/먼저/);
 assert.equal(DR.mutate(next,'lapTimes',lap(1,1,{note:'safe edit'}),false,true).lapTimes[0].note,'safe edit');
});
test('retrying against a newer snapshot preserves another user record and does not duplicate IDs',()=>{
 const root={testLogs:[{id:1}],lapTimes:[lap(1,1)]},record=lap('new',1);
 const tentative=DR.mutate(root,'lapTimes',record);const concurrent=DR.mutate(root,'lapTimes',lap('other',1));
 const final=DR.mutate(concurrent,'lapTimes',record);assert.equal(final.lapTimes.length,3);assert.equal(DR.mutate(final,'lapTimes',record).lapTimes.length,3);assert.equal(tentative.lapTimes.length,2);
});
test('legacy records and nested setup/cooling fields survive JSON backup round trip',()=>{
 const root={testLogs:[{id:1,setup:{fride:0,unknown:'keep'},cooling:{oilLeak:true}}],lapTimes:[lap(2,'1',{sessionNum:'S1',tireSet:'A'})],feedbacks:[{id:3,testLogLink:'1',setupLink:4,handling:7,overall:8}],setupHistory:[{id:4,what:'spring'}]};
 const restored=JSON.parse(JSON.stringify(root));assert.deepEqual(restored,root);assert.equal(DR.scope(restored.feedbacks,'testLogLink','1',restored.testLogs).length,1);
});
test('failed remote save keeps state and editor input, and does not report success',async()=>{
 const messages=[],buttons=[{disabled:false}],S={testLogs:[{id:1}],lapTimes:[]};
 const c=vm.createContext({S,document:{querySelectorAll:()=>buttons},setText:(id,msg)=>messages.push(msg),db:{ref:()=>({transaction:async()=>{throw Error('offline')}})}});
 vm.runInContext(fs.readFileSync('js/driving.js','utf8'),c);vm.runInContext('driveReady=true',c);
 assert.equal(await vm.runInContext("driveCommit('testLogs',{id:2})",c),false);assert.equal(S.testLogs.length,1);assert.equal(buttons[0].disabled,false);assert.match(messages.at(-1),/저장 실패/);assert.equal(messages.some(s=>s==='저장했습니다.'),false);
});
test('legacy descending arrays render in chronological order without rewriting source',()=>{
 const rows=[{id:200,date:'2026-09-14'},{id:100,date:'2026-09-14'},{id:300,date:'2026-09-13'}];assert.deepEqual(DR.chronological(rows).map(r=>r.id),[300,100,200]);assert.equal(rows[0].id,200);
});
test('HTML has one driving tab, four subviews, retained form IDs and no duplicate IDs',()=>{
 const html=fs.readFileSync('index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const id of ['tab-driving','drive-log','drive-laps','drive-feedback','drive-compare','lt-session','fb-testlog-link','log-date','fb-lap-link'])assert.ok(ids.includes(id));
 assert.doesNotMatch(html,/data-tab="(?:laptime|testlog|feedback)"/);assert.doesNotMatch(html,/src="js\/(?:laptime|testlog|feedback)\.js"/);
});
