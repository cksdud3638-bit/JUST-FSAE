/* Unified ledger. Pure model functions also run in Node regression tests. */
const PB = (() => {
  const defaults = ['파워트레인','냉각','흡기','배기','전장','현가','조향','제동','프레임·섀시','카울·공력','공통·소모품','기타','미분류'];
  const statuses = ['검토 중','구매 예정','주문 완료','입고 완료','제작 예정','제작 완료','기존 보유','제외'];
  const list = value => Object.values(value || {});
  const copy = value => JSON.parse(JSON.stringify(value));
  function number(value, optional = true) {
    if(typeof value==='string')value=value.trim();
    if (value === '' || value == null) { if (optional) return null; throw Error('필수 숫자를 입력하세요.'); }
    if(!['number','string'].includes(typeof value))throw Error('숫자를 입력하세요.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw Error('숫자는 0 이상의 유한한 값이어야 합니다.');
    return n;
  }
  const product = (a,b) => a == null || b == null ? null : a * b;
  function migrate(root) {
    if (root.partsBudget?.version === 1) {
      const d = copy(root.partsBudget);
      d.categories = list(d.categories); d.parts = list(d.parts); d.expenses = list(d.expenses);
      return validate(d);
    }
    if (root.partsBudget) throw Error('지원하지 않는 부품·예산 데이터 버전입니다.');
    const budget = root.budget || {}, oldParts = list(root.parts), expenses = list(budget.expenses);
    const names = [...new Set([...Object.keys(budget.limits || {}), ...oldParts.map(p=>p.cat), ...expenses.map(e=>e.part), ...defaults].filter(Boolean))];
    const categories = names.map((name,i)=>({id:'legacy-category-'+i,name,allocation:number(budget.limits?.[name] ?? 0)}));
    const parts = oldParts.map((p,i)=>({ ...p, id:'legacy-part-'+i, legacyId:p.id ?? null,
      cat:p.cat || '미분류', spec:p.spec || '', status:'검토 중',
      plannedQty:number(p.qty ?? 1), purchasedQty:0, plannedUnitCost:number(p.cost), actualUnitCost:null,
      weight:number(p.weight), vendor:p.vendor || '', url:p.url || '', note:p.note || '', updatedAt:0 }));
    const other = [];
    expenses.forEach((e,i)=>{
      // Only an explicit foreign key establishes a link; names/prices never do.
      const linked = e.partId != null ? parts.find(p=>String(p.legacyId)===String(e.partId)) : null;
      if (linked && linked.plannedQty > 0) {
        linked.purchasedQty = linked.plannedQty;
        linked.actualUnitCost = ((product(linked.purchasedQty,linked.actualUnitCost) || 0) + Number(e.amount || 0)) / linked.purchasedQty;
        linked.legacyExpenses = [...(linked.legacyExpenses || []),copy(e)];
      } else other.push({...e,id:'legacy-expense-'+i,cat:e.part || '미분류',name:e.item || e.name || '지출',amount:number(e.amount ?? 0),vendor:e.vendor || '',note:e.note || (e.person ? '담당자: '+e.person : '')});
    });
    return {version:1, overallBudget:number(budget.overallBudget ?? budget.totalBudget ?? root.totalBudget ?? categories.reduce((s,c)=>s+c.allocation,0)),
      categories,parts,expenses:other,legacyBackup:{parts:copy(root.parts || []),budget:copy(budget)},
      migrationNote:'기존 cost는 개당 예상 비용. 명시적 partId가 없는 지출은 기타 지출. 무게는 계획 수량 기준.'};
  }
  function totals(d,cat) {
    const parts = d.parts.filter(p=>p.status!=='제외' && (!cat || p.cat===cat));
    const expenses = d.expenses.filter(e=>!cat || e.cat===cat);
    const allocation = d.categories.filter(c=>!cat || c.name===cat).reduce((s,c)=>s+c.allocation,0);
    const estimated = parts.reduce((s,p)=>s+(product(p.plannedQty,p.plannedUnitCost) || 0),0);
    const actual = parts.reduce((s,p)=>s+(product(p.purchasedQty,p.actualUnitCost) || 0),0)+expenses.reduce((s,e)=>s+e.amount,0);
    const weight = parts.reduce((s,p)=>s+(product(p.plannedQty,p.weight) || 0),0);
    const budget = cat ? allocation : d.overallBudget;
    return {allocation,estimated,actual,weight,count:parts.length,remaining:budget-actual,unallocated:d.overallBudget-allocation,
      usage:budget ? actual/budget*100 : actual ? Infinity : 0,
      missing:parts.filter(p=>p.plannedUnitCost==null || (p.purchasedQty>0 && p.actualUnitCost==null)).length};
  }
  function filtered(d,f={}) {
    const q=(f.search || '').trim().toLocaleLowerCase();
    const rows=d.parts.filter(p=>(f.status ? p.status===f.status : p.status!=='제외') && (!f.cat || p.cat===f.cat) &&
      (!f.uncategorized || p.cat==='미분류') && (!f.over || (product(p.purchasedQty,p.actualUnitCost)!=null && product(p.plannedQty,p.plannedUnitCost)!=null && product(p.purchasedQty,p.actualUnitCost)>product(p.plannedQty,p.plannedUnitCost))) &&
      (!q || [p.name,p.spec,p.vendor].join(' ').toLocaleLowerCase().includes(q)));
    const order=new Map(d.categories.map((c,i)=>[c.name,i]));
    const sort={name:(a,b)=>a.name.localeCompare(b.name,'ko'),estimated:(a,b)=>(product(b.plannedQty,b.plannedUnitCost)||0)-(product(a.plannedQty,a.plannedUnitCost)||0),
      actual:(a,b)=>(product(b.purchasedQty,b.actualUnitCost)||0)-(product(a.purchasedQty,a.actualUnitCost)||0),weight:(a,b)=>(product(b.plannedQty,b.weight)||0)-(product(a.plannedQty,a.weight)||0),recent:(a,b)=>(b.updatedAt||0)-(a.updatedAt||0)};
    return rows.sort(sort[f.sort] || ((a,b)=>(order.get(a.cat)??999)-(order.get(b.cat)??999) || a.name.localeCompare(b.name,'ko')));
  }
  function validate(d) {
    d.overallBudget=number(d.overallBudget,false);
    for(const rows of [d.categories,d.parts,d.expenses]) {
      if(rows.some(r=>typeof r.id!=='string'||!r.id) || new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('중복되거나 잘못된 항목 ID가 있습니다.');
    }
    const names=d.categories.map(c=>c.name);
    if (!names.includes('미분류') || new Set(names).size!==names.length || names.some(n=>!n.trim())) throw Error('파트 이름은 중복 없이 입력하세요. 미분류는 유지해야 합니다.');
    d.categories.forEach(c=>c.allocation=number(c.allocation,false));
    for (const p of d.parts) {
      if (!p.name.trim() || !names.includes(p.cat) || !statuses.includes(p.status)) throw Error('부품명, 파트, 상태를 확인하세요.');
      ['plannedQty','purchasedQty'].forEach(k=>p[k]=number(p[k],false));
      ['plannedUnitCost','actualUnitCost','weight'].forEach(k=>p[k]=number(p[k]));
      if ([product(p.plannedQty,p.plannedUnitCost),product(p.purchasedQty,p.actualUnitCost),product(p.plannedQty,p.weight)].some(n=>n!=null&&!Number.isFinite(n))) throw Error('계산 범위를 초과했습니다.');
      if (p.url && !/^https?:\/\//i.test(p.url)) throw Error('출처 링크는 http:// 또는 https://로 시작해야 합니다.');
    }
    d.expenses.forEach(e=>{if(!e.name.trim() || !names.includes(e.cat)) throw Error('기타 지출의 품목과 파트를 확인하세요.');e.amount=number(e.amount,false);});
    const t=totals(d);
    if(['allocation','estimated','actual','weight','remaining','unallocated'].some(k=>!Number.isFinite(t[k]))) throw Error('합계가 계산 범위를 초과했습니다.');
    return d;
  }
  function rename(d,id,name) {
    const c=d.categories.find(c=>c.id===id); if (!c) throw Error('파트가 삭제되었습니다.');
    if(c.name==='미분류' && name!=='미분류') throw Error('미분류 이름은 유지해야 합니다.');
    d.parts.filter(p=>p.cat===c.name).forEach(p=>p.cat=name);
    d.expenses.filter(e=>e.cat===c.name).forEach(e=>e.cat=name); c.name=name;
  }
  function removeCategory(d,id,target) {
    const c=d.categories.find(c=>c.id===id), dest=d.categories.find(c=>c.name===target);
    if(!c || c.name==='미분류' || !dest || c===dest) throw Error('이동할 다른 파트를 선택하세요. 미분류는 삭제할 수 없습니다.');
    d.parts.filter(p=>p.cat===c.name).forEach(p=>p.cat=target);
    d.expenses.filter(e=>e.cat===c.name).forEach(e=>e.cat=target);
    dest.allocation+=c.allocation; d.categories=d.categories.filter(x=>x.id!==id);
  }
  function fromBackup(data,current) {
    if(data.partsBudget) return validate(migrate(data));
    const d=copy(current);
    const appendCategory=c=>{
      let i=d.categories.length,id='import-category-'+i;
      while(d.categories.some(x=>x.id===id))id='import-category-'+(++i);
      d.categories.push({...c,id});
    };
    if(data.parts!==undefined) {
      const imported=migrate({parts:data.parts});
      d.parts=imported.parts;
      for(const c of imported.categories)if(!d.categories.some(x=>x.name===c.name))appendCategory(c);
    }
    if(data.budget!==undefined) {
      const imported=migrate({budget:data.budget,parts:data.parts || []});
      d.overallBudget=imported.overallBudget;d.expenses=imported.expenses;
      d.categories.forEach(c=>c.allocation=0);
      for(const c of imported.categories){const old=d.categories.find(x=>x.name===c.name);if(old)old.allocation=c.allocation;else appendCategory(c);}
      if(data.parts!==undefined)d.parts=imported.parts;
    }
    d.importedLegacyBackup={parts:copy(data.parts || []),budget:copy(data.budget || {})};
    return validate(d);
  }
  return {defaults,statuses,list,copy,number,product,migrate,totals,filtered,validate,rename,removeCategory,fromBackup};
})();
if(typeof module!=='undefined') module.exports=PB;

let pbData=null, pbReady=false, pbBusy=false, pbEdit=null, pbExpenseEdit=null, pbMigrationStarted=false;
const pbEsc = s=>String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pbMoney = n=>n==null?'미입력':'₩'+n.toLocaleString('ko-KR',{maximumFractionDigits:2});
const pbWeight = n=>n==null?'미입력':(n>=1000?(n/1000).toLocaleString('ko-KR',{maximumFractionDigits:3})+' kg':n.toLocaleString('ko-KR')+' g');
const pbId = ()=>crypto.randomUUID();
function pbReceive(root) {
  try { const first=!pbReady; pbData=PB.migrate(root); pbReady=true; S.partsBudget=pbData;
    S.parts=pbData.parts.filter(p=>p.status!=='제외').map(p=>({...p,qty:p.plannedQty,cost:p.plannedUnitCost ?? 0,weight:p.weight ?? 0}));
    renderPartsBudget();
    if(first) {const input=document.getElementById('pb-overall');if(input)input.value=pbData.overallBudget;setText('pb-message','서버 연결 완료');}
    if(!root.partsBudget && !pbMigrationStarted) {pbMigrationStarted=true; void pbCommit(()=>{});}
  } catch(err) { pbReady=false; setText('pb-message',err.message); }
}
async function pbCommit(change) {
  if(!pbReady || pbBusy) {setText('pb-message','서버 연결 또는 저장 완료를 기다려주세요.');return false;}
  pbBusy=true; setSyncState('saving'); setText('pb-message','저장 중…');
  try {
    // Root transaction reads the latest legacy snapshot during first migration and
    // retries edits against the latest ledger, preserving concurrent unrelated edits.
    const result=await db.ref('just').transaction(root=>{
      root = root || {};
      const d=PB.migrate(root); change(d); PB.validate(d);
      return {...root,partsBudget:d};
    },undefined,false);
    if(!result.committed) throw Error('저장이 취소되었습니다. 다시 저장하세요.');
    pbReceive(result.snapshot.val()); renderHome(); renderWeightDistribution();
    setSyncState('saved'); setText('pb-message','저장되었습니다.');return true;
  } catch(err) {setSyncState('offline');setText('pb-message','저장하지 못했습니다: '+err.message);return false;}
  finally {pbBusy=false;}
}
function pbFilters() { return {search:v('pb-search'),cat:v('pb-filter-cat'),status:v('pb-filter-status'),sort:v('pb-sort'),over:!!document.getElementById('pb-over')?.checked,uncategorized:!!document.getElementById('pb-uncat')?.checked}; }
function pbOptions(select,values) {
  if(!select)return; const old=select.value;
  select.innerHTML=values.map(([value,label])=>`<option value="${pbEsc(value)}">${pbEsc(label)}</option>`).join('');
  if(values.some(([value])=>value===old))select.value=old;
}
function renderPartsBudget() {
  if(!document.getElementById('pb-summary') || !pbData)return;
  const d=pbData,t=PB.totals(d), cats=d.categories.map(c=>[c.name,c.name]);
  ['pb-cat','pb-exp-cat','pb-category-target'].forEach(id=>pbOptions(document.getElementById(id),cats));
  pbOptions(document.getElementById('pb-filter-cat'),[['','전체 파트'],...cats]);
  const cards=[['전체 예산',pbMoney(d.overallBudget)],['배정 예산 합계',pbMoney(t.allocation)],['미배정 예산',pbMoney(t.unallocated)],['예상 총비용',pbMoney(t.estimated)],['실제 총지출',pbMoney(t.actual)],['남은 예산',pbMoney(t.remaining)],['등록 부품 수',t.count+'건'],['총 부품 무게',pbWeight(t.weight)]];
  document.getElementById('pb-summary').innerHTML=cards.map(([label,val])=>`<div class="pb-stat"><span>${label}</span><strong>${val}</strong></div>`).join('');
  setText('pb-warning',[t.unallocated<0?'배정 예산이 전체 예산보다 '+pbMoney(-t.unallocated)+' 많습니다.':'',t.remaining<0?'전체 예산 초과: '+pbMoney(-t.remaining):'',t.missing?`가격 미입력 부품 ${t.missing}건 — 합계는 입력된 금액만 반영합니다.`:''].filter(Boolean).join(' '));
  document.getElementById('pb-categories').innerHTML=[{name:'전체'},...d.categories].map(c=>{
    const a=PB.totals(d,!c.id?null:c.name), pct=Number.isFinite(a.usage)?a.usage.toFixed(1)+'%':'예산 없음 · 지출 발생';
    return `<button type="button" class="pb-category" data-filter="${pbEsc(!c.id?'':c.name)}" aria-pressed="${v('pb-filter-cat')===(!c.id?'':c.name)}"><strong>${pbEsc(c.name)}</strong><span>배정 ${pbMoney(a.allocation)} · ${a.count}건</span><span>예상 ${pbMoney(a.estimated)}</span><span>실제 ${pbMoney(a.actual)} · 잔액 ${pbMoney(a.remaining)}</span><span>${pbWeight(a.weight)} · 사용률 ${pct}</span><span class="pb-bar"><i style="width:${Math.min(a.usage,100)}%;background:${a.usage>100?'#ee7777':a.usage>=80?'#d6b35f':'#6faa89'}"></i></span></button>`;
  }).join('');
  const manage=document.getElementById('pb-category-list');
  manage.innerHTML=d.categories.map((c,i)=>`<div class="pb-category-row"><span>${pbEsc(c.name)}</span><span>${pbMoney(c.allocation)}</span><button type="button" data-cat-edit="${i}">수정</button><button type="button" data-cat-up="${i}" ${i===0?'disabled':''} aria-label="${pbEsc(c.name)} 위로">↑</button><button type="button" data-cat-down="${i}" ${i===d.categories.length-1?'disabled':''} aria-label="${pbEsc(c.name)} 아래로">↓</button><button type="button" class="pb-delete" data-cat-delete="${i}" ${c.name==='미분류'?'disabled':''}>삭제</button></div>`).join('');
  pbRenderList(); pbRenderExpenses();
}
function pbRenderList() {
  if(!pbData)return;
  const f=pbFilters(), rows=PB.filtered(pbData,f);
  setText('pb-active-filters',`${rows.length}건 표시 · ${[f.cat||'전체 파트',f.status||'제외 상태 숨김',f.search?'검색: '+f.search:'',f.over?'예상 비용 초과만':'',f.uncategorized?'미분류만':''].filter(Boolean).join(' · ')}`);
  const link=p=>/^https?:\/\//i.test(p.url || '')?`<a href="${pbEsc(p.url)}" target="_blank" rel="noopener noreferrer">출처 열기</a>`:'—';
  const actions=p=>`<button type="button" data-edit="${pbEsc(p.id)}">수정</button> <button type="button" class="pb-delete" data-delete="${pbEsc(p.id)}">삭제</button>`;
  const text=s=>`<span class="pb-ellipsis" title="${pbEsc(s)}">${pbEsc(s || '—')}</span>`;
  const cells=p=>[text(p.cat),text(p.name),text(p.spec),pbEsc(p.status),p.plannedQty,p.purchasedQty,pbMoney(p.plannedUnitCost),pbMoney(p.actualUnitCost),pbMoney(PB.product(p.plannedQty,p.plannedUnitCost)),pbMoney(PB.product(p.purchasedQty,p.actualUnitCost)),pbWeight(p.weight),pbWeight(PB.product(p.plannedQty,p.weight)),text(p.vendor),link(p),text(p.note),actions(p)];
  document.getElementById('pb-tbody').innerHTML=rows.map(p=>`<tr>${cells(p).map((c,i)=>`<td class="${i>=4&&i<=11?'pb-num':''}">${c}</td>`).join('')}</tr>`).join('');
  document.getElementById('pb-mobile-list').innerHTML=rows.map(p=>`<article class="pb-part-card"><span>${pbEsc(p.cat)} · ${pbEsc(p.status)}</span><h3>${pbEsc(p.name)}</h3><dl><dt>수량 (계획 / 구매)</dt><dd>${p.plannedQty} / ${p.purchasedQty}</dd><dt>예상 비용</dt><dd>${pbMoney(PB.product(p.plannedQty,p.plannedUnitCost))}</dd><dt>실제 지출</dt><dd>${pbMoney(PB.product(p.purchasedQty,p.actualUnitCost))}</dd><dt>총 무게</dt><dd>${pbWeight(PB.product(p.plannedQty,p.weight))}</dd></dl><details><summary>상세 정보</summary><p>규격: ${pbEsc(p.spec||'—')}</p><p>예상 / 실제 단가: ${pbMoney(p.plannedUnitCost)} / ${pbMoney(p.actualUnitCost)}</p><p>개당 무게: ${pbWeight(p.weight)}</p><p>구매처: ${pbEsc(p.vendor||'—')}</p><p>${link(p)}</p><p>${pbEsc(p.note||'메모 없음')}</p></details><div class="pb-actions">${actions(p)}</div></article>`).join('');
  document.getElementById('pb-empty').hidden=rows.length>0;
  document.querySelectorAll('#pb-categories [data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===f.cat)));
}
function pbRenderExpenses() {
  document.getElementById('pb-expenses').innerHTML=pbData.expenses.map(e=>`<article class="pb-expense-row"><div><strong>${pbEsc(e.name)}</strong><p>${pbEsc(e.cat)} · ${pbEsc(e.date||'날짜 없음')} · ${pbEsc(e.vendor||'구매처 없음')}</p><p>${pbEsc(e.note)}</p></div><strong>${pbMoney(e.amount)}</strong><div><button type="button" data-exp-edit="${pbEsc(e.id)}">수정</button> <button type="button" class="pb-delete" data-exp-delete="${pbEsc(e.id)}">삭제</button></div></article>`).join('') || '<p class="pb-help">기타 지출이 없습니다.</p>';
}
function pbOpenPart(id) {
  const p=pbData.parts.find(p=>p.id===id) || {cat:v('pb-filter-cat')||'미분류',status:'구매 예정',plannedQty:1,purchasedQty:0}; pbEdit=id||null;
  for(const k of ['name','cat','spec','status','vendor','url','plannedQty','purchasedQty','plannedUnitCost','actualUnitCost','weight','note','axlePos','valueType','posType']) {
    document.getElementById('pb-'+k).value=p[k] ?? '';
  }
  document.getElementById('pb-installed').checked=!!p.installed;
  document.getElementById('pb-part-form').hidden=false;setText('pb-form-title',id?'부품 수정':'부품 추가'); pbPreview(); document.getElementById('pb-name').focus();
}
function pbPreview() {
  try {const n=k=>PB.number(v('pb-'+k));setText('pb-preview',`예상 ${pbMoney(PB.product(n('plannedQty'),n('plannedUnitCost')))} · 실제 ${pbMoney(PB.product(n('purchasedQty'),n('actualUnitCost')))} · 총 무게 ${pbWeight(PB.product(n('plannedQty'),n('weight')))}`);} catch(e){setText('pb-preview',e.message);}
}
async function pbSavePart(e) {
  e.preventDefault();
  try {
    const id=pbEdit||pbId(), patch={id,updatedAt:Date.now()};
    for(const k of ['name','cat','spec','status','vendor','url','note','valueType','posType'])patch[k]=v('pb-'+k).trim();
    for(const k of ['plannedQty','purchasedQty','plannedUnitCost','actualUnitCost','weight'])patch[k]=PB.number(v('pb-'+k),!['plannedQty','purchasedQty'].includes(k));
    patch.axlePos=v('pb-axlePos')===''?null:Number(v('pb-axlePos'));
    if(patch.axlePos!=null&&!Number.isFinite(patch.axlePos))throw Error('위치를 확인하세요.');
    patch.installed=document.getElementById('pb-installed').checked;
    const editing=!!pbEdit;
    if(await pbCommit(d=>{const i=d.parts.findIndex(p=>p.id===id);if(editing&&i<0)throw Error('다른 사용자가 삭제한 부품입니다.');if(i>=0)d.parts[i]={...d.parts[i],...patch};else d.parts.push(patch);}))document.getElementById('pb-part-form').hidden=true;
  }catch(err){setText('pb-message',err.message);}
}
let pbCategoryEdit=null;
function pbOpenCategory(i) {
  const c=pbData.categories[i];pbCategoryEdit=c?.id||null;
  document.getElementById('pb-category-name').value=c?.name||'';
  document.getElementById('pb-category-allocation').value=c?.allocation??0;
  document.getElementById('pb-category-name').focus();
}
function pbOpenExpense(id) {
  const e=pbData.expenses.find(e=>e.id===id)||{};pbExpenseEdit=id||null;
  ['name','cat','amount','date','vendor','note'].forEach(k=>document.getElementById('pb-exp-'+k).value=e[k]??(k==='date'?new Date().toISOString().slice(0,10):k==='cat'?'미분류':''));
  document.getElementById('pb-exp-form').hidden=false;document.getElementById('pb-exp-name').focus();
}
function pbReport() {
  const scope=v('pb-export-scope'),f=pbFilters();
  const parts=scope==='other'?[]:scope==='over'?PB.filtered(pbData,{over:true}):scope==='unpurchased'?pbData.parts.filter(p=>p.status!=='제외'&&p.purchasedQty<p.plannedQty):scope==='category'?PB.filtered(pbData,{cat:f.cat}):pbData.parts;
  return {version:1,reportType:'parts-budget-report',exported:new Date().toISOString(),scope,overallBudget:pbData.overallBudget,summary:PB.totals(pbData),categories:pbData.categories.map(c=>({...c,...PB.totals(pbData,c.name)})),parts:parts.map(p=>({...p,estimatedAmount:PB.product(p.plannedQty,p.plannedUnitCost),actualAmount:PB.product(p.purchasedQty,p.actualUnitCost),totalWeight:PB.product(p.plannedQty,p.weight)})),expenses:['over','unpurchased'].includes(scope)?[]:scope==='category'?pbData.expenses.filter(e=>!f.cat||e.cat===f.cat):pbData.expenses};
}
function pbExport() {
  if(!pbData)return;
  const report=pbReport(), scope=report.scope;
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='JUST_부품예산_'+scope+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function pbCopySummary() {
  if(!pbData)return;
  const t=PB.totals(pbData);
  const text=`부품·예산 관리\n전체 예산 ${pbMoney(pbData.overallBudget)}\n배정 ${pbMoney(t.allocation)} / 미배정 ${pbMoney(t.unallocated)}\n예상 ${pbMoney(t.estimated)} / 실제 ${pbMoney(t.actual)} / 잔액 ${pbMoney(t.remaining)}\n부품 ${t.count}건 / 총무게 ${pbWeight(t.weight)}\n`+pbData.categories.map(c=>{const a=PB.totals(pbData,c.name);return `${c.name}: 배정 ${pbMoney(c.allocation)}, 예상 ${pbMoney(a.estimated)}, 실제 ${pbMoney(a.actual)}, 잔액 ${pbMoney(a.remaining)}, ${pbWeight(a.weight)}`;}).join('\n');
  try {await navigator.clipboard.writeText(text);setText('pb-message','요약을 복사했습니다.');}catch{setText('pb-message','복사 권한이 없습니다. JSON 내보내기를 이용하세요.');}
}
async function exportBudgetPDF() {
  if(!pbData)return;
  const r=pbReport(), t=r.summary, el=document.createElement('div');
  el.style.cssText='background:white;color:#111;font:12px sans-serif;padding:16px;width:720px';
  el.innerHTML=`<h1>부품·예산 관리</h1><p>${pbEsc(r.exported.slice(0,10))} · 범위 ${pbEsc(v('pb-export-scope'))}</p><p>전체 ${pbMoney(r.overallBudget)} · 배정 ${pbMoney(t.allocation)} · 예상 ${pbMoney(t.estimated)} · 실제 ${pbMoney(t.actual)} · 잔액 ${pbMoney(t.remaining)} · ${pbWeight(t.weight)}</p><h2>파트별 예산</h2>`+
    r.categories.map(c=>`<p>${pbEsc(c.name)}: 배정 ${pbMoney(c.allocation)} · 예상 ${pbMoney(c.estimated)} · 실제 ${pbMoney(c.actual)} · 잔액 ${pbMoney(c.remaining)} · ${pbWeight(c.weight)}</p>`).join('')+'<h2>부품</h2>'+
    r.parts.map(p=>`<div style="break-inside:avoid;border-top:1px solid #ccc;padding:8px 0"><b>${pbEsc(p.cat)} · ${pbEsc(p.name)}</b><p>${pbEsc(p.status)} · 수량 ${p.plannedQty}/${p.purchasedQty} · 예상 ${pbMoney(p.estimatedAmount)} · 실제 ${pbMoney(p.actualAmount)} · ${pbWeight(p.totalWeight)}</p><p>${pbEsc(p.spec)} · ${pbEsc(p.vendor)} · ${pbEsc(p.url)} · ${pbEsc(p.note)}</p></div>`).join('')+'<h2>기타 지출</h2>'+r.expenses.map(e=>`<p>${pbEsc(e.cat)} · ${pbEsc(e.name)} · ${pbMoney(e.amount)} · ${pbEsc(e.date)} · ${pbEsc(e.note)}</p>`).join('');
  try {await html2pdf().set({margin:10,filename:'JUST_부품예산.pdf',html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(el).save();setText('pb-message','PDF를 내보냈습니다.');}catch(err){setText('pb-message','PDF 내보내기 실패: '+err.message);}
}
function initPartsBudget() {
  const root=document.getElementById('tab-parts-budget');if(!root)return;
  pbOptions(document.getElementById('pb-status'),PB.statuses.map(s=>[s,s]));
  pbOptions(document.getElementById('pb-filter-status'),[['','상태 전체 (제외 숨김)'],...PB.statuses.map(s=>[s,s])]);
  root.addEventListener('touchend',e=>e.stopPropagation());
  root.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-filter')){document.getElementById('pb-filter-cat').value=b.dataset.filter;pbRenderList();}
    if(b.dataset.edit)pbOpenPart(b.dataset.edit);
    if(b.dataset.delete&&confirm('이 부품을 삭제할까요?'))await pbCommit(d=>d.parts=d.parts.filter(p=>p.id!==b.dataset.delete));
    if(b.hasAttribute('data-cat-edit'))pbOpenCategory(Number(b.dataset.catEdit));
    for(const [attr,delta] of [['catUp',-1],['catDown',1]])if(b.dataset[attr]!=null){const id=pbData.categories[Number(b.dataset[attr])].id;await pbCommit(d=>{const i=d.categories.findIndex(c=>c.id===id),j=i+delta;if(i>=0&&j>=0&&j<d.categories.length)[d.categories[i],d.categories[j]]=[d.categories[j],d.categories[i]];});}
    if(b.hasAttribute('data-cat-delete')){const c=pbData.categories[Number(b.dataset.catDelete)],target=v('pb-category-target');if(confirm(`${c.name}의 부품·기타 지출·배정 예산을 ${target}(으)로 옮기고 삭제할까요?`))await pbCommit(d=>PB.removeCategory(d,c.id,target));}
    if(b.dataset.expEdit)pbOpenExpense(b.dataset.expEdit);
    if(b.dataset.expDelete&&confirm('이 기타 지출을 삭제할까요?'))await pbCommit(d=>d.expenses=d.expenses.filter(x=>x.id!==b.dataset.expDelete));
  });
  ['pb-search','pb-filter-cat','pb-filter-status','pb-sort','pb-over','pb-uncat'].forEach(id=>document.getElementById(id).addEventListener('input',pbRenderList));
  document.getElementById('pb-reset').onclick=()=>{['pb-search','pb-filter-cat','pb-filter-status','pb-sort'].forEach(id=>document.getElementById(id).value='');['pb-over','pb-uncat'].forEach(id=>document.getElementById(id).checked=false);pbRenderList();};
  document.getElementById('pb-add').onclick=()=>pbOpenPart();
  document.getElementById('pb-cancel').onclick=()=>document.getElementById('pb-part-form').hidden=true;
  document.getElementById('pb-part-form').onsubmit=pbSavePart;
  document.getElementById('pb-part-form').oninput=pbPreview;
  document.getElementById('pb-overall-form').onsubmit=async e=>{e.preventDefault();try{const n=PB.number(v('pb-overall'),false);await pbCommit(d=>d.overallBudget=n);}catch(err){setText('pb-message',err.message);}};
  document.getElementById('pb-category-new').onclick=()=>pbOpenCategory();
  document.getElementById('pb-category-form').onsubmit=async e=>{e.preventDefault();try{const name=v('pb-category-name').trim(),allocation=PB.number(v('pb-category-allocation'),false),id=pbCategoryEdit||pbId(),editing=!!pbCategoryEdit;if(await pbCommit(d=>{if(editing){PB.rename(d,id,name);d.categories.find(c=>c.id===id).allocation=allocation;}else d.categories.push({id,name,allocation});}))pbOpenCategory();}catch(err){setText('pb-message',err.message);}};
  document.getElementById('pb-exp-add').onclick=()=>pbOpenExpense();
  document.getElementById('pb-exp-cancel').onclick=()=>document.getElementById('pb-exp-form').hidden=true;
  document.getElementById('pb-exp-form').onsubmit=async e=>{e.preventDefault();try{const id=pbExpenseEdit||pbId(),patch={id},editing=!!pbExpenseEdit;['name','cat','date','vendor','note'].forEach(k=>patch[k]=v('pb-exp-'+k).trim());patch.amount=PB.number(v('pb-exp-amount'),false);if(await pbCommit(d=>{const i=d.expenses.findIndex(x=>x.id===id);if(editing&&i<0)throw Error('삭제된 지출입니다.');if(i<0)d.expenses.push(patch);else d.expenses[i]={...d.expenses[i],...patch};}))document.getElementById('pb-exp-form').hidden=true;}catch(err){setText('pb-message',err.message);}};
  document.getElementById('pb-export').onclick=pbExport;
}
