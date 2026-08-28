import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc } from "https://gstatic.com";

const params = new URLSearchParams(location.search);
const room = params.get("room");

document.getElementById("roomNumber").innerHTML = "방 번호 : " + room;

const pListEl = document.getElementById("participantList");
const canvas = document.getElementById("ladderCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

let participants = [];

// 1. Firestore 실시간 리스너 작동 (참가자 유입 및 래더 상태 감지)
onSnapshot(doc(db, "rooms", room), (docSnap) => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  participants = data.participants || [];
  
  // 실시간 참여자 UI 렌더링
  if (pListEl) {
    pListEl.innerHTML = participants.map(p => `<li>☕ ${p.nickname}</li>`).join("");
  }
  
  // 사다리가 정상적으로 생성되었을 경우 캔버스 드로잉
  if (data.status === "generated" && data.ladderData) {
    drawLadder(data.ladderData);
  }
});

// 2. 사다리 데이터 매트릭스 알고리즘 생성 (방장 실행 전용)
window.generateLadder = async function() {
  if (participants.length < 2) {
    alert("커피내기를 진행하려면 최소 2명 이상의 참가자가 들어와야 합니다.");
    return;
  }

  const numCols = participants.length;
  const numRows = 7; // 사다리 높이(가로줄 놓일 수 있는 레이어 수)
  const lines = [];

  // 사다리 타기가 끊어지거나 중복 배치되어 일직선으로 떨어지지 않게 좌우 제어 조건 포함
  for (let i = 0; i < numRows; i++) {
    const rowLines = [];
    for (let j = 0; j < numCols - 1; j++) {
      if (j > 0 && rowLines[j - 1] === 1) {
        rowLines.push(0); // 연속된 가로선 방지 알고리즘 적용
      } else {
        rowLines.push(Math.random() > 0.4 ? 1 : 0);
      }
    }
    lines.push(rowLines);
  }

  // 꽝 추첨 (인덱스 하나 무작위 지정)
  const penaltyIndex = Math.floor(Math.random() * numCols);
  const results = Array(numCols).fill("통과 🎉");
  results[penaltyIndex] = "💸 커피 당첨!!";

  const ladderData = {
    lines: lines,
    results: results,
    numCols: numCols,
    numRows: numRows
  };

  // 데이터베이스에 입력 -> 리스너를 감시 중인 모든 참가자 브라우저에 즉시 동기화
  await updateDoc(doc(db, "rooms", room), {
    status: "generated",
    ladderData: ladderData
  });
};

// 3. 공통 캔버스 그래픽 드로잉 함수
function drawLadder(ladderData) {
  if (!ctx) return;
  const { lines, results, numCols, numRows } = ladderData;
  
  const width = canvas.width;
  const height = canvas.height;
  const colWidth = width / (numCols + 1);
  const rowHeight = (height - 120) / (numRows + 1);

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#6f4e37"; // 스타일 시트 커피 기본 테마 컬러
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";

  // 기둥 세로선 및 상단 이름 표기
  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, height - 60);
    ctx.stroke();
    
    ctx.fillStyle = "#333";
    ctx.fillText(participants[i]?.nickname || "", x, 40);
  }

  // 교차 가로선 드로잉
  for (let r = 0; r < numRows; r++) {
    const y = 60 + rowHeight * (r + 1);
    for (let c = 0; c < numCols - 1; c++) {
      if (lines[r][c] === 1) {
        ctx.beginPath();
        ctx.moveTo(colWidth * (c + 1), y);
        ctx.lineTo(colWidth * (c + 2), y);
        ctx.stroke();
      }
    }
  }

  // 하단 결과 텍스트 바인딩
  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.fillStyle = results[i].includes("당첨") ? "#d9534f" : "#5cb85c";
    ctx.fillText(results[i], x, height - 30);
  }
}
