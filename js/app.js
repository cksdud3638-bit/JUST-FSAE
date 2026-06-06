// ═══════════════════════════════════════════════
// HOME DASHBOARD
// ═══════════════════════════════════════════════
function renderHome() {
  const el = id => document.getElementById(id);

  // 1. 인스펙션 통과율
  const allIds = [];
  if (typeof INSP_DATA !== 'undefined') {
    INSP_DATA.forEach(cat => cat.items.forEach(item => allIds.push(item.id)));
  }
  const total  = allIds.length;
  const passed = allIds.filter(id => S.inspection[id] === 'pass').length;
  const failed = allIds.filter(id => S.inspection[id] === 'fail').length;
  const rate   = total > 0 ? Math.round(passed / total * 100) : 0;
  if (el('home-insp-rate')) el('home-insp-rate').textContent = rate + '%';
  if (el('home-insp-sub'))  el('home-insp-sub').textContent  = `통과 ${passed} / 전체 ${total} (미통과 ${failed})`;
  if (el('home-insp-bar'))  el('home-insp-bar').style.width  = rate + '%';

  // 2. 남은 예산
  let totalLimit = 0, totalSpent = 0;
  if (S.budget && S.budget.limits)   Object.values(S.budget.limits).forEach(v => { totalLimit += (v || 0); });
  if (S.budget && S.budget.expenses) S.budget.expenses.forEach(e => { totalSpent += (e.amount || 0); });
  const remain = totalLimit - totalSpent;
  const bRate  = totalLimit > 0 ? Math.round(totalSpent / totalLimit * 100) : 0;
  if (el('home-budget-remain')) el('home-budget-remain').textContent = '₩' + remain.toLocaleString();
  if (el('home-budget-sub'))    el('home-budget-sub').textContent    = `지출 ₩${totalSpent.toLocaleString()} / 한도 ₩${totalLimit.toLocaleString()}`;
  if (el('home-budget-rate'))   el('home-budget-rate').textContent   = bRate + '%';
  if (el('home-budget-detail')) el('home-budget-detail').textContent = totalLimit > 0 ? `₩${totalSpent.toLocaleString()} 사용` : '예산 미설정';

  // 3. 부품 총 중량
  const totalWeight = S.parts.reduce((a, p) => a + (p.weight || 0) * (p.qty || 1), 0);
  const catCount    = [...new Set(S.parts.map(p => p.cat))].length;
  if (el('home-parts-weight')) el('home-parts-weight').textContent = totalWeight.toLocaleString() + ' g';
  if (el('home-parts-sub'))    el('home-parts-sub').textContent    = S.parts.length ? `${S.parts.length}개 부품 · ${catCount}개 카테고리` : '부품 없음';

  // 4. 마지막 테스트
  if (S.testLogs && S.testLogs.length) {
    const sorted = [...S.testLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const last = sorted[0];
    if (el('home-last-test'))       el('home-last-test').textContent       = last.date || '-';
    if (el('home-last-test-title')) el('home-last-test-title').textContent = last.title || '제목 없음';
  } else {
    if (el('home-last-test'))       el('home-last-test').textContent       = '-';
    if (el('home-last-test-title')) el('home-last-test-title').textContent = '기록 없음';
  }

  // 5. D-Day
  const compEl = document.getElementById('comp-date');
  const compVal = compEl ? compEl.value : '';
  if (compVal) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const comp  = new Date(compVal); comp.setHours(0, 0, 0, 0);
    const diff  = Math.round((comp - today) / 86400000);
    if (el('home-dday-num')) {
      el('home-dday-num').textContent = Math.abs(diff);
      el('home-dday-num').style.color = diff < 0 ? '#ffaa00' : (diff <= 7 ? '#ff6600' : 'var(--red)');
    }
    if (el('home-dday-label')) el('home-dday-label').textContent = diff < 0 ? 'DAYS AGO' : 'DAYS LEFT';
    if (el('home-dday-date'))  el('home-dday-date').textContent  = compVal + (diff === 0 ? ' — 오늘!' : diff < 0 ? ' (종료)' : '');
  } else {
    if (el('home-dday-num'))   el('home-dday-num').textContent   = '-';
    if (el('home-dday-date'))  el('home-dday-date').textContent  = '대회 날짜 미설정 — 인스펙션 탭에서 설정';
  }

  // 6. 최근 미통과 항목
  const failIds = Object.entries(S.inspection).filter(([, v]) => v === 'fail').map(([k]) => k);
  const failBox = el('home-fail-list');
  if (failBox) {
    if (!failIds.length) {
      failBox.innerHTML = '<div class="empty-state" style="padding:24px 16px"><div class="empty-icon">✅</div><p>미통과 항목이 없습니다</p></div>';
    } else {
      const show = failIds.slice(0, 3);
      failBox.innerHTML = show.map(id => {
        let itemName = id, catName = '';
        if (typeof INSP_DATA !== 'undefined') {
          INSP_DATA.forEach(cat => {
            const found = cat.items.find(it => it.id === id);
            if (found) { itemName = found.name; catName = cat.cat; }
          });
        }
        return `<div class="issue-item">
          <span class="issue-badge" style="background:rgba(255,0,0,0.15);color:#ff4444;border:1px solid rgba(255,0,0,0.3)">FAIL</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${itemName}</div>
            <div style="font-size:11px;color:#555;margin-top:2px">${catName}</div>
          </div>
        </div>`;
      }).join('') + (failIds.length > 3 ? `<div style="font-size:12px;color:#666;text-align:center;padding:8px">외 ${failIds.length - 3}개 미통과</div>` : '');
    }
  }

  // 7. 랩타임 요약
  if (el('home-lap-count')) el('home-lap-count').textContent = S.lapTimes.length;
  if (S.lapTimes.length && typeof formatTime === 'function') {
    const best = Math.min(...S.lapTimes.map(l => l.sec));
    if (el('home-lap-best')) el('home-lap-best').textContent = '최고: ' + formatTime(best);
  } else {
    if (el('home-lap-best')) el('home-lap-best').textContent = '최고기록 없음';
  }

  // 8. 테스트 일지 건수
  if (el('home-log-count')) el('home-log-count').textContent = S.testLogs ? S.testLogs.length : 0;

  // 9. 마지막 동기화
  const stEl = document.getElementById('save-time');
  if (stEl && el('home-sync-time')) el('home-sync-time').textContent = stEl.textContent || '동기화 중...';
}

// ═══════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════
function switchTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  btn.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
  if (name === 'home')     { renderHome(); }
  if (name === 'laptime')  { renderLapCharts(); populateTestSessions(); }
  if (name === 'fuel')     { calcFuel(); }
  if (name === 'feedback') { renderFeedbackCharts(); renderSetupHistory(); populateSetupLinks(); populateTestLogLinks(); }
  if (name === 'testlog')  { renderTestLogs(); }
  if (name === 'budget')   { renderBudget(); }
  if (name === 'parts')    { renderParts(); }
}

function switchTabByName(name) {
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if (btn) switchTab(name, btn);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().slice(0,10);
  ['lt-date','log-date','fb-date','sh-date'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  buildInspection();
  renderHome();

  db.ref('just').on('value', function(snapshot) {
    const data = snapshot.val() || {};
    if (data.lapTimes)       S.lapTimes       = data.lapTimes;
    if (data.testLogs)       S.testLogs       = data.testLogs;
    if (data.feedbacks)      S.feedbacks      = data.feedbacks;
    if (data.setupHistory)   S.setupHistory   = data.setupHistory;
    if (data.budget)         S.budget         = data.budget;
    if (data.parts)          S.parts          = data.parts;
    if (data.inspectionMeta) S.inspectionMeta = data.inspectionMeta;
    if (data.cornerWeights)  { S.cornerWeights = data.cornerWeights; restoreCornerWeights(); }

    // Legacy save-time display
    if (data.lastSave) {
      const el = document.getElementById('save-time');
      if (el) el.textContent = '마지막 저장: ' + data.lastSave;
    }

    // Sync indicator: show who last modified
    const modifier = data.lastModifier || '';
    setSyncState('synced', modifier);

    if (data.compDate != null) {
      const el = document.getElementById('comp-date');
      if (el && el.value !== data.compDate) {
        el.value = data.compDate;
        renderReport();
      }
    }
    renderLapTable(); renderDriverStats(); renderTestLogs(); renderSetupHistory();
    populateSetupLinks(); populateTestSessions(); populateTestLogLinks();
    calcFuel(); renderBudget(); renderParts(); renderHome();
  });

  // Remote-change detection: flag when another user triggers an update
  let _localSaveTs = 0;
  const _origSave = save;
  // Wrap save to timestamp local saves for remote-change detection
  db.ref('just/lastModifier').on('value', function(snap) {
    const mod = snap.val() || '';
    // If modifier doesn't start with "나 ·" it was another user
    if (mod && !mod.startsWith('나 ·')) {
      setSyncState('remote', mod);
    }
  });

  db.ref('just/inspection').on('value', function(snapshot) {
    const newState = snapshot.val() || {};
    S.inspection = newState;
    document.querySelectorAll('.insp-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.insp-item').forEach(function(r) { r.classList.remove('fail'); });
    Object.entries(newState).forEach(function([id, state]) {
      const row = document.getElementById('row-' + id);
      if (!row) return;
      const target = row.querySelector('.insp-btn.' + state);
      if (target) { target.classList.add('active'); if (state === 'fail') row.classList.add('fail'); }
    });
    updateInspStats(); renderReport(); renderHome();
  });

  ['cornerEntry','midBalance','exitTraction','steeringResponse','brakeFeel','understeer','oversteer'].forEach(k => updateRating(k, 5));

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { switchTab(this.dataset.tab, this); });
  });

  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import').addEventListener('click', importData);
  document.getElementById('btn-set-budget-limit').addEventListener('click', setBudgetLimit);
  document.getElementById('btn-add-expense').addEventListener('click', addExpense);
  document.getElementById('comp-date').addEventListener('change', function() {
    db.ref('just/compDate').set(this.value);
    renderReport();
  });

  const expDateEl = document.getElementById('exp-date');
  if (expDateEl) expDateEl.value = new Date().toISOString().slice(0,10);

  // Touch swipe navigation
  const _main = document.querySelector('.content');
  let _tx = 0, _ty = 0;
  _main.addEventListener('touchstart', e => {
    _tx = e.changedTouches[0].clientX;
    _ty = e.changedTouches[0].clientY;
  }, {passive: true});
  _main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _tx;
    const dy = e.changedTouches[0].clientY - _ty;
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 55) {
      const tabs = Array.from(document.querySelectorAll('.tab-btn'));
      const cur = tabs.findIndex(b => b.classList.contains('active'));
      const next = dx < 0 ? cur + 1 : cur - 1;
      if (next >= 0 && next < tabs.length) tabs[next].click();
    }
  }, {passive: true});
});
