// Source: Formula Student Korea 2026 (2025-12-18), C-Formula and common rules.
const INSP_DATA = [
  { cat: "차체 일반 규정", icon: "📐", color: "#9966cc", items: [
    {"id":"vc01","name":"휠베이스 최소 1,500mm 이상","ref":"제4조①"},
    {"id":"vc02","name":"타이어 외 차량 부분 지면 미접촉 (최저 지상고 확인)","ref":"제4조②"},
    {"id":"vc03","name":"좁은 트레드 폭 ≥ 넓은 트레드 폭의 75% 이상","ref":"제5조"},
    {"id":"vc04","name":"드라이버 좌우 시야 합계 200도 이상 (거울 포함)","ref":"제25조③"},
    {"id":"vc05","name":"드라이버 5초 이내 측면 탈출 가능","ref":"제26조①"},
    {"id":"vc06","name":"1인승·4바퀴 이상, 운전석과 휠이 개방된 포뮬러 형상","ref":"제3조①","page":1},
    {"id":"vc07","name":"외장: 벌크헤드부터 방화벽 또는 메인 롤 후프까지 운전석 외 개방 공간 없음","ref":"제3조②","page":1},
    {"id":"vc08","name":"동일 프레임 참가 기간 2년 이내, 대학생 직접 설계·제작","ref":"제3조③~⑤","page":1},
    {"id":"vc09","name":"모든 드라이버: 완전 착석·조향휠 파지·안전장비 착용에서 양발 착지까지 5초 이내","ref":"제26조①②","page":22},
  ]},
  { cat: "휠 / 타이어", icon: "🔩", color: "#ffaa00", items: [
    {"id":"wt01","name":"단일 고정너트 사용 시 풀림 방지 장치 (이중너트 불인정)","ref":"제6조①","condition":"단일 고정너트 휠 사용 시"},
    {"id":"wt02","name":"휠 볼트/너트 98Nm 이상 토크로 체결 가능","ref":"제6조②"},
    {"id":"wt03","name":"알루미늄 휠너트 사용 시 경질 애노다이징 처리, 변형 없음","ref":"제6조③","condition":"알루미늄 휠너트 사용 시"},
    {"id":"wt04","name":"타이어 트레드 패턴: 제조사 제작 또는 공인 개조만 허용","ref":"제7조①"},
    {"id":"wt05","name":"레인타이어 사용 시 트레드 깊이 최소 2.4mm 이상","ref":"제7조③-2"},
    {"id":"wt06","name":"타이어 공기압 규격 이내","ref":"팀 자체 점검","internal":true},
    {"id":"wt07","name":"비일반 패턴 레인타이어: 검차 요구 시 패턴 증빙자료 준비","ref":"제7조②","page":2,"condition":"비일반 패턴 레인타이어 사용 시"},
    {"id":"wt08","name":"검차 후 타이어·휠 사이즈/타입 변경 금지, 타이어워머 사용 금지","ref":"제7조④","page":2},
  ]},
  { cat: "현가장치", icon: "🔧", color: "#ffbb44", items: [
    {"id":"su01","name":"4바퀴 모두 쇽업소버 포함 현가장치 장착","ref":"제8조①"},
    {"id":"su02","name":"드라이버 탑승 시 바퀴 움직임 ≥ 50mm (상/하 각 25mm)","ref":"제8조①"},
    {"id":"su03","name":"현가장치 작동 범위 내 상호 간섭 없음","ref":"제8조①"},
    {"id":"su04","name":"모든 현가장치 고정부 외부 노출 또는 검차 확인 가능","ref":"제8조②"},
    {"id":"su05","name":"서스펜션 마운팅 볼트 전 잠금 확인","ref":"팀 자체 점검","internal":true},
    {"id":"su06","name":"서스펜션 암 균열/손상 없음","ref":"팀 자체 점검","internal":true},
    {"id":"su07","name":"허브 베어링 유격 허용치 이내","ref":"팀 자체 점검","internal":true},
    {"id":"su08","name":"잭 포인트 구조물 확인","ref":"팀 자체 점검","internal":true},
  ]},
  { cat: "조향장치", icon: "🎡", color: "#00aaff", items: [
    {"id":"st01","name":"조향 제한장치 장착 (타이어가 현가장치/바디/프레임에 닿지 않음)","ref":"제9조①"},
    {"id":"st02","name":"조향휠 유격: 회전방향 7도 이하, 축방향 10mm 이하","ref":"제9조②"},
    {"id":"st03","name":"퀵릴리즈 조향휠 - 장갑 낀 상태에서 분리 가능","ref":"제9조③"},
    {"id":"st04","name":"조향휠 형태: 폐곡선 형태 (H자, 단절 형태 금지)","ref":"제9조④"},
    {"id":"st05","name":"조향휠 위치: 어떠한 조향각에서도 전방 롤 후프 최상단부 아래","ref":"제9조⑤"},
    {"id":"st06","name":"스티어링 랙 고정 마운트 확인","ref":"팀 자체 점검","internal":true},
    {"id":"st07","name":"타이로드 잠금 너트 체결 확인","ref":"팀 자체 점검","internal":true},
    {"id":"st08","name":"모든 조향각에서 조향휠 잡은 손이 전방/메인 롤 후프 최상단 기준선 안","ref":"제9조⑤·그림7","page":8},
  ]},
  { cat: "제동장치", icon: "🛑", color: "#ff0000", items: [
    {"id":"br01","name":"단일 페달로 4륜 모두 작동하는 제동장치","ref":"제10조①"},
    {"id":"br02","name":"2개 독립적 유압 회로 (각각 분리된 오일 저장 용기)","ref":"제10조②"},
    {"id":"br03","name":"제동장치 추돌/파편으로부터 보호","ref":"제10조④"},
    {"id":"br04","name":"보호 없는 플라스틱 브레이크 라인 미사용","ref":"제10조⑤"},
    {"id":"br05","name":"전자식 제동장치 (Brake by wire) 미사용","ref":"제10조⑥"},
    {"id":"br06","name":"BOTS 장착 - 페달 과다 이동 시 엔진 정지 가능","ref":"제10조⑦-1"},
    {"id":"br07","name":"BOTS 작동 시 제동등 제외 전기-전자장치 전원 차단","ref":"제10조⑦-2"},
    {"id":"br08","name":"BOTS 작동 후 페달 놓거나 다시 밟아도 엔진 재시동 불가","ref":"제10조⑦-3"},
    {"id":"br09","name":"BOTS 정상 작동 확인 사진자료 제출","ref":"제10조⑦-4"},
    {"id":"br10","name":"제동등 장착 - 면적 15cm2 이상","ref":"제10조⑨-2"},
    {"id":"br11","name":"제동등: 뒤에서 본 차량 중심선 위, 드라이버 어깨선과 후륜 축 사이","ref":"제10조⑨-1","review":"2026-09-C"},
    {"id":"br12","name":"제동등 LED: 150mm x 30mm 이상, 100mm2당 1개 이상 LED","ref":"제10조⑨-2"},
    {"id":"br13","name":"주 비상정지 스위치를 제외한 전원스위치가 OFF여도 제동등 작동","ref":"제10조⑨-3","review":"2026-09-C"},
    {"id":"br14","name":"제동등 점멸 없음, 제동 스위치로만 작동","ref":"제10조⑨-4"},
    {"id":"br15","name":"어떠한 부품도 제동등을 가리지 않음","ref":"제10조⑨-5"},
    {"id":"br16","name":"마스터 실린더 보호 가드","ref":"팀 자체 점검","internal":true},
    {"id":"br17","name":"브레이크 패드: 제조사 교환 한계와 마모 상태 확인 (팀 자체 점검)","ref":"팀 자체 점검","internal":true},
    {"id":"br18","name":"브레이크 바이어스 조정 잠금 확인","ref":"팀 자체 점검","internal":true},
    {"id":"br19","name":"한 유압회로 누출·고장 시 나머지 회로로 최소 2륜 제동","ref":"제10조②","page":2},
    {"id":"br20","name":"구동축 제동장치 1개 사용은 LSD 또는 라이브액슬 조건에서만 허용","ref":"제10조③","page":2,"condition":"구동축 제동장치 1개 사용 시"},
    {"id":"br21","name":"제동등은 태양빛 아래에서도 상태 식별 가능","ref":"제10조⑨-1","page":3},
  ]},
  { cat: "잭 지지점", icon: "🔼", color: "#ff9900", items: [
    {"id":"jk01","name":"퀵잭 바퀴 장착, 이동 시 차량-지면 미접촉","ref":"제11조①"},
    {"id":"jk02","name":"잭 지지점 차량 후면 위치","ref":"제11조②"},
    {"id":"jk03","name":"잭 지지점: 알루미늄/강철, 바깥지름 25mm 원형 파이프","ref":"제11조②-2"},
    {"id":"jk04","name":"잭 지지점 파이프 길이 최소 280mm 이상 (장애물 없음)","ref":"제11조②-3"},
    {"id":"jk05","name":"잭 지지부 오렌지색 도색","ref":"제11조②-4"},
    {"id":"jk06","name":"잭 지지점 높이: 지면으로부터 75mm~100mm","ref":"제11조③-1"},
    {"id":"jk07","name":"잭 지지점 높이 200mm 시 바퀴 지면 미접촉","ref":"제11조③-2"},
    {"id":"jk08","name":"잭 지지점: 차량 중심선에서 수평·수직 방향으로 장착, 들어 올린 상태에서 안정","ref":"제11조②-1","page":4},
    {"id":"jk09","name":"퀵 잭과 푸시바 지참, 이동 시 푸시바 사용·패독 정비 시 퀵 잭 사용","ref":"제77조①②","page":61},
  ]},
  { cat: "프레임 / 롤 후프", icon: "🏗️", color: "#cc66ff", items: [
    {"id":"fr01","name":"기본 철강: 탄소 0.1% 이상, 항복강도 305MPa·인장강도 365MPa 초과","ref":"제14조①-2","review":"2026-09-C"},
    {"id":"fr02","name":"메인/전방 롤 후프 및 어깨벨트 마운트: 원형 25mm × 1.8mm 이상","ref":"제14조① 표","review":"2026-09-C"},
    {"id":"fr03","name":"측면/전방 충격 구조, 롤 후프 지지대: 25mm x 1.6mm 이상","ref":"제14조①"},
    {"id":"fr04","name":"나머지 프레임: 20mm x 1.2mm 이상 (또는 25x25x1.6mm 각형)","ref":"제14조①"},
    {"id":"fr05","name":"재료 증빙자료 (성분표, 시험성적서) 제출","ref":"제14조①-3"},
    {"id":"fr06","name":"최장신 및 상위 95% 모델: 헬멧과 롤 후프/지지대 기준 연장선 간격 50mm 이상","ref":"제15조①-1","review":"2026-09-C"},
    {"id":"fr07","name":"파이프 벤딩 중심선 반경: 파이프 외경의 3배 초과","ref":"제15조①-2","review":"2026-09-C"},
    {"id":"fr08","name":"벤딩 주름 없음, 벤딩 후 외경 감소 15% 미만","ref":"제15조①-3"},
    {"id":"fr09","name":"메인/전방 롤 후프 직선부 검사구멍 (직경 5mm) 장착","ref":"제15조①-5"},
    {"id":"fr10","name":"메인롤후프: 단일 연속 파이프, 좌우 바닥프레임 연결","ref":"제15조②-2"},
    {"id":"fr11","name":"메인롤후프 기울기: 수직축에서 전/후 10도 이내","ref":"제15조②-4"},
    {"id":"fr12","name":"메인롤후프 폭: 좌우 안쪽 380mm 이상","ref":"제15조②-5"},
    {"id":"fr13","name":"전방롤후프: 단일 연속 파이프, 좌우 바닥프레임 연결","ref":"제15조③-2"},
    {"id":"fr14","name":"메인/전방 롤 후프: 복합소재 사용 불가","ref":"제15조②-3"},
    {"id":"fr15","name":"메인롤후프 지지대: 2개 이상 원형파이프, 좌우 양쪽 지지","ref":"제16조①-2"},
    {"id":"fr16","name":"메인롤후프 지지대: 최상부에서 160mm 이내, 30도 이상 각도","ref":"제16조①-4"},
    {"id":"fr17","name":"메인롤후프 지지대: 직선 파이프 (벤딩 불가)","ref":"제16조①-5"},
    {"id":"fr18","name":"전방롤후프 지지대: 최상부에서 50mm 이내 부착","ref":"제16조②-4"},
    {"id":"fr19","name":"전방 롤 후프 지지대: 양쪽 원형파이프 2개 이상, 벌크헤드까지 연장, 벤딩 금지","ref":"제16조②-2,3","review":"2026-09-C"},
    {"id":"fr20","name":"프레임 주구조물에 검사구멍 외 구멍 없음","ref":"제12조④"},
    {"id":"fr21","name":"드라이버 공간 트러스 구조 확인 (부재 중심선이 한 점에서 교차)","ref":"제12조③"},
    {"id":"fr22","name":"운전석 공간 측정도구 통과 (메인롤후프 수직 하방)","ref":"제12조⑤"},
    {"id":"fr23","name":"운전석 단면 측정도구 통과 (전방롤후프~페달 100mm 후방)","ref":"제12조⑥"},
    {"id":"fr24","name":"SEF: 조직위원회 지정 기한 제출, 재질증명자료 첨부·대체 재료 증명은 출력물 준비","ref":"제13조·별표1","page":63},
    {"id":"fr25","name":"상위 95% 모델: 시트 최후방·페달 최전방, 하단 200mm 원 중심~페달 915mm 이상 등 그림8 확인","ref":"제15조①-1가·그림8","page":7},
    {"id":"fr26","name":"운전석 단면 검사: 조절식 페달은 최전방 위치에서 측정","ref":"제12조⑥","page":6},
    {"id":"fr27","name":"메인 롤 후프 기울어진 방향에 지지대 배치","ref":"제16조①-3","page":10},
    {"id":"fr28","name":"전방 롤 후프 후방 기울기 10° 이상이면 후방 추가 지지대 설치","ref":"제16조②-5","page":11,"condition":"전방 롤 후프가 후방으로 10° 이상 기울어진 경우"},
    {"id":"fr29","name":"주구조물에 바닥판·방화벽·부품을 장착할 때 별도 브래킷 사용","ref":"제12조④","page":5},
  ]},
  { cat: "충돌 보호 구조 (벌크헤드/충격완화장치)", icon: "💥", color: "#ff4400", items: [
    {"id":"ia01","name":"벌크헤드: 폐쇄된 형태, 프레임 주구조물에 확실히 부착","ref":"제17조①-2"},
    {"id":"ia02","name":"벌크헤드: 좌우 각각 3개 이상 프레임 부재로 연결","ref":"제17조①-3"},
    {"id":"ia03","name":"벌크헤드 최상부에서 50mm 이내 프레임 부착, 대각선 부재 있음","ref":"제17조①-5"},
    {"id":"ia04","name":"충격완화장치 앞면: 200mm x 100mm 이상 직사각형","ref":"제17조③-1","condition":"제17조③ 예시 규격 장치 사용 시"},
    {"id":"ia05","name":"충격완화장치 앞뒤면 간격: 200mm 이상","ref":"제17조③-3","condition":"제17조③ 예시 규격 장치 사용 시"},
    {"id":"ia06","name":"충격완화장치 재질: 2mm 이상 철제판 또는 4mm 이상 알루미늄판","ref":"제17조③-4","condition":"제17조③ 예시 규격 장치 사용 시"},
    {"id":"ia07","name":"충격완화장치 앞면 앞쪽에 물체 없음 (카울 제외)","ref":"제17조②-2"},
    {"id":"ia08","name":"충격완화장치 변형 없음 (설계의도 외 변형 시 사용 불가)","ref":"제17조③-6"},
    {"id":"ia09","name":"보호 부품 (마스터 실린더, 오일 리저버, 페달 등) 벌크헤드 뒤쪽","ref":"제17조④-1"},
    {"id":"ia10","name":"충격완화장치 내부에 보호 부품 없음","ref":"제17조④-2"},
    {"id":"ia11","name":"비표준 충격완화장치: 3000N 차량·7m/s, 평균 20g 이하·최대 40g 이하·흡수에너지 7350J 초과 증명","ref":"제17조②-1","page":12,"condition":"제17조③-1~5의 예시 규격을 모두 충족하지 않는 장치"},
    {"id":"ia12","name":"충격완화장치 시험/해석: 개최년 포함 3년 이내 자료, SEF 첨부 (예시 규격 충족 시 증빙 면제)","ref":"제17조②-1","page":13,"condition":"충격완화장치 성능 증빙이 필요한 경우"},
    {"id":"ia13","name":"예시 규격 장치 뒷면이 벌크헤드보다 작으면 벌크헤드를 철판 2mm 또는 알루미늄 4mm로 막음","ref":"제17조③-2","page":13,"condition":"예시 규격 장치의 뒷면이 벌크헤드 앞면보다 작은 경우"},
    {"id":"ia14","name":"예시 규격 충격완화장치: 각 모서리 이음새 용접 등 연결","ref":"제17조③-5","page":13,"condition":"제17조③ 예시 규격 장치 사용 시"},
    {"id":"ia15","name":"벌크헤드 검사: 조절식 페달은 최전방 위치","ref":"제17조①-4","page":12},
  ]},
  { cat: "측면 충돌 보호 구조", icon: "🛡️", color: "#4488ff", items: [
    {"id":"si01","name":"좌우 각 3개 이상 파이프로 측면 충돌 보호 구조","ref":"제18조①-1"},
    {"id":"si02","name":"드라이버 착석 시 양쪽에 위치","ref":"제18조①-2"},
    {"id":"si03","name":"상단 부재: 메인/전방 롤 후프 연결, 지면에서 300~350mm","ref":"제18조①-3가"},
    {"id":"si04","name":"대각선 부재: 상단-하단 연결, 메인/전방 롤 후프 연결","ref":"제18조①-3나"},
    {"id":"si05","name":"하단 부재: 메인/전방 롤 후프 최하단 연결","ref":"제18조①-3다"},
    {"id":"si06","name":"측면 하단 부재: 벤딩 가능, 절단 후 용접 연결 금지; 대체 강도 증빙 조건 확인","ref":"제18조①-3다","page":14},
  ]},
  { cat: "드라이버 보호 (머리/패딩/노즈)", icon: "🪖", color: "#aa44cc", items: [
    {"id":"dp01","name":"머리충격 흡수패드 장착 (헬멧 뒷부분 중앙과 패드 중앙 일치)","ref":"제19조①"},
    {"id":"dp02","name":"머리충격 흡수패드: 면적 240cm2 이상, 두께 40mm 이상","ref":"제19조②"},
    {"id":"dp03","name":"머리충격 흡수패드: 헬멧에서 25mm 이하 거리, 패드 압축 없음","ref":"제19조②"},
    {"id":"dp04","name":"머리충격 흡수패드 견고하게 부착, 흔들림 없음","ref":"제19조③"},
    {"id":"dp05","name":"헬멧과 닿는 프레임 부위: 최소 10mm 패딩 처리","ref":"제20조"},
    {"id":"dp06","name":"날카로운 부분 없음, 안전 처리 완료","ref":"제21조"},
    {"id":"dp07","name":"차량 바디 노즈 반경 35mm 이상","ref":"제21조"},
  ]},
  { cat: "방화벽 / 바닥판", icon: "🔥", color: "#ff6600", items: [
    {"id":"fw01","name":"방화벽: 금속판 1mm 이상; 수냉각 주변만 끓는 물에 변형되지 않는 비금속 허용","ref":"제28조①-2","review":"2026-09-C"},
    {"id":"fw02","name":"방화벽: 동력·연료·윤활·냉각장치 및 축전지로부터 드라이버 완전 격리","ref":"제28조①-1","review":"2026-09-C"},
    {"id":"fw03","name":"방화벽 전선/케이블 통과 구멍 완전 메움, 테이프 연결 금지","ref":"제28조①-3"},
    {"id":"fw04","name":"연료통/연료장치 - 배기시스템 사이 별도 방화벽","ref":"제28조①-4","condition":"연료장치와 배기장치가 있는 경우"},
    {"id":"fw05","name":"압력탱크 - 배기장치 사이 별도 방화벽","ref":"제28조①-5","condition":"압력탱크 사용 시"},
    {"id":"fw06","name":"방화벽 시트로 사용 불가 확인","ref":"제28조①-6"},
    {"id":"fw07","name":"연료통이 엔진/배기장치 위에 위치 시 드립팬 설치","ref":"제28조①-7","condition":"연료통이 엔진 또는 배기장치 위에 있는 경우"},
    {"id":"fw08","name":"바닥판: 발~방화벽 연결, 판 간 틈 3mm 이하","ref":"제27조①②"},
    {"id":"fw09","name":"바닥판 볼트/리벳 기계적 결합 (케이블 타이, 와이어, 피스 금지)","ref":"제27조③"},
    {"id":"fw10","name":"드라이버 공간 내 작동 부품 여유 공간 최대 20mm 이하","ref":"제27조④"},
  ]},
  { cat: "비상 정지 시스템 (C-Formula)", icon: "🔴", color: "#cc0000", items: [
    {"id":"es01","name":"주 비상 정지 스위치: 기계적 작동 방식","ref":"제29조①"},
    {"id":"es02","name":"주 비상 정지 스위치 1개 + 보조 비상 정지 스위치 1개","ref":"제29조②"},
    {"id":"es03","name":"주 비상 정지 스위치: 드라이버 오른쪽 어깨 높이, 외부 조작 가능","ref":"제29조③-1,2"},
    {"id":"es04","name":"주 비상 정지 스위치 작동 시 모든 전기-전자장치 전원 차단","ref":"제29조③-3"},
    {"id":"es05","name":"주 비상 정지 스위치: 작동 시 레버 분리 타입","ref":"제29조⑥"},
    {"id":"es06","name":"보조 비상 정지 스위치: 드라이버 조작 용이 위치, 견고하게 부착","ref":"제29조④-1"},
    {"id":"es07","name":"보조 비상 정지 스위치: 제동등 제외 전기-전자장치 전원 차단","ref":"제29조④-2"},
    {"id":"es08","name":"비상정지 스티커: 25 × 45mm 이상 흰 바탕, 파란 삼각형·빨간 불꽃, 스위치 근처","ref":"제29조⑤","review":"2026-09-C"},
  ]},
  { cat: "소화기", icon: "🧯", color: "#ff4400", items: [
    {"id":"fe01","name":"C-Formula: 1kg 이상 분말 ABC 소화기 최소 2개 준비","ref":"제28조②-1"},
    {"id":"fe02","name":"소화기 유효기간 확인","ref":"팀 자체 점검","internal":true},
    {"id":"fe03","name":"소화기에 팀명 및 출전번호 부착","ref":"제28조②-3"},
    {"id":"fe04","name":"할론 소화기 미사용 확인","ref":"제28조②-1"},
    {"id":"fe05","name":"소화기: 패독 1개·이동 시 동행 1개, 정비·세팅 시 차량 앞뒤 대각선에 2개 이상 배치","ref":"제28조②-2","page":23},
  ]},
  { cat: "저전압 축전지", icon: "🔋", color: "#888888", items: [
    {"id":"bv01","name":"저전압 축전지: 프레임 내부에 고정, 충격·진동에 모든 방향 이동 방지","ref":"제30조①","review":"2026-09-C"},
    {"id":"bv02","name":"배터리 모든 단자 및 +단자 절연 처리","ref":"제30조②"},
    {"id":"bv03","name":"리튬 저전압 축전지: 난연 케이스·방화벽 격리·보호회로 (국내 정식 상용품은 케이스/회로 인정)","ref":"제30조③","review":"2026-09-C","condition":"리튬 기반 저전압 축전지 사용 시"},
  ]},
  { cat: "파워트레인 (내연기관 CBR600RR)", icon: "⚙️", color: "#ff6600", items: [
    {"id":"pt01","name":"4행정 가솔린 엔진, 배기량 710cc 이하 (CBR600RR: 600cc)","ref":"제31조①-1"},
    {"id":"pt02","name":"흡기 제한 장치(Restrictor) 장착 (300cc 초과: 최대 20mm)","ref":"제31조③-6"},
    {"id":"pt03","name":"흡기 제한 장치 내경 완전한 원형, 스로틀 바디 이후 위치","ref":"제31조③-4"},
    {"id":"pt04","name":"검차 시 스로틀 바디 및 흡기필터 제거 후 검사 준비","ref":"제31조③-4"},
    {"id":"pt05","name":"엔진/변속기 액체 누출 방지 (밀폐 상태 확인)","ref":"제31조⑧-1"},
    {"id":"pt06","name":"캐치캔 장착 (냉각/윤활 각각) - 전체 부피 10% 이상 또는 1L 이상","ref":"제31조⑧-2"},
    {"id":"pt07","name":"캐치캔: 끓는 물 변형 없음, 찌그러짐 없음, 확실히 고정","ref":"제31조⑧-3"},
    {"id":"pt08","name":"캐치캔: 방화벽 뒤, 드라이버 어깨 높이 아래, 케이블 타이/테이프 고정 금지","ref":"제31조⑧-4"},
    {"id":"pt09","name":"냉각수용 캐치캔: 배출 호스 최소 내경 3mm 이상, 프레임 최하단까지","ref":"제31조⑧-5"},
    {"id":"pt10","name":"수냉각 시스템: 순수한 물만 사용 (부동액, 첨가제 금지)","ref":"제31조⑨-2,3"},
    {"id":"pt11","name":"냉각수 호스 연결 및 클램프 상태 양호","ref":"팀 자체 점검","internal":true},
    {"id":"pt12","name":"스타트 모터에 의한 자력 시동만 허용","ref":"제31조⑩"},
    {"id":"pt13","name":"체인/벨트/스프라켓 노출 시 구동장치 보호판 장착","ref":"제31조⑥-1"},
    {"id":"pt14","name":"구동장치 보호판: 2mm 이상 철판, 체인/벨트 폭의 3배 이상 (최소 80mm)","ref":"제31조⑥-4가"},
    {"id":"pt15","name":"구동장치 보호판 볼트: 직경 6mm, 강도 8.8 이상, 체인/벨트와 나란히 고정","ref":"제31조⑥-5"},
    {"id":"pt16","name":"엔진 마운팅 볼트 토크 및 잠금 확인","ref":"팀 자체 점검","internal":true},
    {"id":"pt17","name":"드라이브 샤프트 보호 커버","ref":"팀 자체 점검","internal":true},
    {"id":"pt18","name":"흡배기 등 내연기관 요소 개조는 조직위원회에 신고","ref":"제31조②-1","page":24},
    {"id":"pt19","name":"모든 흡입구는 한 구멍 통과, 단일 스로틀바디 (한국산 자연흡기 예외 확인)","ref":"제31조③-1~3","page":24},
    {"id":"pt20","name":"과급기 사용 시 리스트릭터는 과급기 앞; 300cc 이하 23mm·초과 20mm 상한","ref":"제31조③-5~7","page":25,"condition":"과급기 사용 시"},
    {"id":"pt21","name":"구동 보호판: 구멍 없는 재료, 체인 중심 정렬, 최하단 수평선 아래까지·드라이버 방향 개방 없음","ref":"제31조⑥-2,4나","page":26},
    {"id":"pt22","name":"노출 팬/프로펠러: 손가락 보호망 또는 신체 접촉이 불가능한 배치 등 허용 조건 확인","ref":"제31조⑥-3","page":26,"condition":"노출 팬 또는 프로펠러 사용 시"},
    {"id":"pt23","name":"수냉각 구성품은 냉각수 최고 온도와 압력을 견딤","ref":"제31조⑨-1","page":27},
    {"id":"pt24","name":"기화기 또는 스로틀바디 장착, 전자식 제어 사용 시 제36조 준수","ref":"제35조①②","page":31},
  ]},
  { cat: "배기장치", icon: "💨", color: "#888888", items: [
    {"id":"ex01","name":"머플러(배기장치) 장착","ref":"제32조①"},
    {"id":"ex02","name":"배기구: 드라이버 방향 배출 금지","ref":"제32조②-1"},
    {"id":"ex03","name":"배기 파이프 운전석 통과 금지","ref":"제32조②-2"},
    {"id":"ex04","name":"머플러 배기구: 지면에서 600mm 이내 높이","ref":"제32조②-2"},
    {"id":"ex05","name":"머플러 배기구: 뒤축 중심에서 후방 450mm 이내","ref":"제32조②-2"},
    {"id":"ex06","name":"배기구 끝 방향 바닥 향함 금지","ref":"제32조②-3"},
    {"id":"ex07","name":"메인롤후프 앞쪽 배기장치: 차량 바디 옆면 돌출 없음","ref":"제32조②-4"},
    {"id":"ex08","name":"소음: 110dBC 이하","ref":"제32조③-1"},
    {"id":"ex09","name":"소음 측정용 타코미터 장착 (또는 회전수 검출 장비 보유)","ref":"제32조③-3"},
    {"id":"ex10","name":"소음 검차: 배기구에서 0.5m·45°·수평 측정, 다중 배기구는 최대값 사용","ref":"제32조③-4,5","page":27},
    {"id":"ex11","name":"소음 검차 회전수: 중립, 910m/min(범용 730) ÷ (2 × 행정mm) × 1000, 500rpm 단위 반올림","ref":"제32조③-6","page":27},
  ]},
  { cat: "연료장치", icon: "⛽", color: "#cc9900", items: [
    {"id":"fl01","name":"조직위원회 인정 연료 사용, 첨가제 금지","ref":"제33조"},
    {"id":"fl02","name":"연료 주입구 주위 부품에 의해 가려지지 않음","ref":"제34조①-2"},
    {"id":"fl03","name":"연료탱크: 프레임 주구조물/메인롤후프 지지대 내측 위치","ref":"제34조②-1"},
    {"id":"fl04","name":"연료탱크 드라이버 공간 내 위치 금지","ref":"제34조②-1"},
    {"id":"fl05","name":"연료탱크: 부시류(고무 등)로 진동 흡수 고정","ref":"제34조②-3"},
    {"id":"fl06","name":"연료주입구: 바디 탈거 없이 주유 및 주유량 확인 가능","ref":"제34조②-2"},
    {"id":"fl07","name":"연료량 확인용 투명호스: 내연료성, 수직 방향 125mm 이상","ref":"제34조③"},
    {"id":"fl08","name":"내연료성 투명호스 증빙자료 제출","ref":"제34조③"},
    {"id":"fl09","name":"차량 45도 기울임 시 연료 누출 없음","ref":"제34조④-2"},
    {"id":"fl10","name":"연료/가스 배출관 체크밸브 장착 (탱크 뒤집혀도 누출 방지)","ref":"제34조④-3"},
    {"id":"fl11","name":"연료라인: 플라스틱 금지, 휘발유용 연료호스 사용","ref":"제34조⑤-1"},
    {"id":"fl12","name":"연료라인 고무 호스 클램프: 360도 감쌈, 너트/볼트 조임","ref":"제34조⑤-2"},
    {"id":"fl13","name":"연료라인: 운전석 통과 금지, 충돌/파손으로부터 보호","ref":"제34조⑤-4"},
    {"id":"fl14","name":"연료레일: 엔진 구조물에 기계적 고정 (호스클램프, 플라스틱 타이, 안전와이어 제외)","ref":"제34조⑥-2"},
    {"id":"fl15","name":"연료 시스템 전체: 메인롤후프 최상단-4개 타이어 바깥 모서리 공간 내 위치","ref":"제34조⑧"},
    {"id":"fl16","name":"연료탱크 및 흡기시스템: 측면 충돌로부터 보호","ref":"제34조⑧"},
    {"id":"fl17","name":"연료 온도 변경 금지, 흡입구는 공기/연료만, 지정 장소에서만 주유","ref":"제33조①~③","page":28},
    {"id":"fl18","name":"내구레이스 도중 재급유 금지","ref":"제34조①-1","page":28},
    {"id":"fl19","name":"열원 근처 주입구: 드립팬 및 바닥 배출 호스","ref":"제34조①-3","page":28,"condition":"연료 주입구가 열원에 근접한 경우"},
    {"id":"fl20","name":"가스 배출관: 급코너·급가속 누출 방지, 캐치탱크 연결 금지·차체 밖으로 배출","ref":"제34조④-1,3","page":29},
    {"id":"fl21","name":"고무 연료라인 피팅은 둥근 고리/가시형, 클램프로 호스 손상 없음","ref":"제34조⑤-2","page":29},
    {"id":"fl22","name":"웜기어 클램프 사용 시 연료라인 외부 보호 플라스틱 위에 체결","ref":"제34조⑤-3","page":30,"condition":"웜기어 클램프 사용 시"},
    {"id":"fl23","name":"저압분사(10bar 이하): 유연한 매쉬호스+나사 피팅 또는 보호 클램프 강화고무호스, 매쉬호스 클램프 금지","ref":"제34조⑥-1","page":30,"condition":"저압 연료분사 사용 시"},
    {"id":"fl24","name":"인젝션 흡기 매니폴드: 엔진블록 또는 실린더헤드에 안전하게 고정","ref":"제34조⑥-3","page":30,"condition":"연료분사 엔진 사용 시"},
    {"id":"fl25","name":"고압/직분사: 고압라인 유연한 스테인레스 매쉬, 100mm마다 엔진에 기계 고정·펌프 고정","ref":"제34조⑦-1,3","page":30,"condition":"고압 또는 직분사 사용 시"},
    {"id":"fl26","name":"고압/직분사 저압라인: 유연한 매쉬+나사피팅 또는 보호 클램프 강화고무호스","ref":"제34조⑦-2","page":30,"condition":"고압 또는 직분사 사용 시"},
  ]},
  { cat: "안전벨트", icon: "🔒", color: "#00cc66", items: [
    {"id":"sb01","name":"6점식 이상 안전벨트 장착","ref":"제23조①-1"},
    {"id":"sb02","name":"안전벨트 공식 인증 (SFI 16.1/16.5 또는 FIA 8853/98, 8853/2016)","ref":"제23조①-5"},
    {"id":"sb03","name":"안전벨트 손상 없음","ref":"제23조①-4"},
    {"id":"sb04","name":"금속-금속 퀵 릴리스 걸쇠 (허리벨트+어깨벨트 공유)","ref":"제23조①-3"},
    {"id":"sb05","name":"벨트: 프레임 주구조물에 부착 (바닥판/등판 볼트 고정 금지)","ref":"제23조②-1,2"},
    {"id":"sb06","name":"벨트 브래킷: 철강 두께 2mm·폭 25mm 이상, 그림18 A~D 최소 폭은 홀 직경의 150% 초과","ref":"제23조②-4","review":"2026-09-C","condition":"브래킷 마운트 사용 시"},
    {"id":"sb07","name":"허리/어깨벨트 고정 볼트: 직경 8mm, 강도 8.8 이상","ref":"제23조②-6"},
    {"id":"sb08","name":"강도 8.8 미만 아이볼트 금지","ref":"제23조②-7"},
    {"id":"sb09","name":"안전벨트 고정용 볼트/너트 용접 사용 금지","ref":"제23조②-8"},
    {"id":"sb10","name":"허리벨트: 골반 아래 통과 (복부 통과 금지)","ref":"제23조③-1"},
    {"id":"sb11","name":"허리벨트: 지면과 45~65°; 상반신이 지면과 60° 이하이면 60~80°","ref":"제23조③-4","review":"2026-09-C"},
    {"id":"sb12","name":"어깨벨트 각도: 어깨 수평선 기준 위 10도~아래 20도 사이","ref":"제23조④-1"},
    {"id":"sb13","name":"어깨벨트 마운트 간격: 180mm~230mm","ref":"제23조④-3"},
    {"id":"sb14","name":"다리사이벨트: 허벅지 바깥 마운트, 그림22 방식은 간격 100mm 이상, 그 외 200mm 이상","ref":"제23조⑤-2","review":"2026-09-C"},
    {"id":"sb15","name":"5점식 안전벨트 미사용 (금지)","ref":"제23조⑤-3"},
    {"id":"sb16","name":"팔 안전벨트: 운전석 안에 팔 구속, 공통 풀림장치 연결, SFI 3.3 또는 동등 성능","ref":"제24조⑥","review":"2026-09-C"},
    {"id":"sb17","name":"벨트는 방화벽 기준 운전석 쪽에 위치","ref":"제23조②-10"},
    {"id":"sb18","name":"벨트 조절 후 운전석 밖 돌출 또는 회전부·동력계통 접촉 없음","ref":"제23조②-3","page":18},
    {"id":"sb19","name":"감아 쓰는 벨트: 파이프 25 × 1.8mm 이상, 좌우 이동 방지","ref":"제23조②-5","page":18,"condition":"파이프에 직접 감는 마운트 사용 시"},
    {"id":"sb20","name":"허리벨트 고정점: 시트 뒤끝에서 0~75mm, 브래킷 고정 파이프 25 × 1.8mm 이상","ref":"제23조③-3,4","page":19},
    {"id":"sb21","name":"어깨벨트: Y/H형 금지·길이조절 가능, 차체 고정부는 어깨선 아래, 고정 파이프 25 × 1.8mm 이상","ref":"제23조④-2~4","page":19},
    {"id":"sb22","name":"벨트 브래킷/볼트: 그림19 인장·전단 하중 지지 방향 확인","ref":"제23조②-11","page":19},
    {"id":"sb23","name":"6점은 차체 마운트 수 기준, 다리사이벨트도 공통 금속 걸쇠로 한 번에 분리","ref":"제23조⑤-1","page":20},
  ]},
  { cat: "드라이버 안전 장비", icon: "🏎️", color: "#ff66aa", items: [
    {"id":"dr01","name":"풀페이스 헬멧 착용 (턱/안면 노출 금지, 쉴드 포함)","ref":"제24조①-1"},
    {"id":"dr02","name":"헬멧: 제24조①-4에 열거된 Snell / SFI / FIA 인증 또는 후속 인증 확인","ref":"제24조①-4","review":"2026-09-C"},
    {"id":"dr03","name":"헬멧 착용 시 턱걸이 끈 고정","ref":"제24조①-2"},
    {"id":"dr04","name":"레이싱복: 방염 소재, 긴 팔(손목), 긴 바지(발목) 착용","ref":"제24조②-1"},
    {"id":"dr05","name":"레이싱복: SFI 3.2A/5 이상 또는 제24조②-2에 열거된 FIA 인증/후속 인증","ref":"제24조②-2","review":"2026-09-C"},
    {"id":"dr06","name":"방염 장갑 착용 (구멍 있는 장갑 금지)","ref":"제24조③-1"},
    {"id":"dr07","name":"헬멧 쉴드: 충격에 강한 소재, 경기 중 항상 닫힌 상태","ref":"제24조④"},
    {"id":"dr08","name":"방염 신발 착용 (구멍 없음, 끈 외부 미노출)","ref":"제24조⑤-1,2"},
    {"id":"dr09","name":"바라클라바: 방염 소재, SFI 3.3 또는 제24조⑦의 FIA 인증/후속 인증","ref":"제24조⑦","review":"2026-09-C"},
    {"id":"dr10","name":"정차 중이라도 드라이버 탑승·엔진 시동 상태이면 모든 안전장비 착용","ref":"제24조 본문","page":20},
    {"id":"dr11","name":"헬멧: 쉴드 외 전면이 열리는 구조 금지","ref":"제24조①-3","page":20},
    {"id":"dr12","name":"장갑: SFI 3.3/5 또는 제24조③-2의 FIA 인증/후속 인증","ref":"제24조③-2","page":21},
    {"id":"dr13","name":"신발: SFI 3.3 또는 제24조⑤-3의 FIA 인증/후속 인증","ref":"제24조⑤-3","page":21},
  ]},
  { cat: "운전석", icon: "💺", color: "#0088cc", items: [
    {"id":"ds01","name":"시트: 드라이버 엉덩이/등/옆구리 접촉 고정 형태","ref":"제25조①-1"},
    {"id":"ds02","name":"시트 등받이 드라이버 어깨 높이까지 연장","ref":"제25조①-2"},
    {"id":"ds03","name":"안전벨트 착용 시 시트 이탈 없음","ref":"제25조②-1"},
    {"id":"ds04","name":"시트 등받이 차체 구조물에 지지, 어깨벨트 착용 시 드라이버 지지 가능","ref":"제25조②-2"},
  ]},
  { cat: "에어로다이나믹스", icon: "🌬️", color: "#33ccff", items: [
    {"id":"ae01","name":"공력장치: 약 200N 하중 검사에서 최대 변형 25mm 이하, 영구 변형 5mm 이하","ref":"제73조⑧","review":"2026-09-C","condition":"공력장치 사용 시"},
    {"id":"ae02","name":"공력장치 스포일러 모서리: 날카롭지 않게 마무리","ref":"제73조②","review":"2026-09-C","condition":"공력장치 사용 시"},
    {"id":"ae03","name":"전면 공력장치: 앞 타이어 전방 700mm 이상 돌출 금지, 전륜 허브 높이의 바깥 차폭 안","ref":"제73조⑤-1,2","review":"2026-09-C","condition":"공력장치 사용 시"},
    {"id":"ae04","name":"후면 공력장치: 뒤 타이어 후방 250mm 이상 돌출 금지, 공차 높이 1.2m 이하","ref":"제73조⑥-1,3","review":"2026-09-C","condition":"공력장치 사용 시"},
    {"id":"ae05","name":"공력장치: 충분한 정적 강도, 주행 중 과도한 진동·움직임 없음","ref":"제73조④-3,⑧","review":"2026-09-C","condition":"공력장치 사용 시"},
    {"id":"ae06","name":"언더트레이·공력장치: 바퀴 사이 폭·500mm 높이 제한 및 중심 ±400mm 차체 예외 확인","ref":"제73조⑦","review":"2026-09-C","condition":"공력장치 사용 시"},
    {"id":"ae07","name":"공력장치가 드라이버 탈출을 방해하지 않음","ref":"제73조①","page":58,"condition":"공력장치 사용 시"},
    {"id":"ae08","name":"동력으로 차량 하부 공기 흡출/흐름 생성 금지 (냉각 전용 팬 예외)","ref":"제73조③·④-2","page":58,"condition":"공력장치 사용 시"},
    {"id":"ae09","name":"전면: 공차 높이 250mm 초과 부분에서 전륜 휠/타이어가 공력장치에 가려지지 않음","ref":"제73조⑤-3","page":59,"condition":"공력장치 사용 시"},
    {"id":"ae10","name":"후면: 헤드레스트 최후면보다 앞 돌출 금지(언더트레이 예외), 후륜 허브 높이의 타이어 안쪽 폭 이내","ref":"제73조⑥-2,3","page":59,"condition":"후면 공력장치 사용 시"},
  ]},
  { cat: "식별·계측·검차 운영", icon: "📋", color: "#8a9baa", items: [
    {"id":"op01","name":"출전번호 공간: 전방·좌·우 각 300 × 300mm, 측면에서 번호 식별 가능","ref":"제69조②③","page":57},
    {"id":"op02","name":"차량검사 스티커 부착 공간 200 × 100mm 확보","ref":"제70조","page":57},
    {"id":"op03","name":"트랜스폰더 홀더 견고히 고정, 설치 위치는 조직위원회 공지 확인·사용 후 반납","ref":"제71조②·제72조①②","page":58},
    {"id":"op04","name":"검차 후 개조 금지, 재검차 수정과 제75조② 허용 조정 범위 구분","ref":"제75조","page":60},
    {"id":"op05","name":"센서/카메라: 시야·신체·움직임 공간 방해 금지, 카메라 브래킷 고정","ref":"제79조②③","page":61,"condition":"센서 또는 촬영장치 장착 시"},
  ]},
  { cat: "체결장치", icon: "📋", color: "#8a9baa", items: [
    {"id":"fa01","name":"피스류 체결장치 사용 금지","ref":"제74조①","page":60},
    {"id":"fa02","name":"조향·제동·벨트·현가 볼트: SAE Grade 5 / M8.8 이상, 체결 후 나사산 2피치 이상 노출","ref":"제74조②","page":60},
    {"id":"fa03","name":"조향·제동·벨트·동력·현가·공력 볼트/너트: 핀·홈너트·안전와이어·허용 록너트 등 풀림 방지","ref":"제74조③","page":60},
    {"id":"fa04","name":"엔진·배기·브레이크 디스크/캘리퍼 등 고온 부위 나일론 록너트 금지","ref":"제74조③-3","page":60},
    {"id":"fa05","name":"화학적 고정제만으로 풀림 방지 인정 불가, 기타 방식은 동등 성능 증빙","ref":"제74조③-5·④","page":60},
  ]},
  { cat: "압축가스·난연 재료", icon: "📋", color: "#8a9baa", items: [
    {"id":"gc01","name":"LPG·프로판·니트로 등 연소용 압축가스 금지","ref":"제76조①","page":60},
    {"id":"gc02","name":"변속용 불연소 압축가스: 최대 사용 압력을 견디는 용기","ref":"제76조②③","page":61,"condition":"압축가스 사용 시"},
    {"id":"gc03","name":"난연 재료: UL94 V-0 또는 FAR 25.853(a)(1)(i), 발포체는 UL94 HF-1 및 VTM-0 또는 동등성 입증","ref":"제78조","page":61,"condition":"난연성 요구 부위에 재료를 사용하는 경우"},
  ]},
  { cat: "대체 재료·모노코크·탈착식 지지대", icon: "📋", color: "#8a9baa", items: [
    {"id":"am01","name":"기본 규격 외 재료: SEF와 동등 이상 안전율 증명, 조직위원회 사용 승인","ref":"제13조","page":6,"condition":"대체 재료 사용 시"},
    {"id":"am02","name":"대체 롤후프/지지대: Fx 6·Fy 5·Fz -9kN, 최고점 하중·변형 25mm 이하·파괴 없음","ref":"제22조①가·나","page":15,"condition":"대체 롤 후프 또는 지지대 사용 시"},
    {"id":"am03","name":"대체 측면: Fy 7kN/직경250mm 영역, 벌크헤드: Fx120kN; 변형25mm 이하·파괴 없음","ref":"제22조①다·라","page":15,"condition":"대체 측면 또는 벌크헤드 구조 사용 시"},
    {"id":"am04","name":"대체 재료 유형/특성·레이업·동등성 계산 및 시험·해석 자료 SEF 첨부","ref":"제22조②","page":15,"condition":"대체 재료 사용 시"},
    {"id":"am05","name":"복합재: 275 × 500mm 패널·스팬400mm 3점 굽힘, 기준 강관2개 19mm 변위 비교 시험","ref":"제22조④가~다","page":16,"condition":"복합재 주구조 사용 시"},
    {"id":"am06","name":"복합재 전단: 25mm 펀치·32mm 홀·100 × 100mm 이상 시험편, 벌크헤드4kN·측면7.5kN 이상","ref":"제22조④라","page":17,"condition":"복합재 주구조 사용 시"},
    {"id":"am07","name":"비준등방성 복합재: 추가 방향 시험, 약한 방향 물성은 강한 방향의50% 이상","ref":"제22조④마","page":17,"condition":"비준등방성 복합재 사용 시"},
    {"id":"am08","name":"복합재 랩 조인트: 실제 소재/공정 시험, 접착부 전단강도는 스킨 인장강도 초과","ref":"제22조④바","page":17,"condition":"접착 복합재 조인트 사용 시"},
    {"id":"am09","name":"복합재 평판 EI 계산: 곡률/기하단면 제외 등 제22조⑤ 조건 확인","ref":"제22조⑤","page":17,"condition":"복합재 구조 사용 시"},
    {"id":"am10","name":"메인/전방 롤 후프 및 메인 롤 후프 지지대에 복합소재 금지","ref":"제22조⑥","page":17},
    {"id":"am11","name":"모노코크 메인 롤후프 접합: M8·8.8 이상 2개 이상, 양쪽3mm 철강/동등 알루미늄판 및 SEF","ref":"제15조②-6","page":10,"condition":"모노코크 사용 시"},
    {"id":"am12","name":"모노코크 지지대 접합: 양쪽3mm 철강/동등 알루미늄판, M8·8.8 이상 체결","ref":"제16조③-1","page":11,"condition":"모노코크 사용 시"},
    {"id":"am13","name":"탈착식 Double-Lug: 철강 판4.5mm·폭25mm 이상, 보강판, 핀/볼트10mm·10.9 이상·로드엔드 금지","ref":"제16조③-2가~라","page":11,"condition":"탈착식 Double-Lug 지지대 사용 시"},
    {"id":"am14","name":"탈착식 슬리브: 길이80mm·양쪽40mm 이상·관 이상 두께 철강, M6·10.9 이상 볼트","ref":"제16조③-2마","page":12,"condition":"탈착식 슬리브 지지대 사용 시"},
    {"id":"am15","name":"모노코크 벌크헤드·벨트 접합: 기본 프레임과 동등 강도 SEF 제출","ref":"제17조①-6·제23조②-9","page":12,"condition":"모노코크 사용 시"},
  ]},
  { cat: "전자식 스로틀 (C-Formula 조건부)", icon: "📋", color: "#8a9baa", items: [
    {"id":"et01","name":"ETC 전원 차단 시 공회전 복귀, 액추에이터+별도 리턴스프링 등 복귀장치2개 (TPS 스프링 불인정)","ref":"제36조①-1,2","page":31,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et02","name":"블리핑 시 의도하지 않은 가속 방지 입증; ETCSF 제출·사전 승인 및 상용 예외 승인","ref":"제36조①-3·②③","page":31,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et03","name":"TPS: 개별 센서2개 이상, 전원/기준전압 공유 시 차이 감지 가능","ref":"제36조④-1,2","page":32,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et04","name":"TPS: 위치차10% 이상/기타고장 감지, 비정상 출력100ms 이상 시 ETC 전원 차단 (예외는 ETCSF 입증)","ref":"제36조④-3~5","page":32,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et05","name":"TPS: 센서별 독립 분리 검사 가능, 직접 신호 전송·배선고장/개방/단락 감지","ref":"제36조④-6~8","page":32,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et06","name":"TPS 디지털 전송: 범위초과·메시지손상/손실/시간초과 등 고장 탐지·시험 ETCSF 기재","ref":"제36조④-9","page":32,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et07","name":"가속페달: 독립 리턴스프링2개, 한 개만으로0% 복귀, APPS 내장 스프링 불인정·스토퍼·간섭 없음","ref":"제36조⑤·⑥-1","page":33,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et08","name":"APPS: 전원/신호선 분리 센서2개 이상, 구분되는 신호·풀업/풀다운 또는 승인된 반대 기울기 OEM","ref":"제36조⑥-2,3","page":33,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et09","name":"APPS: 위치차10% 이상/고장 감지, 비정상 출력100ms 이상 시 ETC 차단 (3센서·예외 조건 확인)","ref":"제36조⑥-4~6","page":33,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et10","name":"APPS: 독립 분리 검사·직접 전송·배선 개방/단락 고장 감지, 디지털 고장모드 시험 보고","ref":"제36조⑥-7~12","page":33,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et11","name":"BSE: 페달 위치/압력 센서 또는 스위치, 독립 분리 검사·직접 전송","ref":"제36조⑦-1~3","page":34,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et12","name":"BSE: 고장100ms 이상 시 ETC 차단, 개방/단락·디지털 메시지 오류 감지 및 보고","ref":"제36조⑦-4~6","page":34,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et13","name":"브레이크+허용초과 TPS 1초 지속: ETC 차단, 추가1초 내 공회전 미복귀 시 연료·점화 차단","ref":"제36조⑧-1","page":34,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et14","name":"TPS 목표 대비10% 이상 오차1초: ETC 차단, 추가1초 내10% 미만 미회복 시 연료·점화 차단·검차 입증","ref":"제36조⑧-2","page":34,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et15","name":"ETC 이상정지 후 TPS 기본위치 이하가1초 이상 감지될 때까지 정지 유지","ref":"제36조⑧-3","page":35,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et16","name":"BSPD: 독립·프로그래밍 불가 회로, 센서 신호 직접 입력 (다른 모듈 출력 불인정)","ref":"제36조⑨-1,2","page":35,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et17","name":"BSPD: 급제동+스로틀10% 이상1초 / 센서손실100ms / 회로전원 상실 시 엔진·펌프·점화·ETC 차단","ref":"제36조⑨-3,4","page":35,"condition":"전자식 스로틀(ETC) 사용 시"},
    {"id":"et18","name":"BSPD: 주 비상정지로만 리셋, 보조 OFF로 리셋 금지·센서/회로전원 독립 차단 검차 준비","ref":"제36조⑨-5~7","page":35,"condition":"전자식 스로틀(ETC) 사용 시"},
  ]},
];


const INSP_REVIEW_VERSION = '2026-09-C';
function inspectionState(it) {
  const raw=S.inspection[it.id];
  if(raw==='pass' && it.review && S.inspectionReview?.[it.id]!==it.review)return 'pending';
  if(raw==='na' && !it.condition)return 'pending';
  return ['pass','fail','pending','na'].includes(raw)?raw:'';
}
function inspectionStats(items=INSP_DATA.flatMap(c=>c.items)) {
  const counts={pass:0,fail:0,pending:0,na:0,total:items.length};
  items.forEach(it=>{const state=inspectionState(it);if(state)counts[state]++;});
  counts.applicable=counts.total-counts.na;
  counts.rate=counts.applicable?Math.round(counts.pass/counts.applicable*100):0;
  return counts;
}
function applyInspectionState() {
  INSP_DATA.forEach(cat=>cat.items.forEach(it=>{
    const row=document.getElementById('row-'+it.id);if(!row)return;
    const state=inspectionState(it);
    row.classList.toggle('fail',state==='fail');
    row.querySelectorAll('.insp-btn[data-state]').forEach(b=>b.classList.toggle('active',b.dataset.state===state));
    const badge=document.getElementById('review-'+it.id);
    if(badge)badge.hidden=!(it.review && S.inspection[it.id]==='pass' && S.inspectionReview?.[it.id]!==it.review);
  }));
  updateInspStats();renderReport();
}

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
          <div class="insp-item-wrap" id="wrap-${it.id}">
            <div class="insp-item" id="row-${it.id}">
              <div class="insp-item-name">${it.name}${it.condition ? '<small class="insp-condition">적용: '+it.condition+'</small>' : ''}<small class="insp-review" id="review-${it.id}" hidden>규정 수정 · 재확인 필요</small></div>
              <div class="insp-item-ref">${it.ref}${it.page ? ' · p.'+it.page : ''}</div>
              <div class="insp-controls">
                <button class="insp-btn pass" data-id="${it.id}" data-state="pass">✓ 통과</button>
                <button class="insp-btn fail" data-id="${it.id}" data-state="fail">✗ 미통과</button>
                <button class="insp-btn pending" data-id="${it.id}" data-state="pending">? 확인중</button>
                ${it.condition ? '<button class="insp-btn na" data-id="'+it.id+'" data-state="na">해당없음</button>' : ''}
                <button class="insp-btn insp-meta-btn" data-id="${it.id}" title="상세 메모" onclick="toggleInspMeta('${it.id}')">📋</button>
              </div>
            </div>
            <div class="insp-meta-panel" id="meta-${it.id}" style="display:none">
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:10px">
                <div>
                  <div class="insp-meta-label">중요도</div>
                  <select class="form-control" style="padding:6px 10px;font-size:12px" onchange="saveInspMeta('${it.id}','priority',this.value)">
                    <option value="보통">보통</option>
                    <option value="높음">🔴 높음</option>
                    <option value="낮음">🔵 낮음</option>
                  </select>
                </div>
                <div>
                  <div class="insp-meta-label">담당자</div>
                  <input type="text" class="form-control" style="padding:6px 10px;font-size:12px" placeholder="이름" id="meta-assignee-${it.id}" onchange="saveInspMeta('${it.id}','assignee',this.value)">
                </div>
                <div>
                  <div class="insp-meta-label">확인 날짜</div>
                  <input type="date" class="form-control" style="padding:6px 10px;font-size:12px" id="meta-checkdate-${it.id}" onchange="saveInspMeta('${it.id}','checkDate',this.value)">
                </div>
                <div>
                  <div class="insp-meta-label">수정 기한</div>
                  <input type="date" class="form-control" style="padding:6px 10px;font-size:12px" id="meta-deadline-${it.id}" onchange="saveInspMeta('${it.id}','deadline',this.value)">
                </div>
              </div>
              <div>
                <div class="insp-meta-label">불합격 원인 메모</div>
                <textarea class="form-control" rows="2" style="padding:6px 10px;font-size:12px" placeholder="원인 및 수정 내용..." id="meta-reason-${it.id}" onchange="saveInspMeta('${it.id}','failReason',this.value)"></textarea>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    div.querySelector('.insp-cat-header').addEventListener('click', function() { toggleCat(this); });
    div.querySelectorAll('.insp-btn[data-state]').forEach(function(btn) {
      btn.addEventListener('click', function() { setInsp(this.dataset.id, this.dataset.state, this); });
    });
    cont.appendChild(div);
  });
  Object.entries(S.inspection).forEach(([id]) => {
    const item=INSP_DATA.flatMap(c=>c.items).find(it=>it.id===id);if(!item)return;const state=inspectionState(item);
    const row = document.getElementById('row-' + id);
    if (!row) return;
    row.querySelectorAll('.insp-btn[data-state]').forEach(b => b.classList.remove('active'));
    const target = row.querySelector('.insp-btn.' + state);
    if (target) {
      target.classList.add('active');
      if (state === 'fail') row.classList.add('fail');
    }
    if (state === 'fail' || state === 'pending') {
      const panel = document.getElementById('meta-' + id);
      if (panel) panel.style.display = '';
    }
  });
  Object.entries(S.inspectionMeta || {}).forEach(([id, meta]) => {
    restoreInspMeta(id, meta);
  });
  applyInspectionState();
}

function toggleInspMeta(id) {
  const panel = document.getElementById('meta-' + id);
  if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
}

function saveInspMeta(id, field, val) {
  if (!S.inspectionMeta) S.inspectionMeta = {};
  if (!S.inspectionMeta[id]) S.inspectionMeta[id] = {};
  S.inspectionMeta[id][field] = val;
  save('inspectionMeta');
  updateInspStats();
}

function restoreInspMeta(id, meta) {
  const fields=[
    [document.querySelector(`#meta-${id} select`),meta.priority || '보통'],
    [document.getElementById('meta-assignee-'+id),meta.assignee || ''],
    [document.getElementById('meta-checkdate-'+id),meta.checkDate || ''],
    [document.getElementById('meta-deadline-'+id),meta.deadline || ''],
    [document.getElementById('meta-reason-'+id),meta.failReason || '']
  ];
  fields.forEach(([el,value])=>{if(el && el!==document.activeElement)el.value=value;});
}

function slugify(s) { return Array.from(s).map(c=>c.codePointAt(0).toString(16)).join('-'); }

function toggleCat(header) {
  header.classList.toggle('collapsed');
  const items = header.nextElementSibling;
  items.style.display = header.classList.contains('collapsed') ? 'none' : '';
}

async function setInsp(id, state) {
  const it=INSP_DATA.flatMap(c=>c.items).find(it=>it.id===id);
  if(!it || !['pass','fail','pending','na'].includes(state) || (state==='na'&&!it.condition))return;
  const recheck=it.review && S.inspectionReview?.[id]!==it.review;
  const next=S.inspection[id]===state && !recheck?null:state;
  try {
    await db.ref('just').update({['inspection/'+id]:next,['inspectionReview/'+id]:next?INSP_REVIEW_VERSION:null});
    if(next){S.inspection[id]=next;S.inspectionReview??={};S.inspectionReview[id]=INSP_REVIEW_VERSION;}else{delete S.inspection[id];if(S.inspectionReview)delete S.inspectionReview[id];}
    applyInspectionState();renderHome();
    const panel=document.getElementById('meta-'+id);if(panel && ['fail','pending'].includes(next))panel.style.display='';
  }catch(err){alert('점검 기록을 저장하지 못했습니다. 연결을 확인하고 다시 시도하세요.');}
}

function updateInspStats() {
  const t=inspectionStats();
  INSP_DATA.forEach(cat=>{
    const stats=inspectionStats(cat.items),el=document.getElementById('cat-rate-'+slugify(cat.cat));
    if(el){el.textContent=stats.rate+'%';el.style.color=stats.rate===100?'#00cc66':'#aaa';}
  });
  setText('insp-pass-count',t.pass);setText('insp-fail-count',t.fail);setText('insp-pend-count',t.pending);setText('insp-rate',t.rate+'%');
  setText('insp-total-sub','전체 '+t.total+' · 해당없음 '+t.na+' · 적용 '+t.applicable);
  setWidth('insp-pass-bar',t.applicable?t.pass/t.applicable*100:0);setWidth('insp-fail-bar',t.applicable?t.fail/t.applicable*100:0);setWidth('insp-pend-bar',t.applicable?t.pending/t.applicable*100:0);setWidth('insp-rate-bar',t.rate);
}

function renderReport() {
  renderCompetitionDate();
  const barsEl = document.getElementById('report-part-bars');
  if (barsEl) {
    barsEl.innerHTML = INSP_DATA.map(cat => {
      const total = inspectionStats(cat.items).applicable;
      const pass = cat.items.filter(it => inspectionState(it) === 'pass').length;
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
      const st = inspectionState(it);
      if (st === 'fail' || st === 'pending') issues.push({ ...it, state: st });
    }));
    issuesEl.innerHTML = issues.length === 0
      ? '<div style="color:#00cc66;font-size:13px;text-align:center;padding:16px">✓ 미통과/확인중 항목 없음</div>'
      : issues.map(it => {
          const meta = (S.inspectionMeta || {})[it.id] || {};
          const priColor = meta.priority === '높음' ? '#ff4444' : meta.priority === '낮음' ? '#0088ff' : '#ffaa00';
          const priLabel = meta.priority || '보통';
          const assignee = meta.assignee || '';
          const deadline = meta.deadline || '';
          const noAssignee = !assignee && it.state !== 'pass';
          return `<div class="issue-item">
            <span class="issue-badge" style="background:${it.state==='fail'?'rgba(255,0,0,0.15)':'rgba(255,170,0,0.15)'};color:${it.state==='fail'?'#ff4444':'#ffaa00'}">${it.state==='fail'?'미통과':'확인중'}</span>
            <span class="issue-badge" style="background:${priColor}22;color:${priColor};margin-left:0">${priLabel}</span>
            <span style="flex:1;color:#ddd;font-size:12px">${it.name}</span>
            <span style="font-size:11px;color:${assignee?'#aaa':'#ff4444'}">${assignee || '⚠ 담당자 미지정'}</span>
            ${deadline ? `<span style="font-size:10px;color:#888;margin-left:6px">~${deadline}</span>` : ''}
            <span style="color:#555;font-size:10px;font-family:monospace;margin-left:6px">${it.ref}</span>
          </div>`;
        }).join('');
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
    const st = inspectionState(it);
    if(st==='na')return;
    totalItems++;
    if (st === 'pass') totalPass++;
    else if (st === 'fail') totalFail++;
    else if (st === 'pending') totalPending++;
  }));
  const passRate = totalItems ? Math.round(totalPass / totalItems * 100) : 0;
  const passColor = passRate === 100 ? '#16a34a' : passRate >= 60 ? '#d97706' : '#dc2626';

  const compDate = S.compDate || '';
  let ddayHTML = '';
  if (compDate) {
    const result=competitionDay(compDate);
    if(result)ddayHTML = '<div class="dday-val">'+result.text+'</div><div class="dday-sub">'+result.label+' &middot; '+compDate+'</div>';
  }

  const partBarsHTML = INSP_DATA.map(cat => {
    const total = inspectionStats(cat.items).applicable;
    const pass = cat.items.filter(it => inspectionState(it) === 'pass').length;
    const pct = total ? Math.round(pass / total * 100) : 0;
    const cls = pct === 100 ? 'green' : pct >= 60 ? 'yellow' : 'red';
    return `<div class="bar-row">
      <div class="bar-label"><span class="bar-name">${cat.icon} ${cat.cat}</span><span class="bar-pct ${cls}">${pass}/${total} &middot; ${pct}%</span></div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  const failItems = [], pendingItems = [];
  INSP_DATA.forEach(cat => cat.items.forEach(it => {
    const st = inspectionState(it);
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
      <div class="date-lbl">2026 C-Formula · 2025.12.18 시행 규정</div>
    </div>
  </div>
  <div class="header-right">
    <div class="date-lbl">작성일: <span class="date-val">${date}</span></div>
    ${ddayHTML}
  </div>
</div>
<div class="rate-box">
  <div class="rate-lbl">전체 통과율</div>
  <div class="date-lbl">전체 ${inspectionStats().total} · 해당없음 ${inspectionStats().na} · 적용 ${totalItems}</div>
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
  if(!win){alert('보고서 창이 차단되었습니다. 팝업을 허용한 뒤 다시 시도하세요.');return;}
  win.document.open();
  win.document.write(doc);
  win.document.close();
}

function exportInspection() {
  const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
  const rows=[['항목ID','카테고리','항목명','참조규정','적용조건','상태','기존저장상태','규정확인버전']];
  INSP_DATA.forEach(cat=>cat.items.forEach(it=>rows.push([it.id,cat.cat,it.name,it.ref,it.condition||'공통',inspectionState(it)||'미확인',S.inspection[it.id]||'',S.inspectionReview?.[it.id]||''])));
  const blob=new Blob(['\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='JUST_C_Inspection_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
}
