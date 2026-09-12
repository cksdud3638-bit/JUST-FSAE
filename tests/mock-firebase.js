/* Loaded only by the local /test.html route. Never connects to Firebase. */
(() => {
  const key='just-parts-budget-test-v1';
  let root=JSON.parse(localStorage.getItem(key) || 'null') || {
    budget:{totalBudget:1000000,limits:{'기존 파트':500000,'흡기':200000},expenses:[{part:'기존 파트',item:'배송비',amount:3000,date:'2026-09-11',person:'테스트'}]},
    parts:[{id:101,name:'기존 서스펜션 암',cat:'기존 파트',qty:2,cost:50000,weight:450,axlePos:250},{id:102,name:'이름이 긴 기존 부품 — 규격 및 상세 메모 확인용',qty:1,cost:0,weight:1250,note:'기존 데이터 보존 확인'}]
  };
  const listeners=[];
  const get=path=>path.split('/').slice(1).reduce((a,k)=>a?.[k],root) ?? null;
  const snap=value=>({val:()=>JSON.parse(JSON.stringify(value))});
  const notify=()=>listeners.forEach(([path,fn])=>fn(snap(get(path))));
  const persist=()=>{localStorage.setItem(key,JSON.stringify(root));notify();};
  const set=(path,value)=>{const keys=path.split('/').slice(1);if(!keys.length)root=value;else{let node=root;keys.slice(0,-1).forEach(k=>node=node[k]??={});node[keys.at(-1)]=value;}persist();};
  window.firebase={initializeApp(){},database:()=>({ref:path=>({
    on:(event,fn)=>{listeners.push([path,fn]);queueMicrotask(()=>fn(snap(get(path))));},
    once:async()=>snap(get(path)),
    set:async value=>set(path,value), update:async updates=>{Object.assign(root,updates);persist();},
    transaction:async fn=>{const next=fn(get(path));if(next===undefined)return{committed:false,snapshot:snap(get(path))};set(path,next);return{committed:true,snapshot:snap(next)};}
  })})};
  window.addEventListener('storage',e=>{if(e.key===key){root=JSON.parse(e.newValue);notify();}});
  document.addEventListener('DOMContentLoaded',()=>{const p=document.createElement('p');p.textContent='로컬 테스트 전용 · 실제 서버와 연결되지 않습니다';p.style.cssText='padding:8px;background:#24394d;color:white;font-size:12px';document.body.prepend(p);});
})();
