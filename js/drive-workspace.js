// Trackside workspace. Forms are opened only for a deliberate add/edit action.
let dwDirty=false,dwLimit=30,dwLastScope=null;
function driveOpen(view){
 const dialog=driveEl('dw-editor');if(!dialog)return;
 driveView=view;document.querySelectorAll('.drive-section').forEach(el=>el.hidden=el.id!=='drive-'+view);
 const names={log:editLogId?'테스트 정보 수정':'새 테스트 만들기',laps:driveLapEdit?'랩 기록 수정':'랩 기록',feedback:driveFeedbackEdit?'드라이버 메모 수정':'드라이버 메모',setup:driveSetupEdit?'세팅 변경 수정':'세팅 변경',compare:'두 테스트 비교'};
 setText('dw-editor-title',names[view]||'기록 입력');setText('dw-editor-context',view==='log'?'이름과 날짜부터 입력하세요. 상세 정보는 나중에 추가해도 됩니다.':driveLabel(view==='laps'?v('lt-session'):view==='feedback'?v('fb-testlog-link'):view==='setup'?v('sh-session'):driveScope));
 setText('dw-editor-status','');dwDirty=false;renderDriving();
 if(!dialog.open)dialog.showModal();
 const first=driveEl('drive-'+view)?.querySelector('input:not([type=hidden]),select,textarea');first?.focus();
}
function driveClose(force=false){if(driveBusy)return false;if(!force&&dwDirty&&!confirm('입력 중인 내용을 버리고 닫을까요?'))return false;driveEl('dw-editor').close();dwDirty=false;return true;}
function driveSaved(kind){driveSet('drive-driver','');driveSet('dw-record-kind','all');renderDriving();if(kind==='laps'&&driveEl('drive-continue').checked){dwDirty=false;driveSet('lt-valid','valid');setText('dw-editor-status','저장했습니다. 다음 랩타임을 입력하세요.');driveEl('lt-time').focus();}else driveClose(true);}
function drivePrepareNew(kind){const log=S.testLogs.find(l=>DR.eq(l.id,driveScope));const prefix={laps:'lt',feedback:'fb',setup:'sh'}[kind];driveSet(prefix+'-date',log?.date||driveToday());driveSet(kind==='feedback'?'fb-testlog-link':prefix+'-session',log?.id||'');if(kind==='feedback'){driveSet('fb-setup-link','');driveLapOptions();}}
function driveStartLap(){driveNewLap();drivePrepareNew('laps');driveSet('lt-valid','valid');driveOpen('laps');}
function driveStartFeedback(lapId){driveNewFeedback();drivePrepareNew('feedback');if(lapId){const lap=S.lapTimes.find(l=>DR.eq(l.id,lapId));if(lap){driveOptions('fb-testlog-link',S.testLogs.map(l=>[l.id,driveTitle(l)]),'연결 안함',lap.sessionId||'');driveLapOptions();driveSet('fb-lap-link',lap.id);driveFeedbackLap(lap.id);}}driveOpen('feedback');}
function driveStartSetup(){driveNewSetup();drivePrepareNew('setup');driveOpen('setup');}
function driveToggleRatings(){driveEl('drive-ratings').hidden=!driveEl('drive-rate-enabled').checked;}
function driveMore(){dwLimit+=30;renderDriveWorkspace();}
function driveRenderAnalysis(){if(!driveEl('tab-driving').classList.contains('active'))return;renderDriverStats();renderLapCharts();renderFeedbackCharts();}
function renderDriveSessionList(){
 const query=v('log-search').trim().toLowerCase();const rows=DR.chronological(S.testLogs).reverse().filter(l=>[l.title,l.location,l.date,l.purpose,l.result].join(' ').toLowerCase().includes(query));
 setText('dw-test-count',S.testLogs.length+'개');driveEl('test-log-list').innerHTML=rows.map(l=>{const laps=DR.scope(S.lapTimes,'sessionId',String(l.id),S.testLogs);return `<button class="dw-session ${DR.eq(l.id,driveScope)?'is-current':''}" data-dw-select="${driveEsc(l.id)}" aria-pressed="${DR.eq(l.id,driveScope)}"><span>${driveEsc(l.date||'날짜 없음')}</span><strong>${driveEsc(l.title||l.result?.slice(0,35)||'이름 없는 테스트')}</strong><small>${driveEsc(l.location||'장소 미입력')} · ${laps.length}랩</small></button>`;}).join('')||'<div class="dw-empty-small">'+(S.testLogs.length?'검색 결과가 없습니다.':'아직 테스트가 없습니다.<br>첫 테스트를 만들어 보세요.')+'</div>';
}
function renderDriveWorkspace(){
 if(!driveEl('dw-timeline'))return;if(dwLastScope!==driveScope){dwLimit=30;dwLastScope=driveScope;}
 const log=S.testLogs.find(l=>DR.eq(l.id,driveScope));
 const title=log?(log.title||log.result?.slice(0,50)||'이름 없는 테스트'):driveScope==='unlinked'?'미연결 기록':'모든 주행 기록';
 const context=log?[log.date,log.location,log.weather,log.track].filter(Boolean).join(' · '):driveScope==='unlinked'?'테스트에 연결하지 않은 기록입니다. 편집에서 다시 연결할 수 있습니다.':'왼쪽에서 테스트를 선택하거나 새 테스트를 만들어 시작하세요.';
 driveEl('dw-test-heading').innerHTML=`<div class="dw-active-title"><div><span class="dw-eyebrow">${log?'선택한 테스트':'기록 보관함'}</span><h2>${driveEsc(title)}</h2><p>${driveEsc(context)}</p></div><div class="dw-title-actions">${log?driveButton('log',log.id,'테스트 정보 수정'):''}<button class="btn btn-ghost" onclick="driveShow('compare')">테스트 비교</button>${log?'<details class="dw-more-actions"><summary aria-label="테스트 추가 메뉴">···</summary>'+driveButton('deleteLog',log.id,'테스트 삭제')+'</details>':''}</div></div>${log?.purpose?'<p class="dw-purpose"><b>오늘의 목표</b> '+driveEsc(log.purpose)+'</p>':''}${log?.issues||log?.next?'<details class="dw-outcome"><summary>테스트 결과 · 다음 할 일</summary><p>'+driveEsc(log.result||'')+'</p><p>'+driveEsc(log.issues||'')+'</p><p>'+driveEsc(log.next||'')+'</p></details>':log?.result?'<p class="dw-purpose">'+driveEsc(log.result)+'</p>':''}`;
 const kind=v('dw-record-kind')||'all';let records=[];
 for(const key of ['lapTimes','feedbacks','setupHistory'])if(kind==='all'||kind===key)records.push(...driveRows(key).map(r=>({...r,dwKind:key})));
 records=DR.chronological(records).reverse();setText('drive-context',records.length+'개 기록 · 최근 기록부터 표시');
 const laps=driveRows('lapTimes'),best=DR.stats(laps).best;
 driveEl('dw-timeline').innerHTML=records.slice(0,dwLimit).map(r=>{
  const isLap=r.dwKind==='lapTimes',isFb=r.dwKind==='feedbacks';
  const label=isLap?'LAP':isFb?'MEMO':'SETUP';const heading=isLap?r.time||formatTime(r.sec):isFb?r.driver||'드라이버 메모':r.what||'세팅 변경';
  const meta=[r.date,isLap?r.driver:'',r.sessionNum,r.tireSet,r.setupVer].filter(Boolean).join(' · ');
  const detail=isLap?r.note:isFb?r.comment:[r.change,r.why,r.expect?'기대 효과: '+r.expect:''].filter(Boolean).join('\n');
  const scopeLabel=log?'':driveLabel(isFb?r.testLogLink:r.sessionId);
  const tag=isLap?(!DR.valid(r)?'<span class="dw-invalid">통계 제외</span>':DR.seconds(r)===best?'<span class="dw-best">BEST</span>':''):'';
  const linked=isFb&&r.lapId?S.lapTimes.find(l=>DR.eq(l.id,r.lapId)):null;
  const scores=isFb?driveRatings.filter(k=>r[k]!=null).map(k=>driveRatingLabels[driveRatings.indexOf(k)]+' '+r[k]).join(' · '):'';
  const legacy=isFb&&!scores?['handling','braking','accel','comfort','overall'].filter(k=>r[k]!=null).map(k=>({handling:'핸들링',braking:'제동',accel:'가속',comfort:'승차감',overall:'기존 종합'}[k])+': '+r[k]).join(' · '):'';
  return `<article class="dw-event ${isLap?'dw-lap':isFb?'dw-memo':'dw-setup'}"><div class="dw-event-type">${label}</div><div class="dw-event-body"><div class="dw-event-top"><h4>${driveEsc(heading)}</h4>${tag}<span class="dw-event-meta">${driveEsc(meta)}</span></div>${scopeLabel?'<p class="dw-event-meta">'+driveEsc(scopeLabel)+'</p>':''}${linked?'<p class="dw-event-meta">연결 랩 '+driveEsc(linked.time)+'</p>':''}<p class="dw-event-note">${driveEsc(detail||'추가 메모 없음')}</p>${scores||legacy?'<details class="dw-scores"><summary>평가 점수 보기</summary><p>'+driveEsc(scores||legacy)+'</p></details>':''}<div class="dw-event-actions">${isLap?'<button class="btn btn-ghost btn-sm" data-dw-feedback="'+driveEsc(r.id)+'">이 랩에 메모</button>':''}${driveButton(isLap?'lap':isFb?'feedback':'setup',r.id,'수정')}<details><summary>더 보기</summary>${driveButton(isLap?'deleteLap':isFb?'deleteFeedback':'deleteSetup',r.id,'삭제')}</details></div></div></article>`;
 }).join('')||`<div class="dw-empty"><span>＋</span><h3>${log?'첫 주행을 기록해 보세요':'표시할 기록이 없습니다'}</h3><p>${log?'랩타임을 기록하거나 주행 직후 드라이버 메모를 남기세요.':'테스트를 선택하거나 필터를 변경하세요. 기존 미연결 기록도 보존됩니다.'}</p><button class="btn btn-primary" onclick="${log?'driveStartLap()':'showNewLog()'}">${log?'첫 랩 기록':'새 테스트 만들기'}</button></div>`;
 driveEl('dw-more').hidden=records.length<=dwLimit;
 const analysis=document.querySelector('.dw-analysis');if(analysis?.open)driveRenderAnalysis();
}
function initDriveWorkspace(){
 const root=driveEl('tab-driving'),dialog=driveEl('dw-editor');
 const mobile=matchMedia('(max-width: 760px)');driveEl('dw-test-picker').open=!mobile.matches;mobile.addEventListener('change',e=>driveEl('dw-test-picker').open=!e.matches);
 root.addEventListener('click',e=>{const select=e.target.closest('[data-dw-select]');if(select){driveSelect(select.dataset.dwSelect);if(matchMedia('(max-width: 760px)').matches)driveEl('dw-test-picker').open=false;}const feedback=e.target.closest('[data-dw-feedback]');if(feedback)driveStartFeedback(feedback.dataset.dwFeedback);});
 dialog.addEventListener('input',()=>dwDirty=true);dialog.addEventListener('change',()=>dwDirty=true);
 dialog.addEventListener('cancel',e=>{e.preventDefault();driveClose();});
 // Save messages stay next to the editor, including errors and pending server writes.
 new MutationObserver(()=>setText('dw-editor-status',driveEl('drive-status').textContent)).observe(driveEl('drive-status'),{childList:true,subtree:true,characterData:true});
}
