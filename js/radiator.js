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
// 팬 유량 계산 순수 함수 라이브러리
// 기존 주행풍 계산 로직(calcRadiator)과 완전 분리
// ════════════════════════════════════════════════════

const CFM_TO_M3S = 0.00047194745; // 1 CFM → m³/s  (= 0.3048³ / 60)

/**
 * CFM → m³/s 변환
 * @param {number} cfm  체적유량 (CFM, cubic feet per minute)
 * @returns {number}    체적유량 (m³/s)
 */
function convertCfmToM3s(cfm) {
  return cfm * CFM_TO_M3S;
}

/**
 * 라디에이터 1개당 팬 실효 체적유량 계산
 * @param {number} fanCFM          팬 1개당 표기 풍량 (CFM)
 * @param {number} fansPerRadiator 라디에이터 1개당 팬 개수
 * @param {number} fanFlowPercent  팬 유량 적용률 (0~100 %) → 내부에서 0~1 로 변환
 * @returns {number}               라디에이터 1개당 실효 체적유량 (m³/s)
 */
function calculateFanFlowPerRadiator(fanCFM, fansPerRadiator, fanFlowPercent) {
  const fanFlowFactor = fanFlowPercent / 100;
  return convertCfmToM3s(fanCFM) * fansPerRadiator * fanFlowFactor;
}

/**
 * 코어 평균 면풍속 계산
 * @param {number} V_fan_per_radiator 라디에이터 1개당 실효 체적유량 (m³/s)
 * @param {number} W_mm               코어 가로 (mm)
 * @param {number} H_mm               코어 세로 (mm)
 * @returns {{ v_face_ms: number, v_face_kmh: number }}
 *   v_face_ms  : 코어 면풍속 (m/s)
 *   v_face_kmh : 코어 면풍속 km/h 환산
 */
function calculateFaceVelocity(V_fan_per_radiator, W_mm, H_mm) {
  const A_front = (W_mm / 1000) * (H_mm / 1000); // 정면 면적 m²
  const v_face  = A_front > 0 ? V_fan_per_radiator / A_front : 0; // m/s
  return { v_face_ms: v_face, v_face_kmh: v_face * 3.6 };
}

/**
 * 면풍속 기반 U 선형 보간 추정
 * 기준: 0 m/s (정차) ~ 16.6667 m/s (60 km/h) 구간 선형 보간
 * @param {number} v_face_ms 코어 면풍속 (m/s)
 * @param {number} U_still   정차 기준 U (W/m²·K)
 * @param {number} U_60kmh   60 km/h 기준 U (W/m²·K)
 * @returns {number}         추정 U (W/m²·K)
 */
function estimateUFromFaceVelocity(v_face_ms, U_still, U_60kmh) {
  const V_60KMH = 16.6667; // 60 km/h → m/s
  const ratio   = Math.min(Math.max(v_face_ms / V_60KMH, 0), 1);
  return U_still + (U_60kmh - U_still) * ratio;
}

/**
 * 팬 커버율 반영 등가 U 계산
 * 팬이 코어 일부만 커버할 때 커버 영역과 비커버 영역의 면적 가중 평균
 * @param {number} U_still            정차(비커버 영역) U (W/m²·K)
 * @param {number} U_fan              팬 작동 영역 U (W/m²·K)
 * @param {number} fanCoveragePercent 팬 장착 커버율 (0~100 %)
 * @returns {number}                  등가 U (W/m²·K)
 */
function calculateEquivalentU(U_still, U_fan, fanCoveragePercent) {
  const coverageRatio = fanCoveragePercent / 100;
  return U_still + coverageRatio * (U_fan - U_still);
}

/**
 * 공기측·냉각수측 열용량률 계산
 * @param {number} rho_air          공기 밀도 (kg/m³)
 * @param {number} V_air            공기 체적유량 (m³/s)
 * @param {number} cp_air           공기 비열 (J/kg·K)
 * @param {number} rho_water        냉각수 밀도 (kg/m³)
 * @param {number} coolantFlow_Lmin 냉각수 체적유량 (L/min)
 * @param {number} cp_water         냉각수 비열 (J/kg·K)
 * @returns {{ C_air: number, C_water: number, C_min: number, C_max: number, Cr: number }}
 *   C_air   : 공기측 열용량률 (W/K)
 *   C_water : 냉각수측 열용량률 (W/K)
 *   C_min   : min(C_air, C_water) (W/K)
 *   C_max   : max(C_air, C_water) (W/K)
 *   Cr      : 열용량률 비 C_min/C_max (dimensionless)
 */
function calculateCapacityRates(rho_air, V_air, cp_air, rho_water, coolantFlow_Lmin, cp_water) {
  const C_air   = rho_air   * V_air                      * cp_air;   // W/K
  const C_water = rho_water * (coolantFlow_Lmin / 60000) * cp_water; // W/K
  const C_min   = Math.min(C_air, C_water);
  const C_max   = Math.max(C_air, C_water);
  const Cr      = C_max > 0 ? C_min / C_max : 0;
  return { C_air, C_water, C_min, C_max, Cr };
}

/**
 * 교차류 양쪽 비혼합 ε-NTU 공식 (Chang & Hsu 근사식)
 * @param {number} NTU 전달단위수 (dimensionless)
 * @param {number} Cr  열용량률 비 C_min/C_max (0~1)
 * @returns {number}   유용도 ε (0~1, clamp 적용)
 */
function calculateCrossflowEffectiveness(NTU, Cr) {
  let epsilon;
  if (Cr < 1e-6) {
    // Cr → 0 극한: 최대 유체 용량이 무한대인 경우
    epsilon = 1 - Math.exp(-NTU);
  } else {
    epsilon = 1 - Math.exp((Math.pow(NTU, 0.22) / Cr) * (Math.exp(-Cr * Math.pow(NTU, 0.78)) - 1));
  }
  return Math.min(Math.max(epsilon, 0), 1);
}

/**
 * 라디에이터 1단 ε-NTU 계산
 * @param {number} UA_per_radiator  열통과율×면적 (W/K, 1개 기준)
 * @param {number} C_min            최소 열용량률 (W/K)
 * @param {number} C_max            최대 열용량률 (W/K)
 * @param {number} Cr               열용량률 비 C_min/C_max
 * @param {number} T_water_in       냉각수 입구온도 (℃)
 * @param {number} T_air_in         공기 입구온도 (℃)
 * @param {number} C_water          냉각수측 열용량률 (W/K)
 * @returns {{ NTU, epsilon, Q_max, Q, T_water_out }}
 */
function calculateRadiatorStage(UA_per_radiator, C_min, C_max, Cr, T_water_in, T_air_in, C_water) {
  const NTU         = C_min > 0 ? UA_per_radiator / C_min : 0;
  const epsilon     = calculateCrossflowEffectiveness(NTU, Cr);
  const Q_max       = C_min * Math.max(T_water_in - T_air_in, 0);
  const Q           = Math.max(epsilon * Q_max, 0);
  const T_water_out = C_water > 0 ? T_water_in - Q / C_water : T_water_in;
  return { NTU, epsilon, Q_max, Q, T_water_out };
}

/**
 * 직렬 2단 라디에이터 계산
 * @param {number} UA_per_radiator     열통과율×면적 (W/K, 1개 기준)
 * @param {number} V_air_per_radiator  공기 체적유량 (m³/s, 1개 기준)
 * @param {number} rho_air             공기 밀도 (kg/m³)
 * @param {number} cp_air              공기 비열 (J/kg·K)
 * @param {number} rho_water           냉각수 밀도 (kg/m³)
 * @param {number} coolantFlow_Lmin    냉각수 유량 (L/min)
 * @param {number} cp_water            냉각수 비열 (J/kg·K)
 * @param {number} T_water_in          냉각수 입구온도 (℃)
 * @param {number} T_air_in            공기 입구온도 (℃, 각 단 신선 외기)
 * @returns {{ stage1, stage2, Q_total, T_water_final, rates }}
 */
function calculateTwoStageRadiator(UA_per_radiator, V_air_per_radiator, rho_air, cp_air,
                                    rho_water, coolantFlow_Lmin, cp_water, T_water_in, T_air_in) {
  const rates  = calculateCapacityRates(rho_air, V_air_per_radiator, cp_air,
                                         rho_water, coolantFlow_Lmin, cp_water);
  const stage1 = calculateRadiatorStage(UA_per_radiator, rates.C_min, rates.C_max, rates.Cr,
                                          T_water_in, T_air_in, rates.C_water);
  const stage2 = calculateRadiatorStage(UA_per_radiator, rates.C_min, rates.C_max, rates.Cr,
                                          stage1.T_water_out, T_air_in, rates.C_water);
  return { stage1, stage2, Q_total: stage1.Q + stage2.Q,
           T_water_final: stage2.T_water_out, rates };
}

/**
 * 팬 유량 적용률 3단계 민감도 분석 (50 / 75 / 100 %)
 * @param {number} fanCFM               팬 1개 정격 CFM
 * @param {number} fansPerRadiator      라디에이터당 팬 개수
 * @param {number} W_mm                 코어 가로 (mm)
 * @param {number} H_mm                 코어 세로 (mm)
 * @param {number} U_still              정지 상태 U (W/m²·K)
 * @param {number} U_60kmh              60 km/h 기준 U (W/m²·K)
 * @param {number} fanCoveragePercent   팬 커버리지 (%)
 * @param {number} A_heat_per_radiator  라디에이터 1개 열교환 면적 (m²)
 * @param {number} rho_air              공기 밀도 (kg/m³)
 * @param {number} cp_air               공기 비열 (J/kg·K)
 * @param {number} rho_water            냉각수 밀도 (kg/m³)
 * @param {number} coolantFlow_Lmin     냉각수 유량 (L/min)
 * @param {number} cp_water             냉각수 비열 (J/kg·K)
 * @param {number} T_water_in           냉각수 입구온도 (℃)
 * @param {number} T_air_in             외기 온도 (℃)
 * @param {number} engineHeat_kW        엔진 발열량 기준 (kW)
 * @param {string} uMode                'auto' | 'direct'
 * @param {number} fanU_direct          직접 입력 U (W/m²·K, uMode='direct' 시 사용)
 * @returns {Array<{percent, effectiveCFM, v_face_ms, v_face_kmh, U_applied, Q_total_kW, margin_kW}>}
 */
function calculateFanSensitivityCases(
  fanCFM, fansPerRadiator, W_mm, H_mm,
  U_still, U_60kmh, fanCoveragePercent,
  A_heat_per_radiator, rho_air, cp_air,
  rho_water, coolantFlow_Lmin, cp_water,
  T_water_in, T_air_in, engineHeat_kW,
  uMode, fanU_direct
) {
  var scenarios = [50, 75, 100];
  var results   = [];
  for (var i = 0; i < scenarios.length; i++) {
    var pct   = scenarios[i];
    var V_fan = calculateFanFlowPerRadiator(fanCFM, fansPerRadiator, pct);
    var face  = calculateFaceVelocity(V_fan, W_mm, H_mm);
    var U_fan = (uMode === 'auto')
      ? estimateUFromFaceVelocity(face.v_face_ms, U_still, U_60kmh)
      : fanU_direct;
    var U_eq  = calculateEquivalentU(U_still, U_fan, fanCoveragePercent);
    var UA    = U_eq * A_heat_per_radiator;
    var res   = calculateTwoStageRadiator(UA, V_fan, rho_air, cp_air,
                                           rho_water, coolantFlow_Lmin, cp_water,
                                           T_water_in, T_air_in);
    var Qt_kW = res.Q_total / 1000;
    results.push({
      percent:       pct,
      effectiveCFM:  fanCFM * fansPerRadiator * (pct / 100),
      v_face_ms:     face.v_face_ms,
      v_face_kmh:    face.v_face_kmh,
      U_applied:     U_eq,
      Q_total_kW:    Qt_kW,
      margin_kW:     Qt_kW - engineHeat_kW
    });
  }
  return results;
}

// ── 팬 모드 검산 (페이지 로드 시 콘솔 출력) ──────────
(function fanSelfTest() {
  // 검산 조건: 팬 CFM 600, 팬 1개, 적용률 100%, 코어 160×290 mm
  const CFM     = 600;
  const W       = 160;    // mm
  const H       = 290;    // mm
  const U_still = 60;     // W/m²·K
  const U_60kmh = 200;    // W/m²·K

  const q_m3s             = convertCfmToM3s(CFM);
  const q_per_r           = calculateFanFlowPerRadiator(CFM, 1, 100);
  const { v_face_ms, v_face_kmh } = calculateFaceVelocity(q_per_r, W, H);
  const U_est             = estimateUFromFaceVelocity(v_face_ms, U_still, U_60kmh);

  console.group('[JUST] 팬 모드 검산');
  console.log(`600 CFM → m³/s      : ${q_m3s.toFixed(5)}       (예상: 0.28317)`);
  console.log(`코어 면풍속         : ${v_face_ms.toFixed(2)} m/s       (예상: ~6.10)`);
  console.log(`면풍속 km/h 환산    : ${v_face_kmh.toFixed(1)} km/h      (예상: ~22)`);
  console.log(`자동 추정 U         : ${U_est.toFixed(1)} W/m²·K  (예상: ~111)`);
  console.groupEnd();
})();

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

// ════════════════════════════════════════════════════
// 팬 모드 계산 & 비교 카드
// ════════════════════════════════════════════════════

let _lastWindQtKW = NaN; // 주행풍 총 방열량 캐시 (기준선 카드용)
let _lastFanQtKW  = NaN; // 팬 온 총 방열량 캐시

// 숫자 안전 출력 헬퍼
function _cc(id, val, d) {
  const el = document.getElementById(id);
  if (el) el.textContent = (isFinite(val) && val !== null) ? val.toFixed(d ?? 2) : '—';
}

// 판정 배지 (margin = Q_total − eng_kW)
function _verdict(id, margin) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!isFinite(margin)) { el.textContent = '—'; el.className = 'rad-cc-verdict ref'; return; }
  if (margin >= 0) {
    el.textContent = '✅ 냉각 용량 충족  (+' + margin.toFixed(2) + ' kW)';
    el.className   = 'rad-cc-verdict ok';
  } else {
    el.textContent = '⚠️ 냉각 용량 부족  (' + margin.toFixed(2) + ' kW)';
    el.className   = 'rad-cc-verdict ng';
  }
}

// ── 주행풍 카드 (기존 rs-* DOM 참조) ─────────────────
function updateWindCard() {
  const nr  = Math.max(rg('rad-nr'), 1);
  const eng = rg('rad-eng');
  const getRS = function(id) { return parseFloat(document.getElementById(id)?.textContent); };

  const Va_total = getRS('rs-Va');
  const Qt       = getRS('rs-Qt');
  const Q1       = getRS('rs-Q1');
  const Q2       = getRS('rs-Q2');
  const Tw_out   = getRS('rs-Tw-out');
  const margin   = isFinite(Qt) ? Qt - eng : NaN;

  const qtEl = document.getElementById('cc-wind-Qt');
  if (qtEl) qtEl.textContent = isFinite(Qt) ? Qt.toFixed(3) + ' kW' : '—';

  _cc('cc-wind-Va',     isFinite(Va_total) ? Va_total / nr : NaN, 5);
  _cc('cc-wind-v',      rg('rad-v') / 3.6,   2);
  _cc('cc-wind-U',      rg('rad-U'),           0);
  _cc('cc-wind-Q1',     Q1,                    3);
  _cc('cc-wind-Q2',     Q2,                    3);
  _cc('cc-wind-Tw',     Tw_out,               1);
  _cc('cc-wind-margin', margin,                2);
  _verdict('cc-wind-verdict', margin);

  _lastWindQtKW = isFinite(Qt) ? Qt : NaN;
  updateRefCard(eng);
}

// ── 팬 카드 결과 표시 ─────────────────────────────────
function updateFanCard(result, face, U_eq, V_air, eng) {
  const Qt   = result.Q_total / 1000;
  const Q1   = result.stage1.Q / 1000;
  const Q2   = result.stage2.Q / 1000;
  const Tw   = result.T_water_final;
  const margin = Qt - eng;

  const qtEl = document.getElementById('cc-fan-Qt');
  if (qtEl) qtEl.textContent = Qt.toFixed(3) + ' kW';

  _cc('cc-fan-Va',     V_air,           5);
  _cc('cc-fan-v',      face.v_face_ms,  2);
  _cc('cc-fan-U',      U_eq,            0);
  _cc('cc-fan-Q1',     Q1,              3);
  _cc('cc-fan-Q2',     Q2,              3);
  _cc('cc-fan-Tw',     Tw,              1);
  _cc('cc-fan-margin', margin,          2);
  _verdict('cc-fan-verdict', margin);

  _lastFanQtKW = Qt;
  updateRefCard(eng);
}

// ── 팬 카드 메시지 (미입력·오류) ────────────────────
function _showFanMsg(msg, isError) {
  const el = document.getElementById('cc-fan-verdict');
  if (el) { el.textContent = msg; el.className = 'rad-cc-verdict ' + (isError ? 'ng' : 'ref'); }
  ['cc-fan-Qt','cc-fan-Va','cc-fan-v','cc-fan-U','cc-fan-Q1','cc-fan-Q2','cc-fan-Tw','cc-fan-margin']
    .forEach(function(id) { var e = document.getElementById(id); if (e) e.textContent = '—'; });
  _lastFanQtKW = NaN;
  updateRefCard(rg('rad-eng'));
}

// ── 기준선 카드 ───────────────────────────────────────
function updateRefCard(eng) {
  const engEl = document.getElementById('cc-eng-Qt');
  if (engEl) engEl.textContent = eng > 0 ? eng.toFixed(1) + ' kW' : '—';

  var windM = isFinite(_lastWindQtKW) && eng > 0 ? _lastWindQtKW - eng : NaN;
  var fanM  = isFinite(_lastFanQtKW)  && eng > 0 ? _lastFanQtKW  - eng : NaN;

  var wEl = document.getElementById('cc-eng-wind-margin');
  if (wEl) {
    wEl.textContent = isFinite(windM) ? (windM >= 0 ? '+' : '') + windM.toFixed(2) : '—';
    wEl.style.color = isFinite(windM) ? (windM >= 0 ? 'var(--green)' : 'var(--red)') : '#555';
  }
  var fEl = document.getElementById('cc-eng-fan-margin');
  if (fEl) {
    fEl.textContent = isFinite(fanM) ? (fanM >= 0 ? '+' : '') + fanM.toFixed(2) : '—';
    fEl.style.color = isFinite(fanM)  ? (fanM  >= 0 ? 'var(--green)' : 'var(--red)') : '#555';
  }
}

// ── 팬 모드 메인 계산 ─────────────────────────────────
function calcFanMode() {
  var W_mm   = rg('rad-W'),  H_mm   = rg('rad-H'),  nr      = rg('rad-nr');
  var rha    = rg('rad-rha'), cpa   = rg('rad-cpa');
  var rhw    = rg('rad-rhw'), cpw   = rg('rad-cpw');
  var Ta     = rg('rad-Ta'),  Tw_in = rg('rad-Tw'), Vw_Lmin = rg('rad-Vw');
  var eng    = rg('rad-eng');

  if (W_mm <= 0 || H_mm <= 0 || nr <= 0)
    return _showFanMsg('코어 치수 / 개수 입력 필요', true);
  if (rha <= 0 || cpa <= 0 || rhw <= 0 || cpw <= 0)
    return _showFanMsg('유체 물성값 확인 필요', true);
  if (Vw_Lmin <= 0)
    return _showFanMsg('냉각수 유량 입력 필요', true);
  if (Tw_in <= Ta)
    return _showFanMsg('⚠️ 냉각수 온도 ≤ 공기 온도: 방열 불가', true);

  // 열교환 면적 (기존 결과 참조)
  var A_total = parseFloat(document.getElementById('rs-A')?.textContent);
  if (!isFinite(A_total) || A_total <= 0)
    return _showFanMsg('열교환 면적 계산 필요 (치수 입력 후 확인)', true);
  var A_heat_per_rad = A_total / nr;
  var A_front = (W_mm / 1000) * (H_mm / 1000);

  var isFan  = document.getElementById('fan-mode-fan')?.classList.contains('fan-mode-active');
  var isMeas = document.getElementById('fan-mode-measured')?.classList.contains('fan-mode-active');
  if (!isFan && !isMeas) return _showFanMsg('주행풍 FAN OFF 모드 (팬 모드 미선택)', false);

  var V_air, U_fan, U_still, fanCovPct;

  if (isFan) {
    var cfm    = parseFloat(document.getElementById('fan-cfm')?.value)   || 0;
    var count  = parseFloat(document.getElementById('fan-count')?.value)  || 1;
    var effPct = Math.min(Math.max(parseFloat(document.getElementById('fan-eff')?.value) || 100, 0), 100);
    fanCovPct  = Math.min(Math.max(parseFloat(document.getElementById('fan-cover')?.value) || 100, 0), 100);
    if (cfm   <= 0) return _showFanMsg('팬 CFM 입력 필요', true);
    if (count <= 0) return _showFanMsg('팬 개수 입력 필요', true);
    V_air   = calculateFanFlowPerRadiator(cfm, count, effPct);
    U_still = Math.max(parseFloat(document.getElementById('fan-U-idle')?.value)   || 60,  1);
    var isAutoFan = document.getElementById('fan-u-auto')?.classList.contains('fan-u-active');
    if (isAutoFan) {
      var U60f = Math.max(parseFloat(document.getElementById('fan-U-60')?.value) || 200, 1);
      U_fan = estimateUFromFaceVelocity(calculateFaceVelocity(V_air, W_mm, H_mm).v_face_ms, U_still, U60f);
    } else {
      U_fan = Math.max(parseFloat(document.getElementById('fan-U-direct')?.value) || 80, 1);
    }
  } else {
    var q_val = parseFloat(document.getElementById('fan-meas-q')?.value);
    var v_val = parseFloat(document.getElementById('fan-meas-v')?.value);
    fanCovPct = 100;
    if      (isFinite(q_val) && q_val > 0) V_air = q_val;
    else if (isFinite(v_val) && v_val > 0) V_air = v_val * A_front;
    else return _showFanMsg('실측 체적유량 또는 면풍속 입력 필요', false);
    U_still = Math.max(parseFloat(document.getElementById('meas-U-idle')?.value) || 60, 1);
    var isAutoMeas = document.getElementById('meas-u-auto')?.classList.contains('fan-u-active');
    if (isAutoMeas) {
      var U60m = Math.max(parseFloat(document.getElementById('meas-U-60')?.value) || 200, 1);
      U_fan = estimateUFromFaceVelocity(calculateFaceVelocity(V_air, W_mm, H_mm).v_face_ms, U_still, U60m);
    } else {
      U_fan = Math.max(parseFloat(document.getElementById('meas-U-direct')?.value) || 80, 1);
    }
  }

  if (V_air <= 0) return _showFanMsg('공기유량 ≤ 0: 팬 입력 확인', true);

  var U_eq   = calculateEquivalentU(U_still, U_fan, fanCovPct);
  var UA     = Math.max(U_eq, 0) * A_heat_per_rad;
  var result = calculateTwoStageRadiator(UA, V_air, rha, cpa, rhw, Vw_Lmin, cpw, Tw_in, Ta);

  if (!isFinite(result.Q_total) || result.Q_total < 0)
    return _showFanMsg('계산 오류: 입력값 확인 필요', true);

  updateFanCard(result, calculateFaceVelocity(V_air, W_mm, H_mm), U_eq, V_air, eng);
}

// ── 기존 전역 함수 래핑 (원본 코드 무수정) ────────────
;(function patchRadiatorGlobals() {
  var _rad = window.calcRadiator;
  window.calcRadiator = function() { _rad(); updateWindCard(); calcFanMode(); };

  var _fanUp = window.fanUpdate;
  window.fanUpdate = function() { _fanUp(); calcFanMode(); };

  var _setMode = window.fanSetMode;
  window.fanSetMode = function(m) { _setMode(m); calcFanMode(); };

  var _setU = window.fanSetUMode;
  window.fanSetUMode = function(s, m) { _setU(s, m); calcFanMode(); };

  var _measSync = window.fanMeasSync;
  window.fanMeasSync = function(from) { _measSync(from); calcFanMode(); };
})();

// 페이지 로드 후 초기 카드 업데이트
setTimeout(function() { updateWindCard(); calcFanMode(); }, 200);

// ════════════════════════════════════════════════════
// 민감도 분석 + Firebase 팬 입력 동기화
// ════════════════════════════════════════════════════

// ── 민감도 표 행 생성 ─────────────────────────────────
function updateSensTable(cases, currentPct) {
  var tbody = document.getElementById('rad-sens-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  cases.forEach(function(row) {
    var tr   = document.createElement('tr');
    var mCol = row.margin_kW >= 0 ? 'var(--green)' : 'var(--red)';
    var mStr = (row.margin_kW >= 0 ? '+' : '') + row.margin_kW.toFixed(2);
    if (row.percent === currentPct) tr.className = 'rad-sens-active';
    tr.innerHTML =
      '<td>' + row.percent + ' %</td>' +
      '<td>' + row.effectiveCFM.toFixed(0) + '</td>' +
      '<td>' + row.v_face_ms.toFixed(2) + '</td>' +
      '<td>' + row.v_face_kmh.toFixed(1) + '</td>' +
      '<td>' + row.U_applied.toFixed(0) + '</td>' +
      '<td>' + row.Q_total_kW.toFixed(3) + '</td>' +
      '<td style="color:' + mCol + '">' + mStr + '</td>';
    tbody.appendChild(tr);
  });
}

// ── 민감도 섹션 전체 업데이트 (FAN ON 모드에서만 표시) ─
function updateSensSection() {
  var secEl      = document.getElementById('rad-sens-section');
  var autoWarnEl = document.getElementById('rad-notice-auto-u');
  var isFan  = document.getElementById('fan-mode-fan')?.classList.contains('fan-mode-active');
  var isMeas = document.getElementById('fan-mode-measured')?.classList.contains('fan-mode-active');

  // 자동 U 경고 표시 여부
  var isAutoU = false;
  if (isFan)  isAutoU = !!document.getElementById('fan-u-auto')?.classList.contains('fan-u-active');
  if (isMeas) isAutoU = !!document.getElementById('meas-u-auto')?.classList.contains('fan-u-active');
  if (autoWarnEl) autoWarnEl.style.display = isAutoU ? '' : 'none';

  // 민감도 표: FAN ON 모드에서만 의미 있음
  if (!isFan || !secEl) { if (secEl) secEl.style.display = 'none'; return; }

  var W_mm    = rg('rad-W'),  H_mm    = rg('rad-H'),  nr      = rg('rad-nr');
  var rha     = rg('rad-rha'), cpa    = rg('rad-cpa');
  var rhw     = rg('rad-rhw'), cpw    = rg('rad-cpw');
  var Ta      = rg('rad-Ta'),  Tw_in  = rg('rad-Tw'), Vw_Lmin = rg('rad-Vw');
  var eng     = rg('rad-eng');
  var cfm     = parseFloat(document.getElementById('fan-cfm')?.value)    || 0;
  var count   = parseFloat(document.getElementById('fan-count')?.value)  || 1;
  var effPct  = parseFloat(document.getElementById('fan-eff')?.value)    || 100;
  var covPct  = parseFloat(document.getElementById('fan-cover')?.value)  || 100;
  var U_still = Math.max(parseFloat(document.getElementById('fan-U-idle')?.value) || 60,  1);
  var U_60kmh = Math.max(parseFloat(document.getElementById('fan-U-60')?.value)   || 200, 1);
  var uIsAuto = !!document.getElementById('fan-u-auto')?.classList.contains('fan-u-active');
  var U_dir   = parseFloat(document.getElementById('fan-U-direct')?.value) || 80;
  var A_total = parseFloat(document.getElementById('rs-A')?.textContent);

  if (cfm <= 0 || count <= 0 || !isFinite(A_total) || A_total <= 0 ||
      W_mm <= 0 || H_mm <= 0 || nr <= 0 ||
      rha <= 0  || cpa <= 0  || rhw <= 0 || cpw <= 0 ||
      Vw_Lmin <= 0 || Tw_in <= Ta) {
    secEl.style.display = 'none';
    return;
  }

  var A_heat = A_total / nr;
  var cases  = calculateFanSensitivityCases(
    cfm, count, W_mm, H_mm,
    U_still, U_60kmh, covPct, A_heat,
    rha, cpa, rhw, Vw_Lmin, cpw,
    Tw_in, Ta, eng,
    uIsAuto ? 'auto' : 'direct', U_dir
  );

  // 현재 슬라이더 값에서 가장 가까운 시나리오 강조
  var snapPct = [50, 75, 100].reduce(function(best, p) {
    return Math.abs(p - effPct) < Math.abs(best - effPct) ? p : best;
  }, 50);

  secEl.style.display = '';
  updateSensTable(cases, snapPct);
}

// ── 팬 입력값 Firebase 저장 ────────────────────────────
function saveRadiatorFan() {
  if (typeof authUid !== 'undefined' && !authUid) return;
  if (typeof restoringRadiator !== 'undefined' && restoringRadiator) return;
  if (typeof db === 'undefined' || typeof S === 'undefined' || typeof save === 'undefined') return;
  var isFan  = !!document.getElementById('fan-mode-fan')?.classList.contains('fan-mode-active');
  var isMeas = !!document.getElementById('fan-mode-measured')?.classList.contains('fan-mode-active');
  var uIsAuto = !!document.getElementById('fan-u-auto')?.classList.contains('fan-u-active');
  S.radiatorFan = {
    airFlowMode:            isFan ? 'fan' : isMeas ? 'measured' : 'ram',
    fanCFM:                 parseFloat(document.getElementById('fan-cfm')?.value)      || 600,
    fansPerRadiator:        parseFloat(document.getElementById('fan-count')?.value)    || 1,
    fanFlowPercent:         parseFloat(document.getElementById('fan-eff')?.value)      || 100,
    fanCoveragePercent:     parseFloat(document.getElementById('fan-cover')?.value)    || 100,
    fanUMode:               uIsAuto ? 'auto' : 'direct',
    fanU_direct:            parseFloat(document.getElementById('fan-U-direct')?.value) || 150,
    U_still:                parseFloat(document.getElementById('fan-U-idle')?.value)   || 60,
    U_60kmh:                parseFloat(document.getElementById('fan-U-60')?.value)     || 200,
    measuredFlow_m3s:       parseFloat(document.getElementById('fan-meas-q')?.value)  || 0,
    measuredFaceVelocity_ms: parseFloat(document.getElementById('fan-meas-v')?.value) || 0
  };
  save('radiatorFan');
}

// ── 팬 입력값 Firebase 복원 (페이지 초기 로드용) ─────────
function loadRadiatorFan(d) {
  if (!d) return;
  function sv(id, val) { var el = document.getElementById(id); if (el && val !== undefined) el.value = val; }
  var def = (typeof S !== 'undefined' && S.radiatorFan) ? S.radiatorFan : {};
  sv('fan-cfm',      d.fanCFM            ?? def.fanCFM            ?? 600);
  sv('fan-count',    d.fansPerRadiator   ?? def.fansPerRadiator   ?? 1);
  sv('fan-eff',      d.fanFlowPercent    ?? def.fanFlowPercent    ?? 100);
  sv('fan-cover',    d.fanCoveragePercent ?? def.fanCoveragePercent ?? 100);
  sv('fan-U-direct', d.fanU_direct       ?? def.fanU_direct       ?? 150);
  sv('fan-U-idle',   d.U_still           ?? def.U_still           ?? 60);
  sv('fan-U-60',     d.U_60kmh           ?? def.U_60kmh           ?? 200);
  sv('fan-meas-q',   d.measuredFlow_m3s  ?? 0);
  sv('fan-meas-v',   d.measuredFaceVelocity_ms ?? 0);
  // 슬라이더 표시 갱신
  ['fan-eff', 'fan-cover'].forEach(function(id) { fanSyncSlider(id, id + '-val'); });
  // 공기 유동 모드 복원 (DOM 직접 조작 – 저장 루프 방지)
  var mode = d.airFlowMode || 'ram';
  ['wind', 'fan', 'measured'].forEach(function(m) {
    var btn = document.getElementById('fan-mode-' + m);
    var pnl = document.getElementById('fan-panel-' + m);
    if (btn) btn.classList.toggle('fan-mode-active', m === mode);
    if (pnl) pnl.style.display = (m === mode && m !== 'wind') ? '' : 'none';
  });
  // U 계산 방식 복원
  var uIsAuto = (d.fanUMode !== 'direct');
  var dBtn = document.getElementById('fan-u-direct'), aBtn = document.getElementById('fan-u-auto');
  var dPnl = document.getElementById('fan-u-direct-panel'), aPnl = document.getElementById('fan-u-auto-panel');
  if (dBtn) dBtn.classList.toggle('fan-u-active', !uIsAuto);
  if (aBtn) aBtn.classList.toggle('fan-u-active',  uIsAuto);
  if (dPnl) dPnl.style.display = !uIsAuto ? '' : 'none';
  if (aPnl) aPnl.style.display =  uIsAuto ? '' : 'none';
  // 참고값 표시 갱신 (fanUpdate 직접 호출 – window 경유 시 이중 저장 방지용 플래그)
  if (typeof fanUpdate === 'function') fanUpdate();
}

// ── calcFanMode 래핑: 민감도 분석 + Firebase 저장 연결 ──
;(function patchSensAndSync() {
  var _fn = calcFanMode;
  calcFanMode = function() { _fn(); updateSensSection(); saveRadiatorFan(); };
})();

// ── 초기 Firebase 로드 (페이지 로드 1회) ─────────────
let restoringRadiator = false;
function initRadiatorSync(){
  let loaded=false;
  authWatch('just/radiatorFan',function(snap){
    if(loaded)return;loaded=true;
    const data=snap.val();if(!data)return;
    restoringRadiator=true;
    try{loadRadiatorFan(data);calcFanMode();}finally{restoringRadiator=false;}
  });
}

// ── 작업 완료 콘솔 검산 출력 ──────────────────────────
(function fanSensitivitySelfTest() {
  var CFM = 600, cnt = 1, W = 160, H = 290;
  var A_heat = 2.0036 / 2; // 라디에이터 1개당 m²
  var rha = 1.2, cpa = 1006, rhw = 1000, cpw = 4183;
  var cases = calculateFanSensitivityCases(
    CFM, cnt, W, H, 60, 200, 100,
    A_heat, rha, cpa, rhw, 20, cpw, 100, 35, 0, 'auto', 150
  );
  var c = cases[2]; // 100% 시나리오

  console.group('[JUST] 민감도 분석 검산 결과');
  console.log('── 수정 파일 ──────────────────────────────────');
  console.log('  js/radiator.js  : calculateFanSensitivityCases() + 민감도·동기화 로직 추가');
  console.log('  js/storage.js   : S.radiatorFan 기본값 추가');
  console.log('  index.html      : 민감도 분석 표 + 주의문구 섹션 추가');
  console.log('  css/style.css   : .rad-sens* .rad-notice-* 스타일 추가');
  console.log('── 추가된 계산식 ───────────────────────────────');
  console.log('  calculateFanSensitivityCases(): 50/75/100% 적용률 3시나리오 반복 계산');
  console.log('  (calculateRadiatorStage, calculateTwoStageRadiator 재사용)');
  console.log('── 기존 계산과 달라진 점 ──────────────────────');
  console.log('  없음. calcRadiator(), updateWindCard(), updateFanCard() 원본 무수정.');
  console.log('  calcFanMode만 래핑하여 updateSensSection() + saveRadiatorFan() 연결.');
  console.log('── 팬 모드 검산 (CFM 600, 코어 160×290, A_heat 2.0036m²) ─');
  console.log('  실효 CFM       : ' + c.effectiveCFM.toFixed(0) + ' CFM');
  console.log('  면풍속         : ' + c.v_face_ms.toFixed(2)  + ' m/s   (예상: ~6.10)');
  console.log('  면풍속 km/h    : ' + c.v_face_kmh.toFixed(1) + ' km/h');
  console.log('  적용 자동 U    : ' + c.U_applied.toFixed(1)  + ' W/m²·K  (예상: ~111)');
  console.log('  총 방열량      : ' + c.Q_total_kW.toFixed(3) + ' kW  (예상: ~11 kW)');
  console.log('── 남은 물리적 한계·가정 ──────────────────────');
  console.log('  1. U 선형 보간  — 실험식이 아닌 면풍속 0~60km/h 범위 보간값');
  console.log('  2. CFM 표기     — 자유풍량 기준, 라디에이터 장착 시 실측 필요');
  console.log('  3. 직렬 2단     — 각 단 신선 외기 온도 가정, 공기 재순환 미고려');
  console.log('  4. 교차류 공식  — Chang & Hsu 근사식 (양쪽 비혼합)');
  console.log('  5. 압력손실     — 팬-라디에이터 상호 압력 특성 미반영');
  console.groupEnd();
})();
