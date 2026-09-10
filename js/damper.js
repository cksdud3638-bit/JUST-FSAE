// Standalone calculator: no Firebase or shared persisted state dependencies.
const DM_DEF = {
  total_mass: 300, ms: 242.67, front_pct: 49,
  unsprung_f: 25.779, unsprung_r: 31.551,
  k_spring_f: 52.5, k_spring_r: 52.5, mr_f: 0.51, mr_r: 0.60, track_f: 1200, track_r: 1180,
  v_lo: 25, v_hi: 300, clicks_comp: 12, clicks_reb: 20,
  fc_max_lo: 600, fc_min_lo: 95, fr_max_lo: 290, fr_min_lo: 20,
  fc_max_hi: 1658, fc_min_hi: 167, fr_max_hi: 3300, fr_min_hi: 1500,
  structure: 'unknown', dyno_mode: 'shared', click_basis: 'hard', roll_min: '', roll_max: '',
  target_comp_lo_min: 0.3, target_comp_lo_max: 0.7,
  target_reb_lo_min: 0.6, target_reb_lo_max: 1.2,
  target_comp_hi_min: 0.2, target_comp_hi_max: 0.5,
  target_reb_hi_min: 0.4, target_reb_hi_max: 0.9,
};
// Extra adjuster counts have no verified default. Required only in split modes.
Object.assign(DM_DEF, {
  clicks_comp_lo: '', clicks_comp_hi: '', clicks_reb_lo: '', clicks_reb_hi: '',
  model: '', temperature: '', gas_pressure: '', source: '', other_settings: '',
});
const DM_DYNO_KEYS = ['structure', 'click_basis', 'v_lo', 'v_hi', 'clicks_comp', 'clicks_reb',
  'clicks_comp_lo', 'clicks_comp_hi', 'clicks_reb_lo', 'clicks_reb_hi',
  'fc_max_lo', 'fc_min_lo', 'fc_max_hi', 'fc_min_hi', 'fr_max_lo', 'fr_min_lo', 'fr_max_hi', 'fr_min_hi',
  'model', 'temperature', 'gas_pressure', 'source', 'other_settings'];
for (const key of DM_DYNO_KEYS) DM_DEF['rear_' + key] = DM_DEF[key];
const DM_META_KEYS = ['model', 'source', 'other_settings'];
const DM_MAX_CLICKS = 10000; // Computation safety limit, not a damper specification.
const DM_LBF_PER_NMM = 5.710147; // Rounded lbf/in per N/mm.
const DM_EPS = 1e-12; // Floating point comparison tolerance.
const DM_TARGET_KEYS = ['comp_lo', 'reb_lo', 'comp_hi', 'reb_hi'];
const DM_NO_CLICKS = '동시에 만족하는 설정 없음 — 목표 범위 또는 밸빙 재검토 필요';
const DM_GUIDE = '정상상태 밸런스 조정: 스프링과 ARB 사용. 댐퍼는 턴인, 전환, 제동·가속 등 과도응답에 영향을 줍니다. 정상상태에서는 샤프트 속도가 0에 가까워 속도 의존 감쇠력이 사라지므로 롤 강성 배분을 직접 수정할 수 없습니다. 실제 조정 방향은 차량 상태와 코너 구간을 구분해 시험해야 합니다.';
const DM_LIMIT_NOTE = '미검증 JUST 기본값: 실차·CAD·다이나모 근거 미확인. 축 평균 간편 모드(좌우 대칭), 정적 차고 부근 일정 MR을 가정합니다. 타이어 강성 및 ARB는 계산에 포함하지 않습니다. C_eff = F/V는 해당 샤프트 속도에서의 secant 등가값이며, 다이나모 힘에 가스압·마찰력이 포함되면 오차가 발생할 수 있습니다. 클릭별 힘은 두 끝점 사이 선형 보간 근사값입니다. 3/4-way는 다른 조절기를 고정한 측정 데이터와 조절기 독립성 가정이 필요하며 실제 교차 영향을 예측하지 못합니다.';

function dmNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return NaN;
  return String(value).trim() === '' ? NaN : Number(value);
}

function dmDataset(values, axle) {
  const prefix = axle === 'r' && values.dyno_mode === 'separate' ? 'rear_' : '';
  return Object.fromEntries(DM_DYNO_KEYS.map(key => [key, values[prefix + key]]));
}
function dmCountKeys(structure) {
  return structure === '4way' ? ['clicks_comp_lo', 'clicks_comp_hi', 'clicks_reb_lo', 'clicks_reb_hi']
    : structure === '3way' ? ['clicks_comp_lo', 'clicks_comp_hi', 'clicks_reb'] : ['clicks_comp', 'clicks_reb'];
}
function dmValidate(raw) {
  const values = {}, errors = {};
  const fail = (key, message) => { if (!errors[key]) errors[key] = message; };
  function number(key, optional = false) {
    if (optional && String(raw[key] ?? '').trim() === '') { values[key] = null; return; }
    values[key] = dmNumber(raw[key]);
    if (!Number.isFinite(values[key])) fail(key, '유한한 숫자를 입력하세요. 빈 값은 사용할 수 없습니다.');
  }
  function positive(key) { number(key); if (!(values[key] > 0)) fail(key, '0보다 큰 값을 입력하세요.'); }
  for (const key of ['total_mass', 'k_spring_f', 'k_spring_r', 'mr_f', 'mr_r', 'track_f', 'track_r']) positive(key);
  number('front_pct');
  if (!(values.front_pct > 0 && values.front_pct < 100)) fail('front_pct', '전륜 배분은 0% 초과, 100% 미만이어야 합니다.');
  for (const axle of ['f', 'r']) {
    const key = 'unsprung_' + axle; number(key);
    if (values[key] < 0) fail(key, '언스프렁 축질량은 0 이상이어야 합니다.');
    const pct = axle === 'f' ? values.front_pct : 100 - values.front_pct;
    if (values.total_mass * (pct / 100) <= values[key]) fail(key, '해당 축 총질량보다 작아야 합니다. 코너 스프렁 매스는 0보다 커야 합니다.');
  }
  values.dyno_mode = raw.dyno_mode;
  if (!['shared', 'separate'].includes(values.dyno_mode)) fail('dyno_mode', '데이터 모드를 선택하세요.');
  for (const prefix of values.dyno_mode === 'separate' ? ['', 'rear_'] : ['']) {
    const structure = raw[prefix + 'structure']; values[prefix + 'structure'] = structure;
    if (!['unknown', '2way', '3way', '4way'].includes(structure)) fail(prefix + 'structure', '조절 방식을 선택하세요.');
    values[prefix + 'click_basis'] = raw[prefix + 'click_basis'];
    if (!['hard', 'soft'].includes(values[prefix + 'click_basis'])) fail(prefix + 'click_basis', '클릭 기준을 선택하세요.');
    for (const key of DM_META_KEYS) values[prefix + key] = String(raw[prefix + key] ?? '').trim();
    for (const key of ['temperature', 'gas_pressure']) number(prefix + key, true);
    if (values[prefix + 'gas_pressure'] < 0) fail(prefix + 'gas_pressure', '가스압은 0 이상이어야 합니다.');
    positive(prefix + 'v_lo'); positive(prefix + 'v_hi');
    if (values[prefix + 'v_hi'] <= values[prefix + 'v_lo']) fail(prefix + 'v_hi', '고속 샤프트 속도는 저속보다 커야 합니다.');
    for (const key of dmCountKeys(structure)) {
      const id = prefix + key; number(id);
      if (!Number.isSafeInteger(values[id]) || values[id] < 1 || values[id] > DM_MAX_CLICKS) fail(id, '1~10000의 정수를 입력하세요 (브라우저 전수 검사 한도).');
    }
    for (const type of ['fc', 'fr']) for (const speed of ['lo', 'hi']) {
      const hard = prefix + type + '_max_' + speed, soft = prefix + type + '_min_' + speed;
      for (const key of [hard, soft]) { number(key); if (values[key] < 0) fail(key, '감쇠력은 0 이상이어야 합니다.'); }
      if (values[hard] < values[soft]) fail(hard, 'Full Hard 힘은 Full Soft 힘 이상이어야 합니다.');
    }
  }
  for (const target of DM_TARGET_KEYS) {
    const lo = 'target_' + target + '_min', hi = 'target_' + target + '_max'; number(lo); number(hi);
    if (values[lo] < 0) fail(lo, '목표 하한은 0 이상이어야 합니다.');
    if (values[hi] < values[lo]) fail(hi, '목표 상한은 하한 이상이어야 합니다.');
  }
  const hasRoll = [raw.roll_min, raw.roll_max].some(v => v != null && String(v).trim() !== '');
  for (const key of ['roll_min', 'roll_max']) {
    if (!hasRoll) { values[key] = null; continue; }
    number(key);
    if (values[key] < 0 || values[key] > 100) fail(key, '목표 범위는 0~100%로 입력하세요.');
  }
  if (hasRoll && values.roll_max < values.roll_min) fail('roll_max', '목표 상한은 하한 이상이어야 합니다.');
  return { values, errors };
}

function dmForce(hard, soft, click, count, basis) {
  return basis === 'hard'
    ? hard + (soft - hard) * (click / count)
    : soft + (hard - soft) * (click / count);
}
function dmZeta(force, speed, mr, cc) {
  const ce = force / speed, cw = ce * mr * mr;
  return { ce, cw, z: cw / cc };
}
function dmClickRanges(clicks) {
  const ranges = [];
  for (const c of clicks) {
    const last = ranges[ranges.length - 1];
    if (last && last[1] + 1 === c) last[1] = c;
    else ranges.push([c, c]);
  }
  return ranges;
}
function dmClickText(ranges) {
  return ranges.length ? ranges.map(([lo, hi]) => lo === hi ? `${lo}클릭` : `${lo}~${hi}클릭`).join(', ') : DM_NO_CLICKS;
}
function dmRollText(pct, min, max) {
  if (min === null || max === null) return '목표 범위 미설정 — 밸런스 자동 판정 없음';
  if (pct > max) return '전륜 편향 — 일반적으로 언더스티어 방향';
  if (pct < min) return '후륜 편향 — 일반적으로 오버스티어 방향';
  return '사용자 목표 범위 내 — 실제 차량 밸런스를 보증하지 않습니다.';
}

// Pure entry point used by both the UI and Node tests. Invalid inputs never render results.
function dmCalculate(raw) {
  const { values: v, errors } = dmValidate(raw);
  if (Object.keys(errors).length) return { errors };
  const ms = v.total_mass - v.unsprung_f - v.unsprung_r;
  const result = { values: v, ms, axles: {}, targets: {}, springLbf: { f: v.k_spring_f * DM_LBF_PER_NMM, r: v.k_spring_r * DM_LBF_PER_NMM } };
  for (const key of DM_TARGET_KEYS) result.targets[key] = [v[`target_${key}_min`], v[`target_${key}_max`]];
  for (const axle of ['f', 'r']) {
    const p = axle === 'f' ? v.front_pct / 100 : 1 - v.front_pct / 100;
    const mass = (v.total_mass * p - v['unsprung_' + axle]) / 2;
    const mr = v['mr_' + axle], kw = v['k_spring_' + axle] * mr * mr;
    const freq = Math.sqrt(kw * 1000 / mass) / (2 * Math.PI);
    const cc = 2 * Math.sqrt(kw * 1000 * mass) / 1000;
    const kphi = 2 * kw * (v['track_' + axle] / 2) ** 2;
    if (![mass, kw, freq, cc, kphi].every(n => Number.isFinite(n) && n > 0)) {
      return { errors: { ['mr_' + axle]: '계산 가능한 수치 범위를 벗어났습니다. 질량·스프링·MR·트랙을 확인하세요.' } };
    }
    const data = dmDataset(v, axle);
    const a = { mass, kw, freq, cc, kphi, data, z: {}, clicks: {} };
    for (const [type, prefix] of [['comp', 'fc'], ['reb', 'fr']]) {
      for (const speed of ['lo', 'hi']) for (const end of ['max', 'min']) {
        const key = `${prefix}_${end}_${speed}`;
        const z = dmZeta(data[key], data['v_' + speed], mr, cc);
        if (!Object.values(z).every(Number.isFinite)) return { errors: { [(axle === 'r' && v.dyno_mode === 'separate' ? 'rear_' : '') + key]: '등가 감쇠비가 계산 가능한 수치 범위를 벗어났습니다.' } };
        a.z[`${type}_${end}_${speed}`] = z;
      }
      const split = data.structure === '4way' || (data.structure === '3way' && type === 'comp');
      for (const band of split ? ['lo', 'hi'] : ['both']) {
        const clicks = [], key = type + (split ? '_' + band : '');
        const count = data['clicks_' + key];
        if (data.structure !== 'unknown') for (let c = 0; c <= count; c++) {
          const passes = (split ? [band] : ['lo', 'hi']).every(speed => {
            const force = dmForce(data[prefix + '_max_' + speed], data[prefix + '_min_' + speed], c, count, data.click_basis);
            const z = dmZeta(force, data['v_' + speed], mr, cc).z;
            const [lo, hi] = result.targets[type + '_' + speed];
            const tolerance = DM_EPS * Math.max(1, Math.abs(z), lo, hi);
            return z >= lo - tolerance && z <= hi + tolerance;
          });
          if (passes) clicks.push(c);
        }
        a.clicks[key] = dmClickRanges(clicks);
      }
    }
    result.axles[axle] = a;
  }
  result.rollPct = result.axles.f.kphi / (result.axles.f.kphi + result.axles.r.kphi) * 100;
  if (!Number.isFinite(ms) || !Object.values(result.springLbf).every(Number.isFinite) || !Number.isFinite(result.axles.f.kphi + result.axles.r.kphi)) {
    return { errors: { total_mass: '계산 가능한 수치 범위를 벗어났습니다. 입력 크기를 확인하세요.' } };
  }
  return { errors: {}, result };
}

function dmBasisLabel(basis) {
  return basis === 'hard' ? '완전 잠금/Full Hard에서 풀어준 클릭 수 (0 = 최대 감쇠)' : 'Full Soft에서 잠근 클릭 수 (0 = 최소 감쇠)';
}
function dmAdjusterLabel(key) {
  const name = key.startsWith('comp') ? '컴프레션' : '리바운드';
  return name + (key.endsWith('_lo') ? ' 저속 조절기' : key.endsWith('_hi') ? ' 고속 조절기' : ' — 저속·고속 공통');
}
function dmCornerImport(corners) {
  const values = ['fl', 'fr', 'rl', 'rr'].map(key => dmNumber(corners?.[key]));
  if (!values.every(n => Number.isFinite(n) && n > 0)) return { error: '유효한 네 코너 측정값(kg)이 없습니다. 부품 무게/코너웨이트 탭에서 먼저 측정값을 입력하세요.' };
  const total = values.reduce((sum, n) => sum + n, 0);
  if (!Number.isFinite(total)) return { error: '코너 질량 합계가 계산 범위를 벗어났습니다.' };
  return { total_mass: total, front_pct: (values[0] + values[1]) / total * 100 };
}
function dmLoadCornerWeights() {
  // Read only: do not alter S, save(), Firebase or the original measurement controls.
  const imported = dmCornerImport(typeof S === 'undefined' ? null : S.cornerWeights);
  if (imported.error) { ds('dm-import-status', imported.error); return; }
  document.getElementById('dm-total_mass').value = imported.total_mass;
  document.getElementById('dm-front_pct').value = imported.front_pct;
  calcDamper();
  ds('dm-import-status', '코너웨이트를 축 평균으로 불러왔습니다. 운전자·주행 유체 포함 여부를 확인하세요. 포함되지 않았다면 총중량·배분을 보정하세요. 좌우 차이는 평균 처리됩니다.');
}
let _dmSpeedChanged = { f: false, r: false };
function dmBuildAdvanced() {
  const field = (id, label, type = 'number') => `<div><label class="dm-lbl" for="dm-${id}">${label}</label><input id="dm-${id}" class="form-control dm-inp" type="${type}" ${type === 'number' ? 'step="any"' : ''} placeholder="미입력 / 미검증"></div>`;
  const structure = prefix => `<div><label class="dm-lbl" for="dm-${prefix}structure">실제 댐퍼 조절 방식 (모델 설명서 확인 필요)</label><select id="dm-${prefix}structure" class="form-control dm-inp"><option value="unknown">미확인 — 클릭 계산 보류</option><option value="2way">2-way: 컴프레션 1개 + 리바운드 1개</option><option value="3way">3-way: 컴프레션 저속/고속 + 리바운드 1개</option><option value="4way">4-way: 컴프레션·리바운드 저속/고속 각각</option></select></div>`;
  const metadata = prefix => `<p class="dm-note">모델·시험 조건·출처는 아직 미확인입니다. 온도 °C, 가스압 bar, 측정일/시트명과 다른 조절기의 고정 위치를 기록하세요.</p><div class="dm-row2">` +
    field(prefix + 'model', '댐퍼 모델명', 'text') + field(prefix + 'temperature', '시험 온도 (°C)') + field(prefix + 'gas_pressure', '가스압 (bar)') + field(prefix + 'source', '측정일 / 출처', 'text') + field(prefix + 'other_settings', '시험 시 다른 조절기 고정 위치', 'text') + '</div>';
  const extraCounts = prefix => '<div class="dm-row2">' + ['comp_lo', 'comp_hi', 'reb_lo', 'reb_hi'].map(key => field(prefix + 'clicks_' + key, dmAdjusterLabel(key) + ' 총 클릭 (기본값 없음)')).join('') + '</div>';
  document.getElementById('dm-structure-control').innerHTML = structure('');
  document.getElementById('dm-dyno-extra').innerHTML = extraCounts('') + metadata('');
  let rear = structure('rear_') + '<label class="dm-lbl" for="dm-rear_click_basis">후륜 클릭 기준</label><select id="dm-rear_click_basis" class="form-control dm-inp"><option value="hard">완전 잠금/Full Hard에서 풀어준 클릭 수</option><option value="soft">Full Soft에서 잠근 클릭 수</option></select><div class="dm-row2">';
  for (const [key, label] of [['v_lo', '후륜 저속 샤프트 속도 (mm/s)'], ['v_hi', '후륜 고속 샤프트 속도 (mm/s)'], ['clicks_comp', '후륜 컴프레션 총 클릭'], ['clicks_reb', '후륜 리바운드 총 클릭']]) rear += field('rear_' + key, label);
  rear += '</div>' + extraCounts('rear_');
  for (const [speed, speedLabel] of [['lo', '저속'], ['hi', '고속']]) {
    rear += '<p class="dm-note">후륜 ' + speedLabel + ' 측정점 — 미검증 JUST 기본값</p><div class="dm-row2">';
    for (const [type, name] of [['fc', '컴프레션'], ['fr', '리바운드']]) for (const [end, label] of [['max', 'Full Hard'], ['min', 'Full Soft']]) rear += field('rear_' + type + '_' + end + '_' + speed, '후륜 ' + speedLabel + ' ' + name + ' ' + label + ' 힘 (N)');
    rear += '</div>';
  }
  document.getElementById('dm-rear-data').innerHTML = rear + metadata('rear_');
}
function dmModeUI(raw) {
  document.getElementById('dm-rear-data').hidden = raw.dyno_mode !== 'separate';
  for (const prefix of ['', 'rear_']) {
    const active = dmCountKeys(raw[prefix + 'structure']);
    for (const key of ['clicks_comp', 'clicks_reb', 'clicks_comp_lo', 'clicks_comp_hi', 'clicks_reb_lo', 'clicks_reb_hi']) {
      const el = document.getElementById('dm-' + prefix + key);
      if (el) { el.parentElement.hidden = !active.includes(key); el.disabled = !active.includes(key); }
    }
  }
  ds('dm-dyno-label', raw.dyno_mode === 'separate' ? '전륜 다이나모 데이터' : '전후 동일 다이나모 데이터 (간편 모드)');
  ds('dm-speed-warning', (_dmSpeedChanged.f || (raw.dyno_mode === 'separate' && _dmSpeedChanged.r) ? '⚠ 샤프트 속도가 변경되었습니다. ' : '') + '속도와 힘은 같은 다이나모 측정점의 묶음입니다. 속도만 바꾸고 힘을 유지하면 결과가 잘못될 수 있습니다. 해당 속도의 Full Hard/Full Soft 힘을 함께 갱신하세요.');
}
let _dmReady = false;
function ds(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function initDamper() {
  if (!_dmReady) {
    dmBuildAdvanced();
    for (const [key, value] of Object.entries(DM_DEF)) {
      const el = document.getElementById('dm-' + key);
      if (el) el.value = value;
    }
    document.querySelectorAll('#tab-damper .dm-inp').forEach(el => el.addEventListener('input', event => {
      if (['dm-v_lo', 'dm-v_hi', 'dm-rear_v_lo', 'dm-rear_v_hi'].includes(event.target.id)) _dmSpeedChanged[event.target.id.startsWith('dm-rear_') ? 'r' : 'f'] = true;
      if (event.target.id.endsWith('structure') || event.target.id === 'dm-dyno_mode') {
        if (event.target.value === 'separate' || ['3way', '4way'].includes(event.target.value)) document.getElementById('dm-dyno-details').open = true;
      }
      calcDamper();
    }));
    // Keep horizontal table gestures from triggering the app's swipe-to-switch-tab handler.
    document.querySelectorAll('#tab-damper .dm-table-scroll').forEach(el =>
      el.addEventListener('touchend', event => event.stopPropagation(), { passive: true })
    );
    _dmReady = true;
  }
  calcDamper();
}
function dmRead() {
  return Object.fromEntries(Object.keys(DM_DEF).map(key => [key, document.getElementById('dm-' + key)?.value]));
}
function dmShowErrors(errors) {
  for (const key of Object.keys(DM_DEF)) {
    const input = document.getElementById('dm-' + key);
    if (!input) continue;
    const id = input.id + '-error';
    let msg = document.getElementById(id);
    if (!msg) {
      msg = document.createElement('div'); msg.id = id; msg.className = 'dm-error';
      input.insertAdjacentElement('afterend', msg); input.setAttribute('aria-describedby', id);
    }
    msg.textContent = errors[key] || ''; msg.hidden = !errors[key];
    if (errors[key]) { const details = input.closest('details'); if (details) details.open = true; }
    input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
  }
}
function calcDamper() {
  const raw = dmRead();
  dmModeUI(raw);
  const { errors, result } = dmCalculate(raw);
  dmShowErrors(errors);
  const invalid = !result;
  document.getElementById('dm-copy-btn').disabled = invalid;
  ds('dm-status', invalid ? '입력 오류를 수정하면 결과가 다시 계산됩니다.' : '');
  ds('dm-copy-status', '');
  for (const axle of ['f', 'r']) {
    const spring = dmNumber(raw['k_spring_' + axle]) * DM_LBF_PER_NMM;
    ds('dm-spring-lbf-' + axle, Number.isFinite(spring) && spring > 0 ? spring.toFixed(2) : '—');
  }
  const msInput = document.getElementById('dm-ms');
  msInput.value = result ? result.ms.toFixed(3) : '';
  msInput.placeholder = '—';
  if (invalid) {
    document.querySelectorAll('#tab-damper [id^="dm-out-"], #tab-damper [id^="dm-ce-"], #tab-damper [id^="dm-cw-"], #tab-damper [id^="dm-z-"], #tab-damper [id^="dm-rec-"], #tab-damper [data-dm-target]').forEach(el => {
      el.textContent = '—'; el.style.color = ''; el.removeAttribute('title');
      if (el.classList.contains('dm-rec')) el.className = 'dm-rec';
    });
    for (const id of ['dm-label-vlo', 'dm-label-vhi', 'dm-title-vlo', 'dm-title-vhi', 'dm-lbl-mr-f', 'dm-lbl-mr-r', 'dm-roll-warn', 'dm-basis-f', 'dm-basis-r']) ds(id, '—');
    document.getElementById('dm-roll-bar').style.width = '0%';
    return;
  }
  const v = result.values;
  for (const speed of ['lo', 'hi']) {
    ds('dm-label-v' + speed, v['v_' + speed]); ds('dm-title-v' + speed, '전 ' + v['v_' + speed] + ' / 후 ' + result.axles.r.data['v_' + speed]);
  }
  for (const axle of ['f', 'r']) {
    const a = result.axles[axle];
    ds('dm-lbl-mr-' + axle, v['mr_' + axle]);
    ds('dm-out-ms-' + axle, a.mass.toFixed(4)); ds('dm-out-ms-' + axle + '2', a.mass.toFixed(4));
    for (const key of ['kw', 'freq', 'cc']) ds(`dm-out-${key}-${axle}`, a[key].toFixed(key === 'kw' ? 5 : 6));
    ds('dm-out-kphi-' + axle, (a.kphi / 1e6).toFixed(6));
    ds('dm-out-roll-' + axle, (axle === 'f' ? result.rollPct : 100 - result.rollPct).toFixed(4));
    for (const [key, z] of Object.entries(a.z)) {
      ds(`dm-ce-${axle}-${key}`, z.ce.toFixed(3)); ds(`dm-cw-${axle}-${key}`, z.cw.toFixed(3));
      const el = document.getElementById(`dm-z-${axle}-${key}`);
      const [lo, hi] = result.targets[key.replace(/_(max|min)/, '')];
      el.textContent = z.z.toFixed(3);
      el.style.color = z.z < lo ? '#4da6ff' : z.z > hi ? '#ff6666' : '#00cc66';
      el.title = `사용자 목표 ${lo}~${hi} — ${z.z < lo ? '미달' : z.z > hi ? '초과' : '범위 내'}`;
    }
    const host = document.getElementById('dm-clicks-' + axle); host.replaceChildren();
    for (const [key, ranges] of Object.entries(a.clicks)) {
      const cell = document.createElement('div'); cell.className = 'dm-rec-cell';
      const label = document.createElement('div'); label.className = 'dm-rec-label'; label.textContent = dmAdjusterLabel(key);
      const el = document.createElement('div'); el.id = 'dm-rec-' + axle + '-' + key; el.className = 'dm-rec ' + (ranges.length ? 'dm-rec-ok' : 'dm-rec-err');
      el.textContent = a.data.structure === 'unknown' ? '조절 방식 미확인 — 모델 설명서 확인 후 선택하세요.' : dmClickText(ranges);
      cell.append(label, el); host.append(cell);
    }
    ds('dm-basis-' + axle, ({unknown:'구조 미확인','2way':'2-way','3way':'3-way','4way':'4-way'})[a.data.structure] + ' · ' + dmBasisLabel(a.data.click_basis));
  }
  document.querySelectorAll('[data-dm-target]').forEach(el => { el.textContent = result.targets[el.dataset.dmTarget].join(' ~ '); });
  document.getElementById('dm-roll-bar').style.width = result.rollPct + '%';
  ds('dm-roll-warn', dmRollText(result.rollPct, v.roll_min, v.roll_max));
  ds('dm-click-basis-label', '2-way: 저속·고속 교집합 / 3-way: 압축 분리·리바운드 공통 / 4-way: 각각 별도 조절기 근사');
  ds('dm-balance-guide', DM_GUIDE); ds('dm-model-note', DM_LIMIT_NOTE);
}
function resetDamperDefaults() {
  _dmSpeedChanged = { f: false, r: false };
  ds('dm-import-status', '');
  for (const [key, value] of Object.entries(DM_DEF)) {
    const el = document.getElementById('dm-' + key); if (el) el.value = value;
  }
  calcDamper();
}
function dmFormatResult(r) {
  const v = r.values;
  const lines = ['=== JUST-FSAE 댐퍼 세팅 계산 결과 ===',
    `총중량 (운전자·주행 유체 포함): ${v.total_mass} kg / 정적 전륜 축중 비율: ${v.front_pct}%`,
    `언스프렁 매스(비현가질량) — 축 전체: 전 ${v.unsprung_f} kg / 후 ${v.unsprung_r} kg`,
    `스프렁 매스(현가질량) M_s: ${r.ms.toFixed(3)} kg`,
    `전륜 스프링: ${v.k_spring_f} N/mm = ${r.springLbf.f.toFixed(2)} lbf/in / 후륜 스프링: ${v.k_spring_r} N/mm = ${r.springLbf.r.toFixed(2)} lbf/in`,
    'MR = 댐퍼 이동량 / 휠 이동량',
    `댐퍼 샤프트 속도: 저속 ${v.v_lo} mm/s / 고속 ${v.v_hi} mm/s`,
    `클릭 기준: ${v.click_basis === 'hard' ? '완전 잠금/Full Hard에서 풀어준 클릭 수 (0 = 최대 감쇠)' : 'Full Soft에서 잠근 클릭 수 (0 = 최소 감쇠)'}`,
    '[초기 목표값/사용자 설정값 — 보편 권장값 아님]'];
  for (const [key, range] of Object.entries(r.targets)) lines.push(`${key}: ${range.join(' ~ ')}`);
  for (const [axle, name] of [['f', '전륜'], ['r', '후륜']]) {
    const a = r.axles[axle], data = a.data;
    lines.push('데이터 출처 상태: 미검증 JUST 기본값 또는 사용자 입력 — 실차 근거 확인 필요',
      '데이터 모드: ' + v.dyno_mode + ' / 조절 방식: ' + data.structure,
      '클릭 기준: ' + dmBasisLabel(data.click_basis),
      '모델: ' + (data.model || '미확인') + ' / 시험 온도: ' + (data.temperature ?? '미입력') + ' °C / 가스압: ' + (data.gas_pressure ?? '미입력') + ' bar',
      '측정일/출처: ' + (data.source || '미확인') + ' / 다른 조절기 고정 위치: ' + (data.other_settings || '미기록'),
      '샤프트 속도/힘은 동일 측정점이어야 합니다. 속도만 바꾸면 기존 힘 데이터는 유효하지 않을 수 있습니다.',
      '총 클릭: ' + dmCountKeys(data.structure).map(key => key + '=' + data[key]).join(', '));
    lines.push(`[${name}] MR ${v['mr_' + axle]} / 트랙 ${v['track_' + axle]} mm`,
      `코너 스프렁 매스: ${a.mass.toFixed(4)} kg`, `휠 레이트: ${a.kw.toFixed(5)} N/mm`,
      `타이어 강성 미포함 근사 라이드 주파수: ${a.freq.toFixed(6)} Hz`, `임계 감쇠계수: ${a.cc.toFixed(6)} N·s/mm`,
      `스프링 롤 강성 (ARB 제외): ${(a.kphi / 1e6).toFixed(6)} ×10⁶ N·mm/rad`);
    for (const [key, z] of Object.entries(a.z)) {
      const label = key.replace('comp', '컴프레션').replace('reb', '리바운드').replace('_max', ' Full Hard').replace('_min', ' Full Soft').replace('_lo', ` @ ${data.v_lo} mm/s`).replace('_hi', ` @ ${data.v_hi} mm/s`);
      lines.push(`${label}: 등가 감쇠비 ζ_eq ${z.z.toFixed(3)}`);
    }
    for (const [key, ranges] of Object.entries(a.clicks)) lines.push(dmAdjusterLabel(key) + ': ' + (data.structure === 'unknown' ? '조절 방식 미확인 — 클릭 계산 보류' : dmClickText(ranges)));
  }
  lines.push(`스프링에 의한 롤 강성 배분(ARB 제외): 전 ${r.rollPct.toFixed(4)}% / 후 ${(100 - r.rollPct).toFixed(4)}%`,
    `사용자 전륜 목표 범위: ${v.roll_min === null ? '미설정' : `${v.roll_min}~${v.roll_max}%`}`,
    dmRollText(r.rollPct, v.roll_min, v.roll_max),
    '타이어, 캠버 변화, 롤센터, 트랙 차이 등에 따라 실제 결과가 달라질 수 있습니다.', DM_GUIDE, DM_LIMIT_NOTE);
  return lines.join('\n');
}
async function copyDamperResult() {
  const { result } = dmCalculate(dmRead());
  if (!result) { calcDamper(); return; }
  try {
    await navigator.clipboard.writeText(dmFormatResult(result));
    ds('dm-copy-status', '복사됨 ✓');
  } catch (_) { ds('dm-copy-status', '복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.'); }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DM_DEF, DM_DYNO_KEYS, dmDataset, dmCornerImport, dmCountKeys, dmValidate, dmCalculate, dmForce, dmZeta, dmClickRanges, dmClickText, dmRollText, dmFormatResult };
}
