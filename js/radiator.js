// ═══════════════════════════════════════════════════════
// RADIATOR ε-NTU CALCULATOR  (js/radiator.js)
// ═══════════════════════════════════════════════════════

function rg(id)  { return parseFloat(document.getElementById(id)?.value) || 0; }
function rs(id, v, d) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (isFinite(v) && v !== null) ? v.toFixed(d ?? 4) : '—';
}

function calcEps(NTU, R, pass) {
  if (!isFinite(NTU) || NTU <= 0) return 0;
  if (pass === 'single') {
    if (Math.abs(1 - R) < 1e-8) return NTU / (1 + NTU);
    const e = Math.exp(-NTU * (1 - R));
    return (1 - e) / (1 - R * e);
  } else {
    const sq   = Math.sqrt(1 + R * R);
    const arg  = NTU * sq / 2;
    const coth = arg > 350 ? 1 : Math.cosh(arg) / Math.sinh(arg);
    return 2 / (1 + R + sq * coth);
  }
}

function calcRadiator() {
  // ── 라디에이터 형상 (입력: mm) ──
  const H_mm = rg('rad-H');   // 코어 세로 (mm)
  const T_mm = rg('rad-T');   // 코어 두께 (mm)
  const N    = rg('rad-N');   // 관 개수
  const fw   = rg('rad-fw');  // 핀 너비 (mm)
  const fh   = rg('rad-fh');  // 핀 높이 (mm)
  const nr   = rg('rad-nr');  // 라디에이터 개수

  // ── 유체 조건 ──
  const U   = rg('rad-U');    // 열전달계수 (W/m²·K)
  const cpa = rg('rad-cpa');  // 공기 비열 (J/kg·K)
  const cpw = rg('rad-cpw');  // 물 비열 (J/kg·K)
  const rha = rg('rad-rha');  // 공기 밀도 (kg/m³)
  const rhw = rg('rad-rhw');  // 냉각수 밀도 (kg/m³)
  const Ta  = rg('rad-Ta');   // 공기 입구 온도 (℃)
  const Tw  = rg('rad-Tw');   // 냉각수 입구 온도 (℃)
  const Va  = rg('rad-Va');   // 공기 체적 유량 (m³/s)
  const Vw  = rg('rad-Vw');   // 냉각수 유량 (m³/s)
  const eng = rg('rad-eng');  // 엔진 발열량 (kW)

  // ══════════════════════════════════════════════════
  // 1. 열교환 면적 계산
  //    A = (H/1000) × (T/1000) × N × (fw/fh) × (fh/1000) × nr × 2
  // ══════════════════════════════════════════════════
  const A = (H_mm / 1000) * (T_mm / 1000) * N * (fw / fh) * (fh / 1000) * nr * 2;

  // ══════════════════════════════════════════════════
  // 2. 열용량률
  // ══════════════════════════════════════════════════
  const Ca   = rha * Va * cpa;   // 공기 (W/K)
  const Cw   = rhw * Vw * cpw;   // 냉각수 (W/K)
  const Cmin = Math.min(Ca, Cw);
  const Cmax = Math.max(Ca, Cw);

  // ══════════════════════════════════════════════════
  // 3. Q_max, R, NTU
  // ══════════════════════════════════════════════════
  const Qmax = Cmin * (Tw - Ta);
  const R    = Cmin / Cmax;
  const NTU  = (U * A) / Cmin;

  // ══════════════════════════════════════════════════
  // 4. 유용도 & 방열량 (Single / Double 동시 계산)
  // ══════════════════════════════════════════════════
  const eps_s = calcEps(NTU, R, 'single');
  const eps_d = calcEps(NTU, R, 'double');
  const Q_s   = eps_s * Qmax;
  const Q_d   = eps_d * Qmax;

  // ══════════════════════════════════════════════════
  // 5. 출구 온도
  // ══════════════════════════════════════════════════
  const Tw_out_s = Cw > 0 ? Tw - Q_s / Cw : Tw;
  const Ta_out_s = Ca > 0 ? Ta + Q_s / Ca : Ta;
  const Tw_out_d = Cw > 0 ? Tw - Q_d / Cw : Tw;
  const Ta_out_d = Ca > 0 ? Ta + Q_d / Ca : Ta;

  // ══════════════════════════════════════════════════
  // 6. 결과 표 업데이트
  // ══════════════════════════════════════════════════
  rs('rs-A-s',   A,    4);  rs('rs-A-d',   A,    4);
  rs('rs-Ca-s',  Ca,   2);  rs('rs-Ca-d',  Ca,   2);
  rs('rs-Cw-s',  Cw,   2);  rs('rs-Cw-d',  Cw,   2);
  rs('rs-Cm-s',  Cmin, 2);  rs('rs-Cm-d',  Cmin, 2);
  rs('rs-Qm-s',  Qmax, 1);  rs('rs-Qm-d',  Qmax, 1);
  rs('rs-R-s',   R,    4);  rs('rs-R-d',   R,    4);
  rs('rs-NTU-s', NTU,  4);  rs('rs-NTU-d', NTU,  4);
  rs('rs-eps-s', eps_s, 4);
  rs('rs-eps-d', eps_d, 4);
  rs('rs-Q-s',   Q_s / 1000, 3);
  rs('rs-Q-d',   Q_d / 1000, 3);
  rs('rs-Tw-s',  Tw_out_s, 1);  rs('rs-Tw-d',  Tw_out_d, 1);
  rs('rs-Ta-s',  Ta_out_s, 1);  rs('rs-Ta-d',  Ta_out_d, 1);

  // ══════════════════════════════════════════════════
  // 7. 엔진 발열량 비교 (Single Pass 기준)
  // ══════════════════════════════════════════════════
  const Q_kW  = Q_s / 1000;
  const ok    = Q_kW >= eng;
  const stEl  = document.getElementById('rad-status');
  const mainEl = document.getElementById('rad-status-main');
  const subEl  = document.getElementById('rad-status-sub');
  if (stEl)   stEl.className = 'rad-status ' + (ok ? 'rad-ok' : 'rad-ng');
  if (mainEl) mainEl.textContent = ok ? '냉각 충분' : '냉각 부족 경고';
  if (subEl) {
    const diff = (Q_kW - eng).toFixed(2);
    subEl.textContent = ok
      ? `Single Pass ${Q_kW.toFixed(2)} kW ≥ 엔진 발열량 ${eng} kW  (+${diff} kW 여유)`
      : `Single Pass ${Q_kW.toFixed(2)} kW < 엔진 발열량 ${eng} kW  (${diff} kW 부족 — 과열 위험!)`;
  }
}

function copyRadiator() {
  const rows = [
    ['A (m²)',               'rs-A-s',   'rs-A-d'  ],
    ['C_air (W/K)',          'rs-Ca-s',  'rs-Ca-d' ],
    ['C_water (W/K)',        'rs-Cw-s',  'rs-Cw-d' ],
    ['C_min (W/K)',          'rs-Cm-s',  'rs-Cm-d' ],
    ['Q_max (W)',            'rs-Qm-s',  'rs-Qm-d' ],
    ['R = C_min/C_max',      'rs-R-s',   'rs-R-d'  ],
    ['NTU',                  'rs-NTU-s', 'rs-NTU-d'],
    ['유용도 ε',              'rs-eps-s', 'rs-eps-d'],
    ['방열량 Q (kW)',         'rs-Q-s',   'rs-Q-d'  ],
    ['냉각수 출구 온도 (℃)', 'rs-Tw-s',  'rs-Tw-d' ],
    ['공기 출구 온도 (℃)',   'rs-Ta-s',  'rs-Ta-d' ],
  ];
  const w   = 22;
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [
    '[JUST FSAE] 라디에이터 ε-NTU 계산 결과',
    '─'.repeat(60),
    `${pad('항목', w)}  ${pad('Single Pass', 14)}  Double Pass`,
    '─'.repeat(60),
  ];
  rows.forEach(([label, sid, did]) => {
    const sv = document.getElementById(sid)?.textContent || '—';
    const dv = document.getElementById(did)?.textContent || '—';
    lines.push(`${pad(label, w)}  ${pad(sv, 14)}  ${dv}`);
  });
  lines.push('─'.repeat(60));
  lines.push(
    `코어: H=${rg('rad-H')}mm  T=${rg('rad-T')}mm  N=${rg('rad-N')}개  `
    + `핀너비=${rg('rad-fw')}mm  핀높이=${rg('rad-fh')}mm  nr=${rg('rad-nr')}`
  );
  lines.push(
    `U=${rg('rad-U')} W/m²K  Tw_in=${rg('rad-Tw')}℃  Ta_in=${rg('rad-Ta')}℃  `
    + `Va=${rg('rad-Va')} m³/s  Vw=${rg('rad-Vw')} m³/s`
  );

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('rad-copy-btn');
    if (btn) {
      btn.textContent = '✅ 복사됨';
      setTimeout(() => { btn.textContent = '📋 결과 복사'; }, 2000);
    }
  });
}

function printRadiator() { window.print(); }
