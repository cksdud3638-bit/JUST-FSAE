// ═══════════════════════════════════════════════
// COMMON CATEGORIES
// ═══════════════════════════════════════════════
const PART_CATEGORIES = ['섀시','서스펜션','파워트레인','냉각·연료','브레이크','조향','전장','바디·공력','공용부품','기타'];

// ═══════════════════════════════════════════════
// FIREBASE & STATE
// ═══════════════════════════════════════════════
firebase.initializeApp({
  apiKey: "AIzaSyC7cgD6z4EzdKFUwELx6omxiqH56H3xj2Q",
  authDomain: "just-fsae.firebaseapp.com",
  databaseURL: "https://just-fsae-default-rtdb.firebaseio.com",
  projectId: "just-fsae",
  storageBucket: "just-fsae.firebasestorage.app",
  messagingSenderId: "132875342018",
  appId: "1:132875342018:web:d962c5342ff47968b3eb5b"
});
const db = firebase.database();

const S = {
  inspection: {},
  inspectionMeta: {},
  lapTimes: [],
  testLogs: [],
  feedbacks: [],
  setupHistory: [],
  budget: { limits: {}, expenses: [] },
  parts: [],
  cornerWeights: { fl: 0, fr: 0, rl: 0, rr: 0 },
  wheelbase: 1600,
  targetFrontPct: 45,
};

// ═══════════════════════════════════════════════
// SYNC STATUS UI
// ═══════════════════════════════════════════════
let _syncTimer = null;

function setSyncState(state, extra) {
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  const dot = el.querySelector('.sync-dot');
  const txt = el.querySelector('.sync-text');
  const mod = el.querySelector('.sync-modifier');

  el.className = 'sync-indicator';
  const states = {
    saving:  { cls: 'sync-saving',  label: '저장 중…' },
    saved:   { cls: 'sync-saved',   label: '저장 완료' },
    synced:  { cls: 'sync-synced',  label: '서버 동기화 완료' },
    offline: { cls: 'sync-offline', label: '오프라인' },
    remote:  { cls: 'sync-remote',  label: '다른 사용자가 수정함' },
  };
  const cfg = states[state] || states.synced;
  el.classList.add(cfg.cls);
  if (txt) txt.textContent = cfg.label;
  if (mod) mod.textContent = extra || '';
}

function save(key) {
  setSyncState('saving');
  db.ref('just/' + key).set(S[key]);
  const now = new Date();
  const t   = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const modifier = '나 · ' + t;
  db.ref('just/lastSave').set(t);
  db.ref('just/lastModifier').set(modifier);

  setSyncState('saved', modifier);
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => setSyncState('synced', modifier), 2000);

  const legacyEl = document.getElementById('save-time');
  if (legacyEl) legacyEl.textContent = '마지막 저장: ' + t;
}

// ═══════════════════════════════════════════════
// ONLINE / OFFLINE DETECTION
// ═══════════════════════════════════════════════
window.addEventListener('online',  () => setSyncState('synced'));
window.addEventListener('offline', () => setSyncState('offline'));
if (!navigator.onLine) setSyncState('offline');

// ═══════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════
async function exportData() {
  const data = {
    version: '1.1',
    exported: new Date().toISOString(),
    inspection: S.inspection,
    inspectionMeta: S.inspectionMeta,
    lapTimes: S.lapTimes,
    testLogs: S.testLogs,
    feedbacks: S.feedbacks,
    setupHistory: S.setupHistory,
    parts: S.parts,
    cornerWeights: S.cornerWeights,
    wheelbase: S.wheelbase,
    targetFrontPct: S.targetFrontPct,
  };
  const json = JSON.stringify(data, null, 2);
  const filename = 'JUST_FSAE_저장_' + new Date().toISOString().slice(0, 10) + '.json';
  const blob = new Blob([json], {type: 'application/json'});
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, {type: 'application/json'});
      if (navigator.canShare({files: [file]})) {
        await navigator.share({files: [file], title: 'JUST FSAE 데이터', text: 'JUST FSAE 통합 관리 시스템 저장 데이터'});
        return;
      }
    } catch(e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function importData() {
  document.getElementById('import-input').click();
}

function handleImport(input) {
  const file = input.files[0];
  if (!file) return;
  if (!confirm('기존 데이터가 덮어씌워집니다. 계속할까요?')) { input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.inspection     !== undefined) S.inspection     = data.inspection;
      if (data.inspectionMeta !== undefined) S.inspectionMeta = data.inspectionMeta;
      if (data.lapTimes       !== undefined) S.lapTimes       = data.lapTimes;
      if (data.testLogs       !== undefined) S.testLogs       = data.testLogs;
      if (data.feedbacks      !== undefined) S.feedbacks      = data.feedbacks;
      if (data.setupHistory   !== undefined) S.setupHistory   = data.setupHistory;
      if (data.parts          !== undefined) S.parts          = data.parts;
      if (data.cornerWeights  !== undefined) S.cornerWeights  = data.cornerWeights;
      if (data.wheelbase      !== undefined) S.wheelbase      = data.wheelbase;
      if (data.targetFrontPct !== undefined) S.targetFrontPct = data.targetFrontPct;
      ['inspection','inspectionMeta','lapTimes','testLogs','feedbacks','setupHistory','parts','cornerWeights','wheelbase','targetFrontPct'].forEach(k => save(k));
      buildInspection();
      renderLapTable();
      renderDriverStats();
      renderParts();
      renderTestLogs();
      renderSetupHistory();
      populateSetupLinks();
      calcFuel();
      alert('데이터를 성공적으로 불러왔습니다!');
    } catch(err) {
      alert('파일 읽기 오류: ' + err.message);
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════
function v(id) { return document.getElementById(id)?.value || ''; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setWidth(id, pct) { const el = document.getElementById(id); if (el) el.style.width = Math.min(pct, 100) + '%'; }
