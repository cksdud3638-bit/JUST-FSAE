const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {calculateFuel}=require('../js/fuel.js');
const defaults={eff:8.5,circuitLen:1.2,raceDist:22,tankCap:5.5,margin:10,pitFuel:5,density:0.74,allowRefuel:false};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('default fuel and final partial lap use exactly the entered distance',()=>{
 const r=calculateFuel(defaults);near(r.required,22/8.5*1.1);near(r.reserve,22/8.5*.1);near(r.perLap,1.2/8.5);
 near(r.equivalentLaps,22/1.2);near(r.consumed,22/8.5);near(r.finish,r.reserve);near(r.points.at(-1).x,22/1.2);
 assert.equal(r.steps,19);assert.equal(r.events.length,0);assert.equal(r.feasible,true);near(r.fuelKg,r.start*.74);
});
test('zero margin and zero refuel remain zero, with no phantom graph refuel',()=>{
 const r=calculateFuel({...defaults,margin:0,pitFuel:0,allowRefuel:true});near(r.required,22/8.5);near(r.finish,0);assert.equal(r.events.length,0);
 assert.ok(r.points.every((p,i)=>i===0||p.y<=r.points[i-1].y));
});
test('over-capacity is not clipped and no-refuel plan cannot promise completion',()=>{
 const r=calculateFuel({...defaults,tankCap:1});assert.ok(r.tankPct>100);assert.equal(r.feasible,false);assert.equal(r.events.length,0);near(r.start,1);near(r.fuelKg,.74);
 assert.ok(r.points.at(-1).x<r.equivalentLaps);assert.ok(r.finish>=r.reserve-1e-9);
});
test('refuels preserve leftover fuel, capacity and total mass balance; graph shares events',()=>{
 const r=calculateFuel({...defaults,tankCap:1,pitFuel:.7,allowRefuel:true});assert.equal(r.feasible,true);assert.ok(r.events.length>0);
 near(r.start+r.events.reduce((s,e)=>s+e.addFuel,0)-r.finish,22/8.5);near(r.finish,r.reserve);
 for(const e of r.events){assert.ok(e.addFuel>0&&e.addFuel<=.7);assert.ok(e.after<=1+1e-9);
 const same=r.points.filter(p=>p.x===e.lap);assert.equal(same.length,2);near(same[1].y-same[0].y,e.addFuel);assert.ok(e.lap>0&&e.lap<r.equivalentLaps);}
 assert.ok(r.points.every(p=>p.y>=r.reserve-1e-9&&p.y<=1+1e-9));
});
test('insufficient or zero top-up and first-lap insufficiency terminate without fabricated stops',()=>{
 for(const pitFuel of [0,.001]){const r=calculateFuel({...defaults,tankCap:1,pitFuel,allowRefuel:true});assert.equal(r.feasible,false);assert.equal(r.events.length,0);}
 const r=calculateFuel({...defaults,tankCap:.01,allowRefuel:true});assert.equal(r.feasible,false);assert.equal(r.points.length,1);
 const tiny=calculateFuel({...defaults,eff:1e100,tankCap:1e-200});assert.equal(tiny.feasible,false);
});
test('exact whole lap and shorter-than-one-lap trips finish at the exact fuel requirement',()=>{
 for(const raceDist of [1.2,.4,12,1.2+1e-12]){const r=calculateFuel({...defaults,raceDist});assert.equal(r.feasible,true);near(r.consumed,raceDist/8.5);near(r.finish,r.reserve);near(r.points.at(-1).x,raceDist/1.2);}
});
test('invalid or pathological numeric inputs fail instead of silently using defaults',()=>{
 for(const key of ['eff','circuitLen','raceDist','tankCap','margin','pitFuel','density']){
  for(const value of ['',null,undefined,NaN,Infinity,-1,'3oops',{},true])assert.throws(()=>calculateFuel({...defaults,[key]:value}),key+':'+value);
 }
 for(const key of ['eff','circuitLen','raceDist','tankCap','density'])assert.throws(()=>calculateFuel({...defaults,[key]:0}));
 assert.throws(()=>calculateFuel({...defaults,margin:51}));assert.throws(()=>calculateFuel({...defaults,raceDist:1e9,circuitLen:.001}));
 assert.throws(()=>calculateFuel({...defaults,eff:1e-300,raceDist:1e10,circuitLen:1e10}));
});
test('bounded simulation conserves fuel across a grid of capacities and consumption rates',()=>{
 for(const eff of [1,3,8.5])for(const tankCap of [1,2,5.5])for(const margin of [0,10,50])for(const pitFuel of [.1,1,10]){
  const r=calculateFuel({...defaults,eff,tankCap,margin,pitFuel,allowRefuel:true});
  assert.ok(r.points.every(p=>Number.isFinite(p.y)&&p.y>=0&&p.y<=tankCap+1e-8));
  near(r.start+r.events.reduce((s,e)=>s+e.addFuel,0)-r.finish,r.consumed);
  if(r.feasible){near(r.consumed,22/eff);assert.ok(r.finish>=r.reserve-1e-8);}
 }
});
test('UI clears stale results on error, uses departure mass, and never writes shared state',()=>{
 const values={'fuel-eff':'8.5','circuit-len':'1.2','race-dist':'22','tank-cap':'1','safety-margin':'10','pit-fuel':'0','fuel-density':'.74'};
 const els=new Map(),el=id=>{if(!els.has(id))els.set(id,{value:values[id]??'',style:{},textContent:'',getContext(){return {}}});return els.get(id)};
 let chart,destroyed=0;const S={parts:[{weight:100,qty:2},{weight:100,qty:0},{weight:500,qty:1,status:'제외'}]};
 const before=JSON.stringify(S),c=vm.createContext({S,document:{getElementById:el},v:id=>el(id).value,setText:(id,v)=>el(id).textContent=v,Chart:class{constructor(ctx,data){chart=data}destroy(){destroyed++}}});
 vm.runInContext(fs.readFileSync('js/fuel.js','utf8'),c);vm.runInContext('calcFuel()',c);
 assert.equal(el('fuel-total-weight').textContent,'0.94 kg');assert.match(el('fr-tank-pct').textContent,/용량 초과/);assert.equal(el('fr-tank-bar').style.width,'100%');assert.equal(JSON.stringify(S),before);
 el('fuel-eff').value='';vm.runInContext('calcFuel()',c);assert.equal(el('fr-total-fuel').textContent,'—');assert.equal(el('fr-tank-bar').style.width,'0%');assert.ok(destroyed>0);assert.match(el('fuel-error').textContent,/연비/);
 el('fuel-eff').value='8.5';el('safety-margin').value='0';el('tank-cap').value='5.5';vm.runInContext('calcFuel()',c);assert.equal(el('fuel-error').textContent,'');near(chart.data.datasets[0].data.at(-1).y,0);
});
