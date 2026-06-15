// ═══════════════════════════════════════════════
// DAMPER SETUP CALCULATOR
// ═══════════════════════════════════════════════

const DAMPER_DEF = {
  fl: 57, fr: 57, rl: 58, rr: 58,
  k_front: 35, k_rear: 40,
  rh_front: 30, rh_rear: 35,
  mr_front: 0.85, mr_rear: 0.90,
  stroke_front: 60, stroke_rear: 60,
  clicks_front: 20, clicks_rear: 20,
  tire_radius: 254,
  track_front: 1200, track_rear: 1180
};

function initDamper() {
  Object.entries(DAMPER_DEF).forEach(([k, v]) => {
    const el = document.getElementById('dm-' + k);
    if (el) el.value = v;
  });
  document.querySelectorAll('#tab-damper .dm-input').forEach(el => {
    el.addEventListener('input', calcDamper);
  });
  calcDamper();
}

function dmVal(id) {
  return parseFloat(document.getElementById(id)?.value) || 0;
}

function calcDamper() {
  const fl = dmVal('dm-fl'), fr = dmVal('dm-fr');
  const rl = dmVal('dm-rl'), rr = dmVal('dm-rr');
  const k_f = dmVal('dm-k_front'), k_r = dmVal('dm-k_rear');
  const mr_f = dmVal('dm-mr_front'), mr_r = dmVal('dm-mr_rear');
  const cl_f = dmVal('dm-clicks_front'), cl_r = dmVal('dm-clicks_rear');
  const tr_f = dmVal('dm-track_front'), tr_r = dmVal('dm-track_rear');

  const m_fc = (fl + fr) / 2;   // front corner sprung mass
  const m_rc = (rl + rr) / 2;   // rear corner sprung mass

  // ── 1. Critical Damping ──────────────────────────────
  const kw_f = k_f * mr_f * mr_f;   // wheel rate N/mm
  const kw_r = k_r * mr_r * mr_r;
  // C_crit = 2√(K[N/m] × M[kg]) in N·s/m → ÷1000 = N·s/mm
  const cc_f = 2 * Math.sqrt(kw_f * 1000 * m_fc) / 1000;
  const cc_r = 2 * Math.sqrt(kw_r * 1000 * m_rc) / 1000;

  // Bounce ζ=0.65~0.70, Rebound ζ=0.55~0.65
  const cb_f = [0.65 * cc_f, 0.70 * cc_f];
  const cr_f = [0.55 * cc_f, 0.65 * cc_f];
  const cb_r = [0.65 * cc_r, 0.70 * cc_r];
  const cr_r = [0.55 * cc_r, 0.65 * cc_r];

  // ── 2. Roll Stiffness Distribution ──────────────────
  const kphi_f = kw_f * Math.pow(tr_f / 2, 2);  // N/mm × mm² = N·mm
  const kphi_r = kw_r * Math.pow(tr_r / 2, 2);
  const kphi_tot = kphi_f + kphi_r;
  const roll_f = kphi_tot > 0 ? (kphi_f / kphi_tot * 100) : 0;

  // ── 3. Damper Velocity (wheel 25~75 mm/s range) ─────
  const vd_f = [25 * mr_f, 75 * mr_f];
  const vd_r = [25 * mr_r, 75 * mr_r];
  const vlim_f = 50 * mr_f;   // low/high speed boundary
  const vlim_r = 50 * mr_r;

  // ── 4. Click Recommendations ─────────────────────────
  const bc_f = [Math.round(cl_f * 0.40), Math.round(cl_f * 0.45)];
  const rc_f = [Math.round(cl_f * 0.55), Math.round(cl_f * 0.60)];
  const bc_r = [Math.round(cl_r * 0.40), Math.round(cl_r * 0.45)];
  const rc_r = [Math.round(cl_r * 0.55), Math.round(cl_r * 0.60)];

  // ── Update DOM ───────────────────────────────────────
  set('dm-kw-f',    kw_f.toFixed(2));
  set('dm-kw-r',    kw_r.toFixed(2));
  set('dm-cc-f',    cc_f.toFixed(2));
  set('dm-cc-r',    cc_r.toFixed(2));
  setR('dm-cb-f',   cb_f);
  setR('dm-cr-f',   cr_f);
  setR('dm-cb-r',   cb_r);
  setR('dm-cr-r',   cr_r);

  set('dm-kphi-f',  (kphi_f / 1e6).toFixed(3));
  set('dm-kphi-r',  (kphi_r / 1e6).toFixed(3));
  set('dm-roll-f',  roll_f.toFixed(1));
  set('dm-roll-r',  (100 - roll_f).toFixed(1));
  const bar = document.getElementById('dm-roll-bar-f');
  if (bar) bar.style.width = roll_f.toFixed(1) + '%';
  dmRollWarn(roll_f);

  setR('dm-vd-f',   vd_f, 1);
  setR('dm-vd-r',   vd_r, 1);
  set('dm-vlim-f',   vlim_f.toFixed(1));
  set('dm-vlim-f2',  vlim_f.toFixed(1));
  set('dm-vlim-r',   vlim_r.toFixed(1));
  set('dm-vlim-r2',  vlim_r.toFixed(1));

  setR('dm-bc-f',   bc_f, 0);
  setR('dm-rc-f',   rc_f, 0);
  setR('dm-bc-r',   bc_r, 0);
  setR('dm-rc-r',   rc_r, 0);

  dmBalanceGuide(roll_f);
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setR(id, arr, dec = 2) {
  const el = document.getElementById(id);
  if (el) el.textContent = arr[0].toFixed(dec) + ' ~ ' + arr[1].toFixed(dec);
}

function dmRollWarn(pct) {
  const el = document.getElementById('dm-roll-warn');
  if (!el) return;
  if (pct < 60) {
    el.textContent = '⚠ 권장 범위 미달 — 전 롤 강성 부족 (언더스티어 경향)';
    el.className = 'dm-warn dm-warn-yellow';
  } else if (pct > 70) {
    el.textContent = '⚠ 권장 범위 초과 — 전 롤 강성 과다 (오버스티어 경향)';
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
    el.innerHTML = '<strong>언더스티어 조정 가이드:</strong> 전 댐퍼 바운스↑ 또는 후 댐퍼 바운스↓ · 전 댐퍼 리바운드↓';
    el.style.borderColor = 'var(--yellow)';
    el.style.color = 'var(--yellow)';
  } else if (pct > 70) {
    el.innerHTML = '<strong>오버스티어 조정 가이드:</strong> 후 댐퍼 바운스↑ 또는 전 댐퍼 바운스↓ · 전 댐퍼 리바운드↑';
    el.style.borderColor = 'var(--red)';
    el.style.color = '#ff6666';
  } else {
    el.innerHTML = '<strong>이상적인 배분:</strong> 현재 전/후 롤 강성 배분이 FSAE 권장 범위 내에 있습니다. 세팅을 유지하세요.';
    el.style.borderColor = 'var(--green)';
    el.style.color = 'var(--green)';
  }
}

function resetDamperDefaults() {
  Object.entries(DAMPER_DEF).forEach(([k, v]) => {
    const el = document.getElementById('dm-' + k);
    if (el) el.value = v;
  });
  calcDamper();
}

function copyDamperResult() {
  const fl = dmVal('dm-fl'), fr = dmVal('dm-fr');
  const rl = dmVal('dm-rl'), rr = dmVal('dm-rr');
  const k_f = dmVal('dm-k_front'), k_r = dmVal('dm-k_rear');
  const mr_f = dmVal('dm-mr_front'), mr_r = dmVal('dm-mr_rear');
  const cl_f = dmVal('dm-clicks_front'), cl_r = dmVal('dm-clicks_rear');
  const tr_f = dmVal('dm-track_front'), tr_r = dmVal('dm-track_rear');
  const kw_f = k_f * mr_f * mr_f;
  const kw_r = k_r * mr_r * mr_r;
  const cc_f = 2 * Math.sqrt(kw_f * 1000 * (fl + fr) / 2) / 1000;
  const cc_r = 2 * Math.sqrt(kw_r * 1000 * (rl + rr) / 2) / 1000;
  const kphi_f = kw_f * Math.pow(tr_f / 2, 2);
  const kphi_r = kw_r * Math.pow(tr_r / 2, 2);
  const roll_f = (kphi_f / (kphi_f + kphi_r) * 100).toFixed(1);

  const lines = [
    '=== JUST-FSAE 댐퍼 세팅 계산 결과 ===',
    `[입력] FL=${fl} FR=${fr} RL=${rl} RR=${rr} kg`,
    `       K_front=${k_f} N/mm  K_rear=${k_r} N/mm`,
    `       MR_front=${mr_f}  MR_rear=${mr_r}`,
    `       클릭수 전=${cl_f}  후=${cl_r}`,
    '',
    `[1. 임계 감쇠력]`,
    `  전 C_crit = ${cc_f.toFixed(2)} N·s/mm`,
    `    바운스 목표: ${(0.65*cc_f).toFixed(2)}~${(0.70*cc_f).toFixed(2)} N·s/mm`,
    `    리바운드 목표: ${(0.55*cc_f).toFixed(2)}~${(0.65*cc_f).toFixed(2)} N·s/mm`,
    `  후 C_crit = ${cc_r.toFixed(2)} N·s/mm`,
    `    바운스 목표: ${(0.65*cc_r).toFixed(2)}~${(0.70*cc_r).toFixed(2)} N·s/mm`,
    `    리바운드 목표: ${(0.55*cc_r).toFixed(2)}~${(0.65*cc_r).toFixed(2)} N·s/mm`,
    '',
    `[2. 롤 강성 배분]`,
    `  전 ${roll_f}% / 후 ${(100-parseFloat(roll_f)).toFixed(1)}% (FSAE 권장: 전 60~70%)`,
    '',
    `[3. 댐퍼 속도 (휠 25~75 mm/s 기준)]`,
    `  전: ${(25*mr_f).toFixed(1)}~${(75*mr_f).toFixed(1)} mm/s  (저속/고속 경계: ${(50*mr_f).toFixed(1)} mm/s)`,
    `  후: ${(25*mr_r).toFixed(1)}~${(75*mr_r).toFixed(1)} mm/s  (저속/고속 경계: ${(50*mr_r).toFixed(1)} mm/s)`,
    '',
    `[4. 추천 클릭 수]`,
    `  전 바운스: ${Math.round(cl_f*0.40)}~${Math.round(cl_f*0.45)} 클릭 / 리바운드: ${Math.round(cl_f*0.55)}~${Math.round(cl_f*0.60)} 클릭`,
    `  후 바운스: ${Math.round(cl_r*0.40)}~${Math.round(cl_r*0.45)} 클릭 / 리바운드: ${Math.round(cl_r*0.55)}~${Math.round(cl_r*0.60)} 클릭`,
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('dm-copy-btn');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '복사됨 ✓';
    btn.style.background = 'rgba(0,204,102,0.15)';
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1800);
  });
}
