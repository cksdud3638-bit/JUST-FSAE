const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { DM_DEF, dmCalculate, dmForce, dmCornerImport, dmClickRanges, dmClickText, dmRollText, dmFormatResult } = require('../js/damper.js');
const calc = (overrides = {}) => dmCalculate({ ...DM_DEF, structure: '2way', ...overrides });
const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);

test('default mass, suspension and both-wheel roll stiffness match reference values', () => {
  const { errors, result: r } = calc();
  assert.deepEqual(errors, {});
  near(r.ms, 242.670); near(r.axles.f.mass, 60.6105); near(r.axles.r.mass, 60.7245);
  near(2 * r.axles.f.mass + 2 * r.axles.r.mass, r.ms);
  for (const [axle, kw, freq, cc, kphi] of [
    ['f', 13.65525, 2.388889, 1.819507, 9831780], ['r', 18.9, 2.807819, 2.142609, 13158180],
  ]) {
    near(r.axles[axle].kw, kw); near(r.axles[axle].freq, freq);
    near(r.axles[axle].cc, cc); near(r.axles[axle].kphi, kphi);
    assert.deepEqual(r.axles[axle].clicks, { comp: [], reb: [] });
  }
  near(r.rollPct, 42.765537652); near(r.springLbf.f, 299.7827175);
});
test('total and unsprung mass inputs affect results; legacy ms cannot override them', () => {
  const r = calc({ total_mass: 600, ms: -999 }).result;
  near(r.ms, 542.67); near(r.axles.f.mass, 134.1105); near(r.axles.r.mass, 137.2245);
  assert.ok(r.axles.f.freq < calc().result.axles.f.freq);
  assert.ok(r.axles.r.cc > calc().result.axles.r.cc);
  near(calc({ unsprung_f: 35.779 }).result.axles.f.mass, 55.6105);
  near(calc({ unsprung_r: 41.551 }).result.axles.r.mass, 55.7245);
  near(calc({ k_spring_f: 70 }).result.springLbf.f, 399.71029);
});
const invalidCases = [
  ['zero low speed', { v_lo: 0 }, 'v_lo'], ['100% front', { front_pct: 100 }, 'front_pct'],
  ['0% front', { front_pct: 0 }, 'front_pct'], ['negative spring', { k_spring_f: -1 }, 'k_spring_f'],
  ['hard below soft', { fc_max_lo: 90 }, 'fc_max_lo'], ['empty', { total_mass: '' }, 'total_mass'],
  ['fractional clicks', { clicks_comp: 1.5 }, 'clicks_comp'], ['zero clicks', { clicks_reb: 0 }, 'clicks_reb'],
  ['excessive iteration', { clicks_comp: 1e12 }, 'clicks_comp'],
  ['equal speeds', { v_hi: 25 }, 'v_hi'], ['negative mass', { total_mass: -1 }, 'total_mass'],
  ['negative unsprung', { unsprung_f: -1 }, 'unsprung_f'], ['zero corner mass', { unsprung_f: 147 }, 'unsprung_f'],
  ['negative rear corner mass', { unsprung_r: 154 }, 'unsprung_r'], ['zero MR', { mr_f: 0 }, 'mr_f'],
  ['zero track', { track_r: 0 }, 'track_r'], ['negative force', { fr_min_hi: -1 }, 'fr_min_hi'],
  ['NaN', { mr_r: NaN }, 'mr_r'], ['Infinity', { track_f: Infinity }, 'track_f'],
  ['numeric suffix', { k_spring_f: '70abc' }, 'k_spring_f'], ['null', { total_mass: null }, 'total_mass'],
  ['invalid basis', { click_basis: 'unknown' }, 'click_basis'],
  ['half-filled roll target', { roll_min: 40 }, 'roll_max'], ['reversed roll target', { roll_min: 70, roll_max: 60 }, 'roll_max'],
  ['negative zeta', { target_comp_lo_min: -0.1 }, 'target_comp_lo_min'],
  ['reversed zeta', { target_reb_hi_max: 0.1 }, 'target_reb_hi_max'],
  ['empty target', { target_reb_hi_max: '' }, 'target_reb_hi_max'],
];
for (const [name, overrides, key] of invalidCases) test(`rejects ${name}`, () => {
  const r = calc(overrides); assert.ok(r.errors[key]); assert.equal(r.result, undefined);
});
test('all required fields reject non-finite and blank values', () => {
  for (const key of Object.keys(DM_DEF).filter(k => typeof DM_DEF[k] === 'number' && k !== 'ms' && !k.startsWith('rear_'))) {
    for (const value of ['', ' ', undefined, NaN, Infinity, -Infinity]) assert.ok(calc({ [key]: value }).errors[key], key);
  }
});
test('extreme finite inputs never leak non-finite computed results', () => {
  for (const overrides of [{ mr_f: 1e308 }, { track_r: 1e308 }, { k_spring_f: 1e-320 }, { v_lo: 5e-324 }, { total_mass: 1e308 }]) {
    const outcome = calc(overrides);
    if (outcome.result) {
      const check = value => {
        if (typeof value === 'number') assert.ok(Number.isFinite(value));
        else if (value && typeof value === 'object') Object.values(value).forEach(check);
      };
      check(outcome.result);
      assert.doesNotMatch(dmFormatResult(outcome.result), /NaN|Infinity/);
    } else assert.ok(Object.keys(outcome.errors).length);
  }
});
test('Full Hard and Full Soft reference endpoints and range reversal', () => {
  assert.equal(dmForce(600, 95, 0, 12, 'hard'), 600);
  assert.equal(dmForce(600, 95, 12, 12, 'hard'), 95);
  assert.equal(dmForce(600, 95, 0, 12, 'soft'), 95);
  assert.equal(dmForce(600, 95, 12, 12, 'soft'), 600);
  const targets = { target_comp_lo_min: 0, target_comp_lo_max: 1, target_comp_hi_min: 0, target_comp_hi_max: 1 };
  assert.deepEqual(calc(targets).result.axles.f.clicks.comp, [[11, 12]]);
  assert.deepEqual(calc({ ...targets, click_basis: 'soft' }).result.axles.f.clicks.comp, [[0, 1]]);
});
test('intersection excludes individually valid but incompatible low/high settings', () => {
  const r = calc().result;
  assert.deepEqual(r.axles.f.clicks.comp, []);
  assert.deepEqual(r.axles.f.clicks.reb, []);
  assert.match(dmClickText([]), /동시에 만족하는 설정 없음/);
});
test('enumeration agrees with independent force/target oracle across both references', () => {
  for (const basis of ['hard', 'soft']) for (const max of [0.5, 1, 2, 5]) {
    const r = calc({ click_basis: basis, target_comp_lo_max: max }).result;
    for (const axle of ['f', 'r']) for (const [type, prefix] of [['comp', 'fc'], ['reb', 'fr']]) {
      const expected = [], v = r.values, n = v['clicks_' + type], a = r.axles[axle];
      for (let click = 0; click <= n; click++) {
        const fraction = basis === 'hard' ? 1 - click / n : click / n;
        if (['lo', 'hi'].every(speed => {
          const f = v[`${prefix}_min_${speed}`] * (1 - fraction) + v[`${prefix}_max_${speed}`] * fraction;
          const z = f * v['mr_' + axle] ** 2 / (v['v_' + speed] * a.cc);
          const [lo, hi] = r.targets[`${type}_${speed}`]; return z >= lo && z <= hi;
        })) expected.push(click);
      }
      const actual = a.clicks[type].flatMap(([lo, hi]) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));
      assert.deepEqual(actual, expected);
    }
  }
});
test('constant force curves and zero force can satisfy all clicks or none', () => {
  const overrides = { fc_max_lo: 0, fc_min_lo: 0, fc_max_hi: 0, fc_min_hi: 0, target_comp_lo_min: 0, target_comp_hi_min: 0 };
  assert.deepEqual(calc(overrides).result.axles.f.clicks.comp, [[0, 12]]);
  assert.deepEqual(calc({ ...overrides, target_comp_lo_min: 0.1 }).result.axles.f.clicks.comp, []);
  assert.deepEqual(dmClickRanges([0, 1, 3, 5, 6]), [[0, 1], [3, 3], [5, 6]]);
});
test('exact target boundary retains the matching integer click', () => {
  const a = calc().result.axles.f;
  const lo = 95 / 25 * 0.51 ** 2 / a.cc, hi = 167 / 300 * 0.51 ** 2 / a.cc;
  assert.deepEqual(calc({ target_comp_lo_min: lo, target_comp_lo_max: lo, target_comp_hi_min: hi, target_comp_hi_max: hi }).result.axles.f.clicks.comp, [[12, 12]]);
});
test('roll assessment only uses explicit user range, with correct direction', () => {
  assert.match(dmRollText(80, null, null), /자동 판정 없음/);
  assert.match(dmRollText(80, 40, 60), /전륜 편향.*언더스티어/);
  assert.match(dmRollText(30, 40, 60), /후륜 편향.*오버스티어/);
  assert.match(dmRollText(40, 40, 60), /사용자 목표 범위 내/);
});
test('copy text includes corrected units, basis, targets, equivalent ratios and joint clicks', () => {
  const text = dmFormatResult(calc().result);
  for (const token of ['242.670 kg', '60.6105 kg', 'N·mm/rad', 'N·s/mm', 'Full Hard에서 풀어준', '등가 감쇠비 ζ_eq', '25 mm/s', 'secant', 'ARB 제외', '동시에 만족하는 설정 없음']) assert.ok(text.includes(token), token);
  assert.doesNotMatch(text, /NaN|Infinity|60~70|전 컴프레션↑/);
  assert.match(dmFormatResult(calc({ click_basis: 'soft' }).result), /Full Soft에서 잠근/);
});
test('HTML contains static controls and dynamic field hosts without duplicate IDs', () => {
 const h=fs.readFileSync('index.html','utf8'); const ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).filter(id=>id.startsWith('dm-'));
 assert.equal(new Set(ids).size,ids.length);
 for(const id of ['dm-k_spring_f','dm-k_spring_r','dm-structure-control','dm-dyno-extra','dm-rear-data','dm-clicks-f','dm-clicks-r']) assert.ok(ids.includes(id));
});
test('unverified model defaults to unknown and defers click output', () => {
 const r=dmCalculate(DM_DEF).result; assert.equal(r.axles.f.data.structure,'unknown');
 assert.match(dmFormatResult(r),/조절 방식 미확인/);
});
test('front and rear spring rates are independent', () => {
 const base=calc().result, r=calc({k_spring_f:70,k_spring_r:100}).result;
 near(r.axles.f.kw,70*0.51**2);near(r.axles.r.kw,100*0.6**2);
 near(calc({k_spring_f:70}).result.axles.r.kw,base.axles.r.kw);
});
test('cornerweight import uses kg, averages axes, rejects incomplete data and never changes source', () => {
 const fixture={fl:70,fr:77,rl:80,rr:73}; const copy=JSON.stringify(fixture);
 const r=dmCornerImport(fixture);near(r.total_mass,300);near(r.front_pct,49);assert.equal(JSON.stringify(fixture),copy);
 for(const c of [null,{fl:0,fr:77,rl:80,rr:73},{fl:70,fr:'',rl:80,rr:73}]) assert.ok(dmCornerImport(c).error);
});
test('rear dyno is independent in advanced mode and inactive fields do not poison shared mode', () => {
 const base=calc().result;
 const r=calc({dyno_mode:'separate',rear_structure:'2way',rear_fc_max_lo:900,rear_v_lo:30}).result;
 near(r.axles.f.z.comp_max_lo.z,base.axles.f.z.comp_max_lo.z);
 near(r.axles.r.z.comp_max_lo.ce,30);
 assert.equal(calc({rear_fc_max_lo:''}).result.axles.r.z.comp_max_lo.ce,24);
 assert.ok(calc({dyno_mode:'separate',rear_fc_max_lo:''}).errors.rear_fc_max_lo);
 assert.match(dmFormatResult(r),/30 mm\/s/);
});
test('cornerweight load writes only calculator inputs and recomputes, without mutating shared state', () => {
  const corners = Object.freeze({fl:70,fr:77,rl:80,rr:73});
  const elements = {'dm-total_mass':{},'dm-front_pct':{},'dm-import-status':{}};
  const context = vm.createContext({S:{cornerWeights:corners},document:{getElementById:id=>elements[id]},count:0});
  vm.runInContext(fs.readFileSync('js/damper.js','utf8'),context);
  vm.runInContext('calcDamper = () => { count++; }; dmLoadCornerWeights();',context);
  assert.equal(elements['dm-total_mass'].value,300); assert.equal(elements['dm-front_pct'].value,49);
  assert.equal(context.count,1); assert.equal(context.S.cornerWeights,corners);
  assert.match(elements['dm-import-status'].textContent,/운전자·주행 유체/);
});
test('4-way requires independent counts and outputs four ranges per axle', () => {
 assert.ok(calc({structure:'4way'}).errors.clicks_comp_lo);
 const r=calc({structure:'4way',clicks_comp_lo:12,clicks_comp_hi:10,clicks_reb_lo:20,clicks_reb_hi:16}).result;
 assert.deepEqual(Object.keys(r.axles.f.clicks),['comp_lo','comp_hi','reb_lo','reb_hi']);
 assert.ok(r.axles.f.clicks.comp_lo.length);assert.ok(r.axles.f.clicks.comp_hi.length);
 assert.ok(calc({structure:'4way',clicks_comp_lo:1.5}).errors.clicks_comp_lo);
});
test('3-way splits compression only; rebound keeps low/high intersection', () => {
 const r=calc({structure:'3way',clicks_comp_lo:12,clicks_comp_hi:12}).result;
 assert.deepEqual(Object.keys(r.axles.f.clicks),['comp_lo','comp_hi','reb']);
 assert.deepEqual(r.axles.f.clicks.reb,[]);
});
test('optional dyno metadata validation and copy preserve source information', () => {
 assert.ok(calc({temperature:'abc'}).errors.temperature);assert.ok(calc({gas_pressure:-1}).errors.gas_pressure);
 const r=calc({model:'Test damper',temperature:40,gas_pressure:5,source:'2026-09-10 sheet A',other_settings:'rebound 5 out'}).result;
 assert.match(dmFormatResult(r),/Test damper/);assert.match(dmFormatResult(r),/40 °C/);assert.match(dmFormatResult(r),/sheet A/);
});
test('shared backup supports unified ledger; damper calculations do not write shared state', async () => {
  const writes = []; let blob;
  const context = vm.createContext({
    firebase: { initializeApp() {}, database: () => ({ ref: path => ({ set: value => writes.push([path, value]), update: async value => writes.push([path,value]) }) }) },
    window: { addEventListener() {} }, navigator: { onLine: true },
    document: { getElementById: () => null, createElement: () => ({ click() {} }) },
    Blob, URL: { createObjectURL: b => { blob = b; return 'blob:test'; } },
    setTimeout: () => 1, clearTimeout() {}, confirm: () => true, alert() {},
    FileReader: class { readAsText(file) { this.onload({ target: { result: file } }); } },
    renderHome() {}, renderPartsBudget() {},
    buildInspection() {}, renderLapTable() {}, renderDriverStats() {}, renderParts() {}, renderTestLogs() {}, renderSetupHistory() {}, populateSetupLinks() {}, calcFuel() {},
  });
  vm.runInContext(fs.readFileSync('js/storage.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/competition-date.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/parts-budget.js', 'utf8'), context);
  vm.runInContext("S.parts = [{name:'test',weight:123,qty:2}]; save('parts');", context);
  assert.equal(writes[0][0], 'just/parts'); assert.equal(writes[0][1][0].weight, 123);
  const before = vm.runInContext('JSON.stringify(S)', context);
  vm.runInContext(fs.readFileSync('js/damper.js', 'utf8'), context);
  vm.runInContext('dmCalculate(DM_DEF)', context);
  assert.equal(vm.runInContext('JSON.stringify(S)', context), before); assert.equal(writes.length, 3);
  vm.runInContext("S.compDate='2026-09-30'; S.inspectionReview={br13:'2026-09-C'};",context);
  await vm.runInContext('exportData()', context);
  const exported = JSON.parse(await blob.text());
  assert.equal(exported.version, '2.0'); assert.equal(exported.parts[0].weight, 123);
  assert.equal(exported.compDate,'2026-09-30');assert.equal(exported.inspectionReview.br13,'2026-09-C');
  assert.ok(!Object.keys(exported).some(k => /damper|dm/.test(k)));
  context.fixture = JSON.stringify(exported);
  vm.runInContext("S.parts = []; S.compDate=''; S.inspectionReview={}; handleImport({files:[fixture], value:'fixture.json'});", context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(vm.runInContext('S.parts[0].weight', context), 123);
  assert.equal(vm.runInContext('S.compDate',context),'2026-09-30');assert.equal(vm.runInContext('S.inspectionReview.br13',context),'2026-09-C');
});
