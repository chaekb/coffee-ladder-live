# Coffee Ladder Live v5

v5는 v4를 기반으로 사다리 이동 경로를 텍스트가 아니라 **실제 애니메이션**으로 보여주는 버전입니다.

## 주요 변경
- 사다리 가로줄 최소 개수를 늘려 지나치게 단순한 사다리 방지
- 참가자가 자신의 이름을 누르면 말이 실제 사다리를 따라 내려가는 애니메이션 표시
- 세로 이동과 가로 이동을 모두 시각적으로 표시
- 도착 지점에 번호를 표시하고 도착 결과를 카드로 표시
- 이동 경로 텍스트 `2 → 2 → 2...` 대신 시각적 경로 중심으로 변경
- 사다리 행 수를 8행으로 조정

## Firebase 주의
`firebase.js`는 기존에 정상 작동하던 Firebase 설정을 유지해서 사용하세요. ZIP에 들어 있는 값이 실제 프로젝트 설정과 다르면 기존 firebase.js의 내용을 그대로 사용하면 됩니다.

## 실행
GitHub Pages에 기존 파일을 교체해서 업로드하세요.

구성:
- index.html
- create-room.html / create-room.js
- host-room.html / host-room.js
- join-room.html / join-room.js
- guest-room.html / guest-room.js
- ladder-common.js
- firebase.js
- style.css
