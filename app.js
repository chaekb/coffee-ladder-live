import { db, ref, set, get, child, onValue, update, remove } from './config.js';

let roomId = null;
let myName = null;
let isHost = false;
const EXPIRE_TIME = 10 * 60 * 1000; // 10분 (밀리초)

// DOM 요소들이 확실히 로드된 후 이벤트를 바인딩하기 위한 초기화
window.addEventListener('DOMContentLoaded', () => {
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnCopy = document.getElementById('btn-copy');
    const btnJoin = document.getElementById('btn-join');
    const btnStartGame = document.getElementById('btn-start-game');
    const btnClosePopup = document.getElementById('btn-close-popup');
    const roomLink = document.getElementById('room-link');
    const userNameInput = document.getElementById('user-name');

    // 1. 페이지 로드 시 URL에서 방 ID 확인 및 유효성 체크
    const urlParams = new URLSearchParams(window.location.search);
    const rId = urlParams.get('room');
    if (rId) {
        roomId = rId;
        checkRoomValidity();
    }

    // 2. 방 만들기 클릭 이벤트 등록
    if (btnCreateRoom) {
        btnCreateRoom.addEventListener('click', async () => {
            try {
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
                if (roomLink) roomLink.value = generatedLink;
                
                document.getElementById('room-link-container').classList.remove('hidden');
                btnCreateRoom.classList.add('hidden');
                
                document.getElementById('join-zone').classList.remove('hidden');
                listenRoomData();
            } catch (error) {
                console.error("방 생성 에러:", error);
                alert("방을 생성하는 도중 오류가 발생했습니다. Firebase 설정을 확인해주세요.");
            }
        });
    }

    // 3. 링크 복사 버튼 이벤트 등록
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            roomLink.select();
            document.execCommand('copy');
            alert('링크가 복사되었습니다! 카톡방에 공유하세요.');
        });
    }

    // 4. 참가하기 버튼 클릭 이벤트 등록
    if (btnJoin) {
        btnJoin.addEventListener('click', async () => {
            const name = userNameInput.value.trim();
            if (!name) return alert('닉네임을 입력하세요!');
            myName = name;

            await set(ref(db, `rooms/${roomId}/players/${myName}`), {
                joinedAt: Date.now()
            });

            document.getElementById('join-zone').classList.add('hidden');
            document.getElementById('game-zone').classList.remove('hidden');
            document.getElementById('room-title').innerText = `방 ID: ${roomId}`;

            if (isHost && btnStartGame) {
                btnStartGame.classList.remove('hidden');
            }
        });
    }

    // 5. 호스트가 시작 버튼 클릭 시 사다리 생성
    if (btnStartGame) {
        btnStartGame.addEventListener('click', async () => {
            const snapshot = await get(ref(db, `rooms/${roomId}`));
            const data = snapshot.val();
            const players = Object.keys(data.players || {});

            if (players.length < 2) return alert('최소 2명 이상 모여야 시작할 수 있습니다.');

            const linesCount = players.length;
            const steps = 6;
            let structure = [];

            for (let s = 0; s < steps; s++) {
                let row = [];
                for (let l = 0; l < linesCount - 1; l++) {
                    if (l > 0 && row[l - 1] === 1) {
                        row.push(0);
                    } else {
                        row.push(Math.random() > 0.5 ? 1 : 0);
                    }
                }
                structure.push(row);
            }

            const winnerIdx = Math.floor(Math.random() * players.length);
            const winnerName = players[winnerIdx];

            await update(ref(db, `rooms/${roomId}`), {
                status: 'playing',
                ladderStructure: JSON.stringify(structure),
                winner: winnerName
            });
        });
    }

    // 6. 결과 팝업 닫기 이벤트 등록
    if (btnClosePopup) {
        btnClosePopup.addEventListener('click', () => {
            document.getElementById('result-overlay').classList.add('hidden');
        });
    }
});

// 10분 만료 체크 함수
async function checkRoomValidity() {
    try {
        const snapshot = await get(child(ref(db), `rooms/${roomId}`));
        if (snapshot.exists()) {
            const roomData = snapshot.val();
            const now = Date.now();
            if (now - roomData.createdAt > EXPIRE_TIME) {
                alert('생성된 지 10분이 지나 폭파된 방입니다.');
                await remove(ref(db), `rooms/${roomId}`);
                window.location.href = window.location.origin + window.location.pathname;
            } else {
                document.getElementById('lobby-zone').classList.add('hidden');
                document.getElementById('join-zone').classList.remove('hidden');
                listenRoomData();
            }
        } else {
            alert('존재하지 않는 방입니다.');
            window.location.href = window.location.origin + window.location.pathname;
        }
    } catch (error) {
        console.error("방 확인 에러:", error);
    }
}

// 데이터 실시간 감시 및 렌더링 동기화
function listenRoomData() {
    const canvas = document.getElementById('ladder-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    onValue(ref(db, `rooms/${roomId}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.players) {
            const playerNames = Object.keys(data.players);
            document.getElementById('participant-list').innerText = `참가자 (${playerNames.length}명): ${playerNames.join(', ')}`;
            
            if (data.status === 'waiting') {
                drawBaseLines(ctx, canvas, playerNames);
            }
        }

        if (data.status === 'playing' && data.ladderStructure) {
            const players = Object.keys(data.players);
            const structure = JSON.parse(data.ladderStructure);
            animateLadder(ctx, canvas, players, structure, data.winner);
        }
    });
}

// 기본 기둥 그리기
function drawBaseLines(ctx, canvas, players) {
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
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, canvas.height - 40);
        ctx.stroke();
        ctx.fillText(players[i], x, 25);
    }
}

// 모든 클라이언트가 동시에 구동할 사다리 애니메이션 함수
function animateLadder(ctx, canvas, players, structure, winnerName) {
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) btnStartGame.classList.add('hidden');
    
    const count = players.length;
    const spacing = canvas.width / (count + 1);
    const steps = structure.length;
    const stepHeight = (canvas.height - 80) / steps;

    let currentProgress = 0;

    function drawFrame() {
        drawBaseLines(ctx, canvas, players);
        
        ctx.strokeStyle = '#6f4e37';
        ctx.lineWidth = 4;
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
        if (currentProgress < 40) {
            requestAnimationFrame(drawFrame);
        } else {
            showResultPopup(winnerName);
        }
    }
    drawFrame();
}

// 결과 이모션 보여주기 팝업 창 함수
function showResultPopup(winnerName) {
    const resultOverlay = document.getElementById('result-overlay');
    const resultEmoji = document.getElementById('result-emoji');
    const resultMessage = document.getElementById('result-message');
    const resultSub = document.getElementById('result-sub');

    resultOverlay.classList.remove('hidden');
    
    if (myName === winnerName) {
        resultEmoji.innerText = '😭💸😱';
        resultMessage.innerText = `악! 내가 당첨!!`;
        resultSub.innerText = `오늘 커피는 ${myName}님이 쏩니다! 영수증 챙기세요..`;
    } else {
        resultEmoji.innerText = '🎉😎😌';
        resultMessage.innerText = `휴.. 살았다!`;
        resultSub.innerText = `당첨자는 [ ${winnerName} ] 입니다. 잘 마실게요!`;
    }
}
