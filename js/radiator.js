// ═══════════════════════════════════════════════════════
// RADIATOR ε-NTU CALCULATOR  (js/radiator.js)
// JUST FSAE – FPI 기반 물리 모델
// ═══════════════════════════════════════════════════════

function rg(id) { return parseFloat(document.getElementById(id)?.value) || 0; }

function rs(id, v, d) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (isFinite(v) && v !== null) ? v.toFixed(d ?? 4) : '—';
}

// ── 슬라이더 동기화 ───────────────────────────────────
function radSyncSlider(sliderId, inputId) {
  const sl = document.getElementById(sliderId);
  if (!sl) return;
  const v   = Math.min(Math.max(rg(inputId), +sl.min), +sl.max);
  sl.value  = v;
  const pct = ((v - +sl.min) / (+sl.max - +sl.min)) * 100;
  sl.style.background = `linear-gradient(to right, var(--red) ${pct}%, #2a2a2a ${pct}%)`;
}

function radSyncV() { radSyncSlider('rad-v-slider', 'rad-v'); }
function radSyncU() { radSyncSlider('rad-U-slider', 'rad-U'); }

// ── 핀 높이 자동 계산 (H/N − t) ──────────────────────
function radAutoFinH() {
  const H = rg('rad-H');
  const N = rg('rad-N');
  const t = rg('rad-t');
  if (N > 0) {
    const fh = H / N - t;
    if (fh > 0) {
      const el = document.getElementById('rad-fh');
      if (el) el.value = fh.toFixed(2);
    }
  }
}

// ── ε 공식 ────────────────────────────────────────────
function calcEps(NTU, R, pass) {
  if (!isFinite(NTU) || NTU <= 0) return 0;
  if (pass === 'single') {
    if (Math.abs(1 - R) < 1e-8) return NTU / (1 + NTU);
    const e = Math.exp(-NTU * (1 - R));
    return (1 - e) / (1 - R * e);
  } else {
    // Double pass: ε = 2 / (1 + R + √(1+R²)·coth(NTU·√(1+R²)/2))
    const sq   = Math.sqrt(1 + R * R);
    const arg  = NTU * sq / 2;
    const coth = arg > 350 ? 1 : Math.cosh(arg) / Math.sinh(arg);
    return 2 / (1 + R + sq * coth);
  }
}

// ── 메인 계산 ─────────────────────────────────────────
function calcRadiator() {
  radSyncV();
  radSyncU();

  // ── 라디에이터 형상 ──
  const W_mm  = rg('rad-W');    // 코어 가로 mm
  const H_mm  = rg('rad-H');    // 코어 세로 mm
  const T_mm  = rg('rad-T');    // 코어 두께 mm
  const N     = rg('rad-N');    // 튜브 개수
  const fpi   = rg('rad-fpi');  // FPI
  const fh_mm = rg('rad-fh');   // 핀 높이 mm
  const nr    = rg('rad-nr');   // 라디에이터 개수

  // ── 유체 조건 ──
  const U         = rg('rad-U');
  const cpa       = rg('rad-cpa');
  const cpw       = rg('rad-cpw');
  const rha       = rg('rad-rha');
  const rhw       = rg('rad-rhw');
  const Ta        = rg('rad-Ta');
  const Tw        = rg('rad-Tw');
  const Vw_Lmin   = rg('rad-Vw');   // L/min
  const v_kmh     = rg('rad-v');    // km/h
  const eng       = rg('rad-eng');

  // ══════════════════════════════════════════════════
  // 1. 코어 정면 면적
  // ══════════════════════════════════════════════════
  const A_front = (W_mm / 1000) * (H_mm / 1000);   // m²

  // ══════════════════════════════════════════════════
  // 2. 공기 체적유량
  // ══════════════════════════════════════════════════
  const v_ms = v_kmh / 3.6;
  const Va   = A_front * v_ms;                       // m³/s

  // ══════════════════════════════════════════════════
  // 3. 핀 피치
  // ══════════════════════════════════════════════════
  const fin_pitch = 25.4 / fpi;                      // mm

  // ══════════════════════════════════════════════════
  // 4. 총 핀 수
  // ══════════════════════════════════════════════════
  const n_fins = (H_mm / fin_pitch) * N * nr;

  // ══════════════════════════════════════════════════
  // 5. 총 열교환 면적
  // ══════════════════════════════════════════════════
  const A_total = n_fins * 2 * (fh_mm / 1000) * (T_mm / 1000);   // m²

  // ══════════════════════════════════════════════════
  // 6–7. 열용량률
  // ══════════════════════════════════════════════════
  const Ca   = rha * Va * cpa;                       // W/K
  const Vw   = Vw_Lmin / 60000;                      // m³/s
  const Cw   = rhw * Vw * cpw;                       // W/K
  const Cmin = Math.min(Ca, Cw);
  const Cmax = Math.max(Ca, Cw);

  // ══════════════════════════════════════════════════
  // 8–11. Q_max, R, NTU
  // ══════════════════════════════════════════════════
  const Qmax = Cmin * (Tw - Ta);
  const R    = Cmin / Cmax;
  const NTU  = (U * A_total) / Cmin;

  // ══════════════════════════════════════════════════
  // 12–14. 유용도 & 방열량
  // ══════════════════════════════════════════════════
  const eps_s = calcEps(NTU, R, 'single');
  const eps_d = calcEps(NTU, R, 'double');
  const Q_s   = eps_s * Qmax;   // W
  const Q_d   = eps_d * Qmax;   // W

  // ══════════════════════════════════════════════════
  // 15–16. 출구 온도
  // ══════════════════════════════════════════════════
  const Tw_out_s = Cw > 0 ? Tw - Q_s / Cw : Tw;
  const Ta_out_s = Ca > 0 ? Ta + Q_s / Ca : Ta;
  const Tw_out_d = Cw > 0 ? Tw - Q_d / Cw : Tw;
  const Ta_out_d = Ca > 0 ? Ta + Q_d / Ca : Ta;

  // ══════════════════════════════════════════════════
  // 결과 업데이트
  // ══════════════════════════════════════════════════
  rs('rs-Af',  A_front,   4);
  rs('rs-fp',  fin_pitch, 2);
  rs('rs-nf',  n_fins,    0);
  rs('rs-A',   A_total,   4);
  rs('rs-Va',  Va,        5);
  rs('rs-Ca',  Ca,        2);
  rs('rs-Cw',  Cw,        2);
  rs('rs-Cm',  Cmin,      2);
  rs('rs-Qm',  Qmax,      1);
  rs('rs-R',   R,         4);
  rs('rs-NTU', NTU,       4);

  rs('rs-eps-s', eps_s,        4);
  rs('rs-eps-d', eps_d,        4);
  rs('rs-Q-s',   Q_s / 1000,  3);
  rs('rs-Q-d',   Q_d / 1000,  3);
  rs('rs-Tw-s',  Tw_out_s,    1);
  rs('rs-Tw-d',  Tw_out_d,    1);
  rs('rs-Ta-s',  Ta_out_s,    1);
  rs('rs-Ta-d',  Ta_out_d,    1);

  // ══════════════════════════════════════════════════
  // 엔진 발열량 비교 (Single Pass 기준)
  // ══════════════════════════════════════════════════
  const Q_kW   = Q_s / 1000;
  const ok     = Q_kW >= eng;
  const stEl   = document.getElementById('rad-status');
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

// ── 결과 복사 ─────────────────────────────────────────
function copyRadiator() {
  const g   = id => document.getElementById(id)?.textContent || '—';
  const pad = (s, n) => String(s).padEnd(n);
  const w   = 24;

  const lines = [
    '[JUST FSAE] 라디에이터 ε-NTU 계산 결과',
    '─'.repeat(62),
    `코어: ${rg('rad-W')}×${rg('rad-H')}×${rg('rad-T')} mm  튜브=${rg('rad-N')}개  FPI=${rg('rad-fpi')}  핀높이=${rg('rad-fh')}mm  nr=${rg('rad-nr')}`,
    `U=${rg('rad-U')} W/m²K  Tw_in=${rg('rad-Tw')}℃  Ta_in=${rg('rad-Ta')}℃  v=${rg('rad-v')} km/h  Vw=${rg('rad-Vw')} L/min`,
    '─'.repeat(62),
    `${pad('A_front (m²)', w)}  ${g('rs-Af')}`,
    `${pad('핀 피치 (mm)', w)}  ${g('rs-fp')}`,
    `${pad('총 핀 수', w)}  ${g('rs-nf')}`,
    `${pad('A_total (m²)', w)}  ${g('rs-A')}`,
    `${pad('Q_air (m³/s)', w)}  ${g('rs-Va')}`,
    `${pad('C_air (W/K)', w)}  ${g('rs-Ca')}`,
    `${pad('C_water (W/K)', w)}  ${g('rs-Cw')}`,
    `${pad('C_min (W/K)', w)}  ${g('rs-Cm')}`,
    `${pad('Q_max (W)', w)}  ${g('rs-Qm')}`,
    `${pad('R', w)}  ${g('rs-R')}`,
    `${pad('NTU', w)}  ${g('rs-NTU')}`,
    '─'.repeat(62),
    `${pad('항목', w)}  ${pad('Single Pass', 14)}  Double Pass`,
    '─'.repeat(62),
    `${pad('유용도 ε', w)}  ${pad(g('rs-eps-s'), 14)}  ${g('rs-eps-d')}`,
    `${pad('방열량 Q (kW)', w)}  ${pad(g('rs-Q-s'), 14)}  ${g('rs-Q-d')}`,
    `${pad('냉각수 출구 온도 (℃)', w)}  ${pad(g('rs-Tw-s'), 14)}  ${g('rs-Tw-d')}`,
    `${pad('공기 출구 온도 (℃)', w)}  ${pad(g('rs-Ta-s'), 14)}  ${g('rs-Ta-d')}`,
    '─'.repeat(62),
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('rad-copy-btn');
    if (btn) {
      btn.textContent = '✅ 복사됨';
      setTimeout(() => { btn.textContent = '📋 결과 복사'; }, 2000);
    }
  });
}

// ── 인쇄 ──────────────────────────────────────────────
function printRadiator() { window.print(); }
