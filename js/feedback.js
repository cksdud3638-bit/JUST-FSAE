// ═══════════════════════════════════════════════
// TAB 5: FEEDBACK + SETUP HISTORY
// ═══════════════════════════════════════════════
let radarChart=null, fbTrendChart=null, baChart=null;

function updateRating(key, val) {
  document.getElementById('rv-' + key).textContent = val;
  const slider = document.getElementById('fb-' + key);
  const pct = (val-1)/9*100;
  slider.style.background = `linear-gradient(90deg,#ff0000 ${pct}%,#222 ${pct}%)`;
}

function saveFeedback() {
  const driver = v('fb-driver').trim();
  const date = v('fb-date');
  if (!driver || !date) { alert('드라이버와 날짜를 입력하세요.'); return; }
  const vals = {
    cornerEntry:      parseInt(v('fb-cornerEntry'))      || 5,
    midBalance:       parseInt(v('fb-midBalance'))       || 5,
    exitTraction:     parseInt(v('fb-exitTraction'))     || 5,
    steeringResponse: parseInt(v('fb-steeringResponse')) || 5,
    brakeFeel:        parseInt(v('fb-brakeFeel'))        || 5,
    understeer:       parseInt(v('fb-understeer'))       || 5,
    oversteer:        parseInt(v('fb-oversteer'))        || 5,
  };
  const overall = Math.round(Object.values(vals).reduce((a,b)=>a+b,0) / 7);
  const fb = {
    id: Date.now(),
    driver, date,
    setupLink: v('fb-setup-link'),
    testLogLink: v('fb-testlog-link') || '',
    ...vals,
    overall,
    comment: v('fb-comment'),
  };
  S.feedbacks.unshift(fb);
  save('feedbacks');
  renderFeedbackCharts();
  document.getElementById('fb-driver').value='';
  document.getElementById('fb-comment').value='';
  alert('피드백이 저장되었습니다!');
}

function saveSetupChange() {
  const what = v('sh-what').trim();
  const date = v('sh-date');
  if (!what || !date) { alert('날짜와 변경 항목을 입력하세요.'); return; }
  const sh = {
    id: Date.now(),
    date, what,
    change: v('sh-change'),
    why: v('sh-why'),
    expect: v('sh-expect'),
  };
  S.setupHistory.unshift(sh);
  save('setupHistory');
  renderSetupHistory();
  populateSetupLinks();
  ['sh-date','sh-what','sh-change','sh-why','sh-expect'].forEach(id=>{ document.getElementById(id).value=''; });
}

function renderSetupHistory() {
  const el = document.getElementById('setup-history-list');
  if (!S.setupHistory.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div><p>셋업 변경 기록이 없습니다</p></div>';
    return;
  }
  el.innerHTML = S.setupHistory.map(sh => {
    const after = S.feedbacks.filter(f=>f.date>=sh.date).slice(0,1)[0];
    const before = S.feedbacks.filter(f=>f.date<sh.date).slice(0,1)[0];
    const effect = after && before ?
      `전/후 종합: ${before.overall}점 → ${after.overall}점 ${after.overall>before.overall?'(+'+((after.overall-before.overall))+'↑)':'('+((after.overall-before.overall))+'↓)'}` : null;
    return `<div class="setup-history-item">
      <div class="sh-date">${sh.date}</div>
      <div class="sh-what">${sh.what}</div>
      ${sh.change?`<div style="font-size:12px;color:#ffaa00;margin-top:4px">📊 ${sh.change}</div>`:''}
      ${sh.why?`<div class="sh-why">💡 ${sh.why}</div>`:''}
      ${sh.expect?`<div class="sh-why" style="color:#888">목표: ${sh.expect}</div>`:''}
      ${effect?`<div class="sh-effect">✓ ${effect}</div>`:''}
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;color:#ff4444" onclick="deleteSetup(${sh.id})">삭제</button>
    </div>`;
  }).join('');
}

function deleteSetup(id) {
  S.setupHistory = S.setupHistory.filter(s=>s.id!==id);
  save('setupHistory');
  renderSetupHistory();
}

function populateSetupLinks() {
  const sel = document.getElementById('fb-setup-link');
  if (!sel) return;
  sel.innerHTML = '<option value="">없음</option>' + S.setupHistory.map(sh =>
    `<option value="${sh.id}">${sh.date} - ${sh.what}</option>`
  ).join('');
}

function populateTestLogLinks() {
  const sel = document.getElementById('fb-testlog-link');
  if (!sel) return;
  sel.innerHTML = '<option value="">없음</option>' + (S.testLogs || []).map(l =>
    `<option value="${l.id}">${l.date} — ${l.result ? l.result.slice(0,30) : '(결과 미입력)'}</option>`
  ).join('');
}

function renderFeedbackCharts() {
  renderRadar();
  renderFbTrend();
  renderBeforeAfter();
}

function renderRadar() {
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (radarChart) radarChart.destroy();
  if (!S.feedbacks.length) return;

  const recent = S.feedbacks.slice(0,3);
  const colors = ['#ff0000','#00cc66','#0088ff'];

  const fbData = fb => fb.cornerEntry != null
    ? [fb.cornerEntry, fb.midBalance, fb.exitTraction, fb.steeringResponse, fb.brakeFeel, fb.understeer, fb.oversteer]
    : [fb.handling||5, fb.braking||5, fb.accel||5, fb.comfort||5, fb.overall||5, 5, 5];
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['코너 진입','중립 밸런스','탈출 트랙션','조향 응답성','브레이크 감각','언더스티어','오버스티어'],
      datasets: recent.map((fb,i) => ({
        label: `${fb.driver} (${fb.date})`,
        data: fbData(fb),
        borderColor: colors[i%colors.length],
        backgroundColor: colors[i%colors.length]+'22',
        pointBackgroundColor: colors[i%colors.length],
      }))
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 10,
          grid: { color: '#222' },
          angleLines: { color: '#222' },
          pointLabels: { color: '#888', font:{size:11} },
          ticks: { color: '#555', backdropColor: 'transparent', stepSize: 2 }
        }
      },
      plugins: { legend: { labels: { color: '#888', font:{size:10} } } }
    }
  });
}

function renderFbTrend() {
  const ctx = document.getElementById('fbTrendChart').getContext('2d');
  if (fbTrendChart) fbTrendChart.destroy();
  if (S.feedbacks.length < 2) return;

  const sorted = [...S.feedbacks].sort((a,b)=>a.date.localeCompare(b.date));
  const fields = [
    {key:'cornerEntry',label:'코너 진입',color:'#ff0000'},
    {key:'exitTraction',label:'탈출 트랙션',color:'#00cc66'},
    {key:'steeringResponse',label:'조향 응답',color:'#0088ff'},
    {key:'overall',label:'종합',color:'#ffaa00'},
  ];

  fbTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(f=>f.date),
      datasets: fields.map(f=>({
        label: f.label,
        data: sorted.map(fb=>fb[f.key]),
        borderColor: f.color,
        backgroundColor: f.color+'22',
        tension: 0.4, pointRadius: 4,
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color:'#888',font:{size:10} } } },
      scales: {
        x: { grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10}} },
        y: { min:0, max:10, grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10}} }
      }
    }
  });
}

function renderBeforeAfter() {
  if (!S.setupHistory.length || S.feedbacks.length < 2) {
    document.getElementById('beforeafter-panel').style.display='none';
    return;
  }
  const sh = S.setupHistory[0];
  const after = S.feedbacks.filter(f=>f.date>=sh.date).slice(0,1)[0];
  const before = S.feedbacks.filter(f=>f.date<sh.date).slice(0,1)[0];
  if (!after || !before) { document.getElementById('beforeafter-panel').style.display='none'; return; }

  document.getElementById('beforeafter-panel').style.display='block';
  const ctx = document.getElementById('beforeAfterChart').getContext('2d');
  if (baChart) baChart.destroy();

  const labels = ['코너 진입','중립 밸런스','탈출 트랙션','조향 응답성','브레이크 감각','언더스티어','오버스티어'];
  const toArr = fb => fb.cornerEntry != null
    ? [fb.cornerEntry,fb.midBalance,fb.exitTraction,fb.steeringResponse,fb.brakeFeel,fb.understeer,fb.oversteer]
    : [fb.handling||5,fb.braking||5,fb.accel||5,fb.comfort||5,fb.overall||5,5,5];
  const beforeData = toArr(before);
  const afterData  = toArr(after);

  baChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: `변경 전 (${before.date} · ${before.driver})`, data: beforeData, backgroundColor: 'rgba(100,100,100,0.5)', borderColor: '#555', borderWidth:2, borderRadius:4 },
        { label: `변경 후 (${after.date} · ${after.driver})`, data: afterData, backgroundColor: 'rgba(255,0,0,0.4)', borderColor: '#ff0000', borderWidth:2, borderRadius:4 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels:{color:'#888',font:{size:11}} } },
      scales: {
        x: { grid:{color:'#1a1a1a'}, ticks:{color:'#888'} },
        y: { min:0, max:10, grid:{color:'#1a1a1a'}, ticks:{color:'#666'} }
      }
    }
  });
}
