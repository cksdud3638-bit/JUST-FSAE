// ═══════════════════════════════════════════════
// TAB 7: PARTS WEIGHT/COST CALCULATOR
// ═══════════════════════════════════════════════
let partsWeightChart = null, partsCostChart = null;
const PARTS_COLORS = ['#ff0000','#00cc66','#0088ff','#ffaa00','#cc66ff','#ff6688','#00cccc','#ff8800'];
const POS_SLIDER_MIN = -600;
const POS_SLIDER_MAX = 2200;

function fmtWeight(g) {
  if (!g && g !== 0) return '0 g';
  const n = parseFloat(g);
  if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + ' kg';
  return n.toLocaleString() + ' g';
}

// ── Slider sync ──────────────────────────────
function syncPosSlider(src) {
  const numEl = document.getElementById('pt-axle-pos');
  const sldEl = document.getElementById('pt-pos-slider');
  if (!numEl || !sldEl) return;
  if (src === 'num') {
    const val = Math.max(POS_SLIDER_MIN, Math.min(POS_SLIDER_MAX, parseFloat(numEl.value) || 0));
    sldEl.value = val;
    numEl.value = val;
  } else {
    numEl.value = parseInt(sldEl.value);
  }
  updateSliderFill();
}

function updateSliderFill() {
  const sldEl = document.getElementById('pt-pos-slider');
  if (!sldEl) return;
  const pct = ((parseFloat(sldEl.value) - POS_SLIDER_MIN) / (POS_SLIDER_MAX - POS_SLIDER_MIN)) * 100;
  sldEl.style.background = `linear-gradient(to right,#ff0000 0%,#ff0000 ${pct}%,#2a2a2a ${pct}%,#2a2a2a 100%)`;
}

function updateWheelbaseMarkers() {
  const wbEl = document.getElementById('pt-wheelbase');
  const wb = wbEl ? (parseFloat(wbEl.value) || S.wheelbase || 1600) : (S.wheelbase || 1600);
  S.wheelbase = wb;
  const range = POS_SLIDER_MAX - POS_SLIDER_MIN;
  const frontPct = ((0 - POS_SLIDER_MIN) / range * 100).toFixed(2);
  const rearPct  = Math.min(((wb - POS_SLIDER_MIN) / range * 100), 99).toFixed(2);
  const fm = document.getElementById('pos-mark-front');
  const rm = document.getElementById('pos-mark-rear');
  if (fm) fm.style.left = frontPct + '%';
  if (rm) rm.style.left = rearPct + '%';
  const wbLbl = document.getElementById('pos-wb-label');
  if (wbLbl) wbLbl.textContent = wb;
}

function syncTargetPct() {
  const tgtEl = document.getElementById('pt-target-front-pct');
  const rearEl = document.getElementById('pt-target-rear-display');
  if (!tgtEl) return;
  const front = Math.min(90, Math.max(10, parseFloat(tgtEl.value) || 45));
  if (rearEl) rearEl.textContent = (100 - front).toFixed(0) + '%';
  S.targetFrontPct = front;
}

function saveVehicleConfig() {
  updateWheelbaseMarkers();
  syncTargetPct();
  save('wheelbase');
  save('targetFrontPct');
  renderWeightDistribution();
}

// ── Parts CRUD ───────────────────────────────
function addPart() {
  const name      = v('pt-name').trim();
  const cat       = v('pt-cat');
  const weight    = parseFloat(v('pt-weight')) || 0;
  const cost      = parseFloat(v('pt-cost'))   || 0;
  const qty       = Math.max(1, parseInt(v('pt-qty')) || 1);
  const note      = v('pt-note').trim();
  const valueType = v('pt-value-type') || '측정';
  const installed = document.getElementById('pt-installed')?.checked || false;
  const axlePosRaw = document.getElementById('pt-axle-pos')?.value;
  const axlePos   = (axlePosRaw !== '' && axlePosRaw != null) ? parseFloat(axlePosRaw) : null;
  const posType   = v('pt-pos-type') || '실측';
  if (!name) { alert('부품명을 입력하세요.'); return; }
  S.parts.push({ id: Date.now(), name, cat, weight, cost, qty, note, valueType, installed, axlePos, posType });
  save('parts');
  renderParts();
  document.getElementById('pt-name').value   = '';
  document.getElementById('pt-weight').value = '';
  document.getElementById('pt-cost').value   = '';
  document.getElementById('pt-qty').value    = '1';
  document.getElementById('pt-note').value   = '';
  const instEl = document.getElementById('pt-installed');
  if (instEl) instEl.checked = false;
  const posEl = document.getElementById('pt-axle-pos');
  const sldEl = document.getElementById('pt-pos-slider');
  if (posEl) posEl.value = '0';
  if (sldEl) { sldEl.value = '0'; updateSliderFill(); }
}

function deletePart(id) {
  S.parts = S.parts.filter(p => p.id !== id);
  save('parts');
  renderParts();
}

function renderParts() {
  renderPartsTable();
  renderPartsSummary();
  renderPartsCharts();
  renderWeightDistribution();
}

// ── Table ─────────────────────────────────────
function renderPartsTable() {
  const tbody = document.getElementById('parts-tbody');
  const empty = document.getElementById('parts-empty');
  if (!tbody) return;
  if (!S.parts.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = '';
    updatePartsTotals(0, 0, 0, 0);
    return;
  }
  if (empty) empty.style.display = 'none';
  let totalWeight = 0, totalQty = 0, totalCost = 0;
  tbody.innerHTML = S.parts.map((p, i) => {
    const tw = p.weight * p.qty;
    const tc = p.cost   * p.qty;
    totalWeight += tw; totalCost += tc; totalQty += p.qty;
    const vtColor = p.valueType === '측정' ? '#00cc66' : p.valueType === '카탈로그' ? '#0088ff' : '#ffaa00';
    const posCell = p.axlePos != null
      ? `<span style="color:#aaa">${p.axlePos}mm</span>${p.posType ? `<br><span style="color:#444;font-size:10px">${p.posType}</span>` : ''}`
      : '<span style="color:#333">—</span>';
    return `<tr>
      <td style="color:#555">${i + 1}</td>
      <td style="font-weight:600;color:#ddd">${p.name}</td>
      <td><span style="background:#1e1e1e;border-radius:4px;padding:2px 8px;font-size:11px;color:#aaa">${p.cat}</span></td>
      <td style="font-size:11px"><span style="color:${vtColor}">${p.valueType||'측정'}</span></td>
      <td style="text-align:center">${p.installed ? '<span style="color:#00cc66;font-size:13px">✓</span>' : '<span style="color:#333;font-size:13px">—</span>'}</td>
      <td style="font-size:11px;line-height:1.4">${posCell}</td>
      <td style="color:#ccc">${fmtWeight(p.weight)}</td>
      <td style="color:#ccc">${p.qty}</td>
      <td style="color:#ffaa00;font-weight:600">${fmtWeight(tw)}</td>
      <td style="color:#ccc">${p.cost.toLocaleString()}</td>
      <td style="color:#00cc66;font-weight:600">${tc.toLocaleString()}</td>
      <td style="color:#666;font-size:12px">${p.note || '-'}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="deletePart(${p.id})" style="color:#ff4444;border-color:#330000">삭제</button></td>
    </tr>`;
  }).join('');
  const cats = [...new Set(S.parts.map(p => p.cat))].length;
  updatePartsTotals(totalWeight, totalCost, cats, totalQty);
}

function updatePartsTotals(w, c, cats, qty) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('pt-total-weight', fmtWeight(w));
  set('pt-total-cost',   c.toLocaleString());
  set('pt-total-count',  (qty || 0));
  set('pt-cat-count',    cats);
  const target = parseFloat(document.getElementById('pt-target-weight')?.value) || 0;
  const diffEl = document.getElementById('pt-weight-diff');
  if (diffEl && target > 0) {
    const diff = w - target;
    if (diff > 0)      { diffEl.textContent = '+' + fmtWeight(diff) + ' 초과'; diffEl.style.color = '#ff4444'; }
    else if (diff < 0) { diffEl.textContent = fmtWeight(Math.abs(diff)) + ' 여유'; diffEl.style.color = '#00cc66'; }
    else               { diffEl.textContent = '목표 달성'; diffEl.style.color = '#ffaa00'; }
  } else if (diffEl) {
    diffEl.textContent = '—'; diffEl.style.color = '#555';
  }
}

// ── Corner weights ────────────────────────────
function calcCornerWeights() {
  const get = id => parseFloat(document.getElementById(id)?.value) || 0;
  const fl = get('cw-fl'), fr = get('cw-fr'), rl = get('cw-rl'), rr = get('cw-rr');
  const total = fl + fr + rl + rr;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  if (total <= 0) {
    ['cw-total','cw-front-pct','cw-rear-pct','cw-left-pct','cw-right-pct'].forEach(id => set(id, '—'));
    return;
  }
  set('cw-total',     total.toFixed(1) + ' kg');
  set('cw-front-pct', ((fl + fr) / total * 100).toFixed(1) + '%');
  set('cw-rear-pct',  ((rl + rr) / total * 100).toFixed(1) + '%');
  set('cw-left-pct',  ((fl + rl) / total * 100).toFixed(1) + '%');
  set('cw-right-pct', ((fr + rr) / total * 100).toFixed(1) + '%');
  S.cornerWeights = { fl, fr, rl, rr };
}

function saveCornerWeights() {
  calcCornerWeights();
  save('cornerWeights');
}

function restoreCornerWeights() {
  const cw = S.cornerWeights || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('cw-fl', cw.fl); set('cw-fr', cw.fr);
  set('cw-rl', cw.rl); set('cw-rr', cw.rr);
  if (cw.fl || cw.fr || cw.rl || cw.rr) calcCornerWeights();
}

// ── Weight distribution ───────────────────────
function calcWeightDistribution() {
  const wb = parseFloat(document.getElementById('pt-wheelbase')?.value) || S.wheelbase || 1600;
  const targetFront = parseFloat(document.getElementById('pt-target-front-pct')?.value) || S.targetFrontPct || 45;
  if (wb <= 0) return null;

  let M = 0, momentSum = 0, posCount = 0, missingCount = 0, missingWeight = 0;
  S.parts.forEach(p => {
    const w = (p.weight || 0) * (p.qty || 1);
    if (p.axlePos == null || p.axlePos === '' || isNaN(parseFloat(p.axlePos))) {
      missingCount++;
      missingWeight += w;
      return;
    }
    const x = parseFloat(p.axlePos);
    M += w;
    momentSum += w * x;
    posCount++;
  });

  if (M <= 0 || posCount === 0) return null;

  // xCG: 무게중심 위치 (앞차축 기준 mm)
  const xCG = momentSum / M;
  // 후륜 하중: 전체질량 × 무게중심/휠베이스 (전륜 기준 모멘트 평형)
  const WR = M * xCG / wb;
  const WF = M - WR;

  return {
    M, xCG, WF, WR,
    frontPct: WF / M * 100,
    rearPct:  WR / M * 100,
    posCount, totalParts: S.parts.length,
    missingCount, missingWeight,
    wb, targetFront,
    targetDiff: (WF / M * 100) - targetFront,
  };
}

function renderWeightDistribution() {
  const panel = document.getElementById('wd-result');
  if (!panel) return;

  // Sync inputs from S state if empty
  const wbEl  = document.getElementById('pt-wheelbase');
  const tgtEl = document.getElementById('pt-target-front-pct');
  if (wbEl  && !wbEl.value)  wbEl.value  = S.wheelbase      || 1600;
  if (tgtEl && !tgtEl.value) tgtEl.value = S.targetFrontPct || 45;
  syncTargetPct();
  updateWheelbaseMarkers();

  if (!S.parts.length) {
    panel.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-icon">⚖️</div><p>부품을 등록하면 전후 배분이 계산됩니다</p></div>`;
    return;
  }
  const res = calcWeightDistribution();
  if (!res) {
    panel.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-icon">⚖️</div><p>부품에 앞차축 기준 위치를 입력하면<br>전후 무게 배분이 자동 계산됩니다</p></div>`;
    return;
  }

  const fp   = res.frontPct.toFixed(1);
  const rp   = res.rearPct.toFixed(1);
  const diff = res.targetDiff;
  const diffStr   = (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
  const diffColor = Math.abs(diff) <= 1 ? '#00cc66' : Math.abs(diff) <= 3 ? '#ffaa00' : '#ff4444';

  let statusMsg = '', statusColor = '#888';
  if (Math.abs(diff) <= 1)      { statusMsg = '✅ 목표 배분 달성'; statusColor = '#00cc66'; }
  else if (Math.abs(diff) <= 3) { statusMsg = `목표 대비 ${diffStr} — 양호`; statusColor = '#ffaa00'; }
  else if (Math.abs(diff) <= 5) { statusMsg = `목표 대비 ${diffStr} — 조정 권장`; statusColor = '#ff8800'; }
  else                          { statusMsg = `목표 대비 ${diffStr} — 개선 필요`; statusColor = '#ff4444'; }

  const MKg  = (res.M  / 1000).toFixed(2);
  const WFKg = (res.WF / 1000).toFixed(2);
  const WRKg = (res.WR / 1000).toFixed(2);
  const xCGmm = Math.round(res.xCG);

  const warn = res.missingCount > 0
    ? `<div class="wd-warn">⚠ 위치 미입력 ${res.missingCount}개 부품 (${fmtWeight(res.missingWeight)}) — 계산 제외됨</div>` : '';

  panel.innerHTML = `
    ${warn}
    <div class="wd-result-grid">
      <div class="wd-res-card">
        <div class="wd-res-label">계산 포함 총중량</div>
        <div class="wd-res-val" style="color:#ffaa00">${MKg}</div>
        <div class="wd-res-unit">kg</div>
      </div>
      <div class="wd-res-card">
        <div class="wd-res-label">예상 전륜 하중</div>
        <div class="wd-res-val" style="color:#0088ff">${WFKg}</div>
        <div class="wd-res-unit">kg</div>
      </div>
      <div class="wd-res-card">
        <div class="wd-res-label">예상 후륜 하중</div>
        <div class="wd-res-val" style="color:#ee3300">${WRKg}</div>
        <div class="wd-res-unit">kg</div>
      </div>
      <div class="wd-res-card">
        <div class="wd-res-label">무게중심 위치</div>
        <div class="wd-res-val" style="color:#cc66ff">${xCGmm}</div>
        <div class="wd-res-unit">mm (앞차축 기준)</div>
      </div>
    </div>
    <div class="wd-bar-wrap">
      <div class="wd-bar-front" style="width:${fp}%">${parseFloat(fp) > 12 ? '전방 ' + fp + '%' : ''}</div>
      <div class="wd-bar-rear">${parseFloat(rp) > 12 ? '후방 ' + rp + '%' : ''}</div>
    </div>
    <div class="wd-target-row">
      <span style="color:#666;font-size:12px">목표 전방 ${res.targetFront.toFixed(0)}% : 후방 ${(100 - res.targetFront).toFixed(0)}%</span>
      <span style="color:${diffColor};font-weight:700;font-size:13px">차이 ${diffStr}</span>
    </div>
    <div style="font-size:12px;text-align:center;padding:6px 0 4px;color:${statusColor}">${statusMsg}</div>
    <div style="font-size:11px;color:#444;text-align:right;margin-top:4px">휠베이스 ${res.wb}mm · ${res.posCount}/${res.totalParts}개 부품 반영</div>
  `;
}

// ── Category summary ──────────────────────────
function renderPartsSummary() {
  const container = document.getElementById('parts-cat-summary');
  if (!container) return;
  if (!S.parts.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚙️</div><p>부품을 추가하면 카테고리 합산이 표시됩니다</p></div>';
    return;
  }
  const cats = {};
  S.parts.forEach(p => {
    if (!cats[p.cat]) cats[p.cat] = { weight: 0, cost: 0, qty: 0 };
    cats[p.cat].weight += p.weight * p.qty;
    cats[p.cat].cost   += p.cost   * p.qty;
    cats[p.cat].qty    += p.qty;
  });
  const totalWeight = Object.values(cats).reduce((a, c) => a + c.weight, 0);
  const totalCost   = Object.values(cats).reduce((a, c) => a + c.cost,   0);
  container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">${
    Object.entries(cats).map(([cat, d], i) => {
      const wPct = totalWeight > 0 ? (d.weight / totalWeight * 100).toFixed(1) : '0.0';
      const cPct = totalCost   > 0 ? (d.cost   / totalCost   * 100).toFixed(1) : '0.0';
      const col  = PARTS_COLORS[i % PARTS_COLORS.length];
      return `<div style="background:#1a1a1a;border-radius:8px;padding:14px;border-left:3px solid ${col}">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#ddd">${cat}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div><div style="color:#888;margin-bottom:3px">총 무게</div>
            <div style="color:#ffaa00;font-weight:700">${fmtWeight(d.weight)}</div>
            <div style="color:#555;font-size:11px">${wPct}%</div></div>
          <div><div style="color:#888;margin-bottom:3px">총 비용</div>
            <div style="color:#00cc66;font-weight:700">${d.cost.toLocaleString()} 원</div>
            <div style="color:#555;font-size:11px">${cPct}%</div></div>
        </div>
        <div style="color:#666;font-size:11px;margin-top:8px">수량 ${d.qty}개</div>
      </div>`;
    }).join('')
  }</div>`;
}

// ── Charts ────────────────────────────────────
function renderPartsCharts() {
  const cats = {};
  S.parts.forEach(p => {
    if (!cats[p.cat]) cats[p.cat] = { weight: 0, cost: 0 };
    cats[p.cat].weight += p.weight * p.qty;
    cats[p.cat].cost   += p.cost   * p.qty;
  });
  const labels  = Object.keys(cats);
  const weights = labels.map(l => cats[l].weight);
  const costs   = labels.map(l => cats[l].cost);
  const colors  = labels.map((_, i) => PARTS_COLORS[i % PARTS_COLORS.length]);
  const chartOpts = (isWeight) => ({
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { color: '#888', font: { size: 11 }, boxWidth: 12, padding: 8 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${isWeight ? fmtWeight(ctx.parsed) : ctx.parsed.toLocaleString() + ' 원'}` } }
    }
  });
  const wEl = document.getElementById('partsWeightChart');
  if (wEl) {
    if (partsWeightChart) partsWeightChart.destroy();
    if (labels.length) partsWeightChart = new Chart(wEl.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: weights, backgroundColor: colors, borderColor: '#141414', borderWidth: 2 }] },
      options: chartOpts(true)
    });
  }
  const cEl = document.getElementById('partsCostChart');
  if (cEl) {
    if (partsCostChart) partsCostChart.destroy();
    if (labels.length) partsCostChart = new Chart(cEl.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: costs, backgroundColor: colors, borderColor: '#141414', borderWidth: 2 }] },
      options: chartOpts(false)
    });
  }
}
