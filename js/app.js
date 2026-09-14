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
  const insp=inspectionStats();
  const total=insp.applicable,passed=insp.pass,failed=insp.fail,rate=insp.rate;
  if (el('home-insp-rate')) el('home-insp-rate').textContent = rate + '%';
  if (el('home-insp-sub'))  el('home-insp-sub').textContent  = `통과 ${passed} / 전체 ${total} (미통과 ${failed})`;
  if (el('home-insp-bar'))  el('home-insp-bar').style.width  = rate + '%';

  // 2. 남은 예산
  const ledger = pbData || PB.migrate(S);
  const ledgerTotals = PB.totals(ledger);
  const totalLimit = ledger.overallBudget, totalSpent = ledgerTotals.actual;
  const remain = totalLimit - totalSpent;
  const bRate = Number.isFinite(ledgerTotals.usage) ? Math.round(ledgerTotals.usage) + '%' : '예산 없음';
  if (el('home-budget-remain')) el('home-budget-remain').textContent = '₩' + remain.toLocaleString();
  if (el('home-budget-sub'))    el('home-budget-sub').textContent    = `지출 ₩${totalSpent.toLocaleString()} / 한도 ₩${totalLimit.toLocaleString()}`;
  if (el('home-budget-rate'))   el('home-budget-rate').textContent   = bRate;
  if (el('home-budget-detail')) el('home-budget-detail').textContent = totalLimit > 0 ? `₩${totalSpent.toLocaleString()} 사용` : '예산 미설정';

  // 3. 부품 총 중량
  const totalWeight = ledgerTotals.weight;
  const catCount    = [...new Set(S.parts.map(p => p.cat))].length;
  if (el('home-parts-weight')) el('home-parts-weight').textContent = pbWeight(totalWeight);
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
  renderCompetitionDate();

  // 6. 최근 미통과 항목
  const failIds = INSP_DATA.flatMap(c=>c.items).filter(it=>inspectionState(it)==='fail').map(it=>it.id);
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
  if (S.lapTimes.some(DR.valid) && typeof formatTime === 'function') {
    const best = DR.stats(S.lapTimes).best;
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
  const legacyDrive={laptime:'laps',testlog:'log',feedback:'feedback'};
  const driveTarget=legacyDrive[name];
  if(driveTarget){name='driving';btn=document.querySelector('[data-tab="driving"]');}
  if (['budget','parts','weight'].includes(name)) { name='parts-budget'; btn=document.querySelector('[data-tab="parts-budget"]'); }
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  btn.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
  if (name === 'home')     { renderHome(); }
  if (name === 'driving')  { driveShow(driveTarget || driveView); }
  if (name === 'fuel')     { calcFuel(); }
  if (name === 'parts-budget') { renderPartsBudget(); renderWeightDistribution(); }
  if (name === 'parts')    { renderParts(); updateSliderFill(); updateWheelbaseMarkers(); }
  if (name === 'damper')   { if (typeof initDamper   === 'function') initDamper(); }
  if (name === 'radiator') { if (typeof calcRadiator === 'function') calcRadiator(); }
}

function switchTabByName(name) {
  if(['laptime','testlog','feedback'].includes(name)){switchTab(name,document.querySelector('[data-tab="driving"]'));return;}
  if (['budget','parts','weight'].includes(name)) name='parts-budget';
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if (btn) switchTab(name, btn);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const today = driveToday();
  ['lt-date','log-date','fb-date','sh-date'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  initPartsBudget();
  initCompetitionDate();
  initDriving();
  buildInspection();
  renderHome();
  updateSliderFill();

  db.ref('just').on('value', function(snapshot) {
    const data = snapshot.val() || {};
    receiveDriving(data);
    if (data.budget)         S.budget         = data.budget;
    pbReceive(data);
    S.inspectionMeta = data.inspectionMeta || {};
    INSP_DATA.forEach(cat=>cat.items.forEach(it=>restoreInspMeta(it.id,S.inspectionMeta[it.id] || {})));
    if (data.cornerWeights)  { S.cornerWeights = data.cornerWeights; restoreCornerWeights(); }
    if (data.wheelbase != null) {
      S.wheelbase = data.wheelbase;
      const wbEl = document.getElementById('pt-wheelbase');
      if (wbEl) wbEl.value = S.wheelbase;
    }
    if (data.targetFrontPct != null) {
      S.targetFrontPct = data.targetFrontPct;
      const tgtEl = document.getElementById('pt-target-front-pct');
      if (tgtEl) { tgtEl.value = S.targetFrontPct; syncTargetPct(); }
    }
    if (data.driverConfig != null) { S.driverConfig = data.driverConfig; restoreDriverFuelInputs(); }
    if (data.fuelConfig   != null) { S.fuelConfig   = data.fuelConfig;   restoreDriverFuelInputs(); }

    // Legacy save-time display
    if (data.lastSave) {
      const el = document.getElementById('save-time');
      if (el) el.textContent = '마지막 저장: ' + data.lastSave;
    }

    // Sync indicator: show who last modified
    const modifier = data.lastModifier || '';
    setSyncState('synced', modifier);

    receiveCompetitionDate(data.compDate || '');
    S.inspectionReview=data.inspectionReview || {};
    applyInspectionState();
    calcFuel(); renderPartsBudget(); renderParts(); renderHome();
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
    applyInspectionState();
    updateInspStats(); renderReport(); renderHome();
  });

  ['cornerEntry','midBalance','exitTraction','steeringResponse','brakeFeel','understeer','oversteer'].forEach(k => updateRating(k, 5));

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { switchTab(this.dataset.tab, this); });
  });

  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import').addEventListener('click', importData);


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
