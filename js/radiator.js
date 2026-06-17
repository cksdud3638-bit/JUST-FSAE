// ═══════════════════════════════════════════════════════
// RADIATOR NTU CALCULATOR
// ε-NTU Method (Effectiveness – Number of Transfer Units)
// ═══════════════════════════════════════════════════════

let radSpeedChart = null;
let radFlowChart  = null;

function radGet(id) {
  const el = document.getElementById(id);
  return el ? (parseFloat(el.value) || 0) : 0;
}

function radGetPass() {
  const r = document.querySelector('input[name="rad-pass"]:checked');
  return r ? r.value : 'single';
}

function updateRadSlider(sliderEl, valId) {
  const min = parseFloat(sliderEl.min);
  const max = parseFloat(sliderEl.max);
  const val = parseFloat(sliderEl.value);
  const pct = ((val - min) / (max - min)) * 100;
  sliderEl.style.background =
    `linear-gradient(to right, var(--red) ${pct}%, #2a2a2a ${pct}%)`;
  const el = document.getElementById(valId);
  if (el) el.textContent = val;
}

function calcNTUCore(U, A_total, C_min, C_max) {
  const NTU = (U * A_total) / C_min;
  const R   = C_min / C_max;
  let eps;
  if (radGetPass() === 'single') {
    if (Math.abs(1 - R) < 1e-6) {
      eps = NTU / (1 + NTU);
    } else {
      const e = Math.exp(-NTU * (1 - R));
      eps = (1 - e) / (1 - R * e);
    }
  } else {
    // Double pass: ε = 2 / (1 + R + √(1+R²) × coth(NTU×√(1+R²)/2))
    const sq  = Math.sqrt(1 + R * R);
    const arg = NTU * sq / 2;
    const coth = arg > 350 ? 1 : Math.cosh(arg) / Math.sinh(arg);
    eps = 2 / (1 + R + sq * coth);
  }
  eps = Math.min(Math.max(eps, 0), 1);
  return { NTU, R, eps };
}

function calcRadiatorCore(speed_kmh, flow_Lmin) {
  const width  = radGet('rad-width')  / 1000;   // m
  const height = radGet('rad-height') / 1000;   // m
  const thick  = radGet('rad-thick');            // mm
  const tubes  = radGet('rad-tubes');
  const fpi    = radGet('rad-fpi');
  const U      = radGet('rad-U');
  const Tw_in  = radGet('rad-tw-in');
  const Ta_in  = radGet('rad-ta-in');
  const rho_w  = radGet('rad-rho-w');
  const cp_w   = radGet('rad-cp-w');
  const rho_a  = radGet('rad-rho-a');
  const cp_a   = radGet('rad-cp-a');

  // 1. 코어 정면 면적
  const A_front  = width * height;

  // 2. 공기 체적유량 & 열용량률
  const v_ms   = speed_kmh / 3.6;
  const Q_air  = A_front * v_ms;
  const C_air  = rho_a * Q_air * cp_a;

  // 3. 냉각수 열용량률
  const C_water = rho_w * (flow_Lmin / 60000) * cp_w;

  // 4. C_min / C_max
  const C_min = Math.min(C_air, C_water);
  const C_max = Math.max(C_air, C_water);

  // 5. 총 열교환 면적 (핀 면적 기반)
  //    A = width(m) × height(m) × tubes × (FPI/25.4 fins/mm) × thick(mm)
  const A_total = width * height * tubes * (fpi / 25.4) * thick;

  // 6. NTU & 유용도
  const { NTU, R, eps } = calcNTUCore(U, A_total, C_min, C_max);

  // 7. 방열량
  const Q_max = C_min * (Tw_in - Ta_in);
  const Q     = eps * Q_max;

  // 8. 출구 온도
  const Tw_out = Tw_in - Q / C_water;
  const Ta_out = Ta_in  + Q / C_air;

  return { A_front, A_total, C_air, C_water, C_min, C_max, NTU, R, eps, Q_max, Q, Tw_out, Ta_out };
}

function radFmt(n, d) {
  if (!isFinite(n)) return '—';
  return n.toFixed(d !== undefined ? d : 2);
}

function radSet(id, val, d) {
  const el = document.getElementById(id);
  if (el) el.textContent = radFmt(val, d);
}

function calcRadiator() {
  const speed = radGet('rad-speed') || parseFloat(document.getElementById('rad-speed-slider')?.value || '60');
  const flow  = radGet('rad-flow')  || parseFloat(document.getElementById('rad-flow-slider')?.value  || '60');

  // Sync sliders
  const ss = document.getElementById('rad-speed-slider');
  const fs = document.getElementById('rad-flow-slider');
  if (ss) { ss.value = speed; updateRadSlider(ss, 'rad-speed-val'); }
  if (fs) { fs.value = flow;  updateRadSlider(fs, 'rad-flow-val');  }

  const r = calcRadiatorCore(speed, flow);

  radSet('res-Afront',  r.A_front,   4);
  radSet('res-Atotal',  r.A_total,   2);
  radSet('res-Cair',    r.C_air,     1);
  radSet('res-Cwater',  r.C_water,   1);
  radSet('res-Cmin',    r.C_min,     1);
  radSet('res-Cmax',    r.C_max,     1);
  radSet('res-NTU',     r.NTU,       3);
  radSet('res-eps',     r.eps,       4);
  radSet('res-Qmax',    r.Q_max / 1000, 2);
  radSet('res-Q',       r.Q / 1000,  2);
  radSet('res-Tw-out',  r.Tw_out,    1);
  radSet('res-Ta-out',  r.Ta_out,    1);
  radSet('res-dTw',     radGet('rad-tw-in') - r.Tw_out, 1);
  radSet('res-dTa',     r.Ta_out - radGet('rad-ta-in'),  1);

  // 엔진 발열량 비교 상태 표시
  const Q_kW      = r.Q / 1000;
  const engHeat   = radGet('rad-engine-heat');
  const ok        = Q_kW >= engHeat;
  const barEl     = document.getElementById('rad-status-bar');
  const iconEl    = document.getElementById('rad-status-icon');
  const mainEl    = document.getElementById('rad-status-main');
  const subEl     = document.getElementById('rad-status-sub');
  if (barEl)  { barEl.className = 'rad-status-bar ' + (ok ? 'rad-ok' : 'rad-ng'); }
  if (iconEl) { iconEl.textContent = ok ? '✅' : '🚨'; }
  if (mainEl) { mainEl.textContent = ok ? '냉각 충분' : '냉각 부족 경고'; }
  if (subEl)  {
    subEl.textContent = ok
      ? `방열량 ${radFmt(Q_kW)} kW ≥ 엔진 발열량 ${engHeat} kW`
      : `방열량 ${radFmt(Q_kW)} kW < 엔진 발열량 ${engHeat} kW — 과열 위험!`;
  }

  renderRadiatorCharts(flow, speed);
}

function renderRadiatorCharts(currentFlow, currentSpeed) {
  const engHeat    = radGet('rad-engine-heat');
  const speedPts   = [40, 50, 60, 70, 80];
  const flowPts    = [40, 50, 60, 70, 80];
  const speedData  = speedPts.map(s => +(calcRadiatorCore(s, currentFlow).Q / 1000).toFixed(2));
  const flowData   = flowPts.map(f  => +(calcRadiatorCore(currentSpeed, f).Q / 1000).toFixed(2));

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} kW` } }
    },
    scales: {
      x: { ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#222' } },
      y: { ticks: { color: '#666', font: { size: 11 } }, grid: { color: '#222' },
           title: { display: true, text: 'kW', color: '#555', font: { size: 11 } } }
    }
  };

  const engDataset = (labels) => ({
    label: `엔진 발열량 (${engHeat} kW)`,
    data: labels.map(() => engHeat),
    type: 'line',
    borderColor: '#ff4444',
    borderDash: [5, 3],
    borderWidth: 1.5,
    pointRadius: 0,
    fill: false,
    tension: 0,
    order: 0
  });

  // 속도별 차트
  const scCtx = document.getElementById('rad-speed-chart');
  if (scCtx) {
    if (radSpeedChart) { radSpeedChart.destroy(); radSpeedChart = null; }
    radSpeedChart = new Chart(scCtx, {
      type: 'bar',
      data: {
        labels: speedPts.map(s => `${s} km/h`),
        datasets: [
          {
            label: '방열량 Q (kW)',
            data: speedData,
            backgroundColor: speedPts.map(s =>
              s === currentSpeed ? 'rgba(255,0,0,0.75)' : 'rgba(255,0,0,0.2)'),
            borderColor: speedPts.map(s =>
              s === currentSpeed ? 'rgba(255,0,0,1)' : 'rgba(255,0,0,0.4)'),
            borderWidth: 1,
            borderRadius: 4,
            order: 1
          },
          engDataset(speedPts)
        ]
      },
      options: baseOpts
    });
  }

  // 유량별 차트
  const fcCtx = document.getElementById('rad-flow-chart');
  if (fcCtx) {
    if (radFlowChart) { radFlowChart.destroy(); radFlowChart = null; }
    radFlowChart = new Chart(fcCtx, {
      type: 'bar',
      data: {
        labels: flowPts.map(f => `${f} L/min`),
        datasets: [
          {
            label: '방열량 Q (kW)',
            data: flowData,
            backgroundColor: flowPts.map(f =>
              f === currentFlow ? 'rgba(0,136,255,0.75)' : 'rgba(0,136,255,0.2)'),
            borderColor: flowPts.map(f =>
              f === currentFlow ? 'rgba(0,136,255,1)' : 'rgba(0,136,255,0.4)'),
            borderWidth: 1,
            borderRadius: 4,
            order: 1
          },
          engDataset(flowPts)
        ]
      },
      options: baseOpts
    });
  }
}

function copyRadiatorResults() {
  const rows = [
    ['코어 정면 면적',   'res-Afront',  'm²'],
    ['총 열교환 면적',   'res-Atotal',  'm²'],
    ['C_air',           'res-Cair',    'W/K'],
    ['C_water',         'res-Cwater',  'W/K'],
    ['C_min',           'res-Cmin',    'W/K'],
    ['C_max',           'res-Cmax',    'W/K'],
    ['NTU',             'res-NTU',     ''],
    ['유용도 ε',         'res-eps',     ''],
    ['Q_max',           'res-Qmax',    'kW'],
    ['방열량 Q',         'res-Q',       'kW'],
    ['냉각수 출구 온도', 'res-Tw-out',  '℃'],
    ['공기 출구 온도',   'res-Ta-out',  '℃'],
    ['냉각수 온도 강하', 'res-dTw',     '℃'],
    ['공기 온도 상승',   'res-dTa',     '℃'],
  ];
  const lines = [
    '[JUST FSAE] 라디에이터 NTU 계산 결과',
    '─'.repeat(42),
  ];
  rows.forEach(([label, id, unit]) => {
    const val = document.getElementById(id)?.textContent || '—';
    lines.push(`${label.padEnd(14)}: ${val}${unit ? ' ' + unit : ''}`);
  });
  lines.push('─'.repeat(42));
  lines.push(`패스 방식: ${radGetPass() === 'single' ? 'Single Pass' : 'Double Pass'}`);
  lines.push(`차량 속도: ${radGet('rad-speed')} km/h  |  냉각수 유량: ${radGet('rad-flow')} L/min`);
  lines.push(`U: ${radGet('rad-U')} W/m²·K  |  Tw_in: ${radGet('rad-tw-in')}℃  |  Ta_in: ${radGet('rad-ta-in')}℃`);

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('rad-copy-btn');
    if (btn) {
      btn.textContent = '✅ 복사됨';
      setTimeout(() => { btn.textContent = '📋 결과 복사'; }, 2000);
    }
  });
}
