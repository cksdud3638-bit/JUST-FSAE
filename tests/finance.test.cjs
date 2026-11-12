const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const FIN=require('../js/finance.js');
const entry=(patch={})=>({id:'a',kind:'expense',date:'2026-10-01',title:'가공비',category:'제작비',fund:'회비',person:'담당',vendor:'업체',note:'',link:'',amount:200,payer:'team',reimbursed:false,reimbursementDate:'',voided:false,...patch});
const ledger=entries=>FIN.decode({version:1,openingBalance:1000,startDate:'2026-01-01',entries});
test('cash differs from incurred spending; refunds hit actual payout month',()=>{
 const d=ledger([entry(),entry({id:'b',kind:'income',amount:500}),entry({id:'c',payer:'personal',amount:300}),entry({id:'d',payer:'personal',amount:400,reimbursed:true,reimbursementDate:'2026-11-01'})]);
 assert.deepEqual(FIN.totals(d),{income:500,expense:900,cashIn:500,cashOut:600,pending:300,balance:900});
 assert.equal(FIN.totals(d,'2026-10').cashOut,200);assert.equal(FIN.totals(d,'2026-11').cashOut,400);assert.equal(FIN.totals(d,'2026-11').expense,0);
 d.entries[3].voided=true;assert.equal(FIN.totals(d).balance,1300);assert.equal(FIN.totals(d).expense,500);
});
test('empty Firebase arrays decode; unsupported versions, malformed money and dates are rejected',()=>{
 assert.deepEqual(FIN.decode({entries:null}).entries,[]);assert.deepEqual(FIN.decode({entries:{a:entry()}}).entries,[entry()]);
 for(const amount of ['',null,-1,0,1.2,Infinity,'no',true,1e13])assert.throws(()=>ledger([entry({amount})]));
 for(const date of ['2026-02-30','bad','2025-12-31'])assert.throws(()=>ledger([entry({date})]));
 assert.throws(()=>FIN.decode({version:2}));assert.throws(()=>ledger([entry(),entry()]));
 assert.throws(()=>ledger([entry({payer:'personal',person:''})]));assert.throws(()=>ledger([entry({payer:'personal',reimbursed:true,reimbursementDate:'2026-09-01'})]));
 assert.throws(()=>ledger([entry({kind:'income',payer:'personal'})]));
});
test('linked purchases are references only; receipts survive Firebase and JSON round trip',()=>{
 const receipt={name:'영수증.pdf',data:'data:application/pdf;base64,JVBERi0='};
 const d=ledger([entry({link:'part:abc',receipt})]);assert.equal(FIN.totals(d).expense,200);
 assert.deepEqual(FIN.decode(JSON.parse(JSON.stringify(d))),d);
 assert.throws(()=>ledger([entry({receipt:{name:'bad',data:'data:image/svg+xml;base64,AAAA'}})]));
});
test('CSV quotes line breaks and blocks spreadsheet formula execution',()=>{
 const csv=FIN.csv([['=CMD()', '+1', '@test', '-1', 'a"b\nc']]);assert.ok(csv.includes('"\'=CMD()"'));assert.ok(csv.includes('"a""b\nc"'));
});
test('transaction retries preserve concurrent records; failure preserves confirmed model',async()=>{
 let raw=ledger([entry()]),fail=false;const messages=[];
 const c=vm.createContext({document:{getElementById:id=>id==='fin-message'?{set textContent(s){messages.push(s);}}:null},db:{ref:()=>({transaction:async fn=>{if(fail)throw Error('denied');fn(FIN.copy(raw));raw.entries.push(entry({id:'concurrent'}));raw=fn(FIN.copy(raw));return{committed:true,snapshot:{val:()=>raw}};}})}});
 vm.runInContext(fs.readFileSync('js/finance.js','utf8'),c);vm.runInContext('financeReady=true;',c);
 assert.equal(await vm.runInContext("financeCommit(d=>d.entries.push({ ...d.entries[0], id:'new' }))",c),true);assert.equal(raw.entries.length,3);
 const before=vm.runInContext('JSON.stringify(financeData)',c);fail=true;assert.equal(await vm.runInContext('financeCommit(d=>d.openingBalance=9999)',c),false);assert.equal(vm.runInContext('JSON.stringify(financeData)',c),before);assert.ok(messages.some(s=>s.includes('denied')));
});
