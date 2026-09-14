// Distance is authoritative; the final segment can be a partial lap.
let fuelChart = null;
function calculateFuel(input) {
  const names={eff:'연비',circuitLen:'서킷 길이',raceDist:'레이스 거리',tankCap:'탱크 용량',margin:'안전 여유율',pitFuel:'보충량',density:'연료 밀도'};
  const n={};
  for(const [key,label] of Object.entries(names)) {
    const value=input[key];
    if(!['number','string'].includes(typeof value) || String(value).trim()==='')throw Error(label+': 값을 입력하세요.');
    n[key]=Number(value);
    if(!Number.isFinite(n[key]) || n[key]<0 || (!['margin','pitFuel'].includes(key) && n[key]===0))throw Error(label+'에 올바른 양수를 입력하세요. 여유율과 보충량은 0도 가능합니다.');
  }
  if(n.margin>50)throw Error('안전 여유율은 0~50% 범위로 입력하세요.');
  const equivalentLaps=n.raceDist/n.circuitLen;
  if(!Number.isFinite(equivalentLaps) || equivalentLaps>10000)throw Error('시뮬레이션은 최대 10,000랩까지 지원합니다. 거리와 서킷 길이를 확인하세요.');
  const steps=Math.max(1,Math.ceil(equivalentLaps-1e-10)),baseFuel=n.raceDist/n.eff,reserve=baseFuel*n.margin/100;
  const required=baseFuel+reserve,perLap=n.circuitLen/n.eff,tankPct=required/n.tankCap*100;
  const start=Math.min(required,n.tankCap),fuelKg=start*n.density;
  if(![baseFuel,reserve,required,perLap,tankPct,fuelKg].every(Number.isFinite) || baseFuel<=0)throw Error('입력값의 범위가 너무 큽니다. 단위와 수치를 확인하세요.');
  const tolerance=1e-10*required;
  let current=start,consumed=0,reason='';
  const events=[],points=[{x:0,y:start}];
  for(let i=0;i<steps;i++) {
    const endDistance=i===steps-1?n.raceDist:(i+1)*n.circuitLen;
    const burn=(endDistance-i*n.circuitLen)/n.eff;
    if(current+tolerance<burn+reserve) {
      if(i===0){reason='출발 연료로 첫 구간을 주행하면서 안전 여유분을 유지할 수 없습니다.';break;}
      if(!input.allowRefuel){reason='보충 없이 주행하기에는 탱크 용량이 부족합니다.';break;}
      const add=Math.max(0,Math.min(n.pitFuel,n.tankCap-current,required-consumed-current));
      if(current+add+tolerance<burn+reserve){reason='한 번의 보충량 또는 탱크 용량이 부족해 다음 구간을 주행하며 여유분을 유지할 수 없습니다.';break;}
      current+=add;events.push({lap:i,addFuel:add,after:current});points.push({x:i,y:current});
    }
    current=Math.max(0,current-burn);consumed+=burn;
    points.push({x:endDistance/n.circuitLen,y:current});
  }
  return {...n,equivalentLaps,steps,baseFuel,reserve,required,perLap,tankPct,start,fuelKg,events,points,
    feasible:!reason,reason,finish:current,consumed};
}
function calcFuel() {
  const ids={eff:'fuel-eff',circuitLen:'circuit-len',raceDist:'race-dist',tankCap:'tank-cap',margin:'safety-margin',pitFuel:'pit-fuel',density:'fuel-density'};
  const input=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,v(id)]));
  input.allowRefuel=!!document.getElementById('fuel-allow-refuel')?.checked;
  const pitInput=document.getElementById('pit-fuel');if(pitInput)pitInput.disabled=!input.allowRefuel;
  if(!input.allowRefuel)input.pitFuel=0;
  let result;
  try {result=calculateFuel(input);}catch(err){
    setText('fuel-error',err.message);
    ['fr-total-fuel','fr-laps','fr-per-lap','fr-tank-pct','fr-tank-cap-label','fuel-parts-weight','fuel-fuel-weight','fuel-total-weight','fr-start','fr-reserve'].forEach(id=>setText(id,'—'));
    setText('pit-stop-plan','입력값을 확인하면 결과를 다시 계산합니다.');
    setText('fuel-chart-note','입력 오류로 그래프를 표시하지 않습니다.');
    const bar=document.getElementById('fr-tank-bar');if(bar)bar.style.width='0%';
    if(fuelChart){fuelChart.destroy();fuelChart=null;}return;
  }
  setText('fuel-error','');
  setText('fr-total-fuel',result.required.toFixed(2)+' L');
  setText('fr-laps',Number(result.equivalentLaps.toFixed(3))+' 랩 상당');
  setText('fr-per-lap',result.perLap.toFixed(3)+' L');
  setText('fr-start',result.start.toFixed(2)+' L');setText('fr-reserve',result.reserve.toFixed(2)+' L');
  setText('fr-tank-pct',result.tankPct.toFixed(1)+'%'+(result.tankPct>100?' · 용량 초과':''));
  setText('fr-tank-cap-label',result.tankCap+' L');
  const bar=document.getElementById('fr-tank-bar');
  if(bar){bar.style.width=Math.min(result.tankPct,100)+'%';bar.style.background=result.tankPct>100?'#ff4444':result.tankPct>85?'#ffaa00':'#00cc66';}
  const plan=document.getElementById('pit-stop-plan');
  if(plan)plan.innerHTML=(result.feasible
    ? `<p style="color:#00cc66">${result.events.length?'보충 조건에서 완주 가능':'보충 없이 완주 가능'} · 예상 종료 잔량 ${result.finish.toFixed(2)} L</p>`
    : `<p style="color:#ff6666">현재 설정으로 완주 불가: ${result.reason}</p>`)
    +result.events.map((e,i)=>`<div class="pit-stop-item"><div class="lap">${e.lap}</div><div class="details">보충 #${i+1} — ${e.addFuel.toFixed(3)} L<span>${e.lap}랩 완료 후 · 보충 직후 ${e.after.toFixed(3)} L</span></div></div>`).join('');
  const parts=Array.isArray(S.parts)?S.parts:Object.values(S.parts||{});
  const partsWeight=parts.filter(p=>p.status!=='제외').reduce((sum,p)=>sum+Number(p.weight||0)*Number(p.qty??1),0);
  setText('fuel-parts-weight',partsWeight.toLocaleString()+' g');
  setText('fuel-fuel-weight',result.fuelKg.toFixed(3)+' kg');
  setText('fuel-total-weight',((partsWeight/1000)+result.fuelKg).toFixed(2)+' kg');
  setText('fuel-chart-note',result.feasible?'입력 거리까지만 계산합니다. 수직 상승 구간은 위 계획과 같은 연료 보충입니다.':'진행 가능한 구간까지만 표시합니다. 이후 완주를 가정하지 않습니다.');
  renderFuelChart(result);
}
function renderFuelChart(result) {
  if(fuelChart){fuelChart.destroy();fuelChart=null;}
  const canvas=document.getElementById('fuelChart');
  if(!canvas || typeof Chart==='undefined'){setText('fuel-chart-note','그래프를 불러오지 못했습니다. 위 수치 결과와 보충 계획을 확인하세요.');return;}
  fuelChart=new Chart(canvas.getContext('2d'),{
    type:'line',data:{datasets:[{label:'잔여 연료 (L)',data:result.points,borderColor:'#ff4444',backgroundColor:'rgba(255,0,0,0.1)',fill:true,tension:0,pointRadius:2}]},
    options:{responsive:true,animation:false,plugins:{legend:{labels:{color:'#888'}}},scales:{
      x:{type:'linear',min:0,max:result.equivalentLaps,title:{display:true,text:'주행 랩 (소수 = 마지막 부분 랩)',color:'#888'},ticks:{color:'#888',maxTicksLimit:10}},
      y:{min:0,title:{display:true,text:'잔여 연료 (L)',color:'#888'},ticks:{color:'#888'}}}}
  });
}
if(typeof module!=='undefined')module.exports={calculateFuel};
