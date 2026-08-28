구조 변경안

index.html
 ├ create-room.html : 방장 전용
 └ join-room.html   : 참가자 전용

host-room.html
 - 방장 화면
 - 사다리 생성 권한

guest-room.html
 - 참가자 화면
 - 방번호 입력 후 참여

기존 Firebase room.js 로직은
host-room.js / guest-room.js 로 분리하는 방식으로 이동하면 됩니다.
