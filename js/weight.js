// ═══════════════════════════════════════════════
// TAB 7: PARTS WEIGHT/COST CALCULATOR
// ═══════════════════════════════════════════════
let partsWeightChart = null, partsCostChart = null;
const PARTS_COLORS = ['#ff0000','#00cc66','#0088ff','#ffaa00','#cc66ff','#ff6688','#00cccc','#ff8800'];

function fmtWeight(g) {
  if (!g && g !== 0) return '0 g';
  const n = parseFloat(g);
  if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + ' kg';
  return n.toLocaleString() + ' g';
}

function addPart() {
  const name      = v('pt-name').trim();
  const cat       = v('pt-cat');
  const weight    = parseFloat(v('pt-weight')) || 0;
  const cost      = parseFloat(v('pt-cost'))   || 0;
  const qty       = Math.max(1, parseInt(v('pt-qty')) || 1);
  const note      = v('pt-note').trim();
  const valueType = v('pt-value-type') || '측정';
  const installed = document.getElementById('pt-installed')?.checked || false;
  if (!name) { alert('부품명을 입력하세요.'); return; }
  S.parts.push({ id: Date.now(), name, cat, weight, cost, qty, note, valueType, installed });
  save('parts');
  renderParts();
  document.getElementById('pt-name').value   = '';
  document.getElementById('pt-weight').value = '';
  document.getElementById('pt-cost').value   = '';
  document.getElementById('pt-qty').value    = '1';
  document.getElementById('pt-note').value   = '';
  const instEl = document.getElementById('pt-installed');
  if (instEl) instEl.checked = false;
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
}

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
    return `<tr>
      <td style="color:#555">${i + 1}</td>
      <td style="font-weight:600;color:#ddd">${p.name}</td>
      <td><span style="background:#1e1e1e;border-radius:4px;padding:2px 8px;font-size:11px;color:#aaa">${p.cat}</span></td>
      <td style="font-size:11px"><span style="color:${vtColor}">${p.valueType||'측정'}</span></td>
      <td style="text-align:center">${p.installed ? '<span style="color:#00cc66;font-size:13px">✓</span>' : '<span style="color:#333;font-size:13px">—</span>'}</td>
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
    if (diff > 0) {
      diffEl.textContent = '+' + fmtWeight(diff) + ' 초과';
      diffEl.style.color = '#ff4444';
    } else if (diff < 0) {
      diffEl.textContent = fmtWeight(Math.abs(diff)) + ' 여유';
      diffEl.style.color = '#00cc66';
    } else {
      diffEl.textContent = '목표 달성';
      diffEl.style.color = '#ffaa00';
    }
  } else if (diffEl) {
    diffEl.textContent = '—';
    diffEl.style.color = '#555';
  }
}

function calcCornerWeights() {
  const get = id => parseFloat(document.getElementById(id)?.value) || 0;
  const fl = get('cw-fl'), fr = get('cw-fr'), rl = get('cw-rl'), rr = get('cw-rr');
  const total = fl + fr + rl + rr;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  if (total <= 0) {
    set('cw-total', '—'); set('cw-front-pct', '—'); set('cw-rear-pct', '—');
    set('cw-left-pct', '—'); set('cw-right-pct', '—');
    return;
  }
  const front = fl + fr, rear = rl + rr;
  const left  = fl + rl, right = fr + rr;
  set('cw-total',     total.toFixed(1) + ' kg');
  set('cw-front-pct', (front / total * 100).toFixed(1) + '%');
  set('cw-rear-pct',  (rear  / total * 100).toFixed(1) + '%');
  set('cw-left-pct',  (left  / total * 100).toFixed(1) + '%');
  set('cw-right-pct', (right / total * 100).toFixed(1) + '%');
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
          <div>
            <div style="color:#888;margin-bottom:3px">총 무게</div>
            <div style="color:#ffaa00;font-weight:700">${fmtWeight(d.weight)}</div>
            <div style="color:#555;font-size:11px">${wPct}%</div>
          </div>
          <div>
            <div style="color:#888;margin-bottom:3px">총 비용</div>
            <div style="color:#00cc66;font-weight:700">${d.cost.toLocaleString()} 원</div>
            <div style="color:#555;font-size:11px">${cPct}%</div>
          </div>
        </div>
        <div style="color:#666;font-size:11px;margin-top:8px">수량 ${d.qty}개</div>
      </div>`;
    }).join('')
  }</div>`;
}

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
    if (labels.length) {
      partsWeightChart = new Chart(wEl.getContext('2d'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data: weights, backgroundColor: colors, borderColor: '#141414', borderWidth: 2 }] },
        options: chartOpts(true)
      });
    }
  }
  const cEl = document.getElementById('partsCostChart');
  if (cEl) {
    if (partsCostChart) partsCostChart.destroy();
    if (labels.length) {
      partsCostChart = new Chart(cEl.getContext('2d'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data: costs, backgroundColor: colors, borderColor: '#141414', borderWidth: 2 }] },
        options: chartOpts(false)
      });
    }
  }
}
