// ═══════════════════════════════════════════════
// TAB 3: FUEL STRATEGY
// ═══════════════════════════════════════════════
let fuelChart = null;

function calcFuel() {
  const eff = parseFloat(v('fuel-eff')) || 8.5;
  const circuitLen = parseFloat(v('circuit-len')) || 1.2;
  const raceDist = parseFloat(v('race-dist')) || 22;
  const tankCap = parseFloat(v('tank-cap')) || 5.5;
  const margin = parseFloat(v('safety-margin')) || 10;
  const pitFuel = parseFloat(v('pit-fuel')) || 5.0;

  const lapsTotal = Math.ceil(raceDist / circuitLen);
  const fuelPerLap = circuitLen / eff;
  const baseFuel = raceDist / eff;
  const totalFuel = baseFuel * (1 + margin/100);
  const tankPct = Math.min((totalFuel / tankCap) * 100, 100);

  setText('fr-total-fuel', totalFuel.toFixed(2) + ' L');
  setText('fr-laps', lapsTotal + ' 랩');
  setText('fr-per-lap', fuelPerLap.toFixed(3) + ' L');
  setText('fr-tank-pct', Math.round(tankPct) + '%');
  setText('fr-tank-cap-label', tankCap + ' L');
  document.getElementById('fr-tank-bar').style.width = tankPct + '%';
  document.getElementById('fr-tank-bar').style.background =
    tankPct > 100 ? '#ff4444' : tankPct > 85 ? '#ffaa00' : 'linear-gradient(90deg,#ff0000,#ff4444)';

  const pitEl = document.getElementById('pit-stop-plan');
  if (totalFuel <= tankCap) {
    pitEl.innerHTML = `<div class="pit-stop-item"><div class="lap">✓</div><div class="details">피트스톱 불필요<span>전체 연료 탱크 내 수용 가능</span></div></div>`;
  } else {
    let remaining = totalFuel;
    let lap = 0;
    let stops = [];
    let currentFuel = tankCap;
    while (remaining > 0) {
      const lapsOnFuel = Math.floor(currentFuel / fuelPerLap);
      lap += lapsOnFuel;
      remaining -= lapsOnFuel * fuelPerLap;
      if (remaining > 0 && lap < lapsTotal) {
        stops.push({ lap, addFuel: Math.min(pitFuel, tankCap) });
        currentFuel = Math.min(pitFuel, tankCap);
      } else break;
      if (stops.length > 20) break;
    }
    pitEl.innerHTML = stops.map((s,i) =>
      `<div class="pit-stop-item"><div class="lap">${s.lap}</div><div class="details">피트스톱 #${i+1} — 연료 보충 ${s.addFuel.toFixed(1)} L<span>${s.lap}랩 이후 피트 진입</span></div></div>`
    ).join('') || '<div class="pit-stop-item"><div class="lap">-</div><div class="details">계산 오류<span>수치를 확인하세요</span></div></div>';
  }

  // 부품 무게 연동 — 예상 차량 중량
  const partsWeight = S.parts.reduce((a, p) => a + (p.weight || 0) * (p.qty || 1), 0);
  const fuelWeight  = Math.round(totalFuel * 740);
  const totalVehWeight = partsWeight + fuelWeight;
  const setFuelEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setFuelEl('fuel-parts-weight', partsWeight.toLocaleString() + ' g');
  setFuelEl('fuel-fuel-weight',  fuelWeight.toLocaleString() + ' g');
  setFuelEl('fuel-total-weight', (totalVehWeight / 1000).toFixed(2) + ' kg');

  renderFuelChart(lapsTotal, fuelPerLap, tankCap, pitFuel, totalFuel);
}

function renderFuelChart(laps, fuelPerLap, tankCap, pitFuel, totalFuel) {
  const ctx = document.getElementById('fuelChart').getContext('2d');
  if (fuelChart) fuelChart.destroy();

  const labels = [];
  const fuelData = [];
  let current = Math.min(totalFuel, tankCap);
  for (let i=0; i<=laps; i++) {
    labels.push('L' + i);
    fuelData.push(parseFloat(current.toFixed(3)));
    current -= fuelPerLap;
    if (current < 0.5 && i < laps) {
      current = Math.min(pitFuel, tankCap);
    }
  }

  fuelChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '잔여 연료 (L)',
        data: fuelData,
        borderColor: '#ff0000',
        backgroundColor: 'rgba(255,0,0,0.1)',
        fill: true, tension: 0.3, pointRadius: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color:'#888', font:{size:11} } } },
      scales: {
        x: { grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10},maxTicksLimit:10} },
        y: { grid:{color:'#1a1a1a'}, ticks:{color:'#666',font:{size:10}}, min:0 }
      }
    }
  });
}
