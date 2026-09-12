const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const PB=require('../js/parts-budget.js');
const fixture=()=>({budget:{totalBudget:1000,limits:{'기존 파트':400,'흡기':200},expenses:[{part:'기존 파트',item:'배송',amount:30,date:'2026-09-11',person:'담당',weightDelta:-20}]},parts:[{id:123,name:'기존 부품',cat:'기존 파트',qty:2,cost:100,weight:300,axlePos:100,installed:true},{id:124,name:'미분류 부품',qty:1,cost:0,weight:500}]});
test('migration preserves originals, categories, allocations, quantity/unit semantics and expenses',()=>{
 const root=fixture(),before=JSON.stringify(root),d=PB.migrate(root);
 assert.equal(JSON.stringify(root),before);assert.deepEqual(d.legacyBackup, {parts:root.parts,budget:root.budget});
 assert.equal(d.overallBudget,1000);assert.equal(d.categories[0].name,'기존 파트');assert.ok(d.categories.some(c=>c.name==='흡기'));assert.ok(d.categories.some(c=>c.name==='배기'));
 assert.equal(d.parts[0].plannedUnitCost,100);assert.equal(d.parts[0].actualUnitCost,null);assert.equal(d.parts[0].axlePos,100);assert.equal(d.parts[1].cat,'미분류');assert.equal(d.expenses[0].weightDelta,-20);
 assert.deepEqual(PB.migrate({partsBudget:d}),d);assert.deepEqual(PB.migrate(root),d);
 const t=PB.totals(d);assert.equal(t.estimated,200);assert.equal(t.actual,30);assert.equal(t.weight,1100);assert.equal(t.remaining,970);assert.equal(t.unallocated,400);
});
test('explicit linked expense migrates once; a matching item name does not infer linkage',()=>{
 const root=fixture();root.budget.expenses.push({partId:123,part:'기존 파트',item:'기존 부품',amount:180},{partId:123,part:'기존 파트',item:'추가',amount:20});
 const d=PB.migrate(root);assert.equal(d.expenses.length,1);assert.equal(d.parts[0].actualUnitCost,100);assert.equal(PB.totals(d).actual,230);assert.equal(d.parts[0].legacyExpenses.length,2);
});
test('missing and explicit zero prices are distinct, numeric zero quantity stays zero',()=>{
 const d=PB.migrate({parts:[{name:'unknown',qty:0,weight:300},{name:'free',cost:0,qty:2,weight:100}]});
 assert.equal(d.parts[0].plannedUnitCost,null);assert.equal(d.parts[1].plannedUnitCost,0);assert.equal(PB.product(2,null),null);assert.equal(PB.product(2,0),0);assert.equal(PB.totals(d).weight,200);
});
test('owned is included, excluded is omitted from all summary totals',()=>{
 const d=PB.migrate(fixture());d.parts[0].status='기존 보유';d.parts[0].purchasedQty=2;d.parts[0].actualUnitCost=0;d.parts[1].status='제외';
 const t=PB.totals(d);assert.equal(t.count,1);assert.equal(t.weight,600);assert.equal(t.actual,30);assert.equal(PB.filtered(d).length,1);assert.equal(PB.filtered(d,{status:'제외'}).length,1);
});
test('category add/rename/move/delete keeps parts, expenses and allocations reconciled',()=>{
 const d=PB.migrate(fixture());d.categories.push({id:'new',name:'신규',allocation:50});PB.rename(d,d.categories[0].id,'새 이름');
 assert.equal(d.parts[0].cat,'새 이름');assert.equal(d.expenses[0].cat,'새 이름');
 PB.removeCategory(d,d.categories[0].id,'신규');assert.equal(d.parts[0].cat,'신규');assert.equal(d.expenses[0].cat,'신규');assert.equal(d.categories.find(c=>c.id==='new').allocation,450);
 PB.validate(d);assert.equal(PB.totals(d).allocation,650);assert.equal(d.categories.reduce((s,c)=>s+PB.totals(d,c.name).actual,0),PB.totals(d).actual);
 assert.throws(()=>PB.removeCategory(d,d.categories.find(c=>c.name==='미분류').id,'신규'));
});
test('search, category/status/uncategorized/excess filters and every sort',()=>{
 const d=PB.migrate(fixture());d.parts[0].spec='MODEL abc';d.parts[0].vendor='Supplier';d.parts[0].purchasedQty=2;d.parts[0].actualUnitCost=150;d.parts[0].updatedAt=5;
 assert.equal(PB.filtered(d,{search:'ABC'}).length,1);assert.equal(PB.filtered(d,{search:'supplier'}).length,1);assert.equal(PB.filtered(d,{over:true}).length,1);assert.equal(PB.filtered(d,{uncategorized:true})[0].cat,'미분류');assert.equal(PB.filtered(d,{cat:'흡기'}).length,0);
 for(const sort of ['estimated','actual','weight','recent'])assert.equal(PB.filtered(d,{sort})[0].name,'기존 부품');
 assert.deepEqual(PB.filtered(d,{sort:'name'}).map(p=>p.name),['기존 부품','미분류 부품']);
});
test('budget usage boundaries, over-allocation and spending excess',()=>{
 const d=PB.migrate(fixture());d.overallBudget=20;assert.equal(PB.totals(d).remaining,-10);assert.equal(PB.totals(d).usage,150);assert.equal(PB.totals(d).unallocated,-580);PB.validate(d);
 d.overallBudget=0;assert.equal(PB.totals(d).usage,Infinity);
});
test('validation rejects negative, nonfinite, malformed, duplicate and orphaned data',()=>{
 for(const value of [-1,Infinity,NaN,'1abc'])assert.throws(()=>PB.number(value));
 assert.throws(()=>PB.number('',false));assert.equal(PB.number(''),null);assert.equal(PB.number('0'),0);
 const d=PB.migrate(fixture());d.categories.push({...d.categories[0],id:'duplicate'});assert.throws(()=>PB.validate(d));
 const e=PB.migrate(fixture());e.parts[0].cat='unknown';assert.throws(()=>PB.validate(e));
});
test('Firebase omits empty arrays/nulls; repeated decode and JSON backup remain idempotent',()=>{
 const d=PB.migrate({});delete d.parts;delete d.expenses;
 const a=PB.migrate({partsBudget:d});assert.deepEqual(a.parts,[]);assert.deepEqual(a.expenses,[]);assert.deepEqual(PB.migrate(JSON.parse(JSON.stringify({partsBudget:a}))),a);
});
test('transaction retries preserve concurrent records, legacy paths and final deletion',async()=>{
 let root=fixture(),retry=0;
 const c=vm.createContext({crypto:require('node:crypto').webcrypto,document:{getElementById:()=>null},S:{},setText(){},setSyncState(){},renderHome(){},renderWeightDistribution(){},
 db:{ref:()=>({transaction:async fn=>{fn(PB.copy(root));if(retry++===0){root={...root,partsBudget:PB.migrate(root)};root.partsBudget.parts.push({...root.partsBudget.parts[1],id:'concurrent',name:'다른 기기'});}root=fn(PB.copy(root));return {committed:true,snapshot:{val:()=>root}};}})}});
 vm.runInContext(fs.readFileSync('js/parts-budget.js','utf8'),c);vm.runInContext('pbReady=true;pbMigrationStarted=true;',c);
 assert.equal(await vm.runInContext("pbCommit(d=>{d.parts[0].plannedQty=3;})",c),true);
 assert.equal(root.partsBudget.parts.length,3);assert.equal(root.partsBudget.parts[0].plannedQty,3);assert.equal(root.parts[0].qty,2);assert.equal(root.budget.expenses.length,1);
 assert.equal(await vm.runInContext('pbCommit(d=>{d.parts=[];d.expenses=[];})',c),true);assert.equal(root.partsBudget.parts.length,0);assert.equal(vm.runInContext('S.parts.length',c),0);
});
test('failed transaction never reports success or overwrites input model',async()=>{
 const messages=[];const c=vm.createContext({document:{getElementById:()=>null},S:{},setText:(id,s)=>messages.push(s),setSyncState(){},db:{ref:()=>({transaction:async()=>{throw Error('permission denied');}})}});
 vm.runInContext(fs.readFileSync('js/parts-budget.js','utf8'),c);vm.runInContext('pbReady=true;',c);assert.equal(await vm.runInContext('pbCommit(()=>{})',c),false);assert.ok(messages.some(s=>s.includes('permission denied')));
});
test('old backup without budget preserves current allocations and spending',()=>{
 const current=PB.migrate(fixture());current.overallBudget=5000;current.categories[0].allocation=900;current.expenses[0].amount=150;
 const restored=PB.fromBackup({version:'1.1',parts:[{name:'old JSON',qty:2,cost:60,weight:10}]},current);
 assert.equal(restored.overallBudget,5000);assert.equal(restored.categories[0].allocation,900);assert.equal(PB.totals(restored).actual,150);assert.equal(restored.parts.length,1);assert.equal(restored.parts[0].cat,'미분류');assert.equal(PB.totals(restored).estimated,120);
 assert.deepEqual(PB.fromBackup({partsBudget:restored},current),restored);
});
test('legacy parts and budget backup restores both ledgers without double counting',()=>{
 const restored=PB.fromBackup(fixture(),PB.migrate({}));assert.equal(PB.totals(restored).actual,30);assert.equal(PB.totals(restored).estimated,200);assert.equal(restored.overallBudget,1000);
});
