// ═══════════════════════════════════════════════
// TAB 2: LAP TIMES
// ═══════════════════════════════════════════════
let ltTrendChart=null, ltCompareChart=null;

function parseTime(s) {
  const m = s.match(/^(\d+):(\d+)\.(\d+)$/);
  if (!m) return null;
  return parseInt(m[1])*60 + parseInt(m[2]) + parseInt(m[3])/Math.pow(10,m[3].length);
}
function formatTime(sec) {
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return m + ':' + s.toFixed(3).padStart(6,'0');
}

function addLapTime() {
  const driver = v('lt-driver').trim();
  const date = v('lt-date');
  const time = v('lt-time').trim();
  const weather = v('lt-weather');
  const track = v('lt-track');
  const note = v('lt-note').trim();
  const sessionId = v('lt-session') || '';
  const sessionNum = v('lt-session-num').trim();
  const valid = v('lt-valid') || 'valid';
  const tireSet = v('lt-tireset').trim();
  const setupVer = v('lt-setup-ver').trim();

  if (!driver || !date || !time) { alert('드라이버, 날짜, 랩타임을 입력하세요.'); return; }
  const sec = parseTime(time);
  if (sec === null) { alert('랩타임 형식: 1:23.456'); return; }

  S.lapTimes.push({ id: Date.now(), driver, date, time, sec, weather, track, note, sessionId, sessionNum, valid, tireSet, setupVer });
  save('lapTimes');
  renderLapTable();
  renderDriverStats();
  renderLapCharts();
  ['lt-driver','lt-time','lt-note','lt-session-num','lt-tireset','lt-setup-ver'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

function populateTestSessions() {
  const sel = document.getElementById('lt-session');
  if (!sel) return;
  sel.innerHTML = '<option value="">연결 안함</option>' + (S.testLogs || []).map(l =>
    `<option value="${l.id}">${l.date} — ${l.result ? l.result.slice(0,30) : '(결과 미입력)'}</option>`
  ).join('');
}

function deleteLap(id) {
  S.lapTimes = S.lapTimes.filter(l => l.id !== id);
  save('lapTimes');
  renderLapTable();
  renderDriverStats();
  renderLapCharts();
}

function renderLapTable() {
  const tbody = document.getElementById('lap-tbody');
  if (!S.lapTimes.length) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:32px;color:#555">기록 없음</td></tr>';
    return;
  }
  const validLaps = S.lapTimes.filter(l => l.valid !== 'invalid');
  const bests = {};
  validLaps.forEach(l => {
    if (!bests[l.driver] || l.sec < bests[l.driver]) bests[l.driver] = l.sec;
  });
  tbody.innerHTML = S.lapTimes.map((l, i) => {
    const isInvalid = l.valid === 'invalid';
    const isBest = !isInvalid && l.sec === bests[l.driver];
    const sess = l.sessionId ? S.testLogs.find(t => String(t.id) === String(l.sessionId)) : null;
    const sessLabel = sess
      ? `<span style="background:#1e1e1e;border-radius:4px;padding:2px 6px;font-size:10px;color:#0088ff;border:1px solid #001133">${sess.date}</span>`
      : (l.sessionNum ? `<span style="color:#888;font-size:11px">${l.sessionNum}</span>` : '<span style="color:#333;font-size:11px">-</span>');
    return `<tr style="${isInvalid ? 'opacity:0.45;' : ''}">
      <td style="color:#555">${i + 1}</td>
      <td style="font-weight:600;color:#ddd">${l.driver}</td>
      <td style="color:#888">${l.date}</td>
      <td class="${isBest ? 'best-time' : ''}">
        ${l.time}
        ${isBest ? '<span class="lap-badge badge-best">BEST</span>' : ''}
        ${isInvalid ? '<span class="lap-badge" style="background:rgba(255,100,0,0.15);color:#ff6600;border:1px solid rgba(255,100,0,0.3)">무효</span>' : ''}
      </td>
      <td>${l.weather}</td>
      <td>${l.track}</td>
      <td>${sessLabel}</td>
      <td style="color:#888;font-size:11px">${l.tireSet||'-'}</td>
      <td style="color:#888;font-size:11px">${l.setupVer||'-'}</td>
      <td style="color:#666;font-size:12px">${l.note || '-'}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="deleteLap(${l.id})" style="color:#ff4444;border-color:#330000">삭제</button></td>
    </tr>`;
  }).join('');
}

function calcStdDev(times) {
  if (times.length < 2) return 0;
  const avg = times.reduce((a,b)=>a+b,0) / times.length;
  const variance = times.reduce((a,t)=>a+(t-avg)**2,0) / times.length;
  return Math.sqrt(variance);
}

function renderDriverStats() {
  const container = document.getElementById('driver-stats-list');
  if (!S.lapTimes.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏁</div><p>기록을 추가하면 통계가 표시됩니다</p></div>';
    return;
  }
  const drivers = {};
  S.lapTimes.forEach(l => {
    if (!drivers[l.driver]) drivers[l.driver] = { all: [], valid: [] };
    drivers[l.driver].all.push(l.sec);
    if (l.valid !== 'invalid') drivers[l.driver].valid.push(l.sec);
  });
  container.innerHTML = Object.entries(drivers).map(([d, data]) => {
    const times = data.valid.length ? data.valid : data.all;
    const best = Math.min(...times);
    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    const stddev = calcStdDev(times);
    const diff = avg - best;
    return `<div style="background:#1a1a1a;border-radius:8px;padding:14px;margin-bottom:10px;border-left:3px solid var(--red)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px">${d}</div>
        <div style="font-size:11px;color:#555">전체 ${data.all.length}랩 · 유효 ${data.valid.length}랩</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
        <div><div style="color:#888;margin-bottom:3px">최고기록 (유효)</div><div style="color:#00cc66;font-weight:700">${formatTime(best)}</div></div>
        <div><div style="color:#888;margin-bottom:3px">평균기록</div><div style="color:#ffaa00;font-weight:600">${formatTime(avg)}</div></div>
        <div><div style="color:#888;margin-bottom:3px">표준편차</div><div style="color:#0088ff;font-weight:600">±${stddev.toFixed(3)}s</div></div>
        <div><div style="color:#888;margin-bottom:3px">최고 ↔ 평균 차</div><div style="color:#cc66ff;font-weight:600">+${diff.toFixed(3)}s</div></div>
      </div>
    </div>`;
  }).join('');
}

function renderLapCharts() {
  renderLapTrend();
  renderLapCompare();
}

function renderLapTrend() {
  const ctx = document.getElementById('lapTrendChart').getContext('2d');
  if (ltTrendChart) ltTrendChart.destroy();
  if (!S.lapTimes.length) return;

  const drivers = [...new Set(S.lapTimes.map(l=>l.driver))];
  const colors = ['#ff0000','#00cc66','#0088ff','#ffaa00','#cc66ff'];
  const datasets = drivers.map((d,i) => {
    const times = S.lapTimes.filter(l=>l.driver===d).sort((a,b)=>a.date.localeCompare(b.date));
    return {
      label: d,
      data: times.map(t=>({ x: t.date, y: parseFloat(t.sec.toFixed(3)) })),
      borderColor: colors[i%colors.length],
      backgroundColor: colors[i%colors.length]+'33',
      pointBackgroundColor: colors[i%colors.length],
      tension: 0.3, fill: false, pointRadius: 5,
    };
  });

  ltTrendChart = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#888', font:{size:11} } } },
      scales: {
        x: { type:'category', grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10}} },
        y: {
          grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10},
            callback: v => formatTime(v)
          }
        }
      }
    }
  });
}

function renderLapCompare() {
  const ctx = document.getElementById('lapCompareChart').getContext('2d');
  if (ltCompareChart) ltCompareChart.destroy();
  if (!S.lapTimes.length) return;

  const drivers = [...new Set(S.lapTimes.map(l=>l.driver))];
  const bests = drivers.map(d => Math.min(...S.lapTimes.filter(l=>l.driver===d).map(l=>l.sec)));
  const colors = ['#ff0000','#00cc66','#0088ff','#ffaa00','#cc66ff'];

  ltCompareChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: drivers,
      datasets: [{
        label: '최고 랩타임 (초)',
        data: bests.map(s=>parseFloat(s.toFixed(3))),
        backgroundColor: drivers.map((_,i)=>colors[i%colors.length]+'aa'),
        borderColor: drivers.map((_,i)=>colors[i%colors.length]),
        borderWidth: 2, borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid:{color:'#1a1a1a'}, ticks:{color:'#888',font:{size:11}} },
        y: {
          grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10},
            callback: v => formatTime(v)
          }
        }
      }
    }
  });
}
