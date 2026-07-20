// ═══════════════════════════════════════════════════════
// RADIATOR ε-NTU CALCULATOR  (js/radiator.js)
// JUST FSAE – FPI 기반 물리 모델 (교차류 직렬 2단)
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

// ── ε 공식 (교차류 양쪽 비혼합) ───────────────────────
function calcEps(NTU, R) {
  if (!isFinite(NTU) || NTU <= 0) return 0;
  if (R < 1e-8) return 1 - Math.exp(-NTU);
  return 1 - Math.exp((Math.pow(NTU, 0.22) / R) * (Math.exp(-R * Math.pow(NTU, 0.78)) - 1));
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
  // 2. 공기 체적유량 (라디에이터 nr개 합산)
  // ══════════════════════════════════════════════════
  const v_ms      = v_kmh / 3.6;
  const Va_total  = A_front * nr * v_ms;   // 총 공기량 m³/s
  const Va_single = A_front * v_ms;        // 1개 라디에이터 기준

  // ══════════════════════════════════════════════════
  // 3. 핀 피치
  // ══════════════════════════════════════════════════
  const fin_pitch = 25.4 / fpi;                      // mm

  // ══════════════════════════════════════════════════
  // 4. 총 핀 수 (가로W 방향, 튜브 사이 간격 N-1)
  // ══════════════════════════════════════════════════
  const n_fins = (W_mm / fin_pitch) * (N - 1) * nr;

  // ══════════════════════════════════════════════════
  // 5. 총 열교환 면적
  // ══════════════════════════════════════════════════
  const A_total  = n_fins * 2 * (fh_mm / 1000) * (T_mm / 1000);  // m² (nr개 합산)
  const A_single = nr > 0 ? A_total / nr : A_total;               // 1개 기준

  // ══════════════════════════════════════════════════
  // 6–7. 열용량률 (1개 라디에이터 기준)
  // ══════════════════════════════════════════════════
  const Ca    = rha * Va_single * cpa;               // W/K
  const Vw    = Vw_Lmin / 60000;                      // m³/s
  const Cw    = rhw * Vw * cpw;                       // W/K
  const Cmin  = Math.min(Ca, Cw);
  const Cmax  = Math.max(Ca, Cw);

  // ══════════════════════════════════════════════════
  // 8–11. Q_max, R, NTU (1개 라디에이터 기준)
  // ══════════════════════════════════════════════════
  const Qmax = Cmin * (Tw - Ta);
  const R    = Cmin / Cmax;
  const NTU  = (U * A_single) / Cmin;

  // ══════════════════════════════════════════════════
  // 12. 유용도 (교차류 양쪽 비혼합)
  // ══════════════════════════════════════════════════
  const eps = calcEps(NTU, R);

  // ══════════════════════════════════════════════════
  // 13. 직렬 2단 계산
  // ══════════════════════════════════════════════════
  // 1단계: 냉각수 Tw 입구, 공기 Ta 입구
  const Q1      = eps * Cmin * (Tw - Ta);
  const T_w_mid = Cw > 0 ? Tw - Q1 / Cw : Tw;

  // 2단계: 냉각수 T_w_mid 입구, 새 외기 Ta 입구
  const Q2      = eps * Cmin * (T_w_mid - Ta);
  const T_w_out = Cw > 0 ? T_w_mid - Q2 / Cw : T_w_mid;

  const Q_total = Q1 + Q2;   // W

  // ══════════════════════════════════════════════════
  // 결과 업데이트
  // ══════════════════════════════════════════════════
  rs('rs-Af',  A_front,   4);
  rs('rs-fp',  fin_pitch, 2);
  rs('rs-nf',  n_fins,    0);
  rs('rs-A',   A_total,   4);
  rs('rs-Va',  Va_total,  5);
  rs('rs-Ca',  Ca,        2);
  rs('rs-Cw',  Cw,        2);
  rs('rs-Cm',  Cmin,      2);
  rs('rs-Qm',  Qmax,      1);
  rs('rs-R',   R,         4);
  rs('rs-NTU', NTU,       4);
  rs('rs-eps', eps,       4);

  rs('rs-Q1',     Q1 / 1000,      3);
  rs('rs-Tw-mid', T_w_mid,        1);
  rs('rs-Q2',     Q2 / 1000,      3);
  rs('rs-Tw-out', T_w_out,        1);
  rs('rs-Qt',     Q_total / 1000, 3);

  // ══════════════════════════════════════════════════
  // 엔진 발열량 비교 (총 방열량 기준)
  // ══════════════════════════════════════════════════
  const Q_kW   = Q_total / 1000;
  const ok     = Q_kW >= eng;
  const stEl   = document.getElementById('rad-status');
  const mainEl = document.getElementById('rad-status-main');
  const subEl  = document.getElementById('rad-status-sub');
  if (stEl)   stEl.className = 'rad-status ' + (ok ? 'rad-ok' : 'rad-ng');
  if (mainEl) mainEl.textContent = ok ? '냉각 충분' : '냉각 부족 경고';
  if (subEl) {
    const diff = (Q_kW - eng).toFixed(2);
    subEl.textContent = ok
      ? `총 방열량 ${Q_kW.toFixed(2)} kW ≥ 엔진 발열량 ${eng} kW  (+${diff} kW 여유)`
      : `총 방열량 ${Q_kW.toFixed(2)} kW < 엔진 발열량 ${eng} kW  (${diff} kW 부족 — 과열 위험!)`;
  }
}

// ── 결과 복사 ─────────────────────────────────────────
function copyRadiator() {
  const g   = id => document.getElementById(id)?.textContent || '—';
  const pad = (s, n) => String(s).padEnd(n);
  const w   = 28;

  const lines = [
    '[JUST FSAE] 라디에이터 ε-NTU 계산 결과 (교차류 직렬 2단)',
    '─'.repeat(66),
    `코어: ${rg('rad-W')}×${rg('rad-H')}×${rg('rad-T')} mm  튜브=${rg('rad-N')}개  FPI=${rg('rad-fpi')}  핀높이=${rg('rad-fh')}mm  nr=${rg('rad-nr')}`,
    `U=${rg('rad-U')} W/m²K  Tw_in=${rg('rad-Tw')}℃  Ta_in=${rg('rad-Ta')}℃  v=${rg('rad-v')} km/h  Vw=${rg('rad-Vw')} L/min`,
    '─'.repeat(66),
    `${pad('A_front (m²)', w)}  ${g('rs-Af')}`,
    `${pad('핀 피치 (mm)', w)}  ${g('rs-fp')}`,
    `${pad('총 핀 수', w)}  ${g('rs-nf')}`,
    `${pad('A_total (m²)', w)}  ${g('rs-A')}`,
    `${pad('Q_air 총합 (m³/s)', w)}  ${g('rs-Va')}`,
    `${pad('C_air/1개 (W/K)', w)}  ${g('rs-Ca')}`,
    `${pad('C_water (W/K)', w)}  ${g('rs-Cw')}`,
    `${pad('C_min (W/K)', w)}  ${g('rs-Cm')}`,
    `${pad('Q_max (W)', w)}  ${g('rs-Qm')}`,
    `${pad('R', w)}  ${g('rs-R')}`,
    `${pad('NTU (1개 기준)', w)}  ${g('rs-NTU')}`,
    `${pad('유용도 ε (교차류)', w)}  ${g('rs-eps')}`,
    '─'.repeat(66),
    `${pad('1단계 방열량 Q1 (kW)', w)}  ${g('rs-Q1')}`,
    `${pad('1단계 냉각수 출구온도 (℃)', w)}  ${g('rs-Tw-mid')}`,
    `${pad('2단계 방열량 Q2 (kW)', w)}  ${g('rs-Q2')}`,
    `${pad('최종 냉각수 출구온도 (℃)', w)}  ${g('rs-Tw-out')}`,
    `${pad('총 방열량 Q_total (kW)', w)}  ${g('rs-Qt')}`,
    '─'.repeat(66),
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

// ════════════════════════════════════════════════════
// 냉각팬 UI  (계산 로직 비사용 – 입력 참고 전용)
// ════════════════════════════════════════════════════

// ── 공기 유동 모드 전환 ──────────────────────────────
function fanSetMode(mode) {
  ['wind', 'fan', 'measured'].forEach(m => {
    const btn   = document.getElementById('fan-mode-' + m);
    const panel = document.getElementById('fan-panel-' + m);
    if (btn)   btn.classList.toggle('fan-mode-active', m === mode);
    if (panel) panel.style.display = (m === mode && mode !== 'wind') ? '' : 'none';
  });
}

// ── 슬라이더 값 표시 동기화 (팬 전용) ───────────────
function fanSyncSlider(sliderId, valId) {
  const sl = document.getElementById(sliderId);
  const vl = document.getElementById(valId);
  if (!sl || !vl) return;
  vl.textContent = sl.value;
  const pct = ((+sl.value - +sl.min) / (+sl.max - +sl.min)) * 100;
  sl.style.background = `linear-gradient(to right, var(--red) ${pct}%, #2a2a2a ${pct}%)`;
}

// ── U 계산 방식 토글 ─────────────────────────────────
function fanSetUMode(scope, mode) {
  const prefix    = scope === 'fan' ? 'fan' : 'meas';
  const directBtn = document.getElementById(prefix + '-u-direct');
  const autoBtn   = document.getElementById(prefix + '-u-auto');
  const directPan = document.getElementById(prefix + '-u-direct-panel');
  const autoPan   = document.getElementById(prefix + '-u-auto-panel');
  if (directBtn) directBtn.classList.toggle('fan-u-active', mode === 'direct');
  if (autoBtn)   autoBtn.classList.toggle('fan-u-active',  mode === 'auto');
  if (directPan) directPan.style.display = mode === 'direct' ? '' : 'none';
  if (autoPan)   autoPan.style.display   = mode === 'auto'   ? '' : 'none';
}

// ── 실측 체적유량 ↔ 면풍속 자동 계산 ────────────────
function fanMeasSync(from) {
  const W  = rg('rad-W');
  const H  = rg('rad-H');
  const Af = (W > 0 && H > 0) ? (W / 1000) * (H / 1000) : 0;
  const qEl = document.getElementById('fan-meas-q');
  const vEl = document.getElementById('fan-meas-v');
  if (!qEl || !vEl || Af <= 0) return;
  if (from === 'q') {
    const q = parseFloat(qEl.value);
    vEl.value = (isFinite(q) && q >= 0) ? (q / Af).toFixed(3) : '';
  } else {
    const v = parseFloat(vEl.value);
    qEl.value = (isFinite(v) && v >= 0) ? (v * Af).toFixed(4) : '';
  }
}

// ── 팬 참고값 계산 (표시 전용) ───────────────────────
function fanUpdate() {
  const cfm   = parseFloat(document.getElementById('fan-cfm')?.value)   || 0;
  const count = parseFloat(document.getElementById('fan-count')?.value)  || 1;
  const eff   = parseFloat(document.getElementById('fan-eff')?.value)    || 100;
  const W     = rg('rad-W');
  const H     = rg('rad-H');
  const Af    = (W > 0 && H > 0) ? (W / 1000) * (H / 1000) : 0;

  // 1 CFM = 0.00047194745 m³/s
  const q_per_fan = cfm * (eff / 100) * 0.00047194745;   // 팬 1개 유효 체적유량 m³/s
  const q_total   = q_per_fan * count;                    // 라디에이터 1개 기준 총 유량 m³/s
  const v_core    = Af > 0 ? q_total / Af : 0;           // 평균 코어 면풍속 m/s

  const refV = document.getElementById('fan-ref-v');
  const refQ = document.getElementById('fan-ref-q');
  if (refV) refV.textContent = (isFinite(v_core)    && v_core    >= 0) ? v_core.toFixed(2)    : '—';
  if (refQ) refQ.textContent = (isFinite(q_per_fan) && q_per_fan >= 0) ? q_per_fan.toFixed(5) : '—';
}
