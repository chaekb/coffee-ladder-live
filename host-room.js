import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc } from "https://gstatic.com";

const params = new URLSearchParams(location.search);
const room = params.get("room");
document.getElementById("roomNumber").innerHTML = "방 번호 : " + room;

const pListEl = document.getElementById("participantList"); // HTML에 추가 필요
const canvas = document.getElementById("ladderCanvas"); // HTML canvas 엘리먼트
const ctx = canvas ? canvas.getContext("2d") : null;

let participants = [];

// 1. 실시간 참가자 모니터링
onSnapshot(doc(db, "rooms", room), (docSnap) => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  participants = data.participants || [];
  
  // 참가자 명단 UI 업데이트
  if (pListEl) {
    pListEl.innerHTML = participants.map(p => `<li>${p.nickname}</li>`).join("");
  }
  
  // 사다리 데이터가 생성되었다면 그리기 호출
  if (data.status === "generated" && data.ladderData) {
    drawLadder(data.ladderData);
  }
});

// 2. 사다리 생성 및 게임 시작 (방장 이벤트)
window.generateLadder = async function() {
  if (participants.length < 2) {
    alert("최소 2명 이상의 참가자가 필요합니다.");
    return;
  }

  const numCols = participants.length;
  const numRows = 8; // 사다리 가로축 단계 수
  const lines = [];

  // 랜덤 가로줄 만들기 (사다리 타기 알고리즘 데이터 생성)
  for (let i = 0; i < numRows; i++) {
    const rowLines = [];
    for (let j = 0; j < numCols - 1; j++) {
      // 연속된 가로줄 방지 알고리즘
      if (j > 0 && rowLines[j - 1] === 1) {
        rowLines.push(0);
      } else {
        rowLines.push(Math.random() > 0.5 ? 1 : 0);
      }
    }
    lines.push(rowLines);
  }

  // 꽝 위치 선정 (예시: 마지막 사람 한 명 당첨)
  const penaltyIndex = Math.floor(Math.random() * numCols);
  const results = Array(numCols).fill("통과");
  results[penaltyIndex] = "☕ 꽝 (커피 쏘기!)";

  const ladderData = {
    lines: lines,
    results: results,
    numCols: numCols,
    numRows: numRows
  };

  // DB에 상태 및 사다리 데이터 전송 -> 참가자들에게 동시 전송됨
  await updateDoc(doc(db, "rooms", room), {
    status: "generated",
    ladderData: ladderData
  });
};

// 3. 사다리 그리기 함수
function drawLadder(ladderData) {
  if (!ctx) return;
  const { lines, results, numCols, numRows } = ladderData;
  
  const width = canvas.width;
  const height = canvas.height;
  const colWidth = width / (numCols + 1);
  const rowHeight = (height - 100) / (numRows + 1);

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#6f4e37";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";

  // 세로줄 및 상단 이름 그리기
  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x, height - 50);
    ctx.stroke();
    
    // 이름 출력
    ctx.fillText(participants[i]?.nickname || "", x, 35);
  }

  // 가로줄 그리기
  for (let r = 0; r < numRows; r++) {
    const y = 50 + rowHeight * (r + 1);
    for (let c = 0; c < numCols - 1; c++) {
      if (lines[r][c] === 1) {
        const xStart = colWidth * (c + 1);
        const xEnd = colWidth * (c + 2);
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
        ctx.stroke();
      }
    }
  }

  // 하단 결과 출력
  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.fillText(results[i], x, height - 25);
  }
}
