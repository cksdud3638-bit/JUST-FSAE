/* Team accounting: cash and incurred expenses are deliberately separate. */
const FIN = (() => {
  const list = x => Object.values(x || {});
  const copy = x => JSON.parse(JSON.stringify(x));
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
  const money = (x, positive=false) => {
    if(x==='' || x==null || !['string','number'].includes(typeof x))throw Error('금액을 입력하세요.');
    const n=Number(x);if(!Number.isSafeInteger(n)||n<(positive?1:0)||n>1e12)throw Error('금액은 1조 원 이하의 정수로 입력하세요.');return n;
  };
  function date(x){if(!/^\d{4}-\d{2}-\d{2}$/.test(x)||!Number.isFinite(Date.parse(x+'T00:00:00Z'))||new Date(x+'T00:00:00Z').toISOString().slice(0,10)!==x)throw Error('올바른 날짜를 입력하세요.');return x;}
  function validate(d){
    if(d.version!==1)throw Error('지원하지 않는 회계 데이터 버전입니다.');
    d.openingBalance=money(d.openingBalance);date(d.startDate);
    const ids=new Set();let size=0;
    for(const e of d.entries){
      if(!e.id||typeof e.id!=='string'||ids.has(e.id))throw Error('잘못되거나 중복된 거래 ID입니다.');ids.add(e.id);
      if(!['income','expense'].includes(e.kind)||!['team','personal'].includes(e.payer))throw Error('거래 구분을 확인하세요.');
      money(e.amount,true);date(e.date);if(e.date<d.startDate)throw Error('거래일은 장부 시작일 이후여야 합니다.');
      for(const k of ['title','category','fund','person','vendor','note','link'])if(typeof e[k]!=='string'||e[k].length>2000)throw Error('거래 입력 내용을 확인하세요.');
      if(!e.title.trim()||!e.category.trim()||!e.fund.trim())throw Error('항목, 분류, 재원을 입력하세요.');
      if(typeof e.reimbursed!=='boolean'||typeof e.voided!=='boolean')throw Error('정산 상태가 올바르지 않습니다.');
      if(e.kind==='income'&&(e.payer!=='team'||e.reimbursed||e.link))throw Error('수입에는 선결제 또는 부품 연결을 지정할 수 없습니다.');
      if(e.kind==='expense'&&e.payer==='personal'&&!e.person.trim())throw Error('선결제자를 입력하세요.');
      if(e.reimbursed){date(e.reimbursementDate);if(e.kind!=='expense'||e.payer!=='personal'||e.reimbursementDate<e.date)throw Error('환급일과 결제 구분을 확인하세요.');}
      if(e.receipt){
        if(typeof e.receipt.name!=='string'||e.receipt.name.length>250||!/^data:(image\/(png|jpeg)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(e.receipt.data)||e.receipt.data.length>700000)throw Error('증빙은 500KB 이하의 JPG·PNG·PDF만 지원합니다.');
        size+=e.receipt.data.length;
      }
    }
    if(size>10000000)throw Error('증빙 저장 용량이 10MB를 초과했습니다. 기존 증빙을 백업 후 정리하세요.');
    return d;
  }
  function decode(raw){return validate({version:raw?.version??1,openingBalance:raw?.openingBalance??0,startDate:raw?.startDate||'2026-01-01',entries:list(raw?.entries).map(copy)});}
  function totals(d, month=''){
    const all=d.entries.filter(e=>!e.voided), selected=all.filter(e=>!month||e.date.startsWith(month));
    const income=selected.filter(e=>e.kind==='income').reduce((s,e)=>s+e.amount,0);
    const expense=selected.filter(e=>e.kind==='expense').reduce((s,e)=>s+e.amount,0);
    // Refunds belong to the month actually paid, even if the purchase was earlier.
    const cashIn=income;
    const cashOut=all.reduce((s,e)=>s+(e.kind==='expense'&&((e.payer==='team'&&(!month||e.date.startsWith(month)))||(e.payer==='personal'&&e.reimbursed&&(!month||e.reimbursementDate.startsWith(month))))?e.amount:0),0);
    const pending=all.filter(e=>e.kind==='expense'&&e.payer==='personal'&&!e.reimbursed).reduce((s,e)=>s+e.amount,0);
    return {income,expense,cashIn,cashOut,pending,balance:d.openingBalance+all.reduce((s,e)=>s+(e.kind==='income'?e.amount:e.payer==='team'||e.reimbursed?-e.amount:0),0)};
  }
  function csv(rows){const cell=x=>'"'+String(x??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n');}
  return {list,copy,today,money,date,validate,decode,totals,csv};
})();
if(typeof module!=='undefined')module.exports=FIN;

let financeData=FIN.decode(null),financeReady=false,financeBusy=false,financeEditing=null,financeReceipt=null;
const finEl=id=>document.getElementById('fin-'+id);
const finEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finWon=x=>'₩'+x.toLocaleString('ko-KR');
function financeReceive(raw){try{const first=!financeReady;financeData=FIN.decode(raw);financeReady=true;renderFinance();if(first)finMessage('서버 연결 완료');}catch(e){financeReady=false;finMessage(e.message);}}
function finMessage(s){if(finEl('message'))finEl('message').textContent=s;}
async function financeCommit(change){
  if(!financeReady||financeBusy){finMessage('서버 연결 또는 저장이 끝난 후 다시 시도하세요.');return false;}
  financeBusy=true;finMessage('저장 중…');
  try{
    const result=await db.ref('just/finance').transaction(raw=>{const d=FIN.decode(raw);change(d);return FIN.validate(d);},undefined,false);
    if(!result.committed)throw Error('저장이 취소되었습니다.');
    financeReceive(result.snapshot.val());finMessage('서버에 저장했습니다.');return true;
  }catch(e){finMessage('저장 실패: '+e.message);return false;}finally{financeBusy=false;}
}
function financeLinks(){
  if(typeof pbData==='undefined'||!pbData)return [];
  return [...pbData.parts.filter(p=>p.status!=='제외').map(p=>({id:'part:'+p.id,name:p.name,cat:p.cat,amount:p.actualUnitCost==null?null:p.purchasedQty*p.actualUnitCost})),...pbData.expenses.map(e=>({id:'expense:'+e.id,name:e.name,cat:e.cat,amount:e.amount}))];
}
function financeRows(){const month=finEl('month').value,q=finEl('search').value.trim().toLowerCase(),type=finEl('filter').value;return financeData.entries.filter(e=>(!e.voided||finEl('voids').checked)&&(!month||e.date.startsWith(month))&&(!q||[e.title,e.category,e.person,e.vendor,e.fund,e.note].join(' ').toLowerCase().includes(q))&&(!type||e.kind===type||(type==='pending'&&e.kind==='expense'&&e.payer==='personal'&&!e.reimbursed&&!e.voided))).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt-a.updatedAt);}
function renderFinance(){
  if(!finEl('rows'))return;
  const month=finEl('month').value,t=FIN.totals(financeData,month);
  const cards=[['장부 잔액 · 전체 기간',t.balance],['수입 · '+(month||'전체 기간'),t.income],['발생 지출 · '+(month||'전체 기간'),t.expense],['통장 출금 · '+(month||'전체 기간'),t.cashOut],['환급 대기 · 전체 기간',t.pending]];
  finEl('summary').innerHTML=cards.map(([label,n])=>`<div class="fin-card"><span>${label}</span><strong class="${n<0?'fin-negative':''}">${finWon(n)}</strong></div>`).join('');
  finEl('period').textContent=(month||'전체 기간')+' 거래일 기준 조회 · 통장 출금은 실제 결제일/환급일 기준입니다.';
  const rows=financeRows();finEl('count').textContent=rows.length+'건';
  finEl('rows').innerHTML=rows.length?rows.map(e=>`<tr class="${e.voided?'fin-void':''}"><td>${finEsc(e.date)}</td><td><span class="fin-tag ${e.kind}">${e.kind==='income'?'수입':'지출'}</span>${e.voided?' · 취소':''}</td><td><strong>${finEsc(e.title)}</strong><small>${finEsc(e.category)} · ${finEsc(e.fund)}</small>${e.link?'<small>부품·예산 연결: '+finEsc(e.linkName||e.link)+'</small>':''}${e.note?'<small>'+finEsc(e.note)+'</small>':''}</td><td>${finWon(e.amount)}</td><td>${finEsc(e.vendor||'—')}<small>${finEsc(e.person||'—')}</small></td><td>${e.kind==='income'?'입금':e.payer==='team'?'팀 자금 결제':e.reimbursed?'환급 완료 · '+finEsc(e.reimbursementDate):'개인 선결제 · 환급 대기'}</td><td>${e.receipt?`<button type="button" data-receipt="${finEsc(e.id)}">증빙 받기</button>`:'미첨부'}</td><td>${e.voided?`<button type="button" data-restore="${finEsc(e.id)}">복원</button>`:`<button type="button" data-edit="${finEsc(e.id)}">수정</button> <button type="button" data-void="${finEsc(e.id)}">취소 처리</button>`}</td></tr>`).join(''):'<tr><td colspan="8" class="fin-empty">표시할 거래가 없습니다. 첫 수입 또는 지출을 등록하세요.</td></tr>';
  if(!financeReady)finMessage('서버 연결 중…');
}
function financeOpen(id){
  const e=financeData.entries.find(e=>e.id===id);financeEditing=e?FIN.copy(e):null;financeReceipt=e?.receipt?FIN.copy(e.receipt):null;
  finEl('form').reset();finEl('form').hidden=false;finEl('form-title').textContent=e?'거래 수정':'거래 등록';
  const defaults={kind:'expense',date:FIN.today(),payer:'team',fund:'팀 운영비',category:'부품·제작비',reimbursementDate:FIN.today()};
  for(const k of ['kind','date','title','category','amount','fund','person','vendor','payer','note','reimbursementDate'])finEl(k).value=e?.[k]??defaults[k]??'';
  finEl('reimbursed').checked=e?.reimbursed||false;
  const links=financeLinks();if(e?.link&&!links.some(l=>l.id===e.link))links.push({id:e.link,name:e.linkName||'기존 연결 항목'});
  finEl('link').innerHTML='<option value="">연결 안 함</option>'+links.map(l=>`<option value="${finEsc(l.id)}">${finEsc(l.cat||'')} · ${finEsc(l.name)}</option>`).join('');finEl('link').value=e?.link||'';
  finReceiptLabel();financeFormState();finEl('form').scrollIntoView({behavior:'smooth',block:'start'});finEl('title').focus();
}
function finReceiptLabel(){finEl('receipt-label').textContent=financeReceipt?financeReceipt.name:'첨부된 증빙 없음';}
function financeFormState(){const income=finEl('kind').value==='income',personal=!income&&finEl('payer').value==='personal';finEl('payer').disabled=income;finEl('link').disabled=income;finEl('settlement').hidden=!personal;finEl('reimbursementDate').disabled=!personal||!finEl('reimbursed').checked;if(personal&&finEl('reimbursed').checked&&!finEl('reimbursementDate').value)finEl('reimbursementDate').value=FIN.today();}
function finDownload(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function initFinance(){
  const root=document.getElementById('tab-finance');if(!root)return;
  authWatch('just/finance',snap=>financeReceive(snap.val()));
  finEl('add').onclick=()=>financeOpen();finEl('cancel').onclick=()=>{finEl('form').hidden=true;financeEditing=null;financeReceipt=null;};
  ['month','filter','voids'].forEach(k=>finEl(k).onchange=renderFinance);finEl('search').oninput=renderFinance;
  finEl('all').onclick=()=>{finEl('month').value='';renderFinance();};
  ['kind','payer','reimbursed'].forEach(k=>finEl(k).onchange=financeFormState);
  finEl('link').onchange=()=>{const l=financeLinks().find(x=>x.id===finEl('link').value);if(l){if(!finEl('title').value)finEl('title').value=l.name;if(!finEl('amount').value&&l.amount>0)finEl('amount').value=l.amount;if(l.cat)finEl('category').value=l.cat;}finEl('link-warning').textContent=l?'연결은 참조용입니다. 기존 부품 비용은 자동 합산하지 않습니다. 분할 결제 시 이번 거래 금액만 입력하세요.':'';};
  finEl('receipt').onchange=async()=>{const file=finEl('receipt').files[0];if(!file)return;try{if(file.size>500*1024||!['image/png','image/jpeg','application/pdf'].includes(file.type))throw Error('500KB 이하의 JPG·PNG·PDF를 선택하세요.');const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('파일 읽기 실패'));r.readAsDataURL(file);});financeReceipt={name:file.name.slice(0,250),data};finReceiptLabel();}catch(e){finMessage(e.message);}finally{finEl('receipt').value='';}};
  finEl('remove-receipt').onclick=()=>{financeReceipt=null;finReceiptLabel();};
  finEl('form').onsubmit=async event=>{
    event.preventDefault();if(financeBusy)return;const original=financeEditing?FIN.copy(financeEditing):null;
    try{
      const e={id:original?.id||crypto.randomUUID(),createdAt:original?.createdAt||Date.now(),updatedAt:Date.now(),voided:false};
      for(const k of ['kind','date','title','category','fund','person','vendor','payer','note','link','reimbursementDate'])e[k]=finEl(k).value.trim();
      e.amount=FIN.money(finEl('amount').value,true);e.reimbursed=e.kind==='expense'&&e.payer==='personal'&&finEl('reimbursed').checked;
      if(e.kind==='income'){e.payer='team';e.link='';}if(!e.reimbursed)e.reimbursementDate='';
      e.linkName=financeLinks().find(l=>l.id===e.link)?.name||original?.linkName||'';if(financeReceipt)e.receipt=FIN.copy(financeReceipt);
      FIN.validate({...financeData,entries:[e]});
      finEl('submit').disabled=true;
      if(await financeCommit(d=>{const i=d.entries.findIndex(x=>x.id===e.id);if(original&&(i<0||JSON.stringify(d.entries[i])!==JSON.stringify(original)))throw Error('다른 사용자가 이 거래를 수정했습니다. 양식을 닫고 다시 열어 확인하세요.');if(i<0)d.entries.push(e);else d.entries[i]=e;})){finEl('form').hidden=true;financeEditing=null;financeReceipt=null;}
    }catch(e){finMessage(e.message);}finally{finEl('submit').disabled=false;}
  };
  root.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b)return;
    if(b.dataset.edit)financeOpen(b.dataset.edit);
    for(const key of ['void','restore'])if(b.dataset[key]){const id=b.dataset[key];if(confirm(key==='void'?'이 거래를 취소 처리할까요? 기록은 보존되며 합계에서 제외됩니다.':'이 거래를 복원하여 합계에 반영할까요?'))await financeCommit(d=>{const e=d.entries.find(e=>e.id===id);if(!e)throw Error('거래를 찾을 수 없습니다.');e.voided=key==='void';e.updatedAt=Date.now();});}
    if(b.dataset.receipt){const r=financeData.entries.find(e=>e.id===b.dataset.receipt)?.receipt;if(r){const a=document.createElement('a');a.href=r.data;a.download=r.name;a.click();}}
  });
  finEl('settings').onsubmit=async event=>{event.preventDefault();try{const openingBalance=FIN.money(finEl('opening').value),startDate=FIN.date(finEl('start').value);await financeCommit(d=>{d.openingBalance=openingBalance;d.startDate=startDate;});}catch(e){finMessage(e.message);}};
  finEl('settings-toggle').onclick=()=>{finEl('settings').hidden=!finEl('settings').hidden;if(!finEl('settings').hidden){finEl('opening').value=financeData.openingBalance;finEl('start').value=financeData.startDate;}};
  finEl('csv').onclick=()=>finDownload(FIN.csv([['거래일','구분','항목','분류','재원','금액','결제구분','담당/선결제자','거래처','환급여부','환급일','연결항목','증빙파일','메모','취소여부'],...financeRows().map(e=>[e.date,e.kind==='income'?'수입':'지출',e.title,e.category,e.fund,e.amount,e.payer==='team'?'팀 자금':'개인 선결제',e.person,e.vendor,e.reimbursed?'완료':'',e.reimbursementDate,e.linkName,e.receipt?.name,e.note,e.voided?'취소':''])]),'text/csv;charset=utf-8','JUST_회계_'+(finEl('month').value||'전체')+'.csv');
  finEl('backup').onclick=()=>finDownload(JSON.stringify({reportType:'finance-backup',exported:new Date().toISOString(),finance:financeData},null,2),'application/json','JUST_회계_증빙포함_'+FIN.today()+'.json');
  finEl('restore').onclick=()=>finEl('restore-file').click();
  finEl('restore-file').onchange=async()=>{const input=finEl('restore-file'),file=input.files[0];if(!file)return;try{if(file.size>15000000)throw Error('15MB 이하의 회계 백업을 선택하세요.');const backup=JSON.parse(await file.text());if(!backup.finance||!['finance-backup',undefined].includes(backup.reportType))throw Error('회계 데이터가 포함된 JSON 백업을 선택하세요.');const restored=FIN.decode(backup.finance);if(confirm(`현재 회계 장부를 백업의 ${restored.entries.length}건으로 교체할까요? 먼저 현재 장부를 백업해 주세요. 부품·예산 등 다른 데이터는 유지됩니다.`))await financeCommit(d=>{d.openingBalance=restored.openingBalance;d.startDate=restored.startDate;d.entries=FIN.copy(restored.entries);});}catch(e){finMessage('복원 실패: '+e.message);}finally{input.value='';}};
  renderFinance();
}
