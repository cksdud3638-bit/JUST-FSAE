// ═══════════════════════════════════════════════════════
// RADIATOR ε-NTU CALCULATOR  (js/radiator.js)
// ═══════════════════════════════════════════════════════

// ── helpers ──────────────────────────────────────────
function rg(id)  { return parseFloat(document.getElementById(id)?.value) || 0; }
function rs(id, v, d) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (isFinite(v) && v !== null) ? v.toFixed(d ?? 4) : '—';
}

// ── slider sync ───────────────────────────────────────
function radSyncSlider() {
  const sl = document.getElementById('rad-v-slider');
  const v  = rg('rad-v');
  if (sl) {
    sl.value = v;
    const pct = ((v - +sl.min) / (+sl.max - +sl.min)) * 100;
    sl.style.background =
      `linear-gradient(to right, var(--red) ${pct}%, #2a2a2a ${pct}%)`;
  }
}

// ── auto-compute derived inputs ───────────────────────
function radAutoCalc() {
  // 핀비율 = 핀높이 / 핀피치 (핀피치 = 3.175 mm = 1 inch / 8 FPI)
  const fh = rg('rad-fh');
  const finPitch = 0.003175;                         // 8 FPI
  const frEl = document.getElementById('rad-fr');
  if (frEl && fh > 0) frEl.value = (fh / finPitch).toFixed(4);

  // 공기 체적 유량 = 코어면적(H×T) × 차량속도
  const H  = rg('rad-H');
  const T  = rg('rad-T');
  const v  = rg('rad-v');
  const Va = H * T * (v / 3.6);
  const vaEl = document.getElementById('rad-Va');
  if (vaEl) vaEl.value = Va.toFixed(5);

  radSyncSlider();
  calcRadiator();
}

// ── ε formula ─────────────────────────────────────────
function calcEps(NTU, R, pass) {
  if (!isFinite(NTU) || NTU <= 0) return 0;
  if (pass === 'single') {
    if (Math.abs(1 - R) < 1e-8) return NTU / (1 + NTU);
    const e = Math.exp(-NTU * (1 - R));
    return (1 - e) / (1 - R * e);
  } else {
    // Double pass: ε = 2 / (1 + R + √(1+R²) · coth(NTU·√(1+R²)/2))
    const sq  = Math.sqrt(1 + R * R);
    const arg = NTU * sq / 2;
    const coth = arg > 350 ? 1 : Math.cosh(arg) / Math.sinh(arg);
    return 2 / (1 + R + sq * coth);
  }
}

// ── main calculation ──────────────────────────────────
function calcRadiator() {
  // ── 라디에이터 형상 inputs ──
  const H   = rg('rad-H');    // 높이 (m)
  const T   = rg('rad-T');    // 두께 (m)
  const N   = rg('rad-N');    // 관 개수
  const fr  = rg('rad-fr');   // 핀비율
  const fh  = rg('rad-fh');   // 핀 높이 (m)
  const nr  = rg('rad-nr');   // 라디에이터 개수

  // ── 유체 inputs ──
  const U   = rg('rad-U');    // 열전달계수 (W/m²K)
  const cpa = rg('rad-cpa');  // 공기 비열
  const cpw = rg('rad-cpw');  // 냉각수 비열
  const rha = rg('rad-rha');  // 공기 밀도
  const rhw = rg('rad-rhw');  // 냉각수 밀도
  const Ta  = rg('rad-Ta');   // 공기 입구 온도 (℃)
  const Tw  = rg('rad-Tw');   // 냉각수 입구 온도 (℃)
  const Vw  = rg('rad-Vw');   // 냉각수 체적 유량 (m³/s)
  const Va  = rg('rad-Va');   // 공기 체적 유량 (m³/s)
  const eng = rg('rad-eng');  // 엔진 발열량 (kW)

  // ── 1. 총면적 ──────────────────────────────────────
  // A = H × T × N × 핀비율 × 핀높이 × N_rad
  const A = H * T * N * fr * fh * nr;

  // ── 2. 열용량률 ────────────────────────────────────
  const Ca    = rha * Va * cpa;          // 공기
  const Cw    = rhw * Vw * cpw;          // 냉각수
  const Cmin  = Math.min(Ca, Cw);
  const Cmax  = Math.max(Ca, Cw);

  // ── 3. Q_max & R & NTU ────────────────────────────
  const Qmax  = Cmin * (Tw - Ta);
  const R     = Cmin / Cmax;
  const NTU   = (U * A) / Cmin;

  // ── 4. 유용도 & 방열량 (single / double) ─────────
  const eps_s = calcEps(NTU, R, 'single');
  const eps_d = calcEps(NTU, R, 'double');
  const Q_s   = eps_s * Qmax;            // W
  const Q_d   = eps_d * Qmax;            // W

  // ── 5. 출구 온도 ───────────────────────────────────
  const Tw_out_s = Tw - Q_s / Cw;
  const Ta_out_s = Ta + Q_s / Ca;
  const Tw_out_d = Tw - Q_d / Cw;
  const Ta_out_d = Ta + Q_d / Ca;

  // ── 결과 표 업데이트 ──────────────────────────────
  // 공통 값 (both pass 동일)
  rs('rs-A-s',   A,    4);  rs('rs-A-d',   A,    4);
  rs('rs-Ca-s',  Ca,   2);  rs('rs-Ca-d',  Ca,   2);
  rs('rs-Cw-s',  Cw,   2);  rs('rs-Cw-d',  Cw,   2);
  rs('rs-Cm-s',  Cmin, 2);  rs('rs-Cm-d',  Cmin, 2);
  rs('rs-Qm-s',  Qmax, 1);  rs('rs-Qm-d',  Qmax, 1);
  rs('rs-R-s',   R,    4);  rs('rs-R-d',   R,    4);
  rs('rs-NTU-s', NTU,  4);  rs('rs-NTU-d', NTU,  4);

  // 패스별 다른 값
  rs('rs-eps-s', eps_s, 4);
  rs('rs-eps-d', eps_d, 4);
  rs('rs-Q-s',   Q_s / 1000, 3);
  rs('rs-Q-d',   Q_d / 1000, 3);
  rs('rs-Tw-s',  Tw_out_s, 1);
  rs('rs-Tw-d',  Tw_out_d, 1);
  rs('rs-Ta-s',  Ta_out_s, 1);
  rs('rs-Ta-d',  Ta_out_d, 1);

  // ── 6. 엔진 발열량 상태 표시 (Single pass 기준) ──
  const Q_kW   = Q_s / 1000;
  const ok     = Q_kW >= eng;
  const stEl   = document.getElementById('rad-status');
  const mainEl = document.getElementById('rad-status-main');
  const subEl  = document.getElementById('rad-status-sub');
  if (stEl)  stEl.className = 'rad-status ' + (ok ? 'rad-ok' : 'rad-ng');
  if (mainEl) mainEl.textContent = ok ? '냉각 충분' : '냉각 부족 경고';
  if (subEl) {
    const diff = (Q_kW - eng).toFixed(2);
    subEl.textContent = ok
      ? `Single Pass 방열량 ${Q_kW.toFixed(2)} kW ≥ 엔진 발열량 ${eng} kW  (+${diff} kW 여유)`
      : `Single Pass 방열량 ${Q_kW.toFixed(2)} kW < 엔진 발열량 ${eng} kW  (${diff} kW 부족, 과열 위험!)`;
  }
}

// ── 결과 복사 ─────────────────────────────────────────
function copyRadiator() {
  const rows = [
    ['총 면적 A (m²)',             'rs-A-s',   'rs-A-d'  ],
    ['C_air (W/K)',                'rs-Ca-s',  'rs-Ca-d' ],
    ['C_water (W/K)',              'rs-Cw-s',  'rs-Cw-d' ],
    ['C_min (W/K)',                'rs-Cm-s',  'rs-Cm-d' ],
    ['Q_max (W)',                  'rs-Qm-s',  'rs-Qm-d' ],
    ['R = C_min/C_max',            'rs-R-s',   'rs-R-d'  ],
    ['NTU = U·A/C_min',           'rs-NTU-s', 'rs-NTU-d'],
    ['유용도 ε',                   'rs-eps-s', 'rs-eps-d'],
    ['방열량 Q (kW)',              'rs-Q-s',   'rs-Q-d'  ],
    ['냉각수 출구 온도 (℃)',       'rs-Tw-s',  'rs-Tw-d' ],
    ['공기 출구 온도 (℃)',         'rs-Ta-s',  'rs-Ta-d' ],
  ];
  const w = 26;
  const pad = (s, n) => s.padEnd(n);
  const lines = [
    '[JUST FSAE] 라디에이터 NTU 계산 결과',
    '─'.repeat(62),
    `${pad('항목', w)}  ${pad('Single Pass', 14)}  Double Pass`,
    '─'.repeat(62),
  ];
  rows.forEach(([label, sid, did]) => {
    const sv = document.getElementById(sid)?.textContent || '—';
    const dv = document.getElementById(did)?.textContent || '—';
    lines.push(`${pad(label, w)}  ${pad(sv, 14)}  ${dv}`);
  });
  lines.push('─'.repeat(62));
  lines.push(`H=${rg('rad-H')}m  T=${rg('rad-T')}m  N=${rg('rad-N')}tubes  `
    + `핀비율=${rg('rad-fr')}  핀높이=${rg('rad-fh')}m`);
  lines.push(`U=${rg('rad-U')} W/m²K  Tw_in=${rg('rad-Tw')}℃  Ta_in=${rg('rad-Ta')}℃  `
    + `v=${rg('rad-v')} km/h`);

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('rad-copy-btn');
    if (btn) { btn.textContent = '✅ 복사됨'; setTimeout(() => { btn.textContent = '📋 결과 복사'; }, 2000); }
  });
}

// ── 인쇄 ──────────────────────────────────────────────
function printRadiator() { window.print(); }
