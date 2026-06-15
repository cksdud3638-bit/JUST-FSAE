// ═══════════════════════════════════════════════
// DAMPER SETUP CALCULATOR v2
// ═══════════════════════════════════════════════

const DM_DEF = {
  // 차량 기본
  total_mass: 300,
  ms:         242.67,
  front_pct:  49,
  unsprung_f: 25.779,
  unsprung_r: 31.551,
  // 스프링 & 모션
  k_spring:   52.5,
  mr_f:       0.51,
  mr_r:       0.60,
  track_f:    1200,
  track_r:    1180,
  // 댐퍼 클릭
  v_lo:       25,
  v_hi:       300,
  clicks_comp: 12,
  clicks_reb:  20,
  // 저속 감쇠력 (N)
  fc_max_lo: 600,   fc_min_lo: 95,
  fr_max_lo: 290,   fr_min_lo: 20,
  // 고속 감쇠력 (N)
  fc_max_hi: 1658,  fc_min_hi: 167,
  fr_max_hi: 3300,  fr_min_hi: 1500,
};

// 권장 감쇠비 범위 [lo, hi]
const DM_ZETA = {
  comp_lo: [0.3, 0.7],
  reb_lo:  [0.6, 1.2],
  comp_hi: [0.2, 0.5],
  reb_hi:  [0.4, 0.9],
};

let _dmReady = false;

function initDamper() {
  if (!_dmReady) {
    Object.entries(DM_DEF).forEach(([k, v]) => {
      const el = document.getElementById('dm-' + k);
      if (el) el.value = v;
    });
    document.querySelectorAll('#tab-damper .dm-inp').forEach(el =>
      el.addEventListener('input', calcDamper)
    );
    _dmReady = true;
  }
  calcDamper();
}

function dv(id) { return parseFloat(document.getElementById(id)?.value) || 0; }
function ds(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }

function calcDamper() {
  // ── 읽기 ────────────────────────────────────────────
  const ms       = dv('dm-ms');
  const fp       = dv('dm-front_pct') / 100;
  const ms_f     = ms * fp / 2;
  const ms_r     = ms * (1 - fp) / 2;

  const ks   = dv('dm-k_spring');
  const mr_f = dv('dm-mr_f');
  const mr_r = dv('dm-mr_r');
  const tr_f = dv('dm-track_f');
  const tr_r = dv('dm-track_r');

  const v_lo    = dv('dm-v_lo');
  const v_hi    = dv('dm-v_hi');
  const n_comp  = dv('dm-clicks_comp');
  const n_reb   = dv('dm-clicks_reb');

  const fc_max_lo = dv('dm-fc_max_lo'), fc_min_lo = dv('dm-fc_min_lo');
  const fr_max_lo = dv('dm-fr_max_lo'), fr_min_lo = dv('dm-fr_min_lo');
  const fc_max_hi = dv('dm-fc_max_hi'), fc_min_hi = dv('dm-fc_min_hi');
  const fr_max_hi = dv('dm-fr_max_hi'), fr_min_hi = dv('dm-fr_min_hi');

  // ── 기본 계산 ───────────────────────────────────────
  const kw_f   = ks * mr_f * mr_f;
  const kw_r   = ks * mr_r * mr_r;
  const freq_f = (1 / (2 * Math.PI)) * Math.sqrt(kw_f * 1000 / ms_f);
  const freq_r = (1 / (2 * Math.PI)) * Math.sqrt(kw_r * 1000 / ms_r);
  const cc_f   = 2 * Math.sqrt(kw_f * 1000 * ms_f) / 1000;   // N·s/mm
  const cc_r   = 2 * Math.sqrt(kw_r * 1000 * ms_r) / 1000;

  // ── 감쇠비 ─────────────────────────────────────────
  function zeta(F, V, mr, cc) {
    const ce = F / V;         // N·s/mm (damper frame)
    const cw = ce * mr * mr;  // N·s/mm (wheel frame)
    return { ce, cw, z: cw / cc };
  }
  const Z = {
    f: {
      comp_max_lo: zeta(fc_max_lo, v_lo, mr_f, cc_f),
      comp_min_lo: zeta(fc_min_lo, v_lo, mr_f, cc_f),
      reb_max_lo:  zeta(fr_max_lo, v_lo, mr_f, cc_f),
      reb_min_lo:  zeta(fr_min_lo, v_lo, mr_f, cc_f),
      comp_max_hi: zeta(fc_max_hi, v_hi, mr_f, cc_f),
      comp_min_hi: zeta(fc_min_hi, v_hi, mr_f, cc_f),
      reb_max_hi:  zeta(fr_max_hi, v_hi, mr_f, cc_f),
      reb_min_hi:  zeta(fr_min_hi, v_hi, mr_f, cc_f),
    },
    r: {
      comp_max_lo: zeta(fc_max_lo, v_lo, mr_r, cc_r),
      comp_min_lo: zeta(fc_min_lo, v_lo, mr_r, cc_r),
      reb_max_lo:  zeta(fr_max_lo, v_lo, mr_r, cc_r),
      reb_min_lo:  zeta(fr_min_lo, v_lo, mr_r, cc_r),
      comp_max_hi: zeta(fc_max_hi, v_hi, mr_r, cc_r),
      comp_min_hi: zeta(fc_min_hi, v_hi, mr_r, cc_r),
      reb_max_hi:  zeta(fr_max_hi, v_hi, mr_r, cc_r),
      reb_min_hi:  zeta(fr_min_hi, v_hi, mr_r, cc_r),
    },
  };

  // ── 롤 강성 ─────────────────────────────────────────
  const kphi_f  = kw_f * Math.pow(tr_f / 2, 2);
  const kphi_r  = kw_r * Math.pow(tr_r / 2, 2);
  const roll_pct = (kphi_f + kphi_r) > 0 ? kphi_f / (kphi_f + kphi_r) * 100 : 0;

  // ── 클릭 추천 ────────────────────────────────────────
  function clickRec(cc, mr, V, f_min, f_max, n_total, [z_lo, z_hi]) {
    const mr2    = mr * mr;
    const ce_min = f_min / V;
    const ce_max = f_max / V;
    if (Math.abs(ce_max - ce_min) < 1e-9) return { type: 'err' };
    const n_lo = Math.ceil (Math.max(0,       (z_lo * cc / mr2 - ce_min) / (ce_max - ce_min) * n_total));
    const n_hi = Math.floor(Math.min(n_total, (z_hi * cc / mr2 - ce_min) / (ce_max - ce_min) * n_total));
    if (n_lo > n_hi) {
      if ((ce_min * mr2) / cc > z_hi) return { type: 'over',  n: 0 };
      if ((ce_max * mr2) / cc < z_lo) return { type: 'under', n: n_total };
      return { type: 'none' };
    }
    return { type: 'ok', lo: n_lo, hi: n_hi };
  }

  const REC = {
    f: {
      comp_lo: clickRec(cc_f, mr_f, v_lo, fc_min_lo, fc_max_lo, n_comp, DM_ZETA.comp_lo),
      comp_hi: clickRec(cc_f, mr_f, v_hi, fc_min_hi, fc_max_hi, n_comp, DM_ZETA.comp_hi),
      reb_lo:  clickRec(cc_f, mr_f, v_lo, fr_min_lo, fr_max_lo, n_reb,  DM_ZETA.reb_lo),
      reb_hi:  clickRec(cc_f, mr_f, v_hi, fr_min_hi, fr_max_hi, n_reb,  DM_ZETA.reb_hi),
    },
    r: {
      comp_lo: clickRec(cc_r, mr_r, v_lo, fc_min_lo, fc_max_lo, n_comp, DM_ZETA.comp_lo),
      comp_hi: clickRec(cc_r, mr_r, v_hi, fc_min_hi, fc_max_hi, n_comp, DM_ZETA.comp_hi),
      reb_lo:  clickRec(cc_r, mr_r, v_lo, fr_min_lo, fr_max_lo, n_reb,  DM_ZETA.reb_lo),
      reb_hi:  clickRec(cc_r, mr_r, v_hi, fr_min_hi, fr_max_hi, n_reb,  DM_ZETA.reb_hi),
    },
  };

  // ── DOM 업데이트 ─────────────────────────────────────
  // 속도 라벨 동기화
  ds('dm-label-vlo',  v_lo);  ds('dm-label-vhi',  v_hi);
  ds('dm-title-vlo',  v_lo);  ds('dm-title-vhi',  v_hi);
  // MR 라벨
  ds('dm-lbl-mr-f', mr_f);    ds('dm-lbl-mr-r', mr_r);
  // 코너 스프렁 매스 (좌측 패널 + 우측 카드1 - 각각 별도 ID)
  ds('dm-out-ms-f',  ms_f.toFixed(2));
  ds('dm-out-ms-r',  ms_r.toFixed(2));
  ds('dm-out-ms-f2', ms_f.toFixed(2));
  ds('dm-out-ms-r2', ms_r.toFixed(2));
  // 요약 카드
  ds('dm-out-kw-f',   kw_f.toFixed(3));
  ds('dm-out-kw-r',   kw_r.toFixed(3));
  ds('dm-out-freq-f', freq_f.toFixed(3));
  ds('dm-out-freq-r', freq_r.toFixed(3));
  ds('dm-out-cc-f',   cc_f.toFixed(3));
  ds('dm-out-cc-r',   cc_r.toFixed(3));

  // 감쇠비 테이블
  const rows = [
    ['comp_max_lo', 'comp_lo'], ['comp_min_lo', 'comp_lo'],
    ['reb_max_lo',  'reb_lo'],  ['reb_min_lo',  'reb_lo'],
    ['comp_max_hi', 'comp_hi'], ['comp_min_hi', 'comp_hi'],
    ['reb_max_hi',  'reb_hi'],  ['reb_min_hi',  'reb_hi'],
  ];
  for (const [key, rng] of rows) {
    const zf = Z.f[key], zr = Z.r[key];
    ds(`dm-ce-f-${key}`, zf.ce.toFixed(2));
    ds(`dm-cw-f-${key}`, zf.cw.toFixed(3));
    setZeta(`dm-z-f-${key}`, zf.z, DM_ZETA[rng]);
    ds(`dm-ce-r-${key}`, zr.ce.toFixed(2));
    ds(`dm-cw-r-${key}`, zr.cw.toFixed(3));
    setZeta(`dm-z-r-${key}`, zr.z, DM_ZETA[rng]);
  }

  // 롤 강성
  ds('dm-out-kphi-f', (kphi_f / 1e6).toFixed(3));
  ds('dm-out-kphi-r', (kphi_r / 1e6).toFixed(3));
  ds('dm-out-roll-f', roll_pct.toFixed(1));
  ds('dm-out-roll-r', (100 - roll_pct).toFixed(1));
  const bar = document.getElementById('dm-roll-bar');
  if (bar) bar.style.width = Math.min(100, Math.max(0, roll_pct)).toFixed(1) + '%';
  dmRollWarn(roll_pct);

  // 클릭 추천
  setClickRec('dm-rec-f-comp-lo', REC.f.comp_lo, n_comp);
  setClickRec('dm-rec-f-comp-hi', REC.f.comp_hi, n_comp);
  setClickRec('dm-rec-f-reb-lo',  REC.f.reb_lo,  n_reb);
  setClickRec('dm-rec-f-reb-hi',  REC.f.reb_hi,  n_reb);
  setClickRec('dm-rec-r-comp-lo', REC.r.comp_lo, n_comp);
  setClickRec('dm-rec-r-comp-hi', REC.r.comp_hi, n_comp);
  setClickRec('dm-rec-r-reb-lo',  REC.r.reb_lo,  n_reb);
  setClickRec('dm-rec-r-reb-hi',  REC.r.reb_hi,  n_reb);

  // 조정 가이드
  dmBalanceGuide(roll_pct);
}

// ── 헬퍼 ─────────────────────────────────────────────

function setZeta(id, z, [lo, hi]) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = z.toFixed(3);
  if (z < lo * 0.85) {
    el.style.color = '#4da6ff';   // 너무 낮음 (파랑)
    el.title = `목표 ${lo}~${hi} — 미달`;
  } else if (z > hi * 1.15) {
    el.style.color = '#ff4444';   // 너무 높음 (빨강)
    el.title = `목표 ${lo}~${hi} — 초과`;
  } else if (z < lo || z > hi) {
    el.style.color = '#ffaa00';   // 경계 (노랑)
    el.title = `목표 ${lo}~${hi} — 경계`;
  } else {
    el.style.color = '#00cc66';   // 정상 (초록)
    el.title = `목표 ${lo}~${hi} — 정상`;
  }
}

function setClickRec(id, rec, n_total) {
  const el = document.getElementById(id);
  if (!el) return;
  if (rec.type === 'ok') {
    el.textContent = rec.lo === rec.hi ? `${rec.lo}클릭` : `${rec.lo}~${rec.hi}클릭`;
    el.className = 'dm-rec dm-rec-ok';
  } else if (rec.type === 'over') {
    el.textContent = `0클릭 (최소)`;
    el.className = 'dm-rec dm-rec-warn';
  } else if (rec.type === 'under') {
    el.textContent = `${n_total}클릭 (최대)`;
    el.className = 'dm-rec dm-rec-warn';
  } else {
    el.textContent = '범위 없음';
    el.className = 'dm-rec dm-rec-err';
  }
}

function dmRollWarn(pct) {
  const el = document.getElementById('dm-roll-warn');
  if (!el) return;
  if (pct < 60) {
    el.textContent = '⚠ 권장 미달 — 전 롤 강성 부족 (언더스티어 경향)';
    el.className = 'dm-warn dm-warn-yellow';
  } else if (pct > 70) {
    el.textContent = '⚠ 권장 초과 — 전 롤 강성 과다 (오버스티어 경향)';
    el.className = 'dm-warn dm-warn-red';
  } else {
    el.textContent = '✓ FSAE 권장 범위 내 (전 60~70%)';
    el.className = 'dm-warn dm-warn-green';
  }
}

function dmBalanceGuide(pct) {
  const el = document.getElementById('dm-balance-guide');
  if (!el) return;
  if (pct < 60) {
    el.innerHTML = '<strong>언더스티어 조정:</strong> 전 컴프레션↑ 또는 후 컴프레션↓ · 전 리바운드↓';
    el.className = 'dm-guide dm-guide-yellow';
  } else if (pct > 70) {
    el.innerHTML = '<strong>오버스티어 조정:</strong> 후 컴프레션↑ 또는 전 컴프레션↓ · 전 리바운드↑';
    el.className = 'dm-guide dm-guide-red';
  } else {
    el.innerHTML = '<strong>이상적인 배분:</strong> 전/후 롤 강성이 FSAE 권장 범위 내에 있습니다.';
    el.className = 'dm-guide dm-guide-green';
  }
}

function resetDamperDefaults() {
  Object.entries(DM_DEF).forEach(([k, v]) => {
    const el = document.getElementById('dm-' + k);
    if (el) el.value = v;
  });
  calcDamper();
}

function copyDamperResult() {
  const lines = [];
  lines.push('=== JUST-FSAE 댐퍼 세팅 계산 결과 ===');

  const collect = (label, ids) => {
    lines.push('');
    lines.push('[' + label + ']');
    ids.forEach(([lbl, id]) => {
      const el = document.getElementById(id);
      if (el) lines.push(`  ${lbl}: ${el.textContent}`);
    });
  };

  collect('기본 계산 요약', [
    ['전 코너 스프렁', 'dm-out-ms-f'], ['후 코너 스프렁', 'dm-out-ms-r'],
    ['전 휠 레이트', 'dm-out-kw-f'],   ['후 휠 레이트', 'dm-out-kw-r'],
    ['전 라이드 주파수', 'dm-out-freq-f'], ['후 라이드 주파수', 'dm-out-freq-r'],
    ['전 C_crit', 'dm-out-cc-f'],      ['후 C_crit', 'dm-out-cc-r'],
  ]);

  const zKeys = [
    ['압축 Max 저속', 'comp_max_lo'], ['압축 Min 저속', 'comp_min_lo'],
    ['신장 Max 저속', 'reb_max_lo'],  ['신장 Min 저속', 'reb_min_lo'],
    ['압축 Max 고속', 'comp_max_hi'], ['압축 Min 고속', 'comp_min_hi'],
    ['신장 Max 고속', 'reb_max_hi'],  ['신장 Min 고속', 'reb_min_hi'],
  ];
  collect('감쇠비 (전)', zKeys.map(([l, k]) => [`${l} ζ`, `dm-z-f-${k}`]));
  collect('감쇠비 (후)', zKeys.map(([l, k]) => [`${l} ζ`, `dm-z-r-${k}`]));

  collect('롤 강성', [
    ['전 K_φ (×10⁶ N·mm)', 'dm-out-kphi-f'],
    ['후 K_φ (×10⁶ N·mm)', 'dm-out-kphi-r'],
    ['전 배분 비율 %', 'dm-out-roll-f'],
  ]);

  collect('클릭 추천 (전)', [
    ['컴프 저속', 'dm-rec-f-comp-lo'], ['컴프 고속', 'dm-rec-f-comp-hi'],
    ['리바 저속', 'dm-rec-f-reb-lo'],  ['리바 고속', 'dm-rec-f-reb-hi'],
  ]);
  collect('클릭 추천 (후)', [
    ['컴프 저속', 'dm-rec-r-comp-lo'], ['컴프 고속', 'dm-rec-r-comp-hi'],
    ['리바 저속', 'dm-rec-r-reb-lo'],  ['리바 고속', 'dm-rec-r-reb-hi'],
  ]);

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('dm-copy-btn');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '복사됨 ✓';
    btn.style.background = 'rgba(0,204,102,0.15)';
    btn.style.color = 'var(--green)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 1800);
  });
}
