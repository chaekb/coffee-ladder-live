import { db, ref, set, get, child, onValue, update, remove } from './config.js';

let roomId = null;
let myName = null;
let isHost = false;
const EXPIRE_TIME = 10 * 60 * 1000; // 10분 (밀리초)

// DOM 요소들
const lobbyZone = document.getElementById('lobby-zone');
const joinZone = document.getElementById('join-zone');
const gameZone = document.getElementById('game-zone');
const btnCreateRoom = document.getElementById('btn-create-room');
const roomLinkContainer = document.getElementById('room-link-container');
const roomLink = document.getElementById('room-link');
const btnCopy = document.getElementById('btn-copy');
const userNameInput = document.getElementById('user-name');
const btnJoin = document.getElementById('btn-join');
const participantList = document.getElementById('participant-list');
const btnStartGame = document.getElementById('btn-start-game');
const canvas = document.getElementById('ladder-canvas');
const ctx = canvas.getContext('2d');

// 팝업 요소들
const resultOverlay = document.getElementById('result-overlay');
const resultEmoji = document.getElementById('result-emoji');
const resultMessage = document.getElementById('result-message');
const resultSub = document.getElementById('result-sub');
const btnClosePopup = document.getElementById('btn-close-popup');

// 페이지 로드 시 URL에서 방 ID 확인
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rId = urlParams.get('room');
    if (rId) {
        roomId = rId;
        checkRoomValidity();
    }
});

// 10분 만료 체크 함수
async function checkRoomValidity() {
    const snapshot = await get(child(ref(db), `rooms/${roomId}`));
    if (snapshot.exists()) {
        const roomData = snapshot.val();
        const now = Date.now();
        // 10분이 지났다면 디비에서 지우고 폭파
        if (now - roomData.createdAt > EXPIRE_TIME) {
            alert('생성된 지 10분이 지나 폭파된 방입니다.');
            await remove(ref(db), `rooms/${roomId}`);
            window.location.href = window.location.origin + window.location.pathname;
        } else {
            // 정상적인 방이라면 닉네임 입력창 띄우기
            lobbyZone.classList.add('hidden');
            joinZone.classList.remove('hidden');
            listenRoomData();
        }
    } else {
        alert('존재하지 않는 방입니다.');
        window.location.href = window.location.origin + window.location.pathname;
    }
}

// 방 만들기 클릭
btnCreateRoom.addEventListener('click', async () => {
    roomId = Math.random().toString(36).substring(2, 8);
    isHost = true;
    
    await set(ref(db, `rooms/${roomId}`), {
        createdAt: Date.now(),
        status: 'waiting', // waiting, playing, finished
        players: {},
        ladderStructure: '',
        winner: ''
    });

    const generatedLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    roomLink.value = generatedLink;
    roomLinkContainer.classList.remove('hidden');
    btnCreateRoom.classList.add('hidden');
    
    joinZone.classList.remove('hidden');
    listenRoomData();
});

// 링크 복사 버튼
btnCopy.addEventListener('click', () => {
    roomLink.select();
    document.execCommand('copy');
    alert('링크가 복사되었습니다! 카톡방에 공유하세요.');
});

// 참가하기 버튼 클릭
btnJoin.addEventListener('click', async () => {
    const name = userNameInput.value.trim();
    if (!name) return alert('닉네임을 입력하세요!');
    myName = name;

    // 참가자 등록
    await set(ref(db, `rooms/${roomId}/players/${myName}`), {
        joinedAt: Date.now()
    });

    joinZone.classList.add('hidden');
    gameZone.classList.remove('hidden');
    document.getElementById('room-title').innerText = `방 ID: ${roomId}`;

    if (isHost) {
        btnStartGame.classList.remove('hidden');
    }
});

// 데이터 실시간 감시 및 렌더링 동기화
function listenRoomData() {
    onValue(ref(db, `rooms/${roomId}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. 참여자 명단 업데이트
        if (data.players) {
            const playerNames = Object.keys(data.players);
            participantList.innerText = `참가자 (${playerNames.length}명): ${playerNames.join(', ')}`;
            
            // 실시간 대기 상태일 때 캔버스 기본선 그려두기
            if (data.status === 'waiting') {
                drawBaseLines(playerNames);
            }
        }

        // 2. 누군가 게임을 시작했을 때 애니메이션 처리
        if (data.status === 'playing' && data.ladderStructure) {
            const players = Object.keys(data.players);
            const structure = JSON.parse(data.ladderStructure);
            animateLadder(players, structure, data.winner);
        }
    });
}

// 기본 기둥 그리기
function drawBaseLines(players) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (players.length < 2) return;

    const count = players.length;
    const spacing = canvas.width / (count + 1);

    ctx.strokeStyle = '#6f4e37';
    ctx.lineWidth = 4;
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    for (let i = 0; i < count; i++) {
        const x = spacing * (i + 1);
        // 세로선
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, canvas.height - 40);
        ctx.stroke();
        // 이름 표시
        ctx.fillText(players[i], x, 25);
    }
}

// 호스트가 시작 누름 (사다리 무작위 생성 후 디비 업로드)
btnStartGame.addEventListener('click', async () => {
    const snapshot = await get(ref(db, `rooms/${roomId}`));
    const data = snapshot.val();
    const players = Object.keys(data.players);

    if (players.length < 2) return alert('최소 2명 이상 모여야 시작할 수 있습니다.');

    // 가로 사다리 다리 놓기 무작위 설계
    const linesCount = players.length;
    const steps = 6; // 가로 칸수 나누기
    let structure = [];

    for (let s = 0; s < steps; s++) {
        let row = [];
        for (let l = 0; l < linesCount - 1; l++) {
            // 연속해서 다리가 생기지 않도록 방지 확률 반반
            if (l > 0 && row[l - 1] === 1) {
                row.push(0);
            } else {
                row.push(Math.random() > 0.5 ? 1 : 0);
            }
        }
        structure.push(row);
    }

    // 당첨자 선정 (플레이어 인덱스 중 1명)
    const winnerIdx = Math.floor(Math.random() * players.length);
    const winnerName = players[winnerIdx];

    // DB 데이터 업데이트 -> 실시간으로 접속한 모두에게 신호가 감
    await update(ref(db, `rooms/${roomId}`), {
        status: 'playing',
        ladderStructure: JSON.stringify(structure),
        winner: winnerName
    });
});

// 모든 클라이언트가 동시에 구동할 사다리 애니메이션 함수
function animateLadder(players, structure, winnerName) {
    btnStartGame.classList.add('hidden'); // 게임 도중 시작 버튼 감추기
    const count = players.length;
    const spacing = canvas.width / (count + 1);
    const steps = structure.length;
    const stepHeight = (canvas.height - 80) / steps;

    let currentProgress = 0;

    function drawFrame() {
        drawBaseLines(players);
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;

        // 가로 사다리 구조 뼈대 먼저 그리기
        ctx.strokeStyle = '#6f4e37';
        for (let s = 0; s < steps; s++) {
            const y = 40 + (s + 1) * stepHeight;
            for (let l = 0; l < count - 1; l++) {
                if (structure[s][l] === 1) {
                    ctx.beginPath();
                    ctx.moveTo(spacing * (l + 1), y);
                    ctx.lineTo(spacing * (l + 2), y);
                    ctx.stroke();
                }
            }
        }

        currentProgress += 1;
        if (currentProgress < 60) {
            requestAnimationFrame(drawFrame);
        } else {
            // 애니메이션 완료 후 결과 이모션 팝업 표시
            showResultPopup(winnerName);
        }
    }
    drawFrame();
}

// 결과 이모션 보여주기 팝업 창 함수
function showResultPopup(winnerName) {
    resultOverlay.classList.remove('hidden');
    
    if (myName === winnerName) {
        // 내가 걸린 경우 (벌칙 이모션)
        resultEmoji.innerText = '😭💸😱';
        resultMessage.innerText = `악! 내가 당첨!!`;
        resultSub.innerText = `오늘 커피는 ${myName}님이 쏩니다! 영수증 챙기세요..`;
    } else {
        // 살아남은 경우 (기쁨과 안도의 이모션)
        resultEmoji.innerText = '🎉😎😌';
        resultMessage.innerText = `휴.. 살았다!`;
        resultSub.innerText = `당첨자는 [ ${winnerName} ] 입니다. 잘 마실게요!`;
    }
}

// 팝업 닫기
btnClosePopup.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
});
