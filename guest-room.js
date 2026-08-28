import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://gstatic.com";

const params = new URLSearchParams(location.search);
const room = params.get("room");
document.getElementById("roomNumber").innerHTML = "방 번호 : " + room;

const canvas = document.getElementById("ladderCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const statusMessage = document.getElementById("statusMessage"); // 대기 메시지 엘리먼트

// 실시간으로 방장 액션 감지
onSnapshot(doc(db, "rooms", room), (docSnap) => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  
  if (data.status === "waiting") {
    if (statusMessage) statusMessage.innerText = "방장이 사다리를 생성하길 기다리는 중입니다...";
  } else if (data.status === "generated" && data.ladderData) {
    if (statusMessage) statusMessage.innerText = "🎉 사다리 게임 결과 공개!";
    drawLadder(data.ladderData, data.participants);
  }
});

// 방장 화면과 동일하게 사다리 드로잉 (방장 소스의 drawLadder 함수 복사 활용)
function drawLadder(ladderData, participants) {
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

  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x, height - 50);
    ctx.stroke();
    ctx.fillText(participants[i]?.nickname || "", x, 35);
  }

  for (let r = 0; r < numRows; r++) {
    const y = 50 + rowHeight * (r + 1);
    for (let c = 0; c < numCols - 1; c++) {
      if (lines[r][c] === 1) {
        ctx.beginPath();
        ctx.moveTo(colWidth * (c + 1), y);
        ctx.lineTo(colWidth * (c + 2), y);
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < numCols; i++) {
    ctx.fillText(results[i], colWidth * (i + 1), height - 25);
  }
}
