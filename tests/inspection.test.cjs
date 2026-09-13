const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {competitionDay}=require('../js/competition-date.js');
function context(extra={}) {
 const c=vm.createContext({S:{inspection:{},inspectionReview:{}},document:{getElementById:()=>null},setText(){},setWidth(){},renderCompetitionDate(){},renderHome(){},alert(){},...extra});
 vm.runInContext(fs.readFileSync('js/inspection.js','utf8'),c);return c;
}
test('C-Formula audit preserves every legacy ID and excludes electric-only rules',()=>{
 const c=context(),data=vm.runInContext('INSP_DATA',c),items=data.flatMap(c=>c.items);
 const groups={vc:5,wt:6,su:8,st:7,br:18,jk:7,fr:23,ia:10,si:5,dp:7,fw:10,es:8,fe:4,bv:3,pt:17,ex:9,fl:16,sb:17,dr:9,ds:4,ae:6};
 for(const [prefix,count] of Object.entries(groups))for(let i=1;i<=count;i++)assert.ok(items.some(it=>it.id===prefix+String(i).padStart(2,'0')));
 assert.equal(items.length,303);assert.equal(new Set(items.map(i=>i.id)).size,303);
 assert.equal(new Set(data.map(c=>vm.runInContext(`slugify(${JSON.stringify(c.cat)})`,context()))).size,data.length);
 for(const it of items){assert.doesNotMatch(it.name,/E-Formula|TSAL|IMD|고전압|구동시스템|절연.*퀵/);for(const match of it.ref.matchAll(/제(\d+)조/g))assert.ok(Number(match[1])<=36||Number(match[1])>=69,it.ref);}
 assert.ok(items.filter(i=>i.id.startsWith('et')).every(i=>i.condition==='전자식 스로틀(ETC) 사용 시'));
});
test('critical corrections and mandatory omissions have precise references',()=>{
 const items=vm.runInContext('INSP_DATA.flatMap(c=>c.items)',context()),by=id=>items.find(i=>i.id===id);
 assert.match(by('br13').name,/주 비상정지 스위치를 제외/);assert.match(by('ae03').ref,/제73조/);assert.doesNotMatch(by('ae03').name,/75mm/);
 assert.match(by('sb11').name,/60~80/);assert.match(by('sb14').name,/200mm/);assert.match(by('fa02').name,/2피치/);
 for(const id of ['op01','op02','op03','fa01','fa05','et18','am15','fl26'])assert.ok(by(id));
 assert.equal(by('br17').ref,'팀 자체 점검');assert.equal(by('br13').review,'2026-09-C');
});
test('old pass on corrected rule is pending without modifying the saved record',()=>{
 const c=context();vm.runInContext("S.inspection={br13:'pass',vc01:'pass'}",c);
 assert.equal(vm.runInContext("inspectionState(INSP_DATA.flatMap(c=>c.items).find(i=>i.id==='br13'))",c),'pending');
 assert.equal(vm.runInContext('S.inspection.br13',c),'pass');
 vm.runInContext("S.inspectionReview.br13='2026-09-C'",c);assert.equal(vm.runInContext('inspectionStats().pass',c),2);
});
test('not applicable only applies to conditional rules and is excluded from denominator',()=>{
 const c=context();vm.runInContext("S.inspection={et01:'na',vc01:'pass'}",c);
 assert.equal(vm.runInContext('inspectionStats().applicable',c),302);assert.equal(vm.runInContext('inspectionStats().na',c),1);
 vm.runInContext("S.inspection.vc01='na'",c);assert.equal(vm.runInContext('inspectionStats().pending',c),1);
});
test('reconfirming corrected pass persists revision atomically and preserves unrelated items',async()=>{
 const writes=[],c=context({db:{ref:()=>({update:async x=>writes.push(x)})}});
 vm.runInContext("S.inspection={br13:'pass',vc01:'pass'}",c);
 await vm.runInContext("setInsp('br13','pass')",c);
 assert.equal(writes[0]['inspection/br13'],'pass');assert.equal(writes[0]['inspectionReview/br13'],'2026-09-C');assert.equal(vm.runInContext('S.inspection.vc01',c),'pass');
 await vm.runInContext("setInsp('br13','pass')",c);assert.equal(writes[1]['inspection/br13'],null);
});
test('failed inspection save preserves prior state',async()=>{
 const c=context({db:{ref:()=>({update:async()=>{throw Error('offline')}})}});vm.runInContext("S.inspection.vc01='pass'",c);
 await vm.runInContext("setInsp('vc01','fail')",c);assert.equal(vm.runInContext('S.inspection.vc01',c),'pass');
});
test('D-Day uses Korean calendar, exact day, prior day and leap year',()=>{
 assert.equal(competitionDay('2026-09-13',new Date('2026-09-12T14:59:59Z')).text,'D-1');
 assert.equal(competitionDay('2026-09-13',new Date('2026-09-12T15:00:00Z')).text,'D-Day');
 assert.equal(competitionDay('2026-09-13',new Date('2026-09-13T15:00:00Z')).text,'D+1');
 assert.equal(competitionDay('2028-03-01',new Date('2028-02-28T15:00:00Z')).days,1);
 for(const d of ['',null,'bad','2026-02-29','2026-13-01','2026-04-31'])assert.equal(competitionDay(d),null);
});
test('date save and clear share one path, reject invalid and handle failures',async()=>{
 const writes=[],c=vm.createContext({S:{},document:{getElementById:()=>null},setText(){},renderReport(){},db:{ref:path=>({set:async val=>writes.push({path,val})})}});
 vm.runInContext(fs.readFileSync('js/competition-date.js','utf8'),c);
 assert.equal(await vm.runInContext("saveCompetitionDate('2026-09-30')",c),true);assert.equal(writes[0].path,'just/compDate');assert.equal(vm.runInContext('S.compDate',c),'2026-09-30');
 assert.equal(await vm.runInContext("saveCompetitionDate('2026-02-30')",c),false);assert.equal(writes.length,1);
 await vm.runInContext("saveCompetitionDate('')",c);assert.equal(vm.runInContext('S.compDate',c),'');
 c.db={ref:()=>({set:async()=>{throw Error('offline')}})};assert.equal(await vm.runInContext("saveCompetitionDate('2026-09-30')",c),false);assert.equal(vm.runInContext('S.compDate',c),'');
});

test('unrelated sync preserves unsaved date; explicit save synchronizes both inputs',()=>{
 const inputs={'home-comp-date':{value:'2026-10-01'},'comp-date':{value:'2026-09-30'}};
 const c=vm.createContext({S:{compDate:'2026-09-30'},document:{getElementById:id=>inputs[id]},setText(){}});
 vm.runInContext(fs.readFileSync('js/competition-date.js','utf8'),c);
 vm.runInContext("receiveCompetitionDate('2026-09-30')",c);assert.equal(inputs['home-comp-date'].value,'2026-10-01');
 vm.runInContext("receiveCompetitionDate('',true)",c);assert.equal(inputs['home-comp-date'].value,'');assert.equal(inputs['comp-date'].value,'');
});

test('print report and CSV use reviewed status and exclude not-applicable from rate',async()=>{
 let html='',blob;const c=context({S:{inspection:{br13:'pass',et01:'na'},inspectionReview:{},compDate:'2026-09-30'},
 document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({click(){}})},
 competitionDay,Blob,URL:{createObjectURL:b=>{blob=b;return 'blob:test'}},
 window:{open:()=>({document:{open(){},write:s=>html=s,close(){}}})}});
 vm.runInContext('exportInspectionPDF();exportInspection()',c);
 assert.match(html,/2026 C-Formula/);assert.match(html,/전체 303 · 해당없음 1 · 적용 302/);assert.match(html,/확인중 항목 \(1\)/);
 const csv=await blob.text();assert.match(csv,/"br13"[^\n]+"pending","pass",""/);assert.match(csv,/"et01"[^\n]+"na","na",""/);
});
