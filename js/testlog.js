// ═══════════════════════════════════════════════
// TAB 4: TEST LOG
// ═══════════════════════════════════════════════
let editLogId = null;
let selectedLogId = null;

function showNewLog() {
  editLogId = null;
  clearLogForm();
  document.getElementById('log-form-title').textContent = '새 일지 작성';
}

function clearLogForm() {
  ['log-date','log-temp','log-fride','log-rride','log-ftire','log-rtire',
   'log-fcamber','log-rcamber','log-tiretype','log-result','log-issues','log-next'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('log-weather').value='맑음';
  document.getElementById('log-track').value='건조';
  document.getElementById('log-compare-panel').style.display='none';
}

function saveLog() {
  const date = v('log-date');
  if (!date) { alert('날짜를 입력하세요.'); return; }

  const log = {
    id: editLogId || Date.now(),
    date,
    temp: v('log-temp'),
    weather: v('log-weather'),
    track: v('log-track'),
    setup: {
      fride: v('log-fride'), rride: v('log-rride'),
      ftire: v('log-ftire'), rtire: v('log-rtire'),
      fcamber: v('log-fcamber'), rcamber: v('log-rcamber'),
      tiretype: v('log-tiretype'),
    },
    result: v('log-result'),
    issues: v('log-issues'),
    next: v('log-next'),
  };

  if (editLogId) {
    const idx = S.testLogs.findIndex(l=>l.id===editLogId);
    if (idx>=0) S.testLogs[idx] = log;
    editLogId = null;
  } else {
    S.testLogs.unshift(log);
  }
  save('testLogs');
  renderTestLogs();
  clearLogForm();
  document.getElementById('log-form-title').textContent = '새 일지 작성';
}

function renderTestLogs() {
  const container = document.getElementById('test-log-list');
  const query = (document.getElementById('log-search')?.value||'').toLowerCase();
  const filtered = S.testLogs.filter(l =>
    !query || l.date.includes(query) || (l.result||'').toLowerCase().includes(query) || (l.issues||'').toLowerCase().includes(query)
  );
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>일치하는 일지가 없습니다</p></div>';
    return;
  }
  container.innerHTML = filtered.map(log => `
    <div class="test-log-item ${selectedLogId===log.id?'selected':''}" onclick="selectLog(${log.id})">
      <div class="log-date">${log.date}</div>
      <div class="log-title">${log.result ? log.result.slice(0,60)+'...' : '(결과 미입력)'}</div>
      <div class="log-meta">
        <span>${log.weather||''}</span>
        <span>${log.track||''}</span>
        <span>${log.temp?log.temp+'°C':''}</span>
      </div>
      <div class="tag-list">
        ${log.setup.fride?`<span class="log-tag">앞 RH: ${log.setup.fride}mm</span>`:''}
        ${log.setup.rride?`<span class="log-tag">뒤 RH: ${log.setup.rride}mm</span>`:''}
        ${log.setup.tiretype?`<span class="log-tag">${log.setup.tiretype}</span>`:''}
        ${log.issues?'<span class="log-tag" style="color:#ff4444;border-color:#330000">⚠ 이슈</span>':''}
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editLog(${log.id})">편집</button>
        <button class="btn btn-ghost btn-sm" style="color:#ff4444" onclick="event.stopPropagation();deleteLog(${log.id})">삭제</button>
        ${S.testLogs.indexOf(S.testLogs.find(l=>l.id===log.id)) < S.testLogs.length-1 ?
          `<button class="btn btn-ghost btn-sm" style="color:#0088ff;border-color:#001133" onclick="event.stopPropagation();compareLogs(${log.id})">이전 비교</button>` : ''
        }
        <button class="btn btn-ghost btn-sm" style="color:#00cc66;border-color:#003322" onclick="event.stopPropagation();showSessionLaps(${log.id})">🏁 랩타임</button>
      </div>
    </div>
  `).join('');
}

function selectLog(id) {
  selectedLogId = id;
  const log = S.testLogs.find(l=>l.id===id);
  if (!log) return;
  document.getElementById('log-date').value = log.date;
  document.getElementById('log-temp').value = log.temp||'';
  document.getElementById('log-weather').value = log.weather||'맑음';
  document.getElementById('log-track').value = log.track||'건조';
  document.getElementById('log-fride').value = log.setup.fride||'';
  document.getElementById('log-rride').value = log.setup.rride||'';
  document.getElementById('log-ftire').value = log.setup.ftire||'';
  document.getElementById('log-rtire').value = log.setup.rtire||'';
  document.getElementById('log-fcamber').value = log.setup.fcamber||'';
  document.getElementById('log-rcamber').value = log.setup.rcamber||'';
  document.getElementById('log-tiretype').value = log.setup.tiretype||'';
  document.getElementById('log-result').value = log.result||'';
  document.getElementById('log-issues').value = log.issues||'';
  document.getElementById('log-next').value = log.next||'';
  renderTestLogs();
}

function editLog(id) {
  editLogId = id;
  selectLog(id);
  document.getElementById('log-form-title').textContent = '일지 편집';
}

function deleteLog(id) {
  if (!confirm('이 일지를 삭제할까요?')) return;
  S.testLogs = S.testLogs.filter(l=>l.id!==id);
  save('testLogs');
  renderTestLogs();
}

function compareLogs(id) {
  const idx = S.testLogs.findIndex(l=>l.id===id);
  if (idx<0 || idx>=S.testLogs.length-1) return;
  const cur = S.testLogs[idx];
  const prev = S.testLogs[idx+1];
  const panel = document.getElementById('log-compare-panel');
  panel.style.display='block';
  const fields = [
    ['날짜','date'],['날씨','weather'],['노면','track'],
    ['앞 RH(mm)','setup.fride'],['뒤 RH(mm)','setup.rride'],
    ['앞 공기압','setup.ftire'],['뒤 공기압','setup.rtire'],
    ['앞 캠버','setup.fcamber'],['뒤 캠버','setup.rcamber'],
  ];
  const get = (obj, key) => key.split('.').reduce((o,k)=>o?.[k],'...');
  document.getElementById('log-compare-content').innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr><th style="text-align:left;padding:6px;color:#888">항목</th><th style="padding:6px;color:#0088ff">이전 (${prev.date})</th><th style="padding:6px;color:#ff0000">현재 (${cur.date})</th></tr>
      ${fields.map(([label, key]) => {
        const pv = get(prev, key)||'-', cv = get(cur, key)||'-';
        const diff = pv!==cv;
        return `<tr style="border-top:1px solid #1a1a1a">
          <td style="padding:6px;color:#666">${label}</td>
          <td style="padding:6px;text-align:center;color:#888">${pv}</td>
          <td style="padding:6px;text-align:center;color:${diff?'#ffaa00':'#555'};font-weight:${diff?700:400}">${cv}</td>
        </tr>`;
      }).join('')}
    </table>
  `;
}

function filterLogs() { renderTestLogs(); }

function showSessionLaps(logId) {
  const panel = document.getElementById('log-laps-panel');
  const content = document.getElementById('log-laps-content');
  if (!panel || !content) return;
  const laps = S.lapTimes.filter(l => String(l.sessionId) === String(logId));
  panel.style.display = 'block';
  if (!laps.length) {
    content.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-icon">🏁</div><p>이 세션에 연결된 랩타임이 없습니다<br><small style="color:#555">랩타임 탭에서 세션을 선택해 추가하세요</small></p></div>';
    return;
  }
  const bests = {};
  laps.forEach(l => { if (!bests[l.driver] || l.sec < bests[l.driver]) bests[l.driver] = l.sec; });
  content.innerHTML = `<table class="lap-table" style="width:100%"><thead><tr>
    <th>#</th><th>드라이버</th><th>랩타임</th><th>날씨</th><th>노면</th></tr></thead><tbody>` +
    laps.map((l, i) => {
      const isBest = l.sec === bests[l.driver];
      return `<tr>
        <td style="color:#555">${i+1}</td>
        <td style="font-weight:600;color:#ddd">${l.driver}</td>
        <td class="${isBest ? 'best-time' : ''}">${l.time}${isBest ? ' <span class="lap-badge badge-best">BEST</span>' : ''}</td>
        <td>${l.weather}</td><td>${l.track}</td></tr>`;
    }).join('') + '</tbody></table>';
}
