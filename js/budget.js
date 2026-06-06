// ═══════════════════════════════════════════════
// TAB 6: BUDGET
// ═══════════════════════════════════════════════
let _budgetChart = null, _monthlyChart = null;

function setBudgetLimit() {
  const part = document.getElementById('bl-part')?.value;
  const amount = parseInt(document.getElementById('bl-amount')?.value);
  if (!part || !amount || amount <= 0) { alert('파트와 금액을 입력하세요'); return; }
  if (!S.budget.limits) S.budget.limits = {};
  S.budget.limits[part] = amount;
  document.getElementById('bl-amount').value = '';
  save('budget');
}

function deleteBudgetLimit(part) {
  if (!confirm(`'${part}' 예산 한도를 삭제할까요?`)) return;
  delete S.budget.limits[part];
  save('budget');
}

function addExpense() {
  const date   = document.getElementById('exp-date')?.value;
  const part   = document.getElementById('exp-part')?.value;
  const item   = document.getElementById('exp-item')?.value.trim();
  const amount = parseInt(document.getElementById('exp-amount')?.value);
  const person = document.getElementById('exp-person')?.value.trim();
  const wdRaw  = document.getElementById('exp-weight-delta')?.value;
  const weightDelta = wdRaw !== '' && wdRaw != null ? parseInt(wdRaw) : null;
  if (!date || !part || !item || !amount || amount <= 0) { alert('모든 항목을 입력하세요'); return; }
  if (!S.budget.expenses) S.budget.expenses = [];
  S.budget.expenses.push({ date, part, item, amount, person: person || '-', weightDelta });
  S.budget.expenses.sort((a, b) => b.date.localeCompare(a.date));
  ['exp-item','exp-amount','exp-person','exp-weight-delta'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  save('budget');
}

function deleteExpense(idx) {
  if (!confirm('삭제할까요?')) return;
  S.budget.expenses.splice(idx, 1);
  save('budget');
}

function renderBudget() {
  if (!S.budget) return;
  const limits   = S.budget.limits   || {};
  const expenses = S.budget.expenses || [];
  const spent = {};
  expenses.forEach(e => { spent[e.part] = (spent[e.part] || 0) + e.amount; });
  const totalBudget = Object.values(limits).reduce((a,b) => a+b, 0);
  const totalSpent  = Object.values(spent).reduce((a,b) => a+b, 0);
  const usagePct    = totalBudget ? Math.round(totalSpent/totalBudget*100) : 0;
  setText('b-total-budget', '₩' + totalBudget.toLocaleString());
  setText('b-total-spent',  '₩' + totalSpent.toLocaleString());
  setText('b-total-remain', '₩' + (totalBudget-totalSpent).toLocaleString());
  setText('b-usage-rate',   usagePct + '%');
  const bar = document.getElementById('b-usage-bar');
  if (bar) { bar.style.width = Math.min(usagePct,100)+'%'; bar.style.background = usagePct>=90?'#ff0000':usagePct>=70?'#ffaa00':'#00cc66'; }

  const limEl = document.getElementById('budget-limits-list');
  if (limEl) {
    limEl.innerHTML = Object.keys(limits).length === 0
      ? '<div style="color:#555;font-size:12px;padding:8px 0">파트별 예산을 설정해주세요</div>'
      : Object.entries(limits).map(([part, limit]) => {
          const s = spent[part] || 0;
          const pct = Math.min(Math.round(s/limit*100), 100);
          const color = pct>=90?'#ff4444':pct>=70?'#ffaa00':'#00cc66';
          return `<div class="budget-limit-row">
            <div class="budget-part-name">${part}</div>
            <div class="budget-bar-wrap"><div class="budget-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <div class="budget-remaining" style="color:${color}">₩${(limit-s).toLocaleString()}</div>
            <button onclick="deleteBudgetLimit('${part}')" style="background:none;border:none;color:#555;cursor:pointer;font-size:13px;padding:0 4px;touch-action:manipulation">✕</button>
          </div>`;
        }).join('');
  }

  const tbody = document.getElementById('expense-tbody');
  const empty = document.getElementById('expense-empty');
  if (tbody) {
    const totalWeightDelta = expenses.reduce((a, e) => a + (e.weightDelta || 0), 0);
    tbody.innerHTML = expenses.length === 0 ? '' : expenses.map((e, i) => {
      const wd = e.weightDelta != null ? e.weightDelta : null;
      const wdColor = wd == null ? '#555' : wd > 0 ? '#ff4444' : '#00cc66';
      const wdText  = wd == null ? '-' : (wd > 0 ? '+' : '') + wd.toLocaleString() + 'g';
      return `<tr>
        <td>${e.date}</td>
        <td><span style="background:#222;padding:2px 8px;border-radius:4px;font-size:11px">${e.part}</span></td>
        <td>${e.item}</td>
        <td style="font-weight:600;color:var(--red)">₩${e.amount.toLocaleString()}</td>
        <td>${e.person}</td>
        <td style="font-weight:600;color:${wdColor};font-size:12px">${wdText}</td>
        <td><button onclick="deleteExpense(${i})" style="background:none;border:none;color:#555;cursor:pointer;touch-action:manipulation">✕</button></td>
      </tr>`;
    }).join('');
    if (empty) empty.style.display = expenses.length === 0 ? 'block' : 'none';
    const wdSummaryEl = document.getElementById('budget-weight-delta-summary');
    if (wdSummaryEl) {
      const hasAny = expenses.some(e => e.weightDelta != null);
      wdSummaryEl.style.display = hasAny ? '' : 'none';
      wdSummaryEl.textContent = '지출 항목 누적 무게 변화: ' + (totalWeightDelta > 0 ? '+' : '') + totalWeightDelta.toLocaleString() + ' g';
      wdSummaryEl.style.color = totalWeightDelta > 0 ? '#ff4444' : totalWeightDelta < 0 ? '#00cc66' : '#888';
    }
  }

  const parts = Object.keys(limits);
  const ctx1 = document.getElementById('budget-chart');
  if (ctx1 && parts.length > 0) {
    if (_budgetChart) _budgetChart.destroy();
    _budgetChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: parts,
        datasets: [
          { label: '지출', data: parts.map(p => spent[p]||0), backgroundColor: 'rgba(255,0,0,0.7)', borderRadius:4 },
          { label: '잔액', data: parts.map(p => Math.max((limits[p]||0)-(spent[p]||0),0)), backgroundColor: 'rgba(0,204,102,0.4)', borderRadius:4 }
        ]
      },
      options: { responsive:true, plugins:{ legend:{labels:{color:'#888'}} }, scales:{ x:{stacked:true,ticks:{color:'#888'},grid:{color:'#222'}}, y:{stacked:true,ticks:{color:'#888',callback:v=>'₩'+v.toLocaleString()},grid:{color:'#222'}} } }
    });
  }

  const ctx2 = document.getElementById('monthly-chart');
  if (ctx2 && expenses.length > 0) {
    const monthly = {};
    expenses.forEach(e => { const m=e.date.slice(0,7); monthly[m]=(monthly[m]||0)+e.amount; });
    const months = Object.keys(monthly).sort();
    if (_monthlyChart) _monthlyChart.destroy();
    _monthlyChart = new Chart(ctx2, {
      type: 'line',
      data: { labels: months, datasets: [{ label:'월별 지출', data:months.map(m=>monthly[m]), borderColor:'#ff0000', backgroundColor:'rgba(255,0,0,0.1)', fill:true, tension:0.4, pointBackgroundColor:'#ff0000' }] },
      options: { responsive:true, plugins:{legend:{labels:{color:'#888'}}}, scales:{ x:{ticks:{color:'#888'},grid:{color:'#222'}}, y:{ticks:{color:'#888',callback:v=>'₩'+v.toLocaleString()},grid:{color:'#222'}} } }
    });
  }
}

function exportBudgetPDF() {
  const el = document.getElementById('tab-budget');
  const date = new Date().toISOString().slice(0,10);
  html2pdf().set({
    margin: [10,10,10,10],
    filename: 'JUST_Budget_' + date + '.pdf',
    image: { type: 'jpeg', quality: 0.97 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(el).save();
}
