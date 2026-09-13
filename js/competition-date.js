// A date-only value shared by the dashboard, inspection report and backups.
function competitionDay(value, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [y,m,d]=value.split('-').map(Number);
  const target=new Date(0);target.setUTCFullYear(y,m-1,d);target.setUTCHours(0,0,0,0);
  if(target.getUTCFullYear()!==y || target.getUTCMonth()!==m-1 || target.getUTCDate()!==d)return null;
  // Korean competition calendar; avoid UTC-midnight and DST off-by-one errors.
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=t=>Number(parts.find(p=>p.type===t).value);
  const days=Math.round((target.getTime()-Date.UTC(get('year'),get('month')-1,get('day')))/86400000);
  return {days,text:days===0?'D-Day':days>0?'D-'+days:'D+'+Math.abs(days),label:days===0?'대회 당일':days>0?'대회까지 남은 날':'대회일 이후'};
}
function renderCompetitionDate() {
  const date=S.compDate || '', result=competitionDay(date);
  setText('home-dday-num',result?.text || '—');
  setText('home-dday-label',result?.label || '대회 날짜 미설정');
  setText('home-dday-date',result?date+' · 한국 시간 기준':'아래에서 대회 날짜를 입력하세요.');
  setText('dday-num',result?.text || '—');setText('dday-lbl',result?.label || '');
  const wrap=document.getElementById('dday-wrap');if(wrap)wrap.style.display=result?'block':'none';
}
function receiveCompetitionDate(value, force = false) {
  const date=competitionDay(value)?value:'', changed=date!==S.compDate;
  S.compDate=date;
  ['home-comp-date','comp-date'].forEach(id=>{const el=document.getElementById(id);if(el && (changed || force || !el.value))el.value=S.compDate;});
  renderCompetitionDate();
}
async function saveCompetitionDate(value) {
  if(value && !competitionDay(value)){setText('comp-date-status','올바른 대회 날짜를 입력하세요.');return false;}
  setText('comp-date-status','저장 중…');
  try {
    await db.ref('just/compDate').set(value || '');
    receiveCompetitionDate(value,true);renderReport();
    setText('comp-date-status',value?'대회 날짜를 저장했습니다.':'대회 날짜를 지웠습니다.');return true;
  }catch(err){setText('comp-date-status','날짜를 저장하지 못했습니다. 연결을 확인하고 다시 시도하세요.');return false;}
}
function initCompetitionDate() {
  document.getElementById('competition-date-form')?.addEventListener('submit',e=>{e.preventDefault();saveCompetitionDate(v('home-comp-date'));});
  document.getElementById('clear-comp-date')?.addEventListener('click',()=>saveCompetitionDate(''));
  document.getElementById('comp-date')?.addEventListener('change',e=>saveCompetitionDate(e.target.value));
  // Refresh after midnight or returning to the app without rewriting saved data.
  setInterval(renderCompetitionDate,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderCompetitionDate();});
}
if(typeof module!=='undefined')module.exports={competitionDay};
