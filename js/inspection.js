// ═══════════════════════════════════════════════
// TAB 1: INSPECTION
// ═══════════════════════════════════════════════
const INSP_DATA = [
  { cat: '차체 일반 규정', icon: '📐', color: '#9966cc', items: [
    { id: 'vc01', name: '휠베이스 최소 1,500mm 이상', ref: '제4조①' },
    { id: 'vc02', name: '타이어 외 차량 부분 지면 미접촉 (최저 지상고 확인)', ref: '제4조②' },
    { id: 'vc03', name: '좁은 트레드 폭 ≥ 넓은 트레드 폭의 75% 이상', ref: '제5조' },
    { id: 'vc04', name: '드라이버 좌우 시야 합계 200도 이상 (거울 포함)', ref: '제25조③' },
    { id: 'vc05', name: '드라이버 5초 이내 측면 탈출 가능', ref: '제26조①' },
  ]},
  { cat: '휠 / 타이어', icon: '🔩', color: '#ffaa00', items: [
    { id: 'wt01', name: '단일 고정너트 사용 시 풀림 방지 장치 (이중너트 불인정)', ref: '제6조①' },
    { id: 'wt02', name: '휠 볼트/너트 98Nm 이상 토크로 체결 가능', ref: '제6조②' },
    { id: 'wt03', name: '알루미늄 휠너트 사용 시 경질 애노다이징 처리, 변형 없음', ref: '제6조③' },
    { id: 'wt04', name: '타이어 트레드 패턴: 제조사 제작 또는 공인 개조만 허용', ref: '제7조①' },
    { id: 'wt05', name: '레인타이어 사용 시 트레드 깊이 최소 2.4mm 이상', ref: '제7조③-2' },
    { id: 'wt06', name: '타이어 공기압 규격 이내', ref: '제7조' },
  ]},
  { cat: '현가장치', icon: '🔧', color: '#ffbb44', items: [
    { id: 'su01', name: '4바퀴 모두 쇽업소버 포함 현가장치 장착', ref: '제8조①' },
    { id: 'su02', name: '드라이버 탑승 시 바퀴 움직임 ≥ 50mm (상/하 각 25mm)', ref: '제8조①' },
    { id: 'su03', name: '현가장치 작동 범위 내 상호 간섭 없음', ref: '제8조①' },
    { id: 'su04', name: '모든 현가장치 고정부 외부 노출 또는 검차 확인 가능', ref: '제8조②' },
    { id: 'su05', name: '서스펜션 마운팅 볼트 전 잠금 확인', ref: '제8조' },
    { id: 'su06', name: '서스펜션 암 균열/손상 없음', ref: '제8조' },
    { id: 'su07', name: '허브 베어링 유격 허용치 이내', ref: '제8조' },
    { id: 'su08', name: '잭 포인트 구조물 확인', ref: '제8조' },
  ]},
  { cat: '조향장치', icon: '🎡', color: '#00aaff', items: [
    { id: 'st01', name: '조향 제한장치 장착 (타이어가 현가장치/바디/프레임에 닿지 않음)', ref: '제9조①' },
    { id: 'st02', name: '조향휠 유격: 회전방향 7도 이하, 축방향 10mm 이하', ref: '제9조②' },
    { id: 'st03', name: '퀵릴리즈 조향휠 - 장갑 낀 상태에서 분리 가능', ref: '제9조③' },
    { id: 'st04', name: '조향휠 형태: 폐곡선 형태 (H자, 단절 형태 금지)', ref: '제9조④' },
    { id: 'st05', name: '조향휠 위치: 어떠한 조향각에서도 전방 롤 후프 최상단부 아래', ref: '제9조⑤' },
    { id: 'st06', name: '스티어링 랙 고정 마운트 확인', ref: '제9조' },
    { id: 'st07', name: '타이로드 잠금 너트 체결 확인', ref: '제9조' },
  ]},
  { cat: '제동장치', icon: '🛑', color: '#ff0000', items: [
    { id: 'br01', name: '단일 페달로 4륜 모두 작동하는 제동장치', ref: '제10조①' },
    { id: 'br02', name: '2개 독립적 유압 회로 (각각 분리된 오일 저장 용기)', ref: '제10조②' },
    { id: 'br03', name: '제동장치 추돌/파편으로부터 보호', ref: '제10조④' },
    { id: 'br04', name: '보호 없는 플라스틱 브레이크 라인 미사용', ref: '제10조⑤' },
    { id: 'br05', name: '전자식 제동장치 (Brake by wire) 미사용', ref: '제10조⑥' },
    { id: 'br06', name: 'BOTS 장착 - 페달 과다 이동 시 엔진 정지 가능', ref: '제10조⑦-1' },
    { id: 'br07', name: 'BOTS 작동 시 제동등 제외 전기-전자장치 전원 차단', ref: '제10조⑦-2' },
    { id: 'br08', name: 'BOTS 작동 후 페달 놓거나 다시 밟아도 엔진 재시동 불가', ref: '제10조⑦-3' },
    { id: 'br09', name: 'BOTS 정상 작동 확인 사진자료 제출', ref: '제10조⑦-4' },
    { id: 'br10', name: '제동등 장착 - 면적 15cm2 이상', ref: '제10조⑨-2' },
    { id: 'br11', name: '제동등 위치: 드라이버 어깨선과 뒷바퀴 축 사이 교차지점', ref: '제10조⑨-1' },
    { id: 'br12', name: '제동등 LED: 150mm x 30mm 이상, 100mm2당 1개 이상 LED', ref: '제10조⑨-2' },
    { id: 'br13', name: '제동등 - 주 비상정지 OFF 상태에서도 작동', ref: '제10조⑨-3' },
    { id: 'br14', name: '제동등 점멸 없음, 제동 스위치로만 작동', ref: '제10조⑨-4' },
    { id: 'br15', name: '어떠한 부품도 제동등을 가리지 않음', ref: '제10조⑨-5' },
    { id: 'br16', name: '마스터 실린더 보호 가드', ref: '제10조④' },
    { id: 'br17', name: '브레이크 패드 최소 두께 이상', ref: '제10조' },
    { id: 'br18', name: '브레이크 바이어스 조정 잠금 확인', ref: '제10조' },
  ]},
  { cat: '잭 지지점', icon: '🔼', color: '#ff9900', items: [
    { id: 'jk01', name: '퀵잭 바퀴 장착, 이동 시 차량-지면 미접촉', ref: '제11조①' },
    { id: 'jk02', name: '잭 지지점 차량 후면 위치', ref: '제11조②' },
    { id: 'jk03', name: '잭 지지점: 알루미늄/강철, 바깥지름 25mm 원형 파이프', ref: '제11조②-2' },
    { id: 'jk04', name: '잭 지지점 파이프 길이 최소 280mm 이상 (장애물 없음)', ref: '제11조②-3' },
    { id: 'jk05', name: '잭 지지부 오렌지색 도색', ref: '제11조②-4' },
    { id: 'jk06', name: '잭 지지점 높이: 지면으로부터 75mm~100mm', ref: '제11조③-1' },
    { id: 'jk07', name: '잭 지지점 높이 200mm 시 바퀴 지면 미접촉', ref: '제11조③-2' },
  ]},
  { cat: '프레임 / 롤 후프', icon: '🏗️', color: '#cc66ff', items: [
    { id: 'fr01', name: '프레임 주구조물 재료: 항복강도 305MPa, 인장강도 365MPa 이상', ref: '제14조①' },
    { id: 'fr02', name: '메인/전방 롤 후프 파이프: 25mm x 1.8mm 이상', ref: '제14조①' },
    { id: 'fr03', name: '측면/전방 충격 구조, 롤 후프 지지대: 25mm x 1.6mm 이상', ref: '제14조①' },
    { id: 'fr04', name: '나머지 프레임: 20mm x 1.2mm 이상 (또는 25x25x1.6mm 각형)', ref: '제14조①' },
    { id: 'fr05', name: '재료 증빙자료 (성분표, 시험성적서) 제출', ref: '제14조①-3' },
    { id: 'fr06', name: '메인/전방 롤 후프 - 헬멧 상단에서 50mm 이상 간격', ref: '제15조①-1' },
    { id: 'fr07', name: '파이프 벤딩 최소 반경: 파이프 외경의 3배 이상', ref: '제15조①-2' },
    { id: 'fr08', name: '벤딩 주름 없음, 벤딩 후 외경 감소 15% 미만', ref: '제15조①-3' },
    { id: 'fr09', name: '메인/전방 롤 후프 직선부 검사구멍 (직경 5mm) 장착', ref: '제15조①-5' },
    { id: 'fr10', name: '메인롤후프: 단일 연속 파이프, 좌우 바닥프레임 연결', ref: '제15조②-2' },
    { id: 'fr11', name: '메인롤후프 기울기: 수직축에서 전/후 10도 이내', ref: '제15조②-4' },
    { id: 'fr12', name: '메인롤후프 폭: 좌우 안쪽 380mm 이상', ref: '제15조②-5' },
    { id: 'fr13', name: '전방롤후프: 단일 연속 파이프, 좌우 바닥프레임 연결', ref: '제15조③-2' },
    { id: 'fr14', name: '메인/전방 롤 후프: 복합소재 사용 불가', ref: '제15조②-3' },
    { id: 'fr15', name: '메인롤후프 지지대: 2개 이상 원형파이프, 좌우 양쪽 지지', ref: '제16조①-2' },
    { id: 'fr16', name: '메인롤후프 지지대: 최상부에서 160mm 이내, 30도 이상 각도', ref: '제16조①-4' },
    { id: 'fr17', name: '메인롤후프 지지대: 직선 파이프 (벤딩 불가)', ref: '제16조①-5' },
    { id: 'fr18', name: '전방롤후프 지지대: 최상부에서 50mm 이내 부착', ref: '제16조②-4' },
    { id: 'fr19', name: '전방롤후프 지지대: 벌크헤드까지 연장 (드라이버 다리 보호)', ref: '제16조②-3' },
    { id: 'fr20', name: '프레임 주구조물에 검사구멍 외 구멍 없음', ref: '제12조④' },
    { id: 'fr21', name: '드라이버 공간 트러스 구조 확인 (부재 중심선이 한 점에서 교차)', ref: '제12조③' },
    { id: 'fr22', name: '운전석 공간 측정도구 통과 (메인롤후프 수직 하방)', ref: '제12조⑤' },
    { id: 'fr23', name: '운전석 단면 측정도구 통과 (전방롤후프~페달 100mm 후방)', ref: '제12조⑥' },
  ]},
  { cat: '충돌 보호 구조 (벌크헤드/충격완화장치)', icon: '💥', color: '#ff4400', items: [
    { id: 'ia01', name: '벌크헤드: 폐쇄된 형태, 프레임 주구조물에 확실히 부착', ref: '제17조①-2' },
    { id: 'ia02', name: '벌크헤드: 좌우 각각 3개 이상 프레임 부재로 연결', ref: '제17조①-3' },
    { id: 'ia03', name: '벌크헤드 최상부에서 50mm 이내 프레임 부착, 대각선 부재 있음', ref: '제17조①-5' },
    { id: 'ia04', name: '충격완화장치 앞면: 200mm x 100mm 이상 직사각형', ref: '제17조③-1' },
    { id: 'ia05', name: '충격완화장치 앞뒤면 간격: 200mm 이상', ref: '제17조③-3' },
    { id: 'ia06', name: '충격완화장치 재질: 2mm 이상 철제판 또는 4mm 이상 알루미늄판', ref: '제17조③-4' },
    { id: 'ia07', name: '충격완화장치 앞면 앞쪽에 물체 없음 (카울 제외)', ref: '제17조②-2' },
    { id: 'ia08', name: '충격완화장치 변형 없음 (설계의도 외 변형 시 사용 불가)', ref: '제17조③-6' },
    { id: 'ia09', name: '보호 부품 (마스터 실린더, 오일 리저버, 페달 등) 벌크헤드 뒤쪽', ref: '제17조④-1' },
    { id: 'ia10', name: '충격완화장치 내부에 보호 부품 없음', ref: '제17조④-2' },
  ]},
  { cat: '측면 충돌 보호 구조', icon: '🛡️', color: '#4488ff', items: [
    { id: 'si01', name: '좌우 각 3개 이상 파이프로 측면 충돌 보호 구조', ref: '제18조①-1' },
    { id: 'si02', name: '드라이버 착석 시 양쪽에 위치', ref: '제18조①-2' },
    { id: 'si03', name: '상단 부재: 메인/전방 롤 후프 연결, 지면에서 300~350mm', ref: '제18조①-3가' },
    { id: 'si04', name: '대각선 부재: 상단-하단 연결, 메인/전방 롤 후프 연결', ref: '제18조①-3나' },
    { id: 'si05', name: '하단 부재: 메인/전방 롤 후프 최하단 연결', ref: '제18조①-3다' },
  ]},
  { cat: '드라이버 보호 (머리/패딩/노즈)', icon: '🪖', color: '#aa44cc', items: [
    { id: 'dp01', name: '머리충격 흡수패드 장착 (헬멧 뒷부분 중앙과 패드 중앙 일치)', ref: '제19조①' },
    { id: 'dp02', name: '머리충격 흡수패드: 면적 240cm2 이상, 두께 40mm 이상', ref: '제19조②' },
    { id: 'dp03', name: '머리충격 흡수패드: 헬멧에서 25mm 이하 거리, 패드 압축 없음', ref: '제19조②' },
    { id: 'dp04', name: '머리충격 흡수패드 견고하게 부착, 흔들림 없음', ref: '제19조③' },
    { id: 'dp05', name: '헬멧과 닿는 프레임 부위: 최소 10mm 패딩 처리', ref: '제20조' },
    { id: 'dp06', name: '날카로운 부분 없음, 안전 처리 완료', ref: '제21조' },
    { id: 'dp07', name: '차량 바디 노즈 반경 35mm 이상', ref: '제21조' },
  ]},
  { cat: '방화벽 / 바닥판', icon: '🔥', color: '#ff6600', items: [
    { id: 'fw01', name: '방화벽: 1mm 이상 금속판 (수냉각 주변은 비금속 허용)', ref: '제28조①-2' },
    { id: 'fw02', name: '방화벽: 동력/연료/윤활/냉각장치로부터 드라이버 완전 격리', ref: '제28조①-1' },
    { id: 'fw03', name: '방화벽 전선/케이블 통과 구멍 완전 메움, 테이프 연결 금지', ref: '제28조①-3' },
    { id: 'fw04', name: '연료통/연료장치 - 배기시스템 사이 별도 방화벽', ref: '제28조①-4' },
    { id: 'fw05', name: '압력탱크 - 배기장치 사이 별도 방화벽', ref: '제28조①-5' },
    { id: 'fw06', name: '방화벽 시트로 사용 불가 확인', ref: '제28조①-6' },
    { id: 'fw07', name: '연료통이 엔진/배기장치 위에 위치 시 드립팬 설치', ref: '제28조①-7' },
    { id: 'fw08', name: '바닥판: 발~방화벽 연결, 판 간 틈 3mm 이하', ref: '제27조①②' },
    { id: 'fw09', name: '바닥판 볼트/리벳 기계적 결합 (케이블 타이, 와이어, 피스 금지)', ref: '제27조③' },
    { id: 'fw10', name: '드라이버 공간 내 작동 부품 여유 공간 최대 20mm 이하', ref: '제27조④' },
  ]},
  { cat: '비상 정지 시스템 (C-Formula)', icon: '🔴', color: '#cc0000', items: [
    { id: 'es01', name: '주 비상 정지 스위치: 기계적 작동 방식', ref: '제29조①' },
    { id: 'es02', name: '주 비상 정지 스위치 1개 + 보조 비상 정지 스위치 1개', ref: '제29조②' },
    { id: 'es03', name: '주 비상 정지 스위치: 드라이버 오른쪽 어깨 높이, 외부 조작 가능', ref: '제29조③-1,2' },
    { id: 'es04', name: '주 비상 정지 스위치 작동 시 모든 전기-전자장치 전원 차단', ref: '제29조③-3' },
    { id: 'es05', name: '주 비상 정지 스위치: 작동 시 레버 분리 타입', ref: '제29조⑥' },
    { id: 'es06', name: '보조 비상 정지 스위치: 드라이버 조작 용이 위치, 견고하게 부착', ref: '제29조④-1' },
    { id: 'es07', name: '보조 비상 정지 스위치: 제동등 제외 전기-전자장치 전원 차단', ref: '제29조④-2' },
    { id: 'es08', name: '비상 정지 스위치 스티커 부착 (흰색 바탕, 파란 삼각형, 빨간 불꽃)', ref: '제29조⑤' },
  ]},
  { cat: '소화기', icon: '🧯', color: '#ff4400', items: [
    { id: 'fe01', name: 'C-Formula: 1kg 이상 분말 ABC 소화기 최소 2개 준비', ref: '제28조②-1' },
    { id: 'fe02', name: '소화기 유효기간 확인', ref: '제28조②' },
    { id: 'fe03', name: '소화기에 팀명 및 출전번호 부착', ref: '제28조②-3' },
    { id: 'fe04', name: '할론 소화기 미사용 확인', ref: '제28조②-1' },
  ]},
  { cat: '저전압 축전지', icon: '🔋', color: '#888888', items: [
    { id: 'bv01', name: '배터리 차체에 안전하게 고정 (전후/좌우/상하 이동 없음)', ref: '제30조①' },
    { id: 'bv02', name: '배터리 모든 단자 및 +단자 절연 처리', ref: '제30조②' },
    { id: 'bv03', name: '리튬 기반 축전지 사용 시: 난연성 케이스, 방화벽 격리, 보호회로', ref: '제30조③' },
  ]},
  { cat: '파워트레인 (내연기관 CBR600RR)', icon: '⚙️', color: '#ff6600', items: [
    { id: 'pt01', name: '4행정 가솔린 엔진, 배기량 710cc 이하 (CBR600RR: 600cc)', ref: '제31조①-1' },
    { id: 'pt02', name: '흡기 제한 장치(Restrictor) 장착 (300cc 초과: 최대 20mm)', ref: '제31조③-6' },
    { id: 'pt03', name: '흡기 제한 장치 내경 완전한 원형, 스로틀 바디 이후 위치', ref: '제31조③-4' },
    { id: 'pt04', name: '검차 시 스로틀 바디 및 흡기필터 제거 후 검사 준비', ref: '제31조③-4' },
    { id: 'pt05', name: '엔진/변속기 액체 누출 방지 (밀폐 상태 확인)', ref: '제31조⑧-1' },
    { id: 'pt06', name: '캐치캔 장착 (냉각/윤활 각각) - 전체 부피 10% 이상 또는 1L 이상', ref: '제31조⑧-2' },
    { id: 'pt07', name: '캐치캔: 끓는 물 변형 없음, 찌그러짐 없음, 확실히 고정', ref: '제31조⑧-3' },
    { id: 'pt08', name: '캐치캔: 방화벽 뒤, 드라이버 어깨 높이 아래, 케이블 타이/테이프 고정 금지', ref: '제31조⑧-4' },
    { id: 'pt09', name: '냉각수용 캐치캔: 배출 호스 최소 내경 3mm 이상, 프레임 최하단까지', ref: '제31조⑧-5' },
    { id: 'pt10', name: '수냉각 시스템: 순수한 물만 사용 (부동액, 첨가제 금지)', ref: '제31조⑨-2,3' },
    { id: 'pt11', name: '냉각수 호스 연결 및 클램프 상태 양호', ref: '제31조⑨' },
    { id: 'pt12', name: '스타트 모터에 의한 자력 시동만 허용', ref: '제31조⑩' },
    { id: 'pt13', name: '체인/벨트/스프라켓 노출 시 구동장치 보호판 장착', ref: '제31조⑥-1' },
    { id: 'pt14', name: '구동장치 보호판: 2mm 이상 철판, 체인/벨트 폭의 3배 이상 (최소 80mm)', ref: '제31조⑥-4가' },
    { id: 'pt15', name: '구동장치 보호판 볼트: 직경 6mm, 강도 8.8 이상, 체인/벨트와 나란히 고정', ref: '제31조⑥-5' },
    { id: 'pt16', name: '엔진 마운팅 볼트 토크 및 잠금 확인', ref: '제31조' },
    { id: 'pt17', name: '드라이브 샤프트 보호 커버', ref: '제31조⑥' },
  ]},
  { cat: '배기장치', icon: '💨', color: '#888888', items: [
    { id: 'ex01', name: '머플러(배기장치) 장착', ref: '제32조①' },
    { id: 'ex02', name: '배기구: 드라이버 방향 배출 금지', ref: '제32조②-1' },
    { id: 'ex03', name: '배기 파이프 운전석 통과 금지', ref: '제32조②-2' },
    { id: 'ex04', name: '머플러 배기구: 지면에서 600mm 이내 높이', ref: '제32조②-2' },
    { id: 'ex05', name: '머플러 배기구: 뒤축 중심에서 후방 450mm 이내', ref: '제32조②-2' },
    { id: 'ex06', name: '배기구 끝 방향 바닥 향함 금지', ref: '제32조②-3' },
    { id: 'ex07', name: '메인롤후프 앞쪽 배기장치: 차량 바디 옆면 돌출 없음', ref: '제32조②-4' },
    { id: 'ex08', name: '소음: 110dBC 이하', ref: '제32조③-1' },
    { id: 'ex09', name: '소음 측정용 타코미터 장착 (또는 회전수 검출 장비 보유)', ref: '제32조③-3' },
  ]},
  { cat: '연료장치', icon: '⛽', color: '#cc9900', items: [
    { id: 'fl01', name: '조직위원회 인정 연료 사용, 첨가제 금지', ref: '제33조' },
    { id: 'fl02', name: '연료 주입구 주위 부품에 의해 가려지지 않음', ref: '제34조①-2' },
    { id: 'fl03', name: '연료탱크: 프레임 주구조물/메인롤후프 지지대 내측 위치', ref: '제34조②-1' },
    { id: 'fl04', name: '연료탱크 드라이버 공간 내 위치 금지', ref: '제34조②-1' },
    { id: 'fl05', name: '연료탱크: 부시류(고무 등)로 진동 흡수 고정', ref: '제34조②-3' },
    { id: 'fl06', name: '연료주입구: 바디 탈거 없이 주유 및 주유량 확인 가능', ref: '제34조②-2' },
    { id: 'fl07', name: '연료량 확인용 투명호스: 내연료성, 수직 방향 125mm 이상', ref: '제34조③' },
    { id: 'fl08', name: '내연료성 투명호스 증빙자료 제출', ref: '제34조③' },
    { id: 'fl09', name: '차량 45도 기울임 시 연료 누출 없음', ref: '제34조④-2' },
    { id: 'fl10', name: '연료/가스 배출관 체크밸브 장착 (탱크 뒤집혀도 누출 방지)', ref: '제34조④-3' },
    { id: 'fl11', name: '연료라인: 플라스틱 금지, 휘발유용 연료호스 사용', ref: '제34조⑤-1' },
    { id: 'fl12', name: '연료라인 고무 호스 클램프: 360도 감쌈, 너트/볼트 조임', ref: '제34조⑤-2' },
    { id: 'fl13', name: '연료라인: 운전석 통과 금지, 충돌/파손으로부터 보호', ref: '제34조⑤-4' },
    { id: 'fl14', name: '연료레일: 엔진 구조물에 기계적 고정 (호스클램프, 플라스틱 타이, 안전와이어 제외)', ref: '제34조⑥-2' },
    { id: 'fl15', name: '연료 시스템 전체: 메인롤후프 최상단-4개 타이어 바깥 모서리 공간 내 위치', ref: '제34조⑧' },
    { id: 'fl16', name: '연료탱크 및 흡기시스템: 측면 충돌로부터 보호', ref: '제34조⑧' },
  ]},
  { cat: '안전벨트', icon: '🔒', color: '#00cc66', items: [
    { id: 'sb01', name: '6점식 이상 안전벨트 장착', ref: '제23조①-1' },
    { id: 'sb02', name: '안전벨트 공식 인증 (SFI 16.1/16.5 또는 FIA 8853/98, 8853/2016)', ref: '제23조①-5' },
    { id: 'sb03', name: '안전벨트 손상 없음', ref: '제23조①-4' },
    { id: 'sb04', name: '금속-금속 퀵 릴리스 걸쇠 (허리벨트+어깨벨트 공유)', ref: '제23조①-3' },
    { id: 'sb05', name: '벨트: 프레임 주구조물에 부착 (바닥판/등판 볼트 고정 금지)', ref: '제23조②-1,2' },
    { id: 'sb06', name: '벨트 차체 연결부: 두께 2mm, 폭 25mm 이상 철강 브라켓', ref: '제23조②-4' },
    { id: 'sb07', name: '허리/어깨벨트 고정 볼트: 직경 8mm, 강도 8.8 이상', ref: '제23조②-6' },
    { id: 'sb08', name: '강도 8.8 미만 아이볼트 금지', ref: '제23조②-7' },
    { id: 'sb09', name: '안전벨트 고정용 볼트/너트 용접 사용 금지', ref: '제23조②-8' },
    { id: 'sb10', name: '허리벨트: 골반 아래 통과 (복부 통과 금지)', ref: '제23조③-1' },
    { id: 'sb11', name: '허리벨트 각도: 지면과 45도~65도', ref: '제23조③-4' },
    { id: 'sb12', name: '어깨벨트 각도: 어깨 수평선 기준 위 10도~아래 20도 사이', ref: '제23조④-1' },
    { id: 'sb13', name: '어깨벨트 마운트 간격: 180mm~230mm', ref: '제23조④-3' },
    { id: 'sb14', name: '다리사이벨트(Anti-Submarine) 마운트: 허벅지 바깥쪽, 최소 100mm 간격', ref: '제23조⑤-2' },
    { id: 'sb15', name: '5점식 안전벨트 미사용 (금지)', ref: '제23조⑤-3' },
    { id: 'sb16', name: '팔 안전벨트 장착, 안전벨트 풀림장치에 연결', ref: '제23조⑥-1,2' },
    { id: 'sb17', name: '벨트는 방화벽 기준 운전석 쪽에 위치', ref: '제23조②-10' },
  ]},
  { cat: '드라이버 안전 장비', icon: '🏎️', color: '#ff66aa', items: [
    { id: 'dr01', name: '풀페이스 헬멧 착용 (턱/안면 노출 금지, 쉴드 포함)', ref: '제24조①-1' },
    { id: 'dr02', name: '헬멧 인증 규격 확인 (Snell, SFI, FIA 공식 인증)', ref: '제24조①-4' },
    { id: 'dr03', name: '헬멧 착용 시 턱걸이 끈 고정', ref: '제24조①-2' },
    { id: 'dr04', name: '레이싱복: 방염 소재, 긴 팔(손목), 긴 바지(발목) 착용', ref: '제24조②-1' },
    { id: 'dr05', name: '레이싱복 인증: SFI 3.2A/5 이상 또는 FIA 8856-2000 이상', ref: '제24조②-2' },
    { id: 'dr06', name: '방염 장갑 착용 (구멍 있는 장갑 금지)', ref: '제24조③-1' },
    { id: 'dr07', name: '헬멧 쉴드: 충격에 강한 소재, 경기 중 항상 닫힌 상태', ref: '제24조④' },
    { id: 'dr08', name: '방염 신발 착용 (구멍 없음, 끈 외부 미노출)', ref: '제24조⑤-1,2' },
    { id: 'dr09', name: '방염 바라클라바 착용 (공식 인증)', ref: '제24조⑦' },
  ]},
  { cat: '운전석', icon: '💺', color: '#0088cc', items: [
    { id: 'ds01', name: '시트: 드라이버 엉덩이/등/옆구리 접촉 고정 형태', ref: '제25조①-1' },
    { id: 'ds02', name: '시트 등받이 드라이버 어깨 높이까지 연장', ref: '제25조①-2' },
    { id: 'ds03', name: '안전벨트 착용 시 시트 이탈 없음', ref: '제25조②-1' },
    { id: 'ds04', name: '시트 등받이 차체 구조물에 지지, 어깨벨트 착용 시 드라이버 지지 가능', ref: '제25조②-2' },
  ]},
  { cat: '에어로다이나믹스', icon: '🌬️', color: '#33ccff', items: [
    { id: 'ae01', name: '윙 마운팅 구조 견고성 확인', ref: 'AD1.1' },
    { id: 'ae02', name: '윙 엔드플레이트 날카로운 엣지 없음', ref: 'AD1.2' },
    { id: 'ae03', name: '전방 윙 최소 지상고 (75mm)', ref: 'AD2.1' },
    { id: 'ae04', name: '후방 윙 최대 높이 규격 이내', ref: 'AD2.2' },
    { id: 'ae05', name: '공기역학 부품 느슨함 없음', ref: 'AD1.3' },
    { id: 'ae06', name: '언더바디 규격 확인', ref: 'AD3.1' },
  ]},
];

function buildInspection() {
  const cont = document.getElementById('inspection-categories');
  cont.innerHTML = '';
  INSP_DATA.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'insp-category';
    div.innerHTML = `
      <div class="insp-cat-header">
        <div class="insp-cat-name">
          <div class="insp-cat-icon" style="background:${cat.color}22;color:${cat.color}">${cat.icon}</div>
          ${cat.cat}
        </div>
        <div class="insp-cat-stats">
          <span class="cat-pass-rate" id="cat-rate-${slugify(cat.cat)}">0%</span>
          <span style="color:#444">|</span>
          <span class="text-xs text-gray">${cat.items.length}개 항목</span>
          <span class="cat-toggle">▼</span>
        </div>
      </div>
      <div class="insp-items">
        ${cat.items.map(it => `
          <div class="insp-item" id="row-${it.id}">
            <div class="insp-item-name">${it.name}</div>
            <div class="insp-item-ref">${it.ref}</div>
            <div class="insp-controls">
              <button class="insp-btn pass" data-id="${it.id}" data-state="pass">✓ 통과</button>
              <button class="insp-btn fail" data-id="${it.id}" data-state="fail">✗ 미통과</button>
              <button class="insp-btn pending" data-id="${it.id}" data-state="pending">? 확인중</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    div.querySelector('.insp-cat-header').addEventListener('click', function() { toggleCat(this); });
    div.querySelectorAll('.insp-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { setInsp(this.dataset.id, this.dataset.state, this); });
    });
    cont.appendChild(div);
  });
  Object.entries(S.inspection).forEach(([id, state]) => {
    const btns = document.querySelectorAll(`#row-${id} .insp-btn`);
    btns.forEach(b => b.classList.remove('active'));
    const target = document.querySelector(`#row-${id} .insp-btn.${state}`);
    if (target) {
      target.classList.add('active');
      if (state === 'fail') document.getElementById('row-' + id)?.classList.add('fail');
    }
  });
  updateInspStats();
}

function slugify(s) { return s.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_]/g,''); }

function toggleCat(header) {
  header.classList.toggle('collapsed');
  const items = header.nextElementSibling;
  items.style.display = header.classList.contains('collapsed') ? 'none' : '';
}

function setInsp(id, state, btn) {
  const row = document.getElementById('row-' + id);
  row.querySelectorAll('.insp-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  row.classList.remove('fail');
  if (state === 'fail') row.classList.add('fail');
  if (S.inspection[id] === state) {
    delete S.inspection[id];
    btn.classList.remove('active');
    row.classList.remove('fail');
  } else {
    S.inspection[id] = state;
  }
  save('inspection');
  updateInspStats();
}

function updateInspStats() {
  let pass=0, fail=0, pend=0, total=0;
  INSP_DATA.forEach(cat => {
    let catPass=0, catTotal=cat.items.length;
    cat.items.forEach(it => {
      total++;
      const st = S.inspection[it.id];
      if (st==='pass') { pass++; catPass++; }
      else if (st==='fail') fail++;
      else if (st==='pending') pend++;
    });
    const el = document.getElementById('cat-rate-' + slugify(cat.cat));
    if (el) {
      const pct = catTotal ? Math.round(catPass/catTotal*100) : 0;
      el.textContent = pct + '%';
      el.style.color = pct===100 ? '#00cc66' : pct>50 ? '#ffaa00' : '#ff4444';
    }
  });
  const rate = total ? Math.round(pass / total * 100) : 0;
  setText('insp-pass-count', pass);
  setText('insp-fail-count', fail);
  setText('insp-pend-count', pend);
  setText('insp-rate', rate + '%');
  setText('insp-total-sub', `총 ${total}개 항목`);
  setWidth('insp-pass-bar', pass/total*100);
  setWidth('insp-fail-bar', fail/total*100);
  setWidth('insp-pend-bar', pend/total*100);
  setWidth('insp-rate-bar', rate);
}

function renderReport() {
  const compDate = document.getElementById('comp-date')?.value;
  const ddayWrap = document.getElementById('dday-wrap');
  if (compDate && ddayWrap) {
    const diff = Math.ceil((new Date(compDate) - new Date()) / 86400000);
    document.getElementById('dday-num').textContent = diff >= 0 ? 'D-' + diff : 'D+' + Math.abs(diff);
    document.getElementById('dday-lbl').textContent = diff >= 0 ? '대회까지 남은 날' : '대회 종료 후';
    ddayWrap.style.display = 'block';
  } else if (ddayWrap) {
    ddayWrap.style.display = 'none';
  }
  const barsEl = document.getElementById('report-part-bars');
  if (barsEl) {
    barsEl.innerHTML = INSP_DATA.map(cat => {
      const total = cat.items.length;
      const pass = cat.items.filter(it => S.inspection[it.id] === 'pass').length;
      const pct = total ? Math.round(pass / total * 100) : 0;
      const color = pct === 100 ? '#00cc66' : pct >= 60 ? '#ffaa00' : '#ff4444';
      return `<div class="part-bar-wrap">
        <div class="part-bar-label">
          <span style="color:#ddd">${cat.icon} ${cat.cat}</span>
          <span style="color:${color};font-weight:700">${pass}/${total} · ${pct}%</span>
        </div>
        <div class="part-bar-track"><div class="part-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
    }).join('');
  }
  const issuesEl = document.getElementById('report-issues');
  if (issuesEl) {
    const issues = [];
    INSP_DATA.forEach(cat => cat.items.forEach(it => {
      const st = S.inspection[it.id];
      if (st === 'fail' || st === 'pending') issues.push({ ...it, state: st });
    }));
    issuesEl.innerHTML = issues.length === 0
      ? '<div style="color:#00cc66;font-size:13px;text-align:center;padding:16px">✓ 미통과/확인중 항목 없음</div>'
      : issues.map(it => `<div class="issue-item">
          <span class="issue-badge" style="background:${it.state==='fail'?'rgba(255,0,0,0.15)':'rgba(255,170,0,0.15)'};color:${it.state==='fail'?'#ff4444':'#ffaa00'}">${it.state==='fail'?'미통과':'확인중'}</span>
          <span style="flex:1;color:#ddd;font-size:12px">${it.name}</span>
          <span style="color:#555;font-size:10px;font-family:monospace">${it.ref}</span>
        </div>`).join('');
  }
}

function resetInspection() {
  if (!confirm('인스펙션 기록을 모두 초기화할까요?')) return;
  S.inspection = {};
  save('inspection');
  buildInspection();
}

function exportInspectionPDF() {
  const date = new Date().toISOString().slice(0,10);
  const logoSrc = document.querySelector('.header-logo img')?.src || '';

  let totalPass = 0, totalFail = 0, totalPending = 0, totalItems = 0;
  INSP_DATA.forEach(cat => cat.items.forEach(it => {
    totalItems++;
    const st = S.inspection[it.id];
    if (st === 'pass') totalPass++;
    else if (st === 'fail') totalFail++;
    else if (st === 'pending') totalPending++;
  }));
  const passRate = totalItems ? Math.round(totalPass / totalItems * 100) : 0;
  const passColor = passRate === 100 ? '#16a34a' : passRate >= 60 ? '#d97706' : '#dc2626';

  const compDate = document.getElementById('comp-date')?.value || '';
  let ddayHTML = '';
  if (compDate) {
    const diff = Math.ceil((new Date(compDate) - new Date()) / 86400000);
    const ddayText = diff >= 0 ? 'D-' + diff : 'D+' + Math.abs(diff);
    const ddayLabel = diff >= 0 ? '대회까지 남은 날' : '대회 종료 후';
    ddayHTML = `<div class="dday-val">${ddayText}</div><div class="dday-sub">${ddayLabel} &middot; ${compDate}</div>`;
  }

  const partBarsHTML = INSP_DATA.map(cat => {
    const total = cat.items.length;
    const pass = cat.items.filter(it => S.inspection[it.id] === 'pass').length;
    const pct = total ? Math.round(pass / total * 100) : 0;
    const cls = pct === 100 ? 'green' : pct >= 60 ? 'yellow' : 'red';
    return `<div class="bar-row">
      <div class="bar-label"><span class="bar-name">${cat.icon} ${cat.cat}</span><span class="bar-pct ${cls}">${pass}/${total} &middot; ${pct}%</span></div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  const failItems = [], pendingItems = [];
  INSP_DATA.forEach(cat => cat.items.forEach(it => {
    const st = S.inspection[it.id];
    if (st === 'fail') failItems.push({...it});
    else if (st === 'pending') pendingItems.push({...it});
  }));

  const mkRow = (it, cls, label) =>
    `<div class="issue-row ${cls}"><span class="issue-badge">${label}</span><span class="issue-name">${it.name}</span><span class="issue-ref">${it.ref}</span></div>`;

  const failHTML = failItems.length
    ? failItems.map(it => mkRow(it, 'fail', '미통과')).join('')
    : '<p class="none-msg green">미통과 항목 없음 ✓</p>';

  const pendingHTML = pendingItems.length
    ? pendingItems.map(it => mkRow(it, 'pending', '확인중')).join('')
    : '<p class="none-msg green">확인중 항목 없음 ✓</p>';

  const doc = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>JUST 인스펙션 보고서 ${date}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#fff;color:#111;font-family:Arial,sans-serif;padding:20mm 15mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{margin:15mm;size:A4}
@media print{body{padding:0}}
.header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #dc2626;padding-bottom:14px;margin-bottom:20px}
.header-left{display:flex;align-items:center;gap:14px}
.logo{height:46px;object-fit:contain}
.title-sub{font-size:9px;color:#dc2626;font-weight:700;letter-spacing:3px;text-transform:uppercase}
.title-main{font-size:18px;font-weight:800;color:#111}
.header-right{text-align:right}
.date-lbl{font-size:11px;color:#6b7280}
.date-val{font-weight:700;color:#111}
.dday-val{font-size:26px;font-weight:900;color:#dc2626;line-height:1.1;margin-top:6px}
.dday-sub{font-size:10px;color:#6b7280;margin-top:2px}
.rate-box{text-align:center;padding:20px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:20px}
.rate-lbl{font-size:10px;color:#6b7280;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.rate-num{font-size:60px;font-weight:900;line-height:1}
.rate-summary{display:flex;justify-content:center;gap:28px;margin-top:14px}
.sum-item{text-align:center}
.sum-val{font-size:22px;font-weight:800}
.sum-lbl{font-size:10px;color:#6b7280}
.green{color:#16a34a}.red{color:#dc2626}.yellow{color:#d97706}.gray{color:#9ca3af}
.section-title{font-size:12px;font-weight:700;margin-bottom:10px;padding-left:9px;border-left:4px solid #dc2626;letter-spacing:.5px;color:#111}
.section-title.red-t{border-color:#dc2626;color:#dc2626}
.section-title.yellow-t{border-color:#d97706;color:#d97706}
.bar-row{margin-bottom:9px}
.bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px}
.bar-name{color:#374151}
.bar-pct{font-weight:700}
.bar-track{height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden}
.bar-fill{height:100%;border-radius:4px}
.bar-fill.green{background:#16a34a}.bar-fill.yellow{background:#d97706}.bar-fill.red{background:#dc2626}
.part-section{margin-bottom:20px}
.issues-section{margin-bottom:16px}
.issue-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:0 4px 4px 0;margin-bottom:5px;font-size:12px}
.issue-row.fail{background:#fef2f2;border-left:3px solid #dc2626}
.issue-row.pending{background:#fffbeb;border-left:3px solid #d97706}
.issue-badge{font-weight:700;white-space:nowrap;min-width:38px}
.issue-row.fail .issue-badge{color:#dc2626}
.issue-row.pending .issue-badge{color:#d97706}
.issue-name{flex:1;color:#111}
.issue-ref{color:#9ca3af;font-size:10px;font-family:monospace;white-space:nowrap}
.none-msg{font-size:12px;margin:4px 0}
.footer{border-top:1px solid #e5e7eb;padding-top:10px;text-align:center;margin-top:28px}
.footer p{font-size:10px;color:#9ca3af}
</style>
</head>
<body>
<div class="header">
  <div class="header-left">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div>
      <div class="title-sub">JUST FSAE</div>
      <div class="title-main">인스펙션 체크리스트 보고서</div>
    </div>
  </div>
  <div class="header-right">
    <div class="date-lbl">작성일: <span class="date-val">${date}</span></div>
    ${ddayHTML}
  </div>
</div>
<div class="rate-box">
  <div class="rate-lbl">전체 통과율</div>
  <div class="rate-num" style="color:${passColor}">${passRate}%</div>
  <div class="rate-summary">
    <div class="sum-item"><div class="sum-val green">${totalPass}</div><div class="sum-lbl">통과</div></div>
    <div class="sum-item"><div class="sum-val red">${totalFail}</div><div class="sum-lbl">미통과</div></div>
    <div class="sum-item"><div class="sum-val yellow">${totalPending}</div><div class="sum-lbl">확인중</div></div>
    <div class="sum-item"><div class="sum-val gray">${totalItems - totalPass - totalFail - totalPending}</div><div class="sum-lbl">미확인</div></div>
  </div>
</div>
<div class="part-section">
  <div class="section-title">파트별 통과율</div>
  ${partBarsHTML}
</div>
<div class="issues-section">
  <div class="section-title red-t">미통과 항목 (${failItems.length})</div>
  ${failHTML}
</div>
<div class="issues-section">
  <div class="section-title yellow-t">확인중 항목 (${pendingItems.length})</div>
  ${pendingHTML}
</div>
<div class="footer"><p>본 보고서는 JUST FSAE팀 내부 점검용입니다</p></div>
<script>window.addEventListener('load', function(){ window.print(); });<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.open();
  win.document.write(doc);
  win.document.close();
}

function exportInspection() {
  let csv = '항목ID,카테고리,항목명,참조규정,상태\n';
  INSP_DATA.forEach(cat => {
    cat.items.forEach(it => {
      const st = S.inspection[it.id] || '미확인';
      csv += `${it.id},${cat.cat},"${it.name}",${it.ref},${st}\n`;
    });
  });
  const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'JUST_Inspection_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}
